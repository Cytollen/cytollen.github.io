const { test } = require("node:test");
const assert = require("node:assert/strict");
const { harness } = require("./wind-chime-harness.cjs");

function sweep(h, y = 500) {
  const scale = 175.5 / 971;
  h.chime.brush({ clientX: 300 * scale, clientY: y * scale, pointerType: "mouse" });
  h.advance(16);
  h.chime.brush({ clientX: 670 * scale, clientY: y * scale, pointerType: "mouse" });
}

test("preserves fallback and keeps decomposed artwork under 5 MB", () => {
  const h = harness();
  assert.equal(h.button.disabled, true);
  h.chime.prepareArtwork();
  assert.equal(h.button.disabled, false);
  assert.ok(h.classes.has("wind-chime-ready"));
  const bytes = h.chime.sprites().reduce((sum, sprite) => sum + sprite.image.width * sprite.image.height * 4, 0);
  assert.ok(bytes < 5_000_000);
});

test("cursor wind moves the assembly but produces no direct notes; contacts ring later", () => {
  const h = harness();
  h.chime.prepareArtwork();
  sweep(h);
  assert.equal(h.sounds.length, 0);
  assert.ok(h.chime.canopy.velocity < 0);
  assert.ok(h.chime.clapper.velocity < 0);
  assert.ok(h.chime.tubes.every((tube) => Math.abs(tube.velocity) < 0.08));
  h.advance(2500);
  assert.ok(h.notes().length >= 3, "a breeze reaches several tubes");
  assert.ok(new Set(h.notes().map((note) => note.frequency)).size >= 3);
});

test("fast repeated gusts remain restrained and every note stays separated", () => {
  const h = harness();
  h.chime.prepareArtwork();
  h.chime.enableSound();
  for (let i = 0; i < 30; i++) {
    h.chime.gust(i % 3 ? 1 : -1, 1, 0.2);
    h.advance(110);
    assert.ok(h.chime.tubes.every((tube) => Math.abs(tube.angle) <= 0.105));
    assert.ok(Math.abs(h.chime.canopy.angle) <= 0.0322);
  }
  assert.ok(h.notes().length > 2);
  const lastByPitch = new Map();
  h.notes().forEach((note, index, notes) => {
    if (index) assert.ok(note.time - notes[index - 1].time >= 180);
    if (lastByPitch.has(note.frequency)) assert.ok(note.time - lastByPitch.get(note.frequency) >= 620);
    lastByPitch.set(note.frequency, note.time);
  });
});

test("canopy carries each underside attachment point without detaching the wires", () => {
  const h = harness();
  h.chime.canopy.angle = 0.0322;
  h.chime.tubes.forEach((tube) => {
    assert.ok(tube.y < tube.top, "anchor is above tube mouth");
    tube.angle = 0.09;
    const attached = h.chime.worldPoint(tube, tube.x, tube.y);
    const canopyPoint = h.chime.pointOn(h.chime.canopy, tube.x, tube.y);
    assert.ok(Math.hypot(attached.x - canopyPoint.x, attached.y - canopyPoint.y) < 1e-9);
  });
});

test("catcher wire and clapper sit between the rear tubes and front tubes", () => {
  const h = harness();
  h.chime.prepareArtwork();
  h.chime.canopy.angle = 0.01;
  h.drawOps.length = 0;
  h.chime.draw();
  const imageOrder = (sprite) => h.drawOps.findIndex((op) => op.image === sprite.image);
  const cord = h.drawOps.findIndex((op) => op.type === "wire" && op.to[1] === 1248);
  assert.ok(cord >= 0);
  [0, 2, 4].forEach((index) => assert.ok(imageOrder(h.chime.tubes[index].sprite) < cord));
  [1, 3, 5].forEach((index) => assert.ok(imageOrder(h.chime.tubes[index].sprite) > cord));
  const disk = imageOrder(h.chime.sprites()[1]);
  assert.ok(disk > cord);
  [1, 3, 5].forEach((index) => assert.ok(imageOrder(h.chime.tubes[index].sprite) > disk));
});

