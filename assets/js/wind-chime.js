(() => {
  "use strict";

  const figure = document.querySelector("[data-wind-chime]");
  if (!figure) return;

  const button = figure.querySelector(".wind-chime-touch");
  const canvas = figure.querySelector("canvas");
  const context = canvas.getContext("2d");
  const soundButton = figure.querySelector(".wind-chime-sound");
  const soundLabel = figure.querySelector(".wind-chime-sound-label");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!context) return;

  const WIDTH = 971;
  const HEIGHT = 1619;
  const WIND_DECAY = 3.3;
  const WIND_DURATION = 8.5;
  // Switch this key to any retained pitchSets entry to change the site's tuning.
  const DEFAULT_PITCH = "pure";
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const artwork = new Image();
  const clapperArtwork = new Image();
  let artworkLoaded = false;
  let clapperLoaded = false;
  const tubes = [
    // Masks follow the original pencil edges, with each tube's own suspension.
    { x: 371, y: 279, center: 374, top: 356, bottom: 1004, width: 45, frequency: 783.99, normal: [-0.95, -0.312], clearance: 24,
      outline: [[355,356],[382,351],[401,371],[398,939],[399,995],[386,1005],[349,1004],[339,977],[345,702],[349,514]] },
    { x: 400, y: 296, center: 410, top: 337, bottom: 939, width: 48, frequency: 1046.5, normal: [-0.62, 0.785], clearance: 22,
      outline: [[389,337],[420,331],[437,343],[435,928],[420,939],[380,935],[384,711],[384,438]] },
    { x: 453, y: 256, center: 457, top: 381, bottom: 1059, width: 48, frequency: 698.46, normal: [-0.22, -0.975], clearance: 21,
      outline: [[441,381],[462,374],[480,386],[481,1047],[467,1059],[427,1056],[422,1028],[428,701],[430,481]] },
    { x: 516, y: 303, center: 520, top: 328, bottom: 904, width: 47, frequency: 1174.66, normal: [0.32, 0.947], clearance: 23,
      outline: [[501,328],[526,323],[544,339],[540,882],[532,899],[503,905],[489,895],[493,608],[495,397]] },
    { x: 574, y: 269, center: 552, top: 375, bottom: 1120, width: 49, frequency: 587.33, normal: [0.62, -0.785], clearance: 26,
      outline: [[544,375],[566,372],[577,390],[581,1103],[570,1119],[530,1119],[520,1105],[524,905],[534,709],[536,492]] },
    { x: 597, y: 288, center: 590, top: 350, bottom: 883, width: 49, frequency: 880, normal: [0.94, 0.341], clearance: 24,
      outline: [[571,350],[601,345],[615,354],[618,864],[608,881],[577,883],[565,871],[567,598],[565,400]] },
  ].map((tube, index) => ({
    ...tube, angle: 0, velocity: 0, lastStrike: -Infinity, touching: false,
    limit: 0.105, maxVelocity: 0.42,
    // Longer tubes respond and settle more slowly.
    omega: Math.sqrt(9800 / ((tube.bottom - tube.y) * 0.7)),
    damping: 1.08 + index * 0.035,
  }));
  const canopy = { x: 489, y: 29, angle: 0, velocity: 0, omega: 2.55, damping: 0.95, limit: 0.0322, maxVelocity: 0.115 };
  const clapper = { x: 483, y: 286, angle: 0, velocity: 0, omega: 4.45, damping: 0.63, limit: 0.16, maxVelocity: 0.9 };
  const depth = { angle: 0, velocity: 0, omega: 3.72, damping: 0.7, limit: 0.14, maxVelocity: 0.8 };
  const sail = { x: 482, y: 662, angle: 0, velocity: 0, omega: 2.9, damping: 0.72, limit: 0.14, maxVelocity: 0.7 };
  const pendulums = [canopy, ...tubes, clapper, depth, sail];
  const noteFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
  // The guide's five pitch collections, with an octave repeat for six tubes.
  const pitchSets = {
    current: { frequencies: tubes.map((tube) => tube.frequency * 2 ** (4 / 12)), notes: "F♯5 · A5 · B5 · C♯6 · E6 · F♯6", tubeOrder: true },
    warm: { midi: [72, 74, 76, 79, 81, 84], notes: "C5 · D5 · E5 · G5 · A5 · C6" },
    open: { midi: [72, 74, 77, 79, 81, 84], notes: "C5 · D5 · F5 · G5 · A5 · C6" },
    dark: { midi: [72, 75, 77, 79, 82, 84], notes: "C5 · E♭5 · F5 · G5 · B♭5 · C6" },
    japanese: { midi: [72, 73, 77, 79, 80, 84], notes: "C5 · D♭5 · F5 · G5 · A♭5 · C6" },
    sparse: { midi: [72, 77, 79, 82, 84, 91], notes: "C5 · F5 · G5 · B♭5 · C6 · G6" },
    pure: { frequencies: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2].map((ratio) => noteFrequency(72) * ratio), notes: "C5 · D5 · E5 · G5 · A5 · C6 — pure ratios" },
    wide: { midi: [60, 67, 69, 74, 76, 84], notes: "C4 · G4 · A4 · D5 · E5 · C6" },
  };
  // New tunings assign the lowest pitch to the longest copper tube.
  const tubesByLength = tubes.map((tube, index) => index)
    .sort((a, b) => (tubes[b].bottom - tubes[b].top) - (tubes[a].bottom - tubes[a].top));
  Object.values(pitchSets).forEach((set) => {
    const frequencies = set.frequencies || set.midi.map(noteFrequency);
    if (set.tubeOrder) return;
    set.frequencies = [];
    tubesByLength.forEach((tubeIndex, rank) => { set.frequencies[tubeIndex] = frequencies[rank]; });
  });
  let cap;
  let clapperSprite;
  let sailSprite;
  let ready = false;
  let frame = 0;
  let previousTime = 0;
  let accumulator = 0;
  let pointer = null;
  let audio = null;
  let master = null;
  let contactNoise = null;
  let lastBreeze = -Infinity;
  let nextNoteAt = 0;
  let hoverAudioAttempted = false;
  let audioEverRan = false;
  let lastAudioAttempt = -Infinity;
  let muted = false;
  let windTime = 100;
  let windStrength = 0;
  let windDirection = 1;
  let windPhase = 0;
  const voices = new Set();

  function makeSprite(paint, [x, y, width, height]) {
    const image = document.createElement("canvas");
    image.width = width;
    image.height = height;
    const ctx = image.getContext("2d");
    ctx.translate(-x, -y);
    paint(ctx);
    return { image, x, y };
  }

  function drawSprite(sprite) {
    context.drawImage(sprite.image, sprite.x, sprite.y);
  }

  function polygon(ctx, points) {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }

  function prepareArtwork() {
    // Split only the rendering; the original image file remains untouched.
    cap = makeSprite((ctx) => {
      ctx.drawImage(artwork, 315, 20, 349, 193, 315, 20, 349, 193);
      polygon(ctx, [[324,257],[332,243],[354,227],[388,214],[430,206],[483,202],
        [541,205],[583,214],[620,229],[643,247],[654,262],[650,278],
        [633,296],[604,311],[569,321],[529,327],[489,330],[446,327],
        [406,320],[370,308],[341,289],[328,273]]);
      ctx.clip();
      ctx.drawImage(artwork, 0, 0);
      // Restore nearby hatch texture where the original, immovable hanging wires
      // were printed on the underside. The moving wires are drawn in front below.
      [[366,273,13,56,382],[391,291,18,38,413],[439,307,10,22,425],
        [449,250,16,79,467],[479,286,16,43,499],[507,299,14,30,530],
        [568,263,15,66,548],[587,287,18,42,559]].forEach(([x,y,w,h,sx]) => {
        ctx.clearRect(x, y, w, h);
        ctx.drawImage(artwork, sx, y, w, h, x, y, w, h);
      });
    }, [315, 20, 349, 312]);
    tubes.forEach((tube) => {
      const xs = tube.outline.map(([x]) => x);
      const ys = tube.outline.map(([, y]) => y);
      tube.sprite = makeSprite((ctx) => {
        polygon(ctx, tube.outline);
        ctx.clip();
        ctx.drawImage(artwork, 0, 0);
        // Continue the original tube texture behind the overlapping clapper.
        // This exposes orange tubing, rather than a hole, when parts separate.
        if (tube.center === 457 || tube.center === 552) {
          ctx.clearRect(tube.center - 35, 625, 70, 73);
          ctx.drawImage(artwork, tube.center - 30, 705, 60, 75, tube.center - 30, 625, 60, 73);
        }
      }, [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) - Math.min(...xs) + 4, Math.max(...ys) - Math.min(...ys) + 4]);
    });
    clapperSprite = makeSprite((ctx) => {
      // Full transparent disk, including the curve hidden in the original drawing.
      // The front tubes, rather than a cropped sprite, now provide its occlusion.
      ctx.drawImage(clapperArtwork, 398, 624, 172, 77);
    }, [398, 624, 172, 77]);
    sailSprite = makeSprite((ctx) => ctx.drawImage(artwork, 353, 1225, 252, 272, 353, 1225, 252, 272), [353, 1225, 252, 272]);
    ready = true;
    resize();
    button.disabled = false;
    figure.classList.add("wind-chime-ready");
    soundButton.hidden = false;
  }

  function pointOn(body, x, y) {
    const cos = Math.cos(body.angle);
    const sin = Math.sin(body.angle);
    return { x: body.x + (x - body.x) * cos - (y - body.y) * sin,
      y: body.y + (x - body.x) * sin + (y - body.y) * cos };
  }

  function withPendulum(body, paint) {
    context.save();
    context.translate(body.x, body.y);
    context.rotate(body.angle);
    context.translate(-body.x, -body.y);
    paint();
    context.restore();
  }

  function worldPoint(body, x, y) {
    const local = pointOn(body, x, y);
    return pointOn(canopy, local.x, local.y);
  }

  function clapperCenter() {
    const center = pointOn(clapper, 483, 662);
    center.y += Math.sin(depth.angle) * 65;
    return center;
  }

  function thread(x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = "rgba(57, 53, 44, 0.8)";
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.stroke();
  }

  function draw() {
    if (!ready) return;
    context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    if (motionPreference.matches || !pendulums.some((body) => Math.abs(body.angle) + Math.abs(body.velocity) > 0.0001)) {
      context.drawImage(artwork, 0, 0);
      return;
    }
    withPendulum(canopy, () => {
      // The underside is behind every attachment wire, since we look up at it.
      drawSprite(cap);
      [0, 2, 4].forEach(drawTube);
      const center = clapperCenter();
      // The catcher cord passes in front of the rear tubes, behind the front row.
      context.save();
      context.translate(center.x - 483, center.y - 662);
      withPendulum(sail, () => {
        thread(sail.x, sail.y, 480, 1248);
        drawSprite(sailSprite);
      });
      context.restore();
      thread(clapper.x, clapper.y, center.x, center.y - 15);
      context.save();
      context.translate(0, Math.sin(depth.angle) * 65);
      withPendulum(clapper, () => drawSprite(clapperSprite));
      context.restore();
      [1, 3, 5].forEach(drawTube);
    });
  }

  function drawTube(index) {
    const tube = tubes[index];
    withPendulum(tube, () => {
      // Both legs of the suspension loop meet the visible underside of the cap.
      thread(tube.x - 2, tube.y, tube.center - 8, tube.top + 15);
      thread(tube.x + 3, tube.y + 1, tube.center + 7, tube.top + 12);
      drawSprite(tube.sprite);
    });
  }

  function resize() {
    if (!ready) return;
    const width = button.getBoundingClientRect().width;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(width * HEIGHT / WIDTH * ratio));
    pointer = null;
    draw();
  }

  function step(dt, now) {
    // A passing cursor leaves a short-lived, swirling breeze, rather than one
    // instantaneous push. Different horizontal/depth periods visit several tubes.
    windTime += dt;
    if (windTime < WIND_DURATION) {
      const envelope = windStrength * Math.exp(-windTime / WIND_DECAY);
      const x = Math.sin(windTime * 3.9 + windPhase)
        + 0.3 * Math.sin(windTime * 6.3 + windPhase * 2);
      const z = Math.cos(windTime * 3.45 + windPhase)
        + 0.25 * Math.sin(windTime * 5.7 + windPhase * 0.5);
      clapper.velocity += -windDirection * envelope * x * 2.5 * dt;
      depth.velocity += envelope * z * 1.75 * dt;
      sail.velocity += -windDirection * envelope * x * 0.48 * dt;
    }
    // Transfer a little energy between the sail and clapper, with separate periods.
    clapper.velocity += (sail.angle - clapper.angle) * 3.3 * dt;
    sail.velocity += (clapper.angle - sail.angle) * 1.5 * dt;
    depth.velocity += (sail.angle * 0.25 - depth.angle) * 0.7 * dt;
    canopy.velocity += (clapper.angle - canopy.angle) * 0.12 * dt;
    pendulums.forEach((body) => {
      body.velocity += (-(body.omega ** 2) * Math.sin(body.angle) - body.damping * body.velocity) * dt;
      body.angle += body.velocity * dt;
      if (Math.abs(body.angle) > body.limit) {
        body.angle = Math.sign(body.angle) * body.limit;
        body.velocity *= -0.18;
      }
    });
    // The tubes surround the clapper in depth; projected overlaps in this drawing
    // are not collisions. Test travel toward each tube's radial contact surface.
    const length = 662 - clapper.y;
    const contacts = [];
    tubes.forEach((tube, index) => {
      // Recompute after each impact so a second contact uses the changed motion.
      const cx = -Math.sin(clapper.angle) * length;
      const cz = Math.sin(depth.angle) * length;
      const vx = -Math.cos(clapper.angle) * clapper.velocity * length;
      const vz = Math.cos(depth.angle) * depth.velocity * length;
      const height = 662 - tube.y;
      const [nx, nz] = tube.normal;
      const tx = -Math.sin(tube.angle) * height;
      const tv = -Math.cos(tube.angle) * tube.velocity * height;
      const travel = (cx - tx) * nx + cz * nz;
      const speed = (vx - tv) * nx + vz * nz;
      if (travel < tube.clearance - 3) tube.touching = false;
      if (travel >= tube.clearance && !tube.touching) {
        tube.touching = true;
        if (speed <= 14) return;
        // A soft impact shares momentum, rather than exciting every tube at once.
        const effectiveMass = nx * nx + nz * nz + 0.6 * nx * nx;
        const impact = speed * 1.42 / effectiveMass;
        clapper.velocity += impact * nx / length;
        depth.velocity -= impact * nz / length;
        tube.velocity = clamp(tube.velocity - impact * nx / height * 0.6, -tube.maxVelocity, tube.maxVelocity);
        const correction = (travel - tube.clearance) / effectiveMass;
        clapper.angle = clamp(-Math.asin(clamp((cx - correction * nx) / length, -1, 1)), -clapper.limit, clapper.limit);
        depth.angle = clamp(Math.asin(clamp((cz - correction * nz) / length, -1, 1)), -depth.limit, depth.limit);
        tube.angle = clamp(-Math.asin(clamp((tx + correction * 0.6 * nx) / height, -1, 1)), -tube.limit, tube.limit);
        if (now - tube.lastStrike > 620) contacts.push({ index, speed });
      }
    });
    // Choose one distinct contact; individual cooldowns prevent buzzing chords.
    if (contacts.length && now >= nextNoteAt) {
      contacts.sort((a, b) => b.speed - a.speed);
      const tailVolume = 1 - 0.2 * clamp((windTime - 1) / 3, 0, 1);
      strike(contacts[0].index, clamp(contacts[0].speed / 250, 0.13, 0.8) * tailVolume, now);
    }
  }

  function animate(now) {
    frame = 0;
    if (document.hidden) return;
    const elapsed = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = now;
    accumulator += elapsed;
    // Fixed substeps keep the physics consistent on both 60 Hz and 120 Hz screens.
    while (accumulator >= 1 / 120) {
      step(1 / 120, now);
      accumulator -= 1 / 120;
    }
    const moving = windTime < WIND_DURATION || pendulums.some((body) => Math.abs(body.angle) > 0.0008 || Math.abs(body.velocity) > 0.002);
    if (!moving) {
      pendulums.forEach((body) => { body.angle = 0; body.velocity = 0; });
      previousTime = 0;
      accumulator = 0;
    }
    draw();
    if (moving) frame = requestAnimationFrame(animate);
  }

  function wake() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(animate);
  }

  function nudge(body, impulse) {
    body.velocity = clamp(body.velocity + impulse, -body.maxVelocity, body.maxVelocity);
    wake();
  }

  function strike(index, strength, now = performance.now()) {
    const tube = tubes[index];
    if (now - tube.lastStrike < 620 || now < nextNoteAt) return;
    tube.lastStrike = now;
    nextNoteAt = now + 185 + Math.random() * 125;
    playTone(pitchSets[DEFAULT_PITCH].frequencies[index], strength, tube.normal[0] * 0.45);
  }

  // Distance between swept segments also catches a pointer that skips over a tube
  // between events. All hit tests use the same rotated endpoints as the drawing.
  function pointDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }

  function segmentDistance(a, b, c, d) {
    const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const ac = cross(a, b, c), ad = cross(a, b, d);
    const ca = cross(c, d, a), cb = cross(c, d, b);
    if (ac * ad < 0 && ca * cb < 0) return 0;
    return Math.min(pointDistance(a, c, d), pointDistance(b, c, d), pointDistance(c, a, b), pointDistance(d, a, b));
  }

  function brush(event) {
    if (!ready || event.pointerType === "touch") return;
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    const scale = WIDTH / box.width;
    const now = performance.now();
    const current = { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale, time: now };
    const from = pointer && now - pointer.time < 150 ? pointer : current;
    pointer = current;
    if (current.x < -100 || current.x > WIDTH + 100 || current.y < 160 || current.y > 1540) return;
    const distance = Math.hypot(current.x - from.x, current.y - from.y);
    if (distance < 0.5) return;
    const strength = clamp(distance / scale / Math.max(8, now - from.time) / 1.7, 0.4, 1);
    const direction = Math.sign(current.x - from.x) || Math.sign(current.y - from.y) || 1;
    const visiblePoint = (body, x, y) => motionPreference.matches ? { x, y } : worldPoint(body, x, y);
    const crossedTube = tubes.some((tube) => {
      const a = visiblePoint(tube, tube.center, tube.top);
      const b = visiblePoint(tube, tube.center, tube.bottom);
      return segmentDistance(from, current, a, b) <= tube.width / 2 + scale * 2.5;
    });
    const sailCenter = pointOn(sail, 482, 1356);
    const center = clapperCenter();
    sailCenter.x += center.x - 483;
    sailCenter.y += center.y - 662;
    const worldSail = motionPreference.matches ? { x: 482, y: 1356 } : pointOn(canopy, sailCenter.x, sailCenter.y);
    const capLeft = motionPreference.matches ? { x: 340, y: 265 } : pointOn(canopy, 340, 265);
    const capRight = motionPreference.matches ? { x: 642, y: 265 } : pointOn(canopy, 642, 265);
    if (crossedTube || pointDistance(worldSail, from, current) < 85
      || segmentDistance(from, current, capLeft, capRight) < 35) {
      enableSound(true);
      gust(direction, strength, (current.y - from.y) / distance);
    }
  }

  function gust(direction = 1, strength = 0.75, vertical = 0) {
    const now = performance.now();
    if (now - lastBreeze < 85) return false;
    lastBreeze = now;
    const remainingWind = windStrength * Math.exp(-windTime / WIND_DECAY);
    windStrength = Math.min(1.3, strength + remainingWind * 0.3);
    windTime = 0;
    windDirection = direction;
    windPhase = Math.random() * Math.PI * 2;
    // Randomness belongs to the wind, once per gust; tones emerge from collisions.
    const swirl = (Math.random() - 0.5) * 1.4 + vertical * 0.6;
    nudge(sail, -direction * strength * 0.48);
    nudge(clapper, -direction * strength * (0.48 + Math.random() * 0.2));
    nudge(depth, swirl * strength * 0.64);
    nudge(canopy, -direction * strength * 0.04715);
    tubes.forEach((tube, index) => nudge(tube, -direction * strength * (0.035 + index * 0.004)));
    return true;
  }

  function updateSoundButton() {
    const enabled = !muted && !!audio && audio.state === "running";
    soundButton.setAttribute("aria-pressed", String(enabled));
    soundLabel.textContent = enabled ? "SOUND ON" : "SOUND OFF";
  }

  function enableSound(fromHover = false) {
    if (muted) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (audio && audio.state === "running") {
      audioEverRan = true;
      master.gain.setTargetAtTime(0.45, audio.currentTime, 0.025);
      updateSoundButton();
      return;
    }
    const now = performance.now();
    if (fromHover && hoverAudioAttempted && (!audioEverRan || now - lastAudioAttempt < 1500)) return;
    hoverAudioAttempted = true;
    lastAudioAttempt = now;
    try {
      if (!audio) {
        audio = new AudioContext();
        audio.onstatechange = updateSoundButton;
        master = audio.createGain();
        master.gain.value = 0.45;
        const limiter = audio.createDynamicsCompressor();
        limiter.threshold.value = -16;
        limiter.knee.value = 15;
        limiter.ratio.value = 5;
        master.connect(limiter);
        limiter.connect(audio.destination);
        contactNoise = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.022), audio.sampleRate);
        const samples = contactNoise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
          const t = i / audio.sampleRate;
          samples[i] = (Math.random() * 2 - 1) * Math.min(1, t / 0.001) * Math.exp(-t / 0.0035);
        }
      }
      // Hover can work on an already permitted site. A pending hover resume must
      // never prevent a later genuine page gesture from trying again.
      audio.resume().then(() => {
        if (audio.state === "running") audioEverRan = true;
        master.gain.setTargetAtTime(muted ? 0 : 0.45, audio.currentTime, 0.025);
        updateSoundButton();
      }).catch(() => {});
      if (audio.state === "running") audioEverRan = true;
      updateSoundButton();
    } catch (_) { /* Motion remains available when audio is unavailable. */ }
  }

  function playTone(frequency, strength, pan) {
    if (muted || !audio || audio.state !== "running" || document.hidden) return;
    const now = audio.currentTime;
    if (voices.size >= 8) voices.values().next().value.stop(now);
    const gain = audio.createGain();
    const panner = audio.createStereoPanner ? audio.createStereoPanner() : audio.createGain();
    if (panner.pan) panner.pan.value = pan;
    gain.gain.value = 0.14 * clamp(strength, 0.08, 1);
    gain.connect(panner);
    panner.connect(master);
    const oscillators = [];
    const partials = [];
    const voice = { stop(time) {
      gain.gain.setTargetAtTime(0, time, 0.008);
      oscillators.forEach((oscillator) => oscillator.stop(time + 0.04));
      voices.delete(voice);
    } };
    voices.add(voice);
    // A faint split fundamental gives natural beating; higher modes die away
    // quickly, leaving space between the individual copper-tube contacts.
    [1, 1.0014, 2.756, 5.404, 8.933].forEach((ratio, index) => {
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      const duration = [2.9, 2.55, 1.3, 0.5, 0.105][index];
      const volume = [0.55, 0.13, 0.19, 0.048, 0.012][index];
      oscillator.frequency.value = frequency * ratio;
      oscillator.detune.value = (Math.random() - 0.5) * 1.2;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(volume, now + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(envelope);
      envelope.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
      oscillators.push(oscillator);
      partials.push(envelope);
    });
    const tap = audio.createBufferSource();
    const tapFilter = audio.createBiquadFilter();
    const tapGain = audio.createGain();
    tap.buffer = contactNoise;
    tapFilter.type = "bandpass";
    tapFilter.frequency.value = frequency * 1.8;
    tapFilter.Q.value = 0.7;
    tapGain.gain.value = 0.04;
    tap.connect(tapFilter);
    tapFilter.connect(tapGain);
    tapGain.connect(gain);
    tap.start(now);
    tap.stop(now + 0.025);
    oscillators.push(tap);
    partials.push(tapFilter, tapGain);
    oscillators[0].onended = () => {
      oscillators.forEach((oscillator) => oscillator.disconnect());
      partials.forEach((partial) => partial.disconnect());
      gain.disconnect();
      panner.disconnect();
      voices.delete(voice);
    };
  }

  let lastPointerType = "mouse";
  soundButton.addEventListener("click", () => {
    if (!muted && audio && audio.state === "running") {
      muted = true;
      master.gain.setTargetAtTime(0, audio.currentTime, 0.015);
      voices.forEach((voice) => voice.stop(audio.currentTime));
    } else {
      muted = false;
      enableSound();
    }
    updateSoundButton();
  });
  button.addEventListener("pointerdown", (event) => { lastPointerType = event.pointerType; });
  button.addEventListener("click", (event) => {
    // Mouse interaction is hover-only, leaving click free for a future subpage.
    // Native button activation is still an equivalent breeze for touch/keyboard.
    if (event.detail === 0 || lastPointerType === "touch" || lastPointerType === "pen") gust();
  });
  ["pointerdown", "touchend", "keydown", "click"].forEach((name) => {
    document.addEventListener(name, (event) => {
      if (event.isTrusted && !soundButton.contains(event.target)) enableSound();
    }, { capture: true, passive: true });
  });
  document.addEventListener("pointermove", brush, { passive: true });
  document.addEventListener("pointerout", (event) => { if (!event.relatedTarget) pointer = null; });
  window.addEventListener("scroll", () => { pointer = null; }, { passive: true });
  window.addEventListener("blur", () => { pointer = null; });
  document.addEventListener("visibilitychange", () => {
    pointer = null;
    previousTime = 0;
    accumulator = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      windTime = 100;
      windStrength = 0;
      pendulums.forEach((body) => { body.angle = 0; body.velocity = 0; });
      tubes.forEach((tube) => { tube.touching = false; });
      draw();
      if (audio) voices.forEach((voice) => voice.stop(audio.currentTime));
    } else wake();
  });
  motionPreference.addEventListener("change", () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    accumulator = 0;
    windTime = 100;
    windStrength = 0;
    pendulums.forEach((body) => { body.angle = 0; body.velocity = 0; });
    tubes.forEach((tube) => { tube.touching = false; });
    draw();
  });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(button);
  else window.addEventListener("resize", resize);

  const prepareWhenLoaded = () => { if (artworkLoaded && clapperLoaded) prepareArtwork(); };
  artwork.onload = () => { artworkLoaded = true; prepareWhenLoaded(); };
  clapperArtwork.onload = () => { clapperLoaded = true; prepareWhenLoaded(); };
  artwork.src = figure.querySelector("img").src;
  clapperArtwork.src = figure.dataset.clapperSrc;
})();
