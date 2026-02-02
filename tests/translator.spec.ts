import { test, expect, Page, Locator } from '@playwright/test';

test.describe('SwiftTranslator UI Tests (Data-Driven)', () => {
  
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
  
    return page.locator('button[aria-label="Translate"]:visible');
  }

  function getPanels(page: Page): Locator {
    
    return page.locator(
      'div.w-full.h-80.p-3.rounded-lg.ring-1.ring-slate-300.whitespace-pre-wrap'
    );
  }

  function getInputPanel(page: Page): Locator {
    
    return getPanels(page).filter({ has: page.locator('textarea, input, [contenteditable="true"]') }).first();
  }

  function getOutputPanel(page: Page): Locator {
    
    return getPanels(page).filter({ hasNot: page.locator('textarea, input, [contenteditable="true"]') }).first();
  }

  async function readText(locator: Locator): Promise<string> {
    const txt = (await locator.textContent()) ?? '';
    return txt.replace(/\s+/g, ' ').trim();
  }

  async function translate(page: Page, singlish: string): Promise<string> {
    const input = getInput(page);
    await expect(input).toBeVisible({ timeout: 25_000 });

    
    const out = getOutputPanel(page);

    
    await expect(out).toBeVisible({ timeout: 25_000 });

    
    await input.fill('');
    await input.fill(singlish);

    
    const btn = getTranslateButton(page);
    if (await btn.count()) {
      if (await btn.first().isEnabled().catch(() => false)) {
        await btn.first().click().catch(() => {});
      }
    }

    const before = await readText(out);

    
    if (!singlish || singlish.trim().length === 0) {
      await page.waitForTimeout(1200);
      return await readText(out);
    }

  
    await expect
      .poll(
        async () => {
          const now = await readText(out);
         
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

    { id: 'Pos_UI_0001', input: "k"},
  ];

  for (const tc of positiveCases) {
    test(tc.id, async ({ page }) => {
      const actual = await translate(page, tc.input);
      
      expect(actual).toMatch(/[අ-ෆ]/);
    });
  }

  // =========================
  // NEGATIVE TEST DATA (10)
  // =========================
  const negativeCases = [
    { id: 'Neg_Fun_0001', input: 'mama igenanne cyber security course eka' },
    { id: 'Neg_Fun_0002', input: 'Hello මම	Supun' },
    { id: 'Neg_Fun_0003', input: 'sun crcker hari rasayi' },
    { id: 'Neg_Fun_0004', input: 'මම ගෙදර යනවා' },
    { id: 'Neg_Fun_0005', input: 'I am going home' },
    { id: 'Neg_Fun_0006', input: 'Iamgoing home' },
    { id: 'Neg_Fun_0007', input: 'oyaata123 ko4hom5ada6' },
    { id: 'Neg_Fun_0008', input: 'man newei' },
    { id: 'Neg_Fun_0009', input: 'apita swimming pool ekak thiyenawa' },
    { id: 'Neg_Fun_0010', input: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  ];

  for (const tc of negativeCases) {
    test(tc.id, async ({ page }) => {
      const actual = await translate(page, tc.input);
      
      expect(actual).not.toMatch(/[අ-ෆ]/);
    });
  }
});