test("one swipe gives multiple pitches then a quieter, sparser tail across different winds", () => {
  const earlyVolumes = [], lateVolumes = [], earlyGaps = [], lateGaps = [];
  for (let seed = 1; seed <= 8; seed++) {
    const h = harness({ randomSeed: seed * 7919 });
    h.chime.prepareArtwork();
    h.chime.enableSound();
    h.chime.gust(seed % 2 ? 1 : -1, 1);
    h.advance(12000);
    const notes = h.notes();
    assert.ok(notes.length >= 7);
    assert.ok(new Set(notes.map((note) => note.frequency)).size >= 3);
    assert.ok(notes.at(-1).time > 5000, "contacts continue several seconds after the swipe");
    notes.forEach((note, index) => {
      if (note.time < 3000) {
        earlyVolumes.push(note.volume);
        if (index) earlyGaps.push(note.time - notes[index - 1].time);
      }
      if (note.time > 4000) {
        lateVolumes.push(note.volume);
        if (index) lateGaps.push(note.time - notes[index - 1].time);
      }
    });
  }
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(mean(lateVolumes) < mean(earlyVolumes) * 0.8);
  assert.ok(mean(lateGaps) > mean(earlyGaps) * 1.5);
});

test("near misses, stationary pointers, and projected resting overlaps do not ring", () => {
  const h = harness();
  h.chime.prepareArtwork();
  h.chime.enableSound();
  for (let i = 0; i < 120; i++) h.chime.step(1 / 120, 1000 + i * 10);
  assert.equal(h.notes().length, 0);
  const scale = 175.5 / 971;
  h.chime.brush({ clientX: 230 * scale, clientY: 350 * scale, pointerType: "mouse" });
  h.advance(16);
  h.chime.brush({ clientX: 230 * scale, clientY: 900 * scale, pointerType: "mouse" });
  h.chime.brush({ clientX: 230 * scale, clientY: 900 * scale, pointerType: "mouse" });
  assert.equal(h.frames.size, 0);
  assert.ok(h.chime.pendulums.every((body) => body.velocity === 0));
});

test("physics settles at 60 and 120 Hz without a permanent animation loop", () => {
  for (const rate of [60, 120]) {
    const h = harness();
    h.chime.prepareArtwork();
    h.chime.gust(1, 1);
    h.advance(35000, 1000 / rate);
    assert.equal(h.frames.size, 0);
    assert.ok(h.chime.pendulums.every((body) => body.angle === 0 && body.velocity === 0));
  }
});

test("reduced motion keeps the illustration still while contacts can still sound", () => {
  const h = harness({ reducedMotion: true });
  h.chime.prepareArtwork();
  h.chime.enableSound();
  sweep(h);
  h.advance(2000);
  assert.ok(h.notes().length > 0);
  assert.equal(h.draws.at(-1), h.chime.artwork, "the visible frame uses the stationary original artwork");
  h.advance(35000);
  assert.equal(h.frames.size, 0);
});

test("a suspended hover attempt never blocks a later page gesture or replays old notes", () => {
  const h = harness({ audioAllowed: false });
  h.chime.prepareArtwork();
  sweep(h);
  h.advance(2000);
  assert.equal(h.notes().length, 0);
  assert.equal(h.resumeCalls(), 1);
  h.allowAudio();
  h.document.emit("pointerdown", { isTrusted: true });
  assert.equal(h.resumeCalls(), 2);
  assert.equal(h.notes().length, 0, "no accumulated audio burst on unlock");
  h.chime.gust(-1, 1);
  h.advance(2000);
  assert.ok(h.notes().length > 0);
});

test("hover can resume audio again after a previously permitted context is suspended", () => {
  const h = harness();
  h.chime.prepareArtwork();
  h.chime.enableSound(true);
  assert.equal(h.resumeCalls(), 1);
  h.audioContexts[0].state = "suspended";
  h.advance(2000);
  h.chime.enableSound(true);
  assert.equal(h.resumeCalls(), 2);
  assert.equal(h.chime.state().soundEnabled, true);
});

