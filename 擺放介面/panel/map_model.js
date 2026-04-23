document.addEventListener('DOMContentLoaded', function () {
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = './panel/map_model_style.css';
  document.head.appendChild(cssLink);

  const clickableBox = document.getElementById('clickable-box');
  const solutionDropdown = document.getElementById('solution');
  const statusBar = document.getElementById('status-bar');
  const gbestDisplay = document.getElementById('gbest');
  const mapCheck = document.getElementById('map-check');
  const thresholdBtn = document.getElementById('threshold-btn');
  const connectBtn = document.getElementById('connect-btn');
  const undoBtn = document.getElementById('undo-btn');
  const saveMapBtn = document.getElementById('savemap-btn');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');

  let gridSize = 5;
  let sensorCount = 0;
  const sensingRange = 5;
  const connectDistance = 8;
  const threshold = 0.3;
  const sensors = [];
  let probabilitiesCache = [];
  let historyStack = [];
  let isThresholdMode = false;
  let isConnectMode = false;
  let isGameMode = true;
  let connectionLines = [];
  let hasShownCompletionModal = false;
  let obstacleSet = new Set();

  const levelSizes = {
    1: 5,
    2: 10,
    3: 15,
    4: 20,
    5: 8,
    6: 12,
    7: 18,
    8: 30,
    9: 50
  };

  const obstacleMaps = {
    5: createWallPattern(8, [
      { x: 3, y: 1, length: 5, direction: 'v', gap: 2 },
      { x: 1, y: 5, length: 6, direction: 'h', gap: 4 }
    ]),
    6: createWallPattern(12, [
      { x: 5, y: 1, length: 8, direction: 'v', gap: 6 },
      { x: 8, y: 3, length: 7, direction: 'h', gap: 9 }
    ]),
    7: createWallPattern(18, [
      { x: 4, y: 2, length: 12, direction: 'v', gap: 8 },
      { x: 9, y: 0, length: 14, direction: 'v', gap: 4 },
      { x: 2, y: 10, length: 14, direction: 'h', gap: 13 }
    ]),
    8: createWallPattern(30, [
      { x: 6, y: 3, length: 22, direction: 'v', gap: 14 },
      { x: 14, y: 4, length: 21, direction: 'v', gap: 8 },
      { x: 22, y: 3, length: 23, direction: 'v', gap: 18 },
      { x: 3, y: 9, length: 24, direction: 'h', gap: 6 },
      { x: 2, y: 20, length: 25, direction: 'h', gap: 23 }
    ])
  };

  function createWallPattern(size, walls) {
    const wallsSet = new Set();
    walls.forEach(wall => {
      for (let i = 0; i < wall.length; i++) {
        const x = wall.direction === 'h' ? wall.x + i : wall.x;
        const y = wall.direction === 'h' ? wall.y : wall.y + i;
        if (x >= 0 && x < size && y >= 0 && y < size && i !== wall.gap) {
          wallsSet.add(`${x},${y}`);
        }
      }
    });
    return wallsSet;
  }

  statusBar.innerHTML = '';
  for (let i = 0; i <= 10; i++) {
    const value = (1 - i / 10).toFixed(1);
    const scaleLine = document.createElement('div');
    scaleLine.classList.add('scale-line');
    scaleLine.style.top = `${(i / 10) * 100}%`;

    const scaleText = document.createElement('div');
    scaleText.classList.add('status-bar-scale');
    scaleText.style.top = `${(i / 10) * 100}%`;
    scaleText.textContent = value;

    statusBar.appendChild(scaleLine);
    statusBar.appendChild(scaleText);
  }

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  const xAxis = document.createElement('div');
  xAxis.id = 'x-axis';
  const yAxis = document.createElement('div');
  yAxis.id = 'y-axis';

  container.appendChild(clickableBox);
  container.appendChild(xAxis);
  container.appendChild(yAxis);
  document.querySelector('.interactive-panel').prepend(container);

  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  document.body.appendChild(tooltip);

  const completionModal = document.createElement('div');
  completionModal.className = 'completion-modal';
  completionModal.innerHTML = `
    <div class="completion-card">
      <button class="completion-close" type="button" aria-label="Close completion message">x</button>
      <img class="completion-image" src="./image/full kuro.png" alt="Mission complete cat">
      <h2>Mission Complete!</h2>
      <p id="completion-message"></p>
    </div>
  `;
  document.body.appendChild(completionModal);

  const completionMessage = document.getElementById('completion-message');
  const completionClose = completionModal.querySelector('.completion-close');

  function setStatLabel(element, label) {
    if (!element || !element.parentElement) {
      return;
    }

    const labelNode = Array.from(element.parentElement.childNodes)
      .find(node => node.nodeType === Node.TEXT_NODE);
    if (labelNode) {
      labelNode.textContent = `${label}: `;
    }
  }

  function updateCounters() {
    setStatLabel(gbestDisplay, isGameMode ? 'Cat' : 'Sensors');
    gbestDisplay.textContent = `${sensorCount}`;
  }

  function updateLegendLabels() {
    const labelBoxes = document.querySelectorAll('.legend-group .label-box');
    if (labelBoxes[0]) {
      labelBoxes[0].lastChild.textContent = isGameMode ? ' : Cat' : ' : Sensor';
    }
    if (labelBoxes[1]) {
      labelBoxes[1].lastChild.textContent = isGameMode ? ' : Fish' : ' : Weak Zone';
    }
  }

  function updateModeButton() {
    if (!modeToggleBtn) {
      return;
    }

    const label = isGameMode ? 'Pro Mode' : 'Game Mode';
    modeToggleBtn.textContent = label;
    modeToggleBtn.title = label;
    modeToggleBtn.setAttribute('aria-label', label);
  }

  function updateCompletionText(completionRate) {
    const coverage = Number(completionRate || 0);
    if (isGameMode) {
      setStatLabel(mapCheck, 'Fish');
      mapCheck.textContent = `${(100 - coverage).toFixed(2)}%`;
      return;
    }

    setStatLabel(mapCheck, 'Coverage');
    mapCheck.textContent = `${coverage.toFixed(2)}% Complete`;
  }

  function hideCompletionModal() {
    completionModal.classList.remove('show');
  }

  function showCompletionModal() {
    if (hasShownCompletionModal) {
      return;
    }

    hasShownCompletionModal = true;
    if (completionMessage) {
      completionMessage.textContent = isGameMode
        ? `You used ${sensorCount} ${sensorCount === 1 ? 'cat' : 'cats'} to eat all the fish!`
        : `You completed the map with ${sensorCount} ${sensorCount === 1 ? 'sensor' : 'sensors'}!`;
    }
    completionModal.classList.add('show');
  }

  function checkCompletion(completionRate) {
    const coverage = Number(completionRate || 0);
    if (coverage >= 100) {
      showCompletionModal();
    } else {
      hasShownCompletionModal = false;
    }
  }

  function updateModeUI() {
    document.body.classList.toggle('cat-game-mode', isGameMode);
    updateCounters();
    updateLegendLabels();
    updateModeButton();
    updateCompletionText(calculateCompletionRate(clickableBox));
  }

  function getSelectedGridSize() {
    const fixedSize = parseInt(document.body.dataset.fixedSize || '', 10);
    if (!Number.isNaN(fixedSize) && fixedSize > 0) {
      return fixedSize;
    }

    const selectedValue = parseInt(solutionDropdown?.value || '1', 10);
    return levelSizes[selectedValue] || 5;
  }

  function getSelectedLevel() {
    return parseInt(solutionDropdown?.value || '1', 10);
  }

  function getObstacleSetForLevel(level) {
    return obstacleMaps[level] || new Set();
  }

  function isObstacle(x, y) {
    return obstacleSet.has(`${x},${y}`);
  }

  function hasLineOfSight(sensor, targetX, targetY) {
    const startX = sensor.x + 0.5;
    const startY = sensor.y + 0.5;
    const endX = targetX + 0.5;
    const endY = targetY + 0.5;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const sampleCount = Math.max(1, Math.ceil(distance * 12));
    const visitedCells = new Set();

    for (let step = 1; step < sampleCount; step++) {
      const ratio = step / sampleCount;
      const x = Math.floor(startX + deltaX * ratio);
      const y = Math.floor(startY + deltaY * ratio);
      const key = `${x},${y}`;

      if (visitedCells.has(key)) {
        continue;
      }
      visitedCells.add(key);

      if (!(x === sensor.x && y === sensor.y) && !(x === targetX && y === targetY) && isObstacle(x, y)) {
        return false;
      }
    }

    return true;
  }

  function saveMapState() {
    const currentState = sensors.map(sensor => ({ x: sensor.x, y: sensor.y }));
    historyStack.push(currentState);
    if (historyStack.length > 60) {
      historyStack.shift();
    }
  }

  function clearConnections() {
    connectionLines.forEach(line => line.remove());
    connectionLines = [];
  }

  function connectSensors() {
    clearConnections();

    const cellSize = clickableBox.offsetWidth / gridSize;
    sensors.forEach((sensorA, indexA) => {
      sensors.forEach((sensorB, indexB) => {
        if (indexA >= indexB) {
          return;
        }

        const distance = Math.sqrt(
          Math.pow(sensorA.x - sensorB.x, 2) + Math.pow(sensorA.y - sensorB.y, 2)
        );

        if (distance <= connectDistance && hasLineOfSight(sensorA, sensorB.x, sensorB.y)) {
          const line = document.createElement('div');
          line.classList.add('connection-line');
          if (isGameMode) {
            line.classList.add('game-connection-line');
          }

          const startX = (sensorA.x + 0.5) * cellSize;
          const startY = (sensorA.y + 0.5) * cellSize;
          const endX = (sensorB.x + 0.5) * cellSize;
          const endY = (sensorB.y + 0.5) * cellSize;
          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
          const lineThickness = Math.max(3, Math.min(12, cellSize * 0.24));
          const dotSpacing = Math.max(7, Math.min(18, cellSize * 0.6));
          const endCapSize = Math.max(6, Math.min(16, cellSize * 0.52));

          line.style.width = `${length}px`;
          line.style.setProperty('--link-thickness', `${lineThickness}px`);
          line.style.setProperty('--link-dot-size', `${Math.max(2, lineThickness * 0.36)}px`);
          line.style.setProperty('--link-dot-spacing', `${dotSpacing}px`);
          line.style.setProperty('--link-cap-size', `${endCapSize}px`);
          line.style.left = `${startX}px`;
          line.style.top = `${startY}px`;
          line.style.transform = `rotate(${angle}deg)`;

          clickableBox.appendChild(line);
          connectionLines.push(line);
        }
      });
    });
  }

  function lightenColor(color, amount) {
    const values = color.match(/\d+/g)?.map(Number);
    if (!values || values.length < 3) {
      return color;
    }

    const [r, g, b] = values;
    const nextR = Math.round(r + (255 - r) * amount);
    const nextG = Math.round(g + (255 - g) * amount);
    const nextB = Math.round(b + (255 - b) * amount);
    return `rgb(${nextR}, ${nextG}, ${nextB})`;
  }

  function getColorFromProbability(prob) {
    const colors = [
      { stop: 0.0, r: 0, g: 45, b: 255 },
      { stop: 0.2, r: 0, g: 95, b: 255 },
      { stop: 0.33, r: 0, g: 255, b: 255 },
      { stop: 0.4, r: 0, g: 255, b: 130 },
      { stop: 0.45, r: 84, g: 255, b: 0 },
      { stop: 0.55, r: 255, g: 255, b: 0 },
      { stop: 0.75, r: 255, g: 125, b: 0 },
      { stop: 1.0, r: 234, g: 0, b: 0 }
    ];

    for (let i = 0; i < colors.length - 1; i++) {
      const start = colors[i];
      const end = colors[i + 1];
      if (prob >= start.stop && prob <= end.stop) {
        const ratio = (prob - start.stop) / (end.stop - start.stop);
        const r = Math.floor(start.r + ratio * (end.r - start.r));
        const g = Math.floor(start.g + ratio * (end.g - start.g));
        const b = Math.floor(start.b + ratio * (end.b - start.b));
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    return 'rgb(0, 45, 255)';
  }

  function getGameColorFromProbability(probability) {
    if (probability >= 0.9) {
      return '#b8f28f';
    }
    if (probability >= 0.75) {
      return '#d7f78f';
    }
    if (probability >= 0.6) {
      return '#fff28a';
    }
    if (probability >= 0.45) {
      return '#ffd36e';
    }
    if (probability >= 0.3) {
      return '#ffb26f';
    }
    if (probability >= 0.2) {
      return '#ff9f9f';
    }
    if (probability >= 0.1) {
      return '#ffb7cb';
    }
    return '#ffd6e5';
  }

  function calculateCompletionRate(grid) {
    const cells = Array.from(grid.childNodes).filter(cell => cell.classList.contains('grid-cell'));
    const playableCells = cells.filter(cell => !cell.classList.contains('wall'));
    if (playableCells.length === 0) {
      return '0.00';
    }
    const satisfied = playableCells.filter(cell => !cell.classList.contains('dissatisfy')).length;
    return ((satisfied / playableCells.length) * 100).toFixed(2);
  }

  function applyProbabilitiesToGrid(probabilities, grid) {
    const cells = Array.from(grid.childNodes).filter(cell => cell.classList.contains('grid-cell'));

    cells.forEach((cell, index) => {
      if (cell.classList.contains('wall')) {
        cell.style.backgroundColor = '#d9d4c7';
        cell.classList.remove('dissatisfy');
        return;
      }

      if (cell.classList.contains('sensor')) {
        cell.style.backgroundColor = isGameMode ? '#fff7d7' : '#ffe2ea';
        cell.classList.remove('dissatisfy');
        return;
      }

      const probability = probabilities[index] || 0;
      const activeColor = getColorFromProbability(probability);
      const gameCellColor = isThresholdMode
        ? getGameColorFromProbability(probability)
        : probability > threshold
          ? '#b8f28f'
          : '#ffd6e5';

      if (probability > threshold) {
        cell.style.backgroundColor = isGameMode ? gameCellColor : activeColor;
        cell.classList.remove('dissatisfy');
      } else {
        cell.style.backgroundColor = isGameMode
          ? gameCellColor
          : isThresholdMode
          ? lightenColor(getColorFromProbability(threshold), 0.62)
          : activeColor;
        cell.classList.add('dissatisfy');
      }
    });
  }

  function calculateDetectionProbability(size, sensorList, grid) {
    const probabilities = Array(size * size).fill(0);

    sensorList.forEach(sensor => {
      for (let dx = -sensingRange; dx <= sensingRange; dx++) {
        for (let dy = -sensingRange; dy <= sensingRange; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > sensingRange || distance === 0) {
            continue;
          }

          const targetX = sensor.x + dx;
          const targetY = sensor.y + dy;

          if (targetX >= 0 && targetX < size && targetY >= 0 && targetY < size) {
            if (isObstacle(targetX, targetY) || !hasLineOfSight(sensor, targetX, targetY)) {
              continue;
            }
            const index = targetY * size + targetX;
            const prob = 1 / distance;
            probabilities[index] = 1 - (1 - probabilities[index]) * (1 - prob);
          }
        }
      }
    });

    Array.from(grid.childNodes)
      .filter(cell => cell.classList.contains('grid-cell'))
      .forEach((cell, index) => {
        const x = index % size;
        const y = Math.floor(index / size);
        if (isObstacle(x, y)) {
          probabilities[index] = 1;
          cell.dataset.probability = probabilities[index];
          return;
        }
        if (sensorList.some(sensor => sensor.x === x && sensor.y === y)) {
          probabilities[index] = 1;
        }
        cell.dataset.probability = probabilities[index];
      });

    probabilitiesCache = probabilities;
    applyProbabilitiesToGrid(probabilities, grid);
    const completionRate = calculateCompletionRate(grid);
    updateCompletionText(completionRate);
    checkCompletion(completionRate);

    if (isConnectMode) {
      connectSensors();
    } else {
      clearConnections();
    }
  }

  function renderAxes(size) {
    let boxWidth = clickableBox.clientWidth || 300;
    let boxHeight = clickableBox.clientHeight || 300;
    const cellWidth = boxWidth / size;
    const cellHeight = boxHeight / size;
    const fontSize = Math.min(Math.min(cellWidth, cellHeight) * 0.7, 14);

    xAxis.innerHTML = '';
    yAxis.innerHTML = '';
    xAxis.style.top = '-24px';
    xAxis.style.left = '0';
    xAxis.style.width = `${boxWidth}px`;
    yAxis.style.top = '0';
    yAxis.style.left = '-34px';
    yAxis.style.height = `${boxHeight}px`;

    for (let i = 0; i < size; i++) {
      const xLabel = document.createElement('div');
      xLabel.style.position = 'absolute';
      xLabel.style.top = '0';
      xLabel.style.left = `${i * cellWidth}px`;
      xLabel.style.width = `${cellWidth}px`;
      xLabel.style.textAlign = 'center';
      xLabel.style.fontSize = `${fontSize}px`;
      xLabel.style.lineHeight = '1';
      xLabel.style.whiteSpace = 'nowrap';
      xLabel.textContent = i % 5 === 0 ? i + 1 : '';
      xAxis.appendChild(xLabel);

      const yLabel = document.createElement('div');
      yLabel.style.position = 'absolute';
      yLabel.style.top = `${i * cellHeight}px`;
      yLabel.style.left = '0';
      yLabel.style.width = '26px';
      yLabel.style.height = `${cellHeight}px`;
      yLabel.style.textAlign = 'right';
      yLabel.style.fontSize = `${fontSize}px`;
      yLabel.style.lineHeight = `${cellHeight}px`;
      yLabel.style.whiteSpace = 'nowrap';
      yLabel.textContent = i % 5 === 0 ? i + 1 : '';
      yAxis.appendChild(yLabel);
    }
  }

  function updateGrid(layout = []) {
    sensors.length = 0;
    sensorCount = 0;

    const cells = Array.from(clickableBox.childNodes).filter(cell => cell.classList.contains('grid-cell'));
    cells.forEach(cell => {
      cell.classList.remove('sensor');
      cell.classList.remove('dissatisfy');
      cell.style.backgroundColor = cell.classList.contains('wall')
        ? '#d9d4c7'
        : isGameMode ? '#fff7d7' : 'rgb(0, 45, 255)';
      cell.dataset.probability = 0;
    });

    layout.forEach(sensor => {
      const index = sensor.y * gridSize + sensor.x;
      const cell = cells[index];
      if (!cell) {
        return;
      }

      cell.classList.add('sensor');
      sensors.push({ x: sensor.x, y: sensor.y });
      sensorCount++;
    });

    updateCounters();
    calculateDetectionProbability(gridSize, sensors, clickableBox);
  }

  function renderGrid(size, layout = []) {
    gridSize = size;
    obstacleSet = getObstacleSetForLevel(getSelectedLevel());
    clickableBox.innerHTML = '';
    clearConnections();
    clickableBox.style.display = 'grid';
    clickableBox.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    clickableBox.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    sensors.length = 0;
    sensorCount = 0;
    historyStack = [];
    renderAxes(size);

    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      const x = i % size;
      const y = Math.floor(i / size);

      cell.classList.add('grid-cell');
      cell.dataset.index = i;
      cell.dataset.probability = 0;
      if (isObstacle(x, y)) {
        cell.classList.add('wall');
      }
      cell.style.backgroundColor = isObstacle(x, y)
        ? '#d9d4c7'
        : isGameMode ? '#fff7d7' : 'rgb(0, 45, 255)';

      cell.addEventListener('click', function () {
        if (cell.classList.contains('wall')) {
          return;
        }
        saveMapState();

        if (cell.classList.contains('sensor')) {
          cell.classList.remove('sensor');
          const sensorIndex = sensors.findIndex(sensor => sensor.x === x && sensor.y === y);
          if (sensorIndex !== -1) {
            sensors.splice(sensorIndex, 1);
          }
          sensorCount--;
        } else {
          cell.classList.add('sensor');
          sensors.push({ x, y });
          sensorCount++;
        }

        updateCounters();
        calculateDetectionProbability(size, sensors, clickableBox);
      });

      cell.addEventListener('mousemove', function (event) {
        const probability = parseFloat(cell.dataset.probability || '0');
        tooltip.innerHTML = `Detection Probability: ${probability.toFixed(3)}<br>Threshold: ${threshold.toFixed(2)}`;
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
        tooltip.style.display = 'block';
      });

      cell.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });

      clickableBox.appendChild(cell);
    }

    updateGrid(layout);
  }

  completionClose?.addEventListener('click', hideCompletionModal);
  completionModal.addEventListener('click', function (event) {
    if (event.target === completionModal) {
      hideCompletionModal();
    }
  });

  function exportMap() {
    const limitMatrix = Array.from({ length: gridSize }, () => new Array(gridSize).fill(threshold));
    const output = [];
    output.push(`Map :\n${gridSize}x${gridSize}`);
    output.push(`Sensing_range : ${sensingRange}`);
    output.push(`Connect : ${connectDistance}`);
    output.push('Limit :');
    limitMatrix.forEach(row => output.push(row.join(' ')));
    output.push('Generation :');
    output.push(`*1 [${sensors.map(sensor => `{x: ${sensor.x}, y: ${sensor.y}}`).join(', ')}]`);

    const blob = new Blob([output.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const sensorLabel = sensors.length === 1 ? 'sensor' : 'sensors';
    anchor.href = url;
    anchor.download = `map_${gridSize}x${gridSize}_${sensors.length}_${sensorLabel}.epin`;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 100);
  }

  thresholdBtn?.addEventListener('click', function () {
    isThresholdMode = !isThresholdMode;
    const label = isThresholdMode ? 'Simple View' : 'Coverage View';
    thresholdBtn.innerHTML = label.replace(' ', '<br>');
    thresholdBtn.title = label;
    thresholdBtn.setAttribute('aria-label', label);
    applyProbabilitiesToGrid(probabilitiesCache, clickableBox);
  });

  connectBtn?.addEventListener('click', function () {
    isConnectMode = !isConnectMode;
    const label = isConnectMode ? 'Hide Links' : 'Show Links';
    connectBtn.innerHTML = label.replace(' ', '<br>');
    connectBtn.title = label;
    connectBtn.setAttribute('aria-label', label);
    if (isConnectMode) {
      connectSensors();
    } else {
      clearConnections();
    }
  });

  undoBtn?.addEventListener('click', function () {
    if (historyStack.length === 0) {
      return;
    }

    const previousState = historyStack.pop();
    updateGrid(previousState || []);
  });

  saveMapBtn?.addEventListener('click', exportMap);

  modeToggleBtn?.addEventListener('click', function () {
    isGameMode = !isGameMode;
    hasShownCompletionModal = false;
    updateModeUI();
    applyProbabilitiesToGrid(probabilitiesCache, clickableBox);
    const completionRate = calculateCompletionRate(clickableBox);
    updateCompletionText(completionRate);
    checkCompletion(completionRate);
  });

  solutionDropdown?.addEventListener('change', function () {
    renderGrid(getSelectedGridSize(), []);
  });

  updateModeUI();
  renderGrid(getSelectedGridSize(), []);
});
