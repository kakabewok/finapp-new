import { test, expect, APIRequestContext } from '@playwright/test';
import { createTestEnvironment, teardownTestEnvironment, getSessionTokens, TestEnvironment, TestRoles } from '../utils/supabase-test-helpers';

let env: TestEnvironment;

test.beforeAll(async () => {
  env = await createTestEnvironment();
});

test.afterAll(async () => {
  if (env) {
    await teardownTestEnvironment(env);
  }
});

// Helper function to inject session cookies into the APIRequestContext
async function loginAs(request: APIRequestContext, email: string) {
  const tokens = await getSessionTokens(email);
  // Send the tokens to our dev endpoint to set cookies
  const response = await request.post('/api/dev/set-session', {
    data: tokens,
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('Transactions API - Personal Mode', () => {
  test.beforeEach(async ({ request }) => {
    await loginAs(request, env.personalUserEmail);
  });

  let createdTransactionId: string;

  test('Create personal transaction', async ({ request }) => {
    const res = await request.post('/api/transactions', {
      data: {
        type: 'expense',
        amount: 100,
        transaction_date: new Date().toISOString(),
      },
    });
    const bodyText = await res.text();
    expect(res.ok(), bodyText).toBeTruthy();
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.workspace_id).toBeNull();
    createdTransactionId = data.id;
  });

  test('Read personal transactions', async ({ request }) => {
    // Create one inline to ensure we have data to read
    await request.post('/api/transactions', {
      data: { type: 'expense', amount: 150, transaction_date: new Date().toISOString() },
    });

    const res = await request.get('/api/transactions');
    if (!res.ok()) {
      console.error('Read personal transactions error:', await res.text());
    }
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    if (!Array.isArray(data)) {
       console.error('Read personal transactions data:', data);
    }
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('Update personal transaction', async ({ request }) => {
    // Need to ensure createdTransactionId is available. 
    // In Playwright tests run in parallel or independently, state shouldn't be shared this way ideally,
    // but for simplicity we rely on the serial execution within this block if we configure fullyParallel to false,
    // or we can just create it inline.
    
    // Creating one inline to be safe
    const createRes = await request.post('/api/transactions', {
      data: { type: 'expense', amount: 50, transaction_date: new Date().toISOString() },
    });
    if (!createRes.ok()) {
       console.error('Update create error:', await createRes.text());
    }
    const { id } = await createRes.json();

    const res = await request.put(`/api/transactions/${id}`, {
      data: { amount: 75 },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Delete personal transaction', async ({ request }) => {
    const createRes = await request.post('/api/transactions', {
      data: { type: 'expense', amount: 50, transaction_date: new Date().toISOString() },
    });
    if (!createRes.ok()) {
       console.error('Delete create error:', await createRes.text());
    }
    const { id } = await createRes.json();

    const res = await request.delete(`/api/transactions/${id}`);
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Transactions API - Workspace Mode', () => {
  test.describe.configure({ mode: 'serial' });

  let adminCreatedTrxId: string;
  let memberCreatedTrxId: string;

  test('Owner / Admin / Member can create transactions', async ({ request }) => {
    // Test as Admin
    await loginAs(request, env.users.admin.email);
    const adminRes = await request.post('/api/transactions', {
      data: {
        workspace_id: env.workspaceId,
        type: 'expense',
        amount: 100,
        transaction_date: new Date().toISOString(),
      },
    });
    if (!adminRes.ok()) {
      console.error(await adminRes.text());
    }
    expect(adminRes.ok()).toBeTruthy();
    adminCreatedTrxId = (await adminRes.json()).id;

    // Test as Member
    await loginAs(request, env.users.member.email);
    const memberRes = await request.post('/api/transactions', {
      data: {
        workspace_id: env.workspaceId,
        type: 'income',
        amount: 200,
        transaction_date: new Date().toISOString(),
      },
    });
    expect(memberRes.ok()).toBeTruthy();
    memberCreatedTrxId = (await memberRes.json()).id;
  });

  test('Viewer cannot create transactions', async ({ request }) => {
    await loginAs(request, env.users.viewer.email);
    const res = await request.post('/api/transactions', {
      data: {
        workspace_id: env.workspaceId,
        type: 'expense',
        amount: 50,
        transaction_date: new Date().toISOString(),
      },
    });
    // Assuming backend enforces this via RLS or logic, which should return 403 or fail
    if (res.status() !== 403) {
      console.error('Viewer create transaction unexpected status:', res.status(), await res.text());
    }
    expect(res.status()).toBe(403);
  });

  test('Owner / Admin can update others transactions', async ({ request }) => {
    await loginAs(request, env.users.admin.email);
    const res = await request.put(`/api/transactions/${memberCreatedTrxId}`, {
      data: { amount: 250, workspace_id: env.workspaceId },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Member can update own transactions', async ({ request }) => {
    await loginAs(request, env.users.member.email);
    const res = await request.put(`/api/transactions/${memberCreatedTrxId}`, {
      data: { amount: 275, workspace_id: env.workspaceId },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Member cannot update others transactions', async ({ request }) => {
    await loginAs(request, env.users.member.email);
    const res = await request.put(`/api/transactions/${adminCreatedTrxId}`, {
      data: { amount: 500, workspace_id: env.workspaceId },
    });
    expect(res.status()).toBe(403);
  });

  test('Viewer cannot update any transactions', async ({ request }) => {
    await loginAs(request, env.users.viewer.email);
    const res = await request.put(`/api/transactions/${adminCreatedTrxId}`, {
      data: { amount: 500, workspace_id: env.workspaceId },
    });
    expect(res.status()).toBe(403);
  });

  test('Member cannot delete others transactions', async ({ request }) => {
    await loginAs(request, env.users.member.email);
    const res = await request.delete(`/api/transactions/${adminCreatedTrxId}?workspace_id=${env.workspaceId}`);
    expect(res.status()).toBe(403);
  });

  test('Viewer cannot delete any transactions', async ({ request }) => {
    await loginAs(request, env.users.viewer.email);
    const res = await request.delete(`/api/transactions/${memberCreatedTrxId}?workspace_id=${env.workspaceId}`);
    expect(res.status()).toBe(403);
  });

  test('Member can delete own transactions', async ({ request }) => {
    await loginAs(request, env.users.member.email);
    const res = await request.delete(`/api/transactions/${memberCreatedTrxId}?workspace_id=${env.workspaceId}`);
    expect(res.ok()).toBeTruthy();
  });

  test('Owner / Admin can delete others transactions', async ({ request }) => {
    await loginAs(request, env.users.admin.email);
    const res = await request.delete(`/api/transactions/${adminCreatedTrxId}?workspace_id=${env.workspaceId}`);
    expect(res.ok()).toBeTruthy();
  });
});
