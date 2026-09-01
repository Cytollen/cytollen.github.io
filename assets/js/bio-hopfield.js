(() => {
  "use strict";

  const canvas = document.getElementById("hopfield-name");
  const status = document.getElementById("hopfield-status");
  const controls = document.querySelectorAll("[data-hopfield-action]");

  if (!canvas) return;

  const glyphs = {
    " ": ["0", "0", "0", "0", "0", "0", "0"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    I: ["111", "010", "010", "010", "010", "010", "111"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  };

  const text = "XINLONG DU";
  const glyphHeight = 7;
  const paddingX = 0;
  const paddingTop = 2;
  const paddingBottom = 1;
  const gap = 1;
  const bias = 0.18;
  const recallDelay = 3000;
  const artworkWidth = 2120;
  const artworkHeight = 742;
  const artworkColumnLines = [
    217.5, 250, 283.5, 317, 351.5, 386, 420, 453.5, 487, 521, 555, 588,
    621.5, 655.5, 688.5, 722, 755, 789, 822.5, 855, 887.5, 921.5, 955,
    988, 1021, 1054.5, 1087, 1120, 1153.5, 1187.5, 1221, 1254, 1287,
    1320.5, 1354, 1386.5, 1420, 1454, 1487.5, 1521, 1554.5, 1588,
    1620.5, 1654, 1687, 1720.5, 1754, 1788, 1821, 1854.5, 1887.5,
    1920, 1953.5, 1987.5,
  ];
  const artworkRowLines = [244.5, 277, 311, 345, 380, 415, 451, 486, 520, 554, 587.5];
  const cols = textWidth(text) + paddingX * 2;
  const rows = glyphHeight + paddingTop + paddingBottom;
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
            pattern[(row + paddingTop) * cols + cursor + col] = 1;
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
    const col = cellIndexAt(x, gridBox.columnLines);
    const row = cellIndexAt(y, gridBox.rowLines);

    if (col === -1 || row === -1) return null;

    return row * cols + col;
  }

  function cellIndexAt(value, lines) {
    if (value < lines[0] || value > lines[lines.length - 1]) return -1;

    let low = 0;
    let high = lines.length - 1;

    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);

      if (value < lines[middle]) {
        high = middle;
      } else {
        low = middle;
      }
    }

    return low;
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
    return {
      columnLines: artworkColumnLines.map((line) => width * (line / artworkWidth)),
      rowLines: artworkRowLines.map((line) => height * (line / artworkHeight)),
    };
  }

  function draw() {
    const { width, height } = syncCanvasSize();
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue("--ink").trim() || "#171717";

    gridBox = calculateGrid(width, height);

    context.clearRect(0, 0, width, height);
    context.fillStyle = ink;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const value = state[row * cols + col];
        const cellLeft = gridBox.columnLines[col];
        const cellRight = gridBox.columnLines[col + 1];
        const cellTop = gridBox.rowLines[row];
        const cellBottom = gridBox.rowLines[row + 1];
        const blockWidth = Math.max(1, (cellRight - cellLeft) * 0.76);
        const blockHeight = Math.max(1, (cellBottom - cellTop) * 0.76);
        const x = cellLeft + (cellRight - cellLeft - blockWidth) / 2;
        const y = cellTop + (cellBottom - cellTop - blockHeight) / 2;

        if (value === 1) {
          context.fillRect(x, y, blockWidth, blockHeight);
        }
      }
    }

  }

  function recallProgress() {
    return clamp((overlap / nodeCount + 1) / 2);
  }

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }
})();
