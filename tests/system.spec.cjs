const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const sdkPath = path.resolve(
  path.dirname(require.resolve('appwrite')),
  '..',
  'iife',
  'sdk.js'
);
const appwriteSdk = fs.readFileSync(sdkPath, 'utf8');

async function useLocalSdk(page) {
  await page.route('https://cdn.jsdelivr.net/npm/appwrite@29.1.0', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: appwriteSdk
    })
  );
}

async function enterStudio(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start writing' }).click();
}

async function openCircle(page) {
  await page.locator('[data-screen="circle"]').click();
}

test.beforeEach(async ({ page }) => {
  await useLocalSdk(page);
});

test('first visit stays usable and clearly reports missing Appwrite config', async ({ page }) => {
  await enterStudio(page);
  await openCircle(page);

  await expect(page.locator('#appwrite-auth-badge')).toHaveText('Appwrite · setup required');
  await page.locator('button[onclick="openAppwriteAccountDialog()"]').click();
  await expect(page.locator('#appwrite-account-status')).toContainText('Add the Appwrite Web SDK endpoint');

  await page.locator('#appwrite-email').fill('artist@example.com');
  await page.locator('#appwrite-password').fill('a-safe-test-password');
  await page.locator('#appwrite-submit').click();
  await expect(page.locator('#appwrite-account-status')).toContainText('Appwrite is not ready');
  await expect(page.locator('#circle-project-list button')).toHaveCount(2);
});

test('corrupt saved draft is reported without preventing the studio from opening', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hidden-leaf-draft-v1', '{not valid json');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start writing' }).click();

  await expect(page.locator('#draft-status')).toContainText('Saved draft could not be read');
  await expect(page.getByRole('textbox', { name: 'Line 1', exact: true })).toBeVisible();
});

test('word field uses monochrome motion and respects reduced-motion preference', async ({ page }) => {
  await enterStudio(page);
  const word = page.locator('#word-field-nodes .word-orbit:not(.word-orbit-ambient)').first();
  const ambientWord = page.locator('#word-field-nodes .word-orbit-ambient').first();
  await expect(word).toBeVisible();
  await expect(ambientWord).toBeAttached();

  const motionStyles = await page.evaluate(() => {
    const primary = document.querySelector('#word-field-nodes .word-orbit:not(.word-orbit-ambient)');
    const ambient = document.querySelector('#word-field-nodes .word-orbit-ambient');
    const field = document.getElementById('word-field');
    return {
      primaryAnimation: getComputedStyle(primary).animationName,
      primaryColor: getComputedStyle(primary).color,
      ambientAnimation: getComputedStyle(ambient).animationName,
      ambientColor: getComputedStyle(ambient).color,
      ringAnimation: getComputedStyle(field, '::before').animationName
    };
  });
  expect(motionStyles.primaryAnimation).toBe('word-spiral-primary');
  expect(motionStyles.ambientAnimation).toBe('word-drift-ambient');
  expect(motionStyles.ringAnimation).toBe('word-lens-drift');
  expect(motionStyles.primaryColor).toBe('rgb(242, 242, 242)');
  expect(motionStyles.ambientColor).toContain('220, 220, 220');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionNames = await page.evaluate(() => {
    const primary = document.querySelector('#word-field-nodes .word-orbit:not(.word-orbit-ambient)');
    const ambient = document.querySelector('#word-field-nodes .word-orbit-ambient');
    const field = document.getElementById('word-field');
    return [
      getComputedStyle(primary).animationName,
      getComputedStyle(ambient).animationName,
      getComputedStyle(field, '::before').animationName,
      getComputedStyle(field, '::after').animationName
    ];
  });
  expect(reducedMotionNames).toEqual(['none', 'none', 'none', 'none']);
});