test("speaker enables sound; mute survives swipes, page clicks and pending audio resumes", async () => {
  const h = harness({ audioAllowed: false });
  h.chime.prepareArtwork();
  sweep(h);
  assert.equal(h.soundButton.attrs["aria-pressed"], "false");
  assert.equal(h.soundLabel.textContent, "SOUND OFF");
  h.allowAudio();
  h.soundButton.emit("click");
  assert.equal(h.soundButton.attrs["aria-pressed"], "true");
  assert.equal(h.soundLabel.textContent, "SOUND ON");
  h.advance(1000);
  assert.ok(h.notes().length > 0);
  h.soundButton.emit("click");
  assert.equal(h.soundButton.attrs["aria-pressed"], "false");
  assert.equal(h.soundLabel.textContent, "SOUND OFF");
  assert.equal(h.chime.state().voices, 0);
  await new Promise(setImmediate);
  const count = h.notes().length;
  h.chime.gust(-1, 1);
  h.document.emit("click", { isTrusted: true });
  h.advance(3000);
  assert.equal(h.notes().length, count);
  assert.equal(h.soundButton.attrs["aria-pressed"], "false");
  assert.equal(h.soundLabel.textContent, "SOUND OFF");
  h.soundButton.emit("click");
  h.chime.gust(1, 1);
  h.advance(2000);
  assert.ok(h.notes().length > count);
  assert.equal(h.soundLabel.textContent, "SOUND ON");
});

test("touch and keyboard can send a breeze; mouse click stays available for navigation", () => {
  const h = harness();
  h.chime.prepareArtwork();
  h.button.emit("click", { detail: 1 });
  assert.equal(h.frames.size, 0);
  h.button.emit("click", { detail: 0 });
  assert.equal(h.frames.size, 1);
  h.advance(500);
  h.button.emit("pointerdown", { pointerType: "touch" });
  h.button.emit("click", { detail: 1 });
  assert.ok(h.chime.sail.velocity !== 0);
});

test("all retained pitch configurations still ring the guide's notes", () => {
  const c5 = 440 * 2 ** ((72 - 69) / 12);
  const sets = {
    warm: [523.25, 587.33, 659.26, 783.99, 880, 1046.50],
    open: [523.25, 587.33, 698.46, 783.99, 880, 1046.50],
    dark: [523.25, 622.25, 698.46, 783.99, 932.33, 1046.50],
    japanese: [523.25, 554.37, 698.46, 783.99, 830.61, 1046.50],
    sparse: [523.25, 698.46, 783.99, 932.33, 1046.50, 1567.98],
    pure: [c5, c5 * 9 / 8, c5 * 5 / 4, c5 * 3 / 2, c5 * 5 / 3, c5 * 2],
    wide: [261.63, 392, 440, 587.33, 659.26, 1046.50],
    current: [783.99, 1046.5, 698.46, 1174.66, 587.33, 880].map((frequency) => frequency * 2 ** (4 / 12)),
  };
  for (const [name, frequencies] of Object.entries(sets)) {
    const h = harness({ pitch: name });
    h.chime.prepareArtwork();
    h.chime.enableSound();
    h.chime.gust(1, 1);
    h.advance(12000);
    const notes = h.notes();
    assert.ok(new Set(notes.map((note) => note.frequency)).size >= 3);
    assert.ok(notes.every((note) => frequencies.some((frequency) => Math.abs(frequency - note.frequency) < 0.02)), name);
  }
});

test("warm pure ratios are the default; audio is bounded and stops in the background", () => {
  const h = harness();
  h.chime.prepareArtwork();
  h.chime.enableSound();
  h.chime.gust(1, 1);
  h.advance(2500);
  assert.ok(h.notes().length > 0);
  const c5 = 440 * 2 ** ((72 - 69) / 12);
  const frequencies = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2].map((ratio) => c5 * ratio);
  assert.ok(h.notes().every((note) => frequencies.some((frequency) => Math.abs(note.frequency - frequency) < 0.001)));
  for (let i = 0; i < 40; i++) h.chime.playTone(1000, 0.5, 0);
  assert.equal(h.chime.state().voices, 8);
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  assert.equal(h.chime.state().voices, 0);
  assert.equal(h.frames.size, 0);
  const count = h.notes().length;
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  h.advance(10000);
  assert.equal(h.notes().length, count, "returning to the page never replays an old breeze");
});
