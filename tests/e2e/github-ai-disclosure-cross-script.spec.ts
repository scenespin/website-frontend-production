import { expect, test } from '@playwright/test';

const SCREENPLAY_A = process.env.PLAYWRIGHT_SCREENPLAY_OWNER_A || 'screenplay_owner_a_e2e';
const SCREENPLAY_B = process.env.PLAYWRIGHT_SCREENPLAY_OWNER_B || 'screenplay_owner_b_e2e';
const SCREENPLAY_COLLAB = process.env.PLAYWRIGHT_SCREENPLAY_COLLAB || 'screenplay_collab_e2e';

function buildReport(screenplayId: string) {
  return {
    success: true,
    data: {
      events: [
        {
          event_id: `event_${screenplayId}_1`,
          screenplay_id: screenplayId,
          user_id: 'user_test',
          timestamp: new Date().toISOString(),
          source: 'screenwriter_ai',
          feature: 'insert_text',
          range_start: 1,
          range_end: 10,
          preview: 'Test AI disclosure event',
          confidence: 'high',
        },
      ],
      consent: null,
    },
  };
}

async function seedGitHubConfig(page: import('@playwright/test').Page, screenplayId: string) {
  await page.evaluate((id) => {
    const value = JSON.stringify({
      owner: `owner_${id}`,
      repo: `repo_${id}`,
      branch: 'main',
    });
    localStorage.setItem(`screenplay_github_config_${id}`, value);
    localStorage.setItem('screenplay_github_config', value);
  }, screenplayId);
}

test.describe('AI Disclosure GitHub sync screenplay scoping', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/screenplays/*/ai-disclosure-report', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const screenplayId = path.split('/')[3] || 'screenplay_unknown';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildReport(screenplayId)),
      });
    });

    await page.route('**/api/github/screenplay/context**', async (route) => {
      const url = new URL(route.request().url());
      const screenplayId = url.searchParams.get('screenplayId') || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          screenplayId,
          canonicalConfigured: true,
          ownerGitHubConnected: true,
          repoOwner: `owner_${screenplayId}`,
          repoName: `repo_${screenplayId}`,
          canManageGitHub: true,
        }),
      });
    });
  });

  test('sync request follows active screenplay id across A -> B', async ({ page }) => {
    const syncBodies: Array<Record<string, unknown>> = [];

    await page.addInitScript(([screenplayA, screenplayB]) => {
      const createValue = (id: string) =>
        JSON.stringify({ owner: `owner_${id}`, repo: `repo_${id}`, branch: 'main' });
      localStorage.setItem(`screenplay_github_config_${screenplayA}`, createValue(screenplayA));
      localStorage.setItem(`screenplay_github_config_${screenplayB}`, createValue(screenplayB));
      localStorage.setItem('screenplay_github_config', createValue(screenplayA));
    }, [SCREENPLAY_A, SCREENPLAY_B]);

    await page.route('**/api/github/ai-audit/sync', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      syncBodies.push(body);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalInReport: 1,
          alreadyInLedger: 0,
          synced: 1,
          errors: [],
        }),
      });
    });

    await page.goto(`/examples/e2e-ai-disclosure?screenplayId=${SCREENPLAY_A}&title=OwnerA`);
    await seedGitHubConfig(page, SCREENPLAY_A);
    await page.reload();
    const syncButtonA = page.getByRole('button', { name: 'Sync to GitHub' });
    await expect
      .poll(async () => syncButtonA.isEnabled(), { timeout: 15_000 })
      .toBe(true);
    await syncButtonA.click();

    await page.goto(`/examples/e2e-ai-disclosure?screenplayId=${SCREENPLAY_B}&title=OwnerB`);
    await seedGitHubConfig(page, SCREENPLAY_B);
    await page.reload();
    const syncButtonB = page.getByRole('button', { name: 'Sync to GitHub' });
    await expect
      .poll(async () => syncButtonB.isEnabled(), { timeout: 15_000 })
      .toBe(true);
    await syncButtonB.click();

    await expect.poll(() => syncBodies.length).toBe(2);
    expect(syncBodies[0]?.screenplayId).toBe(SCREENPLAY_A);
    expect(syncBodies[1]?.screenplayId).toBe(SCREENPLAY_B);
  });

  test('collaborator screenplay sync still targets collaborator screenplay id', async ({ page }) => {
    let collaboratorSyncBody: Record<string, unknown> | null = null;

    await page.addInitScript((screenplayId) => {
      const scopedKey = `screenplay_github_config_${screenplayId}`;
      const value = JSON.stringify({
        owner: `owner_${screenplayId}`,
        repo: `repo_${screenplayId}`,
        branch: 'main',
      });
      localStorage.setItem(scopedKey, value);
      localStorage.setItem('screenplay_github_config', value);
    }, SCREENPLAY_COLLAB);

    await page.route('**/api/github/ai-audit/sync', async (route) => {
      collaboratorSyncBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalInReport: 1,
          alreadyInLedger: 0,
          synced: 1,
          errors: [],
        }),
      });
    });

    await page.goto(`/examples/e2e-ai-disclosure?screenplayId=${SCREENPLAY_COLLAB}&title=CollaboratorScript`);
    await seedGitHubConfig(page, SCREENPLAY_COLLAB);
    await page.reload();
    const syncButton = page.getByRole('button', { name: 'Sync to GitHub' });
    await expect
      .poll(async () => syncButton.isEnabled(), { timeout: 15_000 })
      .toBe(true);
    await syncButton.click();

    await expect.poll(() => collaboratorSyncBody !== null).toBe(true);
    expect(collaboratorSyncBody?.screenplayId).toBe(SCREENPLAY_COLLAB);
  });
});
