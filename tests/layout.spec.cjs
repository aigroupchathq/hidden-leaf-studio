const { test, expect } = require('@playwright/test');

test('studio screens fit mobile and desktop without sticky subheadings or clipped controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Start writing' }).click();

  for (const width of [320, 375, 390, 544, 768, 1280]) {
    await page.setViewportSize({ width, height: 760 });
    for (const screen of ['write', 'vocal', 'beat', 'circle']) {
      await page.locator(`#studio-nav [data-screen="${screen}"]`).click();
      const layout = await page.evaluate(() => {
        const visible = (node) => node && getComputedStyle(node).display !== 'none';
        const header = document.querySelector('body > header');
        const vocalHeader = document.querySelector('#vocal-view .vocal-page-heading');
        const main = document.querySelector('body > main');
        const trackControls = document.querySelector('.vocal-track-controls');
        return {
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          offenders: [...document.querySelectorAll('body *')]
            .filter((node) => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
            .slice(0, 12).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className).slice(0, 55), right: Math.round(node.getBoundingClientRect().right) })),
          headerBottom: header.getBoundingClientRect().bottom,
          mainTop: main.getBoundingClientRect().top,
          vocalHeaderPosition: getComputedStyle(vocalHeader).position,
          trackControlsClipped: Boolean(visible(trackControls) && trackControls.scrollWidth > trackControls.clientWidth + 1)
        };
      });
      expect(layout.scrollWidth, `${screen} at ${width}px caused horizontal overflow: ${JSON.stringify(layout.offenders)}`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.vocalHeaderPosition, `Vocal heading is sticky at ${width}px`).not.toBe('sticky');
      expect(layout.trackControlsClipped, `Take controls clipped at ${width}px`).toBe(false);
      if (width < 640) expect(layout.mainTop, `Main overlaps header at ${width}px`).toBeGreaterThanOrEqual(layout.headerBottom - 1);
    }
  }
  expect(errors).toEqual([]);
});

test('recording take controls and labels remain usable at narrow widths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start writing' }).click();
  await page.locator('#studio-nav [data-screen="vocal"]').click();
  await page.evaluate(() => {
    studioTracks.push({
      id: 'layout-check', name: 'Long verse vocal layer',
      blob: new Blob(['test'], { type: 'audio/wav' }), duration: 2,
      createdAt: Date.now(), muted: false, volume: 1, offset: 0,
      player: null, objectUrl: null
    });
    renderStudioTracks();
  });
  for (const width of [320, 375, 390, 544, 768, 1280]) {
    await page.setViewportSize({ width, height: 760 });
    const dimensions = await page.evaluate(() => {
      const controls = document.querySelector('.vocal-track-controls');
      const row = document.querySelector('.vocal-track');
      const heading = document.querySelector('.vocal-page-heading');
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        controlsWidth: controls.clientWidth,
        controlsScrollWidth: controls.scrollWidth,
        controlsRight: controls.getBoundingClientRect().right,
        rowRight: row.getBoundingClientRect().right,
        headingRight: heading.getBoundingClientRect().right
      };
    });
    expect(dimensions.documentWidth, `${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewportWidth);
    expect(dimensions.controlsScrollWidth, `${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.controlsWidth + 1);
    expect(dimensions.controlsRight, `${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.rowRight + 1);
    expect(dimensions.headingRight).toBeLessThanOrEqual(dimensions.viewportWidth);
  }
});

test('splash and pitch guide text stay readable without overlapping', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 760 });
    const splash = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      color: getComputedStyle(document.getElementById('splash-enter')).color,
      fontSize: parseFloat(getComputedStyle(document.getElementById('splash-enter')).fontSize),
      button: document.getElementById('splash-enter').getBoundingClientRect(),
      title: document.getElementById('splash-title').getBoundingClientRect()
    }));
    expect(splash.width).toBeLessThanOrEqual(splash.viewport);
    expect(splash.color).toBe('rgb(255, 255, 255)');
    expect(splash.fontSize).toBeGreaterThanOrEqual(14);
    expect(splash.button.top).toBeGreaterThan(splash.title.bottom);
  }
  await page.getByRole('button', { name: 'Start writing' }).click();
  await page.locator('#studio-nav [data-screen="vocal"]').click();
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 760 });
    const positions = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      return {
        note: rect('#tuner-note'),
        frequency: rect('#tuner-frequency'),
        target: rect('#tuner-target'),
        cents: rect('#tuner-cents'),
        trace: rect('#pitch-trace'),
        hint: rect('.pitch-tool-note'),
        meter: rect('.vocal-cents-meter')
      };
    });
    for (const [upper, lower] of [['note', 'frequency'], ['frequency', 'target'], ['target', 'cents'], ['cents', 'trace'], ['trace', 'hint'], ['hint', 'meter']]) {
      expect(positions[upper].bottom, `${width}px: ${upper} overlaps ${lower}`).toBeLessThanOrEqual(positions[lower].top + 1);
    }
  }
  await page.locator('[data-vocal-mode="record"]').click();
  await expect(page.locator('.tuner-readout')).toBeHidden();
  await expect(page.locator('#vocal-recording')).toBeVisible();
  await expect(page.locator('#beat-waveform, #rap-waveform')).toHaveCount(0);
});
