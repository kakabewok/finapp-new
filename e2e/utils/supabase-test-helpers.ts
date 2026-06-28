import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// The tests must run with the service role key to bypass RLS and create users/workspaces
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type TestRoles = 'owner' | 'admin' | 'member' | 'viewer';

export interface TestUser {
  id: string;
  email: string;
  role: TestRoles;
}

export interface TestEnvironment {
  workspaceId: string;
  users: Record<TestRoles, TestUser>;
  personalUserId: string;
  personalUserEmail: string;
}

export async function createTestEnvironment(): Promise<TestEnvironment> {
  const prefix = `test_${crypto.randomBytes(4).toString('hex')}`;
  const roles: TestRoles[] = ['owner', 'admin', 'member', 'viewer'];
  
  const users: Record<TestRoles, TestUser> = {} as any;

  // 1. Create test users for workspace roles
  for (const role of roles) {
    const email = `${prefix}_${role}@example.com`;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'testpassword123',
      email_confirm: true,
    });
    
    if (error) throw new Error(`Failed to create user ${role}: ${error.message}`);
    users[role] = { id: data.user.id, email, role };
  }

  // 1b. Create a separate user for personal mode testing
  const personalUserEmail = `${prefix}_personal@example.com`;
  const { data: personalUserData } = await supabaseAdmin.auth.admin.createUser({
    email: personalUserEmail,
    password: 'testpassword123',
    email_confirm: true,
  });
  const personalUserId = personalUserData.user!.id;

  // 2. Create Workspace (owner creates it)
  const { data: workspace, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .insert({
      name: `Test Workspace ${prefix}`,
      owner_id: users.owner.id,
    })
    .select('id')
    .single();

  if (wsError) throw new Error(`Failed to create workspace: ${wsError.message}`);
  
  const workspaceId = workspace.id;

  // 3. Add members to workspace
  const members = roles.map(role => ({
    workspace_id: workspaceId,
    user_id: users[role].id,
    role: role,
  }));

  const { error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .insert(members);

  if (memberError) throw new Error(`Failed to add members: ${memberError.message}`);

  return { workspaceId, users, personalUserId, personalUserEmail };
}

export async function teardownTestEnvironment(env: TestEnvironment) {
  // Delete workspace
  await supabaseAdmin.from('workspaces').delete().eq('id', env.workspaceId);
  
  // Delete users
  for (const role of Object.values(env.users)) {
    await supabaseAdmin.auth.admin.deleteUser(role.id);
  }
  
  // Delete personal user
  await supabaseAdmin.auth.admin.deleteUser(env.personalUserId);
}

export async function getSessionTokens(email: string): Promise<{ access_token: string; refresh_token: string }> {
  // Use a temporary client for sign-in so we don't mutate the supabaseAdmin singleton's auth state
  const tempClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await tempClient.auth.signInWithPassword({
    email,
    password: 'testpassword123',
  });
  
  if (error || !data.session) {
    console.error(`Sign in error for ${email}:`, error);
    throw new Error(`Failed to sign in test user: ${error?.message}`);
  }
  
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}
