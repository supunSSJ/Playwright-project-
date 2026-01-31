# Playwright-project-
ITPM Assignment 1- full Playwright project 
# SwiftTranslator UI Tests (Playwright + TypeScript)

This project contains data-driven UI tests for **https://www.swifttranslator.com/**
using **Playwright** + **TypeScript**.

## ✅ Prerequisites
- Node.js (LTS recommended)
- npm (comes with Node)
- Internet connection (tests hit the live site)

## 📦 Install
```bash
npm install
npx playwright install

Run Tests
Run all tests (Chromium, headed)
npx playwright test tests/translator.spec.ts --project=chromium --headed --workers=1

Run with HTML report
npx playwright test tests/translator.spec.ts --project=chromium --headed --workers=1 --reporter=html


After run, open the report:

npx playwright show-report


