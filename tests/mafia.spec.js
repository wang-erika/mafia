import { test, expect } from '@playwright/test';

test('bypass login using disable-security strategy', async ({ page }) => {
    await page.goto('http://localhost:31000/api/auth?key=disable-security&nickname=test&name=test');
  
    const response = await page.request.get('http://localhost:31000/api/check');
    const responseBody = await response.json();
    expect(responseBody.isAuthenticated).toBe(true);
  });
  
/*
test('start game and access host-only features', async ({ page }) => {
  await page.goto('http://localhost:8130/api/auth?key=disable-security&nickname=test&name=test&groups=mafia-admin');
  await page.goto('http://localhost:8130/lobby')
  await page.click('text=Create Game')
  await page.waitForURL('http://localhost:8130/')

  // Host only settings link
  const textContent = await page.textContent('body');
  expect(textContent).toContain('Game Settings');

  // Navigate to host only game settings and change room name
  await page.click('text=Game Settings');

  await page.waitForSelector('form.form');

  // Fill the form
  await page.fill('#roomName', 'Test Room');
  await page.fill('#dayLength', '20'); 
  await page.fill('#nightLength', '10'); 

  // Click on "Update Settings" button
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:8130/')
  const roomName = await page.textContent('body');
  expect(roomName).toContain('Test Room');
})
*/

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