test('lyric writing line floats gently when idle and stays still while focused', async ({ page }) => {
  await enterStudio(page);
  await expect(page.locator('#studio-splash')).toBeHidden();
  const line = page.locator('.writing-line-one');
  const textarea = page.getByRole('textbox', { name: 'Line 1', exact: true });

  await line.locator('input, textarea').evaluateAll((elements) => elements.forEach((element) => element.blur()));
  await page.locator('[data-screen="beat"]').focus();
  await expect(textarea).not.toBeFocused();
  await expect.poll(() => line.evaluate((element) => element.matches(':focus-within'))).toBe(false);
  await expect.poll(() => line.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('lyric-line-float');
  await textarea.focus();
  await expect.poll(() => line.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('none');
  const focusedTransform = await line.evaluate((element) => getComputedStyle(element).transform);
  expect(focusedTransform).toBe('none');

  await textarea.fill('A line that stays steady while I write');
  await expect(textarea).toHaveValue('A line that stays steady while I write');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await textarea.blur();
  await expect.poll(() => line.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('none');
});

test('language changes update suggestions without changing the draft and survive reload', async ({ page }) => {
  await enterStudio(page);
  const language = page.locator('#writing-language');
  const line = page.getByRole('textbox', { name: 'Line 1', exact: true });

  await line.fill('A private image stays in my own voice');
  await language.selectOption('english');
  await expect(page.locator('#word-field')).toContainText('English vocabulary');
  await expect(page.locator('#word-field')).toContainText('afterimage');

  await language.selectOption('roman-hindi');
  await expect(page.locator('#word-field')).toContainText('Roman Hindi/Urdu vocabulary');
  await expect(page.locator('#word-field')).toContainText('kainaat');
  await expect(line).toHaveValue('A private image stays in my own voice');

  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator('#writing-language')).toHaveValue('roman-hindi');
  await expect(page.getByRole('textbox', { name: 'Line 1', exact: true })).toHaveValue('A private image stays in my own voice');
  await expect(page.locator('#word-field')).toContainText('Roman Hindi/Urdu vocabulary');
});

test('beat chord voicings play in every palette and lane mute/solo gates playback', async ({ page }) => {
  await page.addInitScript(() => {
    window.__beatAudioFrequencies = [];
    const parameter = () => ({
      setValueAtTime(value) {
        window.__beatAudioFrequencies.push(value);
      },
      exponentialRampToValueAtTime() {}
    });
    const node = () => ({
      connect() {},
      disconnect() {},
      start() {},
      stop() {}
    });
    class TestAudioContext {
      constructor() {
        this.currentTime = 0;
        this.sampleRate = 1000;
        this.state = 'suspended';
        this.destination = {};
      }
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      suspend() {
        this.state = 'suspended';
        return Promise.resolve();
      }
      createOscillator() {
        return { ...node(), frequency: parameter(), type: 'sine' };
      }
      createGain() {
        return { ...node(), gain: parameter() };
      }
      createBuffer(_channels, length) {
        return { getChannelData: () => new Float32Array(length) };
      }
      createBufferSource() {
        return { ...node(), buffer: null };
      }
      createBiquadFilter() {
        return { ...node(), frequency: parameter(), type: 'lowpass' };
      }
    }
    window.AudioContext = TestAudioContext;
    window.webkitAudioContext = TestAudioContext;
  });
  await enterStudio(page);
  await page.locator('[data-screen="beat"]').click();

  await page.locator('#select-palette').selectOption('slowpulse');
  await page.getByRole('button', { name: 'Solo CHORD lane' }).click();
  await page.getByRole('button', { name: 'Play beat' }).click();
  await page.waitForTimeout(100);
  const drillFrequencies = await page.evaluate(() => window.__beatAudioFrequencies.slice());
  for (const frequency of [110, 130.81, 164.81, 196]) {
    expect(drillFrequencies).toContain(frequency);
  }
  expect(drillFrequencies).not.toContain(120);

  await page.getByRole('button', { name: 'Stop beat' }).click();
  await page.evaluate(() => { window.__beatAudioFrequencies = []; });
  await page.locator('#select-palette').selectOption('tabladrift');
  await expect(page.getByRole('button', { name: 'Unsolo CHORD lane' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Play beat' }).click();
  await page.waitForTimeout(100);
  const tablaFrequencies = await page.evaluate(() => window.__beatAudioFrequencies.slice());
  for (const frequency of [146.83, 185, 220, 277.18]) {
    expect(tablaFrequencies).toContain(frequency);
  }
  expect(tablaFrequencies).not.toContain(120);

  await page.getByRole('button', { name: 'Stop beat' }).click();
  await page.getByRole('button', { name: 'Mute CHORD lane' }).click();
  await page.evaluate(() => { window.__beatAudioFrequencies = []; });
  await page.getByRole('button', { name: 'Play beat' }).click();
  await page.waitForTimeout(100);
  await expect.poll(() => page.evaluate(() => window.__beatAudioFrequencies.length)).toBe(0);
  await expect(page.getByRole('button', { name: 'Unmute CHORD lane' })).toHaveAttribute('aria-pressed', 'true');
});

test('beat particle tab reacts to audible hits and stops cleanly', async ({ page }) => {
  await page.addInitScript(() => {
    const parameter = () => ({
      setValueAtTime() {},
      exponentialRampToValueAtTime() {}
    });
    const node = () => ({
      connect() {},
      disconnect() {},
      start() {},
      stop() {}
    });
    class TestAudioContext {
      constructor() {
        this.currentTime = 0;
        this.sampleRate = 1000;
        this.state = 'suspended';
        this.destination = {};
      }
      resume() { this.state = 'running'; return Promise.resolve(); }
      suspend() { this.state = 'suspended'; return Promise.resolve(); }
      createOscillator() { return { ...node(), frequency: parameter(), type: 'sine' }; }
      createGain() { return { ...node(), gain: parameter() }; }
      createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
      createBufferSource() { return { ...node(), buffer: null }; }
      createBiquadFilter() { return { ...node(), frequency: parameter(), type: 'lowpass' }; }
    }
    window.AudioContext = TestAudioContext;
    window.webkitAudioContext = TestAudioContext;
  });
  await enterStudio(page);
  await page.locator('[data-screen="beat"]').click();

  const visualizer = page.locator('#beat-visualizer');
  const canvas = page.locator('#beat-visualizer-canvas');
  await expect(visualizer).toHaveAttribute('open', '');
  await expect(visualizer.locator('summary')).toContainText('slow drift, responsive to your rhythm');
  await expect(canvas).toBeVisible();
  await expect(visualizer).toBeVisible();
  await expect(canvas).toHaveCSS('animation-name', 'beat-dust-drift');
  await expect(canvas).toHaveCSS('height', '128px');
  await page.getByRole('button', { name: 'Play beat' }).click();
  await expect.poll(() => canvas.getAttribute('data-particle-count')).not.toBe('0');
  await visualizer.locator('summary').click();
  await expect(canvas).toHaveAttribute('data-particle-count', '0');
  await page.getByRole('button', { name: 'Stop beat' }).click();
  await expect(canvas).toHaveAttribute('data-particle-count', '0');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visualizer.locator('summary').click();
  await expect(canvas).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Play beat' }).click();
  await page.waitForTimeout(150);
  await expect(canvas).toHaveAttribute('data-particle-count', '0');
  await page.getByRole('button', { name: 'Stop beat' }).click();
});

test('beat room preview enforces roles, restores patterns, and safely renders chat text', async ({ page }) => {
  await enterStudio(page);
  await openCircle(page);
  await expect(page.getByLabel('Collaboration preview scope')).toContainText('nothing here is shared or saved to a server');
  await expect(page.getByLabel('Collaboration preview scope')).toContainText('Lyrics stay in this browser');
  await expect(page.getByLabel('Collaboration preview scope')).toContainText('No uploaded audio, persistent chat, public directory, or open invites');
  await expect(page.getByRole('button', { name: 'Invite preview' })).toBeVisible();
  await page.getByRole('button', { name: 'New beat room' }).click();
  await expect(page.locator('.circle-project-list button').first()).toContainText('Untitled collab 1');

  const createdStep = page.locator('#circle-step-grid button').nth(1);
  await expect(createdStep).toHaveAttribute('aria-pressed', 'false');
  await createdStep.click();
  await expect(createdStep).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Restore starting beat' }).click();
  await expect(page.locator('#circle-step-grid button').nth(1)).toHaveAttribute('aria-pressed', 'false');

  await page.getByLabel('Write a message to this beat room').fill('<script>alert(1)</script>');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('#circle-chat-log')).toContainText('<script>alert(1)</script>');
  await expect(page.locator('#circle-chat-log script')).toHaveCount(0);

  await page.getByRole('button', { name: /Afterimage/ }).click();
  await expect(page.locator('#circle-role-label')).toHaveText('You · listener');
  await expect(page.locator('#circle-step-grid button:disabled')).toHaveCount(16);
  await expect(page.locator('#circle-restore-version')).toBeDisabled();
});

test('Circle and account dialog fit narrow mobile screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterStudio(page);
  await openCircle(page);

  const circleLayout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    layoutColumns: getComputedStyle(document.querySelector('.circle-layout')).gridTemplateColumns,
    stepWidth: document.querySelector('.circle-step').getBoundingClientRect().width,
    stepHeight: document.querySelector('.circle-step').getBoundingClientRect().height
  }));
  expect(circleLayout.scrollWidth).toBeLessThanOrEqual(circleLayout.viewportWidth);
  expect(circleLayout.layoutColumns.split(' ')).toHaveLength(1);
  expect(circleLayout.stepWidth).toBeGreaterThanOrEqual(44);
  expect(circleLayout.stepHeight).toBeGreaterThanOrEqual(44);

  await page.locator('button[onclick="openAppwriteAccountDialog()"]').click();
  const dialogBounds = await page.locator('#appwrite-account-dialog').evaluate((dialog) => {
    const bounds = dialog.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right, viewportWidth: window.innerWidth };
  });
  expect(dialogBounds.left).toBeGreaterThanOrEqual(0);
  expect(dialogBounds.right).toBeLessThanOrEqual(dialogBounds.viewportWidth);
});

