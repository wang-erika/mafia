import { test, expect } from '@playwright/test';

test('bypass login using disable-security strategy', async ({ page }) => {
    await page.goto('http://localhost:31000/api/auth?key=disable-security&nickname=test&name=test');
  
    const response = await page.request.get('http://localhost:31000/api/check');
    const responseBody = await response.json();
    expect(responseBody.isAuthenticated).toBe(true);
  });
  

test('start game and access host-only features', async ({ page }) => {
  await page.goto('http://localhost:31000/api/auth?key=disable-security&nickname=test&name=test&groups=mafia-admin');
  await page.goto('http://localhost:31000/lobby')
  await page.click('text=Create Games')
  await page.waitForLoadState('networkidle');
  await page.waitForURL('http://localhost:31000/')

  // Host only settings link
  const textContent = await page.textContent('body');
  expect(textContent).toContain('Game Settings');
})


test('login and join existing game through lobby', async ({ page }) => {
  await page.goto('http://localhost:31000/api/auth?key=disable-security&nickname=test&name=test');
  await page.goto('http://localhost:31000/lobby')
  await page.click('text=Join As Player')
})

test('user can send a chat message', async ({ page }) => {
  await page.goto('http://localhost:31000/api/auth?key=disable-security&nickname=test&name=test');
  await page.goto('http://localhost:31000/')
  await page.waitForSelector('input[placeholder="Type a message..."]', { state: 'visible' });

  const testMessage = "Hello, this is a test message!";
  await page.fill('input[placeholder="Type a message..."]', testMessage);

  await page.click('text="Send"');

  await expect(page.locator('.messages')).toContainText(testMessage);

  const inputValue = await page.inputValue('input[placeholder="Type a message..."]');
  expect(inputValue).toBe('');
});