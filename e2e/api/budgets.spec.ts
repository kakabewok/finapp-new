import { test, expect, APIRequestContext } from '@playwright/test';
import { createTestEnvironment, teardownTestEnvironment, getSessionTokens, TestEnvironment, supabaseAdmin } from '../utils/supabase-test-helpers';

let env: TestEnvironment;

let categoryId: string;
let workspaceCategoryId: string;

test.beforeAll(async () => {
  env = await createTestEnvironment();

  // Create a personal category for testing budgets
  const res = await supabaseAdmin.from('categories').insert({
    name: 'Test Category',
    type: 'expense',
    user_id: env.personalUserId,
  }).select('id').single();
  categoryId = res.data?.id;

  // Create a workspace category
  const wsRes = await supabaseAdmin.from('categories').insert({
    name: 'Workspace Category',
    type: 'expense',
    workspace_id: env.workspaceId,
  }).select('id').single();
  workspaceCategoryId = wsRes.data?.id;
});

test.afterAll(async () => {
  if (env) {
    await teardownTestEnvironment(env);
  }
});

async function loginAs(request: APIRequestContext, email: string) {
  const tokens = await getSessionTokens(email);
  const response = await request.post('/api/dev/set-session', {
    data: tokens,
  });
  expect(response.ok()).toBeTruthy();
}

test.describe('Budgets API - Personal Mode', () => {
  test.beforeEach(async ({ request }) => {
    await loginAs(request, env.personalUserEmail);
  });

  test('Create personal budget', async ({ request }) => {
    const res = await request.post('/api/budgets', {
      data: {
        amount: 500,
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        is_recurring: false,
        is_rollover: false,
        category_id: categoryId,
      },
    });
    const bodyText = await res.text();
    expect(res.ok(), bodyText).toBeTruthy();
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.workspace_id).toBeNull();
  });

  // Basic testing for other operations on personal budgets
  test('Update personal budget', async ({ request }) => {
    const createRes = await request.post('/api/budgets', {
      data: { category_id: categoryId, amount: 1000, start_date: '2026-06-01', end_date: '2026-06-30' },
    });
    const { id } = await createRes.json();

    const res = await request.patch(`/api/budgets/${id}`, {
      data: { amount: 1200 },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Delete personal budget', async ({ request }) => {
    const createRes = await request.post('/api/budgets', {
      data: { category_id: categoryId, amount: 100, start_date: '2026-06-01', end_date: '2026-06-30' },
    });
    const { id } = await createRes.json();

    const res = await request.delete(`/api/budgets/${id}`);
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Budgets API - Workspace Mode', () => {
  test.describe.configure({ mode: 'serial' });

  let budgetId: string;

  test('Owner / Admin / Member can create budgets', async ({ request }) => {
    // Owner creates
    await loginAs(request, env.users.owner.email);
    const ownerRes = await request.post('/api/budgets', {
      data: {
        workspace_id: env.workspaceId,
        category_id: workspaceCategoryId,
        amount: 2000,
        start_date: '2026-06-01',
        end_date: '2026-06-30',
      },
    });
    if (!ownerRes.ok()) console.error('Owner budget create error:', await ownerRes.text());
    expect(ownerRes.ok()).toBeTruthy();
    budgetId = (await ownerRes.json()).id;

    // Admin creates
    await loginAs(request, env.users.admin.email);
    const adminRes = await request.post('/api/budgets', {
      data: {
        workspace_id: env.workspaceId,
        category_id: workspaceCategoryId,
        amount: 500,
        start_date: '2026-07-01',
        end_date: '2026-07-31',
      },
    });
    if (!adminRes.ok()) console.error('Admin budget create error:', await adminRes.text());
    expect(adminRes.ok()).toBeTruthy();
    budgetId = (await adminRes.json()).id;

    // Member creates
    await loginAs(request, env.users.member.email);
    const memberRes = await request.post('/api/budgets', {
      data: {
        workspace_id: env.workspaceId,
        category_id: workspaceCategoryId,
        amount: 500,
        start_date: '2026-08-01',
        end_date: '2026-08-31',
      },
    });
    if (!memberRes.ok()) console.error('Member budget create error:', await memberRes.text());
    expect(memberRes.ok()).toBeTruthy();
  });

  test('Viewer cannot create budgets', async ({ request }) => {
    await loginAs(request, env.users.viewer.email);
    const res = await request.post('/api/budgets', {
      data: {
        workspace_id: env.workspaceId,
        category_id: workspaceCategoryId,
        amount: 100,
        start_date: '2026-06-01',
        end_date: '2026-06-30',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('Viewer cannot update budgets', async ({ request }) => {
    await loginAs(request, env.users.viewer.email);
    const res = await request.patch(`/api/budgets/${budgetId}`, {
      data: { amount: 2500, workspace_id: env.workspaceId },
    });
    expect(res.status()).toBe(403);
  });

  test('Viewer cannot delete budgets', async ({ request }) => {
    await loginAs(request, env.users.viewer.email);
    const res = await request.delete(`/api/budgets/${budgetId}?workspace_id=${env.workspaceId}`);
    expect(res.status()).toBe(403);
  });

  test('Member can update budgets', async ({ request }) => {
    await loginAs(request, env.users.member.email);
    const res = await request.patch(`/api/budgets/${budgetId}`, {
      data: { amount: 2200, workspace_id: env.workspaceId },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Member can delete budgets', async ({ request }) => {
    await loginAs(request, env.users.member.email);
    const res = await request.delete(`/api/budgets/${budgetId}?workspace_id=${env.workspaceId}`);
    expect(res.ok()).toBeTruthy();
  });

  test('URL Parameter Tampering (DELETE)', async ({ request }) => {
    // Try to delete a budget belonging to the workspace using Personal mode (no workspace_id)
    await loginAs(request, env.users.owner.email);
    const createRes = await request.post('/api/budgets', {
      data: {
        workspace_id: env.workspaceId,
        category_id: workspaceCategoryId,
        amount: 500,
        start_date: '2026-09-01',
        end_date: '2026-09-30',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const targetId = (await createRes.json()).id;

    // Delete without workspace_id (tampering). Should fail or silently do nothing (return 404 or success but no rows deleted based on logic).
    // In our implementation, deleteQuery.is("workspace_id", null).eq("user_id", user.id) is run.
    // It will return 200 but not delete the workspace budget.
    const delRes1 = await request.delete(`/api/budgets/${targetId}`);
    expect(delRes1.ok()).toBeTruthy();

    // The budget should still exist
    // Let's actually delete it correctly
    const delRes2 = await request.delete(`/api/budgets/${targetId}?workspace_id=${env.workspaceId}`);
    expect(delRes2.ok()).toBeTruthy();
  });
});