test('beat grid shows all steps without horizontal scrolling on narrow screens', async ({ page }) => {
  await enterStudio(page);
  await page.locator('[data-screen="beat"]').click();

  for (const width of [320, 390, 640]) {
    await page.setViewportSize({ width, height: 844 });
    const beatLayout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      controlCount: document.querySelectorAll('#beat-editor .beat-track-control').length,
      controlHeight: document.querySelector('.beat-track-control').getBoundingClientRect().height,
      editorVisible: !document.getElementById('beat-view').classList.contains('hidden'),
      lanes: Array.from(document.querySelectorAll('#beat-editor .beat-grid'), (grid) => {
        const bounds = grid.getBoundingClientRect();
        const steps = Array.from(grid.querySelectorAll('.beat-step'), (step) => {
          const stepBounds = step.getBoundingClientRect();
          return {
            left: stepBounds.left >= bounds.left - 1,
            right: stepBounds.right <= bounds.right + 1,
            height: stepBounds.height
          };
        });
        return {
          columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          clientWidth: grid.clientWidth,
          scrollWidth: grid.scrollWidth,
          steps
        };
      })
    }));
    expect(beatLayout.editorVisible).toBe(true);
    expect(beatLayout.controlCount).toBe(8);
    expect(beatLayout.controlHeight).toBeGreaterThanOrEqual(44);
    expect(beatLayout.scrollWidth).toBeLessThanOrEqual(beatLayout.viewportWidth);
    expect(beatLayout.lanes).toHaveLength(4);
    for (const lane of beatLayout.lanes) {
      expect(lane.columns).toBe(width <= 360 ? 4 : 8);
      expect(lane.clientWidth).toBe(lane.scrollWidth);
      expect(lane.steps).toHaveLength(16);
      expect(
        lane.steps.every((step) => step.left && step.right && step.height >= 44),
        JSON.stringify({ width, steps: lane.steps })
      ).toBe(true);
    }
  }
});

