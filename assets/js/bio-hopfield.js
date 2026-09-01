(() => {
  "use strict";

  const canvas = document.getElementById("hopfield-name");
  const status = document.getElementById("hopfield-status");
  const controls = document.querySelectorAll("[data-hopfield-action]");

  if (!canvas) return;

  const glyphs = {
    " ": ["000", "000", "000", "000", "000", "000", "000"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  };

  const text = "XINLONG DU";
  const glyphHeight = 7;
  const paddingX = 2;
  const paddingY = 3;
  const gap = 1;
  const bias = 0.18;
  const recallDelay = 3000;
  const cols = textWidth(text) + paddingX * 2;
  const rows = glyphHeight + paddingY * 2;
  const nodeCount = cols * rows;
  const target = makePattern(text);
  const state = new Int8Array(nodeCount);
  const sweepOrder = Array.from({ length: nodeCount }, (_, index) => index);
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let overlap = 0;
  let updates = 0;
  let sweepChanges = 0;
  let stableSweeps = 0;
  let running = false;
  let recallTimer = 0;
  let frameId = 0;
  let countdownFrameId = 0;
  let recallDueAt = 0;
  let tensionProgress = 0;
  let painting = false;
  let paintValue = 1;
  let lastPaintedIndex = -1;
  let dragStarted = false;
  let pointerStartIndex = -1;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let canvasBox = { height: 0, ratio: 0, width: 0 };
  let gridBox = null;

  initializeState();
  draw();
  startRecall();

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", endPainting);
  canvas.addEventListener("pointercancel", cancelPainting);
  window.addEventListener("resize", draw);
  window.addEventListener("pageshow", draw);

  controls.forEach((control) => {
    control.addEventListener("click", handleControlClick);
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(draw).observe(canvas);
  }

  function textWidth(value) {
    return value.split("").reduce((width, character, index) => {
      const glyph = glyphs[character] || glyphs[" "];
      return width + glyph[0].length + (index === value.length - 1 ? 0 : gap);
    }, 0);
  }

  function makePattern(value) {
    const pattern = new Int8Array(nodeCount);
    pattern.fill(-1);

    let cursor = paddingX;
    for (const character of value) {
      const glyph = glyphs[character] || glyphs[" "];

      glyph.forEach((line, row) => {
        for (let col = 0; col < line.length; col += 1) {
          if (line[col] === "1") {
            pattern[(row + paddingY) * cols + cursor + col] = 1;
          }
        }
      });

      cursor += glyph[0].length + gap;
    }

    return pattern;
  }

  function initializeState() {
    overlap = 0;

    for (let index = 0; index < nodeCount; index += 1) {
      const followsMemory = Math.random() < 0.54;
      state[index] = followsMemory ? target[index] : -target[index];
      overlap += target[index] * state[index];
    }
  }

  function shuffleState() {
    overlap = 0;

    for (let index = 0; index < nodeCount; index += 1) {
      state[index] = Math.random() < 0.5 ? 1 : -1;
      overlap += target[index] * state[index];
    }
  }

  function setAll(value) {
    overlap = 0;

    for (let index = 0; index < nodeCount; index += 1) {
      state[index] = value;
      overlap += target[index] * state[index];
    }
  }

  function setNode(index, value) {
    const current = state[index];

    if (current === value) return;

    state[index] = value;
    overlap += target[index] * (value - current);
  }

  function paintNode(index) {
    setNode(index, paintValue);
    lastPaintedIndex = index;
  }

  function paintPath(index) {
    if (lastPaintedIndex === -1) {
      paintNode(index);
      return;
    }

    if (index === lastPaintedIndex) return;

    paintLine(lastPaintedIndex, index);
    lastPaintedIndex = index;
  }

  function paintLine(fromIndex, toIndex) {
    let x0 = fromIndex % cols;
    let y0 = Math.floor(fromIndex / cols);
    const x1 = toIndex % cols;
    const y1 = Math.floor(toIndex / cols);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx - dy;

    while (true) {
      setNode(y0 * cols + x0, paintValue);

      if (x0 === x1 && y0 === y1) break;

      const doubledError = error * 2;
      if (doubledError > -dy) {
        error -= dy;
        x0 += sx;
      }
      if (doubledError < dx) {
        error += dx;
        y0 += sy;
      }
    }
  }

  function toggleNode(index) {
    setNode(index, state[index] === 1 ? -1 : 1);
  }

  function startDrag(index) {
    dragStarted = true;

    if (pointerStartIndex !== -1) {
      paintPath(pointerStartIndex);
    }

    if (index !== null) {
      paintPath(index);
    }
  }

  function handlePointerDown(event) {
    const index = nodeIndexAt(event);

    if (index === null) return;

    event.preventDefault();
    pauseRecall();
    painting = true;
    paintValue = 1;
    lastPaintedIndex = -1;
    dragStarted = false;
    pointerStartIndex = index;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;

    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event) {
    if (!painting) return;

    const index = nodeIndexAt(event);
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;

    if (!dragStarted && Math.hypot(dx, dy) >= 4) {
      event.preventDefault();
      startDrag(index);
      draw();
      queueRecall();
    }

    if (!dragStarted || index === null || index === lastPaintedIndex) return;

    event.preventDefault();
    paintPath(index);
    draw();
    queueRecall();
  }

  function endPainting(event) {
    if (!painting) return;

    if (!dragStarted && pointerStartIndex !== -1) {
      event.preventDefault();
      toggleNode(pointerStartIndex);
      draw();
      queueRecall();
    }

    painting = false;
    lastPaintedIndex = -1;
    dragStarted = false;
    pointerStartIndex = -1;

    if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function cancelPainting(event) {
    if (!painting) return;

    painting = false;
    lastPaintedIndex = -1;
    dragStarted = false;
    pointerStartIndex = -1;

    if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function handleControlClick(event) {
    const action = event.currentTarget.dataset.hopfieldAction;

    pauseRecall();
    painting = false;
    lastPaintedIndex = -1;
    dragStarted = false;
    pointerStartIndex = -1;

    if (action === "shuffle") {
      shuffleState();
    } else if (action === "clear") {
      setAll(-1);
    }

    draw();
    queueRecall();
  }

  function nodeIndexAt(event) {
    if (!gridBox) draw();

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor((x - gridBox.startX) / gridBox.cell);
    const row = Math.floor((y - gridBox.startY) / gridBox.cell);

    if (
      x < gridBox.startX ||
      y < gridBox.startY ||
      x > gridBox.startX + gridBox.gridWidth ||
      y > gridBox.startY + gridBox.gridHeight ||
      col < 0 ||
      col >= cols ||
      row < 0 ||
      row >= rows
    ) {
      return null;
    }

    return row * cols + col;
  }

  function pauseRecall() {
    running = false;
    recallDueAt = 0;
    tensionProgress = 0;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    if (countdownFrameId) {
      cancelAnimationFrame(countdownFrameId);
      countdownFrameId = 0;
    }

    if (recallTimer) {
      clearTimeout(recallTimer);
      recallTimer = 0;
    }
  }

  function queueRecall() {
    if (recallTimer) {
      clearTimeout(recallTimer);
      recallTimer = 0;
    }

    if (countdownFrameId) {
      cancelAnimationFrame(countdownFrameId);
      countdownFrameId = 0;
    }

    recallDueAt = performance.now() + recallDelay;
    tensionProgress = 0;

    recallTimer = window.setTimeout(() => {
      recallTimer = 0;
      recallDueAt = 0;
      tensionProgress = 0;
      startRecall();
    }, recallDelay);

    updateCountdown(performance.now());
  }

  function updateCountdown(now) {
    const remaining = Math.max(0, recallDueAt - now);
    tensionProgress = 1 - remaining / recallDelay;

    if (status) {
      status.textContent = `recall in ${Math.ceil(remaining / 1000)}s`;
    }

    draw();

    if (remaining > 0 && recallDueAt > 0) {
      countdownFrameId = requestAnimationFrame(updateCountdown);
    } else {
      countdownFrameId = 0;
    }
  }

  function startRecall() {
    pauseRecall();
    resetDynamics();

    if (status) status.textContent = "recalling";

    if (reducedMotion) {
      settleSynchronously();
      draw();
      return;
    }

    running = true;
    frameId = requestAnimationFrame(tick);
  }

  function resetDynamics() {
    updates = 0;
    sweepChanges = 0;
    stableSweeps = 0;
  }

  function shuffleSweepOrder() {
    for (let index = nodeCount - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const current = sweepOrder[index];
      sweepOrder[index] = sweepOrder[swapIndex];
      sweepOrder[swapIndex] = current;
    }
  }

  function updateNode(index) {
    const current = state[index];
    const memory = target[index];
    const overlapWithoutSelf = overlap - memory * current;
    const field = memory * (overlapWithoutSelf / nodeCount) + bias * memory;
    const next = field >= 0 ? 1 : -1;

    if (next !== current) {
      state[index] = next;
      overlap += memory * (next - current);
      sweepChanges += 1;
    }
  }

  function updateRandomNode() {
    updateNode(Math.floor(Math.random() * nodeCount));
  }

  function cleanupWithPermutationSweeps(maxSweeps = 1) {
    for (let sweep = 0; sweep < maxSweeps && overlap !== nodeCount; sweep += 1) {
      shuffleSweepOrder();
      for (const index of sweepOrder) {
        updateNode(index);
      }
    }
  }

  function tick() {
    if (!running) {
      frameId = 0;
      return;
    }

    const updatesPerFrame = Math.max(18, Math.floor(nodeCount / 18));

    for (let count = 0; count < updatesPerFrame; count += 1) {
      updateRandomNode();
      updates += 1;

      if (updates % nodeCount === 0) {
        stableSweeps = sweepChanges === 0 ? stableSweeps + 1 : 0;
        sweepChanges = 0;
      }
    }

    draw();

    if (stableSweeps >= 2 || updates > nodeCount * 28) {
      running = false;
      frameId = 0;
      cleanupWithPermutationSweeps();
      draw();
      if (status) status.textContent = "settled";
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  function settleSynchronously() {
    for (let sweep = 0; sweep < 28; sweep += 1) {
      let changes = 0;

      for (let count = 0; count < nodeCount; count += 1) {
        const before = overlap;
        updateRandomNode();
        if (overlap !== before) changes += 1;
      }

      if (changes === 0) break;
    }

    cleanupWithPermutationSweeps();
    if (status) status.textContent = "settled";
  }

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));

    if (
      canvas.width !== pixelWidth ||
      canvas.height !== pixelHeight ||
      canvasBox.width !== width ||
      canvasBox.height !== height ||
      canvasBox.ratio !== ratio
    ) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvasBox = { height, ratio, width };
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    return canvasBox;
  }

  function calculateGrid(width, height) {
    const outerPaddingX = Math.max(8, Math.floor(width * 0.03));
    const outerPaddingY = Math.max(16, Math.floor(height * 0.16));
    const progressGap = 14;
    const usableWidth = Math.max(1, width - outerPaddingX * 2);
    const usableHeight = Math.max(1, height - outerPaddingY * 2 - progressGap);
    const cell = Math.max(1, Math.floor(Math.min(usableWidth / cols, usableHeight / rows)));
    const gridWidth = cell * cols;
    const gridHeight = cell * rows;
    const startX = Math.floor((width - gridWidth) / 2);
    const startY = Math.floor(outerPaddingY + (usableHeight - gridHeight) / 2);
    const gutter = Math.max(1, Math.floor(cell * 0.15));
    const block = Math.max(1, cell - gutter);
    const progressY = Math.min(height - 2, startY + gridHeight + progressGap - 4);

    return { block, cell, gridHeight, gridWidth, gutter, progressY, startX, startY };
  }

  function drawNetworkTraces(line) {
    const left = gridBox.startX;
    const right = gridBox.startX + gridBox.gridWidth;
    const top = gridBox.startY;
    const bottom = gridBox.startY + gridBox.gridHeight;
    const width = gridBox.gridWidth;
    const traces = [
      [0.03, 0.34, -1],
      [0.12, 0.58, -1],
      [0.24, 0.73, -1],
      [0.38, 0.91, -1],
      [0.64, 0.97, -1],
      [0.05, 0.46, 1],
      [0.18, 0.67, 1],
      [0.31, 0.84, 1],
      [0.53, 0.96, 1],
    ];

    context.save();
    context.strokeStyle = line;
    context.lineWidth = 0.65;
    context.globalAlpha = 0.52;

    for (const [from, to, direction] of traces) {
      const y = direction < 0 ? top : bottom;
      const bend = Math.max(14, gridBox.cell * (2.4 + (to - from) * 2.8));

      context.beginPath();
      context.moveTo(left + width * from, y);
      context.bezierCurveTo(
        left + width * (from + 0.08),
        y + bend * direction,
        left + width * (to - 0.08),
        y + bend * direction,
        left + width * to,
        y,
      );
      context.stroke();
    }

    context.restore();
  }

  function drawRegistrationMarks(line) {
    const offset = Math.max(8, gridBox.cell * 0.72);
    const length = Math.max(5, gridBox.cell * 0.48);
    const points = [
      [gridBox.startX - offset, gridBox.startY - offset],
      [gridBox.startX + gridBox.gridWidth + offset, gridBox.startY - offset],
      [gridBox.startX - offset, gridBox.startY + gridBox.gridHeight + offset],
      [gridBox.startX + gridBox.gridWidth + offset, gridBox.startY + gridBox.gridHeight + offset],
    ];

    context.save();
    context.strokeStyle = line;
    context.lineWidth = 0.8;
    context.globalAlpha = 0.75;

    for (const [x, y] of points) {
      context.beginPath();
      context.moveTo(x - length, y);
      context.lineTo(x + length, y);
      context.moveTo(x, y - length);
      context.lineTo(x, y + length);
      context.stroke();
    }

    context.restore();
  }

  function draw() {
    const { width, height } = syncCanvasSize();
    const styles = getComputedStyle(document.documentElement);
    const paper = styles.getPropertyValue("--paper").trim() || "#fbfaf7";
    const ink = styles.getPropertyValue("--ink").trim() || "#171717";
    const accent = styles.getPropertyValue("--accent").trim() || "#245f73";
    const line = styles.getPropertyValue("--line").trim() || "#ded9d0";

    gridBox = calculateGrid(width, height);

    context.clearRect(0, 0, width, height);
    context.fillStyle = paper;
    context.fillRect(0, 0, width, height);
    drawNetworkTraces(line);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const value = state[row * cols + col];
        const x = gridBox.startX + col * gridBox.cell;
        const y = gridBox.startY + row * gridBox.cell;

        if (value === 1) {
          context.fillStyle = ink;
          context.fillRect(x, y, gridBox.block, gridBox.block);
        } else {
          context.fillStyle = paper;
          context.fillRect(x, y, gridBox.block, gridBox.block);
          context.save();
          context.globalAlpha = 0.62;
          context.strokeStyle = line;
          context.lineWidth = 0.7;
          context.strokeRect(x + 0.35, y + 0.35, Math.max(0, gridBox.block - 0.7), Math.max(0, gridBox.block - 0.7));
          context.restore();
        }
      }
    }

    drawRegistrationMarks(line);

    const barProgress = recallDueAt > 0 ? tensionProgress : recallProgress();

    context.fillStyle = line;
    context.fillRect(gridBox.startX, gridBox.progressY, gridBox.gridWidth, 1);
    context.fillStyle = accent;
    context.fillRect(gridBox.startX, gridBox.progressY, Math.max(0, gridBox.gridWidth * clamp(barProgress)), 2);
  }

  function recallProgress() {
    return clamp((overlap / nodeCount + 1) / 2);
  }

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }
})();
