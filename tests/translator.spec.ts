import { test, expect, Page, Locator } from '@playwright/test';

test.describe('SwiftTranslator UI Tests (Data-Driven)', () => {
  // slow site එකට safe
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoWithRetry(page, 'https://www.swifttranslator.com/');
  });

  async function gotoWithRetry(page: Page, url: string, retries = 2) {
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        // networkidle sometimes never happens
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }

  function getInput(page: Page): Locator {
    return page.getByPlaceholder(/Input Your Singlish Text Here/i).first();
  }

  function getTranslateButton(page: Page): Locator {
    // site එකේ button තිබ්බොත් visible එක පමණක්
    return page.locator('button[aria-label="Translate"]:visible');
  }

  function getPanels(page: Page): Locator {
    // site එකේ UI style එකට ගැලපෙන්න class selector
    return page.locator(
      'div.w-full.h-80.p-3.rounded-lg.ring-1.ring-slate-300.whitespace-pre-wrap'
    );
  }

  function getInputPanel(page: Page): Locator {
    // textarea තියෙන panel එක input
    return getPanels(page).filter({ has: page.locator('textarea, input, [contenteditable="true"]') }).first();
  }

  function getOutputPanel(page: Page): Locator {
    // textarea නැති panel එක output
    return getPanels(page).filter({ hasNot: page.locator('textarea, input, [contenteditable="true"]') }).first();
  }

  async function readText(locator: Locator): Promise<string> {
    const txt = (await locator.textContent()) ?? '';
    return txt.replace(/\s+/g, ' ').trim();
  }

  async function translate(page: Page, singlish: string): Promise<string> {
    const input = getInput(page);
    await expect(input).toBeVisible({ timeout: 25_000 });

    // output panel එක locate කරන්න (selectors change වුණත් මෙක stable)
    const out = getOutputPanel(page);

    // Sometimes panels late-load වෙනවා
    await expect(out).toBeVisible({ timeout: 25_000 });

    // input clear + fill
    await input.fill('');
    await input.fill(singlish);

    // translate button තිබ්බොත් click කරන්න (auto translate නැති අවස්ථාවන්ට)
    const btn = getTranslateButton(page);
    if (await btn.count()) {
      if (await btn.first().isEnabled().catch(() => false)) {
        await btn.first().click().catch(() => {});
      }
    }

    const before = await readText(out);

    // Empty/whitespace input වලදී output change වෙන්නම ඕන නෑ → short wait + return
    if (!singlish || singlish.trim().length === 0) {
      await page.waitForTimeout(1200);
      return await readText(out);
    }

    // output update / Sinhala chars appear වෙනකන් poll
    // (හිතන්න: API slow, debounce, auto-translate delay)
    await expect
      .poll(
        async () => {
          const now = await readText(out);
          // change or Sinhala script detected
          const hasSinhala = /[අ-ෆ]/.test(now);
          if (now !== before && now.length > 0) return now;
          if (hasSinhala) return now;
          return '';
        },
        { timeout: 35_000 }
      )
      .not.toBe('');

    return await readText(out);
  }

  // =========================
  // POSITIVE TEST DATA (24)
  // =========================
  const positiveCases = [
    { id: 'Pos_Fun_0001', input: 'suba udhaeesanak!' },
    { id: 'Pos_Fun_0002', input: 'man gedara yanawa' },
    { id: 'Pos_Fun_0003', input: 'mama oyaata aadhareyi' },
    { id: 'Pos_Fun_0004', input: 'karuNaakara meeka balanna' },
    { id: 'Pos_Fun_0005', input: 'mama oyaata kalin thava 2nekta baee kivvaa' },
    { id: 'Pos_Fun_0006', input: 'Hi,kohomada oyata' },
    { id: 'Pos_Fun_0007', input: 'api koLaBA yanavaa' },
    { id: 'Pos_Fun_0008', input: 'Mama iye ra oyata call karane' },
    { id: 'Pos_Fun_0009', input: 'MaMa Dn GeDaRa YnW' },
    { id: 'Pos_Fun_0010', input: 'api heta gamata yamu' },
    { id: 'Pos_Fun_0011', input: 'nimal gedhara giye naee' },
    { id: 'Pos_Fun_0012', input: 'eeya ahanna' },
    { id: 'Pos_Fun_0013', input: 'ayYoo mata mee mokadha unee' },
    { id: 'Pos_Fun_0014', input: 'mama gedhara giyaa, dhaen kanavaa' },
    { id: 'Pos_Fun_0015', input: 'Mama heta ude 8 kalin ethana inna one' },
    { id: 'Pos_Fun_0016', input: 'vaessa nisaa mama innee gedhara' },
    { id: 'Pos_Fun_0017', input: 'Lamai iskole yanawa' },
    { id: 'Pos_Fun_0018', input: 'Oya ada hari lassana adumak adan awilla baba' },
    { id: 'Pos_Fun_0019', input: 'Oyata mata udawwak karanna puluwanda' },
    { id: 'Pos_Fun_0020', input: 'oyaa kohedha yannee adha?' },
    { id: 'Pos_Fun_0021', input: 'Mata ada ude mara wadak ne une bus eke konda jack ekak gahuwa' },
    { id: 'Pos_Fun_0022', input: 'Mama gedara yanawa' },
    { id: 'Pos_Fun_0023', input: 'mama adha vaedata giyaa. vaeda godak thibba. havasath nathara valaa gedhara aavaa.' },
    { id: 'Pos_Fun_0024', input: 'meka eekata vadaa hoDHAyi' },
  ];

  for (const tc of positiveCases) {
    test(tc.id, async ({ page }) => {
      const actual = await translate(page, tc.input);
      // Positive: Sinhala letters at least one
      expect(actual).toMatch(/[අ-ෆ]/);
    });
  }

  // =========================
  // NEGATIVE TEST DATA (10)
  // =========================
  const negativeCases = [
    { id: 'Neg_Fun_0001', input: '' },
    { id: 'Neg_Fun_0002', input: '123456789' },
    { id: 'Neg_Fun_0003', input: '@@@###$$$' },
    { id: 'Neg_Fun_0004', input: 'මම ගෙදර යනවා' },
    { id: 'Neg_Fun_0005', input: 'I am going home' },
    { id: 'Neg_Fun_0006', input: 'asdfghjkl' },
    { id: 'Neg_Fun_0007', input: '     ' },
    { id: 'Neg_Fun_0008', input: '💔😪' },
    { id: 'Neg_Fun_0009', input: '---___---' },
    { id: 'Neg_Fun_0010', input: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  ];

  for (const tc of negativeCases) {
    test(tc.id, async ({ page }) => {
      const actual = await translate(page, tc.input);
      // Negative: should not produce Sinhala script
      expect(actual).not.toMatch(/[අ-ෆ]/);
    });
  }
});
