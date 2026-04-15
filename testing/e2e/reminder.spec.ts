import { test, expect } from '@playwright/test';

test.describe('叮咚 DingDong - 提醒功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('首页标题显示正确', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('提醒');
  });

  test('空状态显示引导', async ({ page }) => {
    const emptyText = page.locator('text=还没有任何提醒');
    if (await emptyText.isVisible()) {
      await expect(emptyText).toBeVisible();
      await expect(page.locator('text=新建提醒')).toBeVisible();
    }
  });

  test('点击新建按钮弹出面板', async ({ page }) => {
    await page.click('text=新建提醒');
    await expect(page.locator('text=新建提醒').nth(1)).toBeVisible();
  });

  test('创建一次性提醒流程', async ({ page }) => {
    await page.click('text=新建提醒');
    await page.fill('input[placeholder*="喝水"]', '测试提醒');
    await page.click('text=保存提醒');
    await expect(page.locator('text=测试提醒')).toBeVisible();
  });
});