test('configured auth can sign up and sign out through Appwrite SDK requests', async ({ page }) => {
  let authenticated = false;
  let createdAccount = null;
  const calls = [];

  await page.route('**/appwrite-config.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.HIDDEN_LEAF_APPWRITE_CONFIG = Object.freeze({
        endpoint: 'http://127.0.0.1:4173/v1',
        projectId: 'test-project'
      });`
    })
  );
  await page.route('http://127.0.0.1:4173/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push({ method: request.method(), path: url.pathname });

    if (url.pathname === '/v1/account' && request.method() === 'GET') {
      if (!authenticated) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'No session', code: 401, type: 'unauthorized', version: '1' })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ $id: 'test-user', name: 'Test Artist', email: 'artist@example.com' })
      });
    }

    if (url.pathname === '/v1/account' && request.method() === 'POST') {
      createdAccount = request.postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ $id: 'test-user', name: createdAccount.name, email: createdAccount.email })
      });
    }

    if (url.pathname === '/v1/account/sessions/email' && request.method() === 'POST') {
      authenticated = true;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ $id: 'test-session', userId: 'test-user', current: true })
      });
    }

    if (url.pathname === '/v1/account/sessions/current' && request.method() === 'DELETE') {
      authenticated = false;
      return route.fulfill({ status: 204, body: '' });
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unexpected mocked request', code: 404, type: 'not_found', version: '1' })
    });
  });

  await enterStudio(page);
  await openCircle(page);
  await page.locator('button[onclick="openAppwriteAccountDialog()"]').click();
  await expect(page.locator('#appwrite-account-status')).toContainText('Sign in or create an account');
  await page.locator('#appwrite-signup-mode').click();
  await page.locator('#appwrite-name').fill('Test Artist');
  await page.locator('#appwrite-email').fill('artist@example.com');
  await page.locator('#appwrite-password').fill('safe-test-password-123');
  await page.locator('#appwrite-submit').click();

  await expect(page.locator('#appwrite-account-dialog')).not.toHaveAttribute('open', '');
  await expect(page.locator('#appwrite-auth-badge')).toHaveText('Signed in · Test Artist');
  expect(createdAccount.name).toBe('Test Artist');
  expect(createdAccount.email).toBe('artist@example.com');
  expect(calls.some((call) => call.path === '/v1/account/sessions/email')).toBe(true);

  await page.locator('button[onclick="openAppwriteAccountDialog()"]').click();
  await page.locator('#appwrite-sign-out').click();
  await expect(page.locator('#appwrite-auth-badge')).toHaveText('Appwrite · signed out');
  expect(calls.some((call) => call.method === 'DELETE' && call.path === '/v1/account/sessions/current')).toBe(true);
});

test('configured auth keeps the dialog open and surfaces rejected credentials', async ({ page }) => {
  await page.route('**/appwrite-config.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `window.HIDDEN_LEAF_APPWRITE_CONFIG = Object.freeze({
        endpoint: 'http://127.0.0.1:4173/v1',
        projectId: 'test-project'
      });`
    })
  );
  await page.route('http://127.0.0.1:4173/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/v1/account' && request.method() === 'GET') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'No session', code: 401, type: 'unauthorized', version: '1' })
      });
    }
    if (url.pathname === '/v1/account/sessions/email' && request.method() === 'POST') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials', code: 401, type: 'user_invalid_credentials', version: '1' })
      });
    }
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Not found', code: 404, type: 'not_found', version: '1' })
    });
  });

  await enterStudio(page);
  await openCircle(page);
  await page.locator('button[onclick="openAppwriteAccountDialog()"]').click();
  await page.locator('#appwrite-email').fill('artist@example.com');
  await page.locator('#appwrite-password').fill('wrong-password-123');
  await page.locator('#appwrite-submit').click();

  await expect(page.locator('#appwrite-account-dialog')).toBeVisible();
  await expect(page.locator('#appwrite-account-status')).toContainText('Sign-in failed');
  await expect(page.locator('#appwrite-auth-badge')).toHaveText('Appwrite · signed out');
});

test.describe.skip('live Appwrite integration', () => {
  test('connects to the isolated project and enforces project permissions', async () => {
    // Requires the project API endpoint, configured test users, and an isolated test-data cleanup policy.
  });
});
