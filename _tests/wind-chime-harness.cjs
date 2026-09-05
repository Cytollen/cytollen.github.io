// Run with: node --test _tests/wind-chime.test.cjs
// These exercise the production script without a browser or extra dependencies.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness({ reducedMotion = false, nativeCanvas, image, clapperImage, audioAllowed = true, randomSeed = 7919, pitch } = {}) {
  let now = 1000;
  let id = 0;
  const frames = new Map();
  const timers = new Map();
  const audioContexts = [];
  let resumeCalls = 0;
  let seed = randomSeed;
  const sounds = [];
  const draws = [];
  const drawOps = [];
  let lineStart, lineEnd;
  const fakeContext = new Proxy({}, { get: (target, key) => target[key] || (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  fakeContext.drawImage = (image) => { draws.push(image); drawOps.push({ type: "image", image }); };
  fakeContext.moveTo = (x, y) => { lineStart = [x, y]; };
  fakeContext.lineTo = (x, y) => { lineEnd = [x, y]; };
  fakeContext.stroke = () => drawOps.push({ type: "wire", from: lineStart, to: lineEnd });
  const target = (properties = {}) => ({
    listeners: {}, attrs: {},
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
    emit(name, event = {}) { this.listeners[name]?.forEach((callback) => callback(event)); },
    setAttribute(name, value) { this.attrs[name] = value; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 175.5, height: 175.5 * 1619 / 971 }; },
    ...properties,
  });
  const canvas = nativeCanvas ? nativeCanvas.createCanvas(971, 1619) : { getContext: () => fakeContext };
  canvas.getBoundingClientRect = target().getBoundingClientRect;
  const button = target({ disabled: true });
  const soundButton = target({ hidden: true, contains(element) { return element === this; } });
  const soundLabel = { textContent: "SOUND OFF" };
  const classes = new Set();
  let imageIndex = 0;
  const figure = target({
    classList: { add: (value) => classes.add(value) },
    dataset: { clapperSrc: clapperImage ? clapperImage.src : "clapper.webp" },
    contains: (element) => element === button,
    querySelector: (selector) => ({ ".wind-chime-touch": button, ".wind-chime-sound": soundButton, ".wind-chime-sound-label": soundLabel, canvas, img: { src: image ? image.src : "original.png" } })[selector],
  });
  const document = target({ hidden: false, querySelector: (selector) => selector === "[data-wind-chime]" ? figure : null,
    createElement: () => nativeCanvas ? nativeCanvas.createCanvas(1, 1) : { getContext: () => fakeContext } });
  const media = target({ matches: reducedMotion });
  const parameter = () => ({ value: 0, setTargetAtTime(value) { this.value = value; }, setValueAtTime(value) { this.value = value; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ gain: parameter(), pan: parameter(), frequency: parameter(), detune: parameter(), threshold: parameter(), knee: parameter(), ratio: parameter(), Q: parameter(), connect(destination) { this.output = destination; }, disconnect() {} });
  class AudioContext {
    constructor() { this.state = "suspended"; this.sampleRate = 48000; audioContexts.push(this); }
    get currentTime() { return now / 1000; }
    resume() { resumeCalls++; if (audioAllowed) { this.state = "running"; return Promise.resolve(); } return new Promise(() => {}); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { ...node(), start() {}, stop() {} }; }
    createBiquadFilter() { return node(); }
    createGain() { return node(); }
    createDynamicsCompressor() { return node(); }
    createStereoPanner() { return node(); }
    createOscillator() {
      const oscillator = node();
      oscillator.start = () => sounds.push({ frequency: oscillator.frequency.value, time: now, volume: oscillator.output.output.gain.value });
      oscillator.stop = () => {};
      return oscillator;
    }
  }
  const window = target({ devicePixelRatio: 2, matchMedia: () => media, AudioContext,
    setTimeout(callback, delay) { timers.set(++id, { callback, due: now + delay }); return id; } });
  const testMath = Object.create(Math);
  testMath.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const sandbox = { Math: testMath, window, document, console, performance: { now: () => now },
    Image: image ? function () { return imageIndex++ ? (clapperImage || image) : image; } : class {},
    requestAnimationFrame(callback) { frames.set(++id, callback); return id; },
    cancelAnimationFrame(key) { frames.delete(key); } };
  let source = fs.readFileSync(path.join(__dirname, "../assets/js/wind-chime.js"), "utf8");
  // Exercise alternate configuration choices without exposing a public control.
  if (pitch) source = source.replace('const DEFAULT_PITCH = "pure";', `const DEFAULT_PITCH = ${JSON.stringify(pitch)};`);
  // Expose internals only inside this isolated test evaluation, never in production.
  source = source.replace(/\}\)\(\);\s*$/, `globalThis.chime = { tubes, canopy, clapper, depth, sail, pendulums, artwork, clapperArtwork, prepareArtwork,
    draw, step, gust, brush, pointOn, worldPoint, clapperCenter, segmentDistance, enableSound, playTone,
    state: () => ({ ready, frame, soundEnabled: !muted && audio?.state === "running", muted, voices: voices.size }), sprites: () => [cap, clapperSprite, sailSprite, ...tubes.map(tube => tube.sprite)] }; })();`);
  vm.runInNewContext(source, sandbox);
  const chime = sandbox.chime;
  const advance = (milliseconds, frameDuration = 1000 / 60) => {
    const until = now + milliseconds;
    while (now < until) {
      now += frameDuration;
      for (const [key, timer] of timers) if (timer.due <= now) { timers.delete(key); timer.callback(); }
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(now));
    }
  };
  return { chime, canvas, button, soundButton, soundLabel, classes, window, document, media, sounds, draws, drawOps, frames, audioContexts,
    advance, setTime: (value) => { now = value; }, allowAudio: () => { audioAllowed = true; },
    resumeCalls: () => resumeCalls, notes: () => sounds.filter((_, index) => index % 5 === 0) };
}

module.exports = { harness };
