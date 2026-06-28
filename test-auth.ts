import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const prefix = `test_${crypto.randomBytes(4).toString('hex')}`;
  const email = `${prefix}@example.com`;
  console.log('Creating user:', email);
  
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'testpassword123',
    email_confirm: true,
  });
  
  if (createError) {
    console.error('Create error:', createError);
    return;
  }
  console.log('Created user:', createData.user.id);
  
  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password: 'testpassword123',
  });
  
  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }
  console.log('Signed in successfully, token:', signInData.session.access_token.slice(0, 10));
}

run();
