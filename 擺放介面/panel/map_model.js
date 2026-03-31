document.addEventListener('DOMContentLoaded', function () {
  // 載入此互動面板專用樣式。

  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = './panel/map_model_style.css';
  document.head.appendChild(cssLink);

  // 主要 DOM 節點快取。
  const clickableBox = document.getElementById('clickable-box');
  const solutionDropdown = document.getElementById('solution');
  const statusBar = document.getElementById('status-bar');
  const gbestDisplay = document.getElementById('gbest');
  const mapCheck = document.getElementById('map-check');
  
  // 主要狀態：感測器數量、地圖大小與機率快取。
  let sensorCount = 0;
  let gridSize = 5;
  const sensors = [];
  let probabilitiesCache = null;

  // 預設情境：提供幾組固定配置快速切換。
  const sensorLayouts = {
    1: [{ x: 2, y: 2 }],

    2: [{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 7 }, { x: 7, y: 7 }],

    3: [{x: 2, y: 2}, {x: 7, y: 2}, {x: 12, y: 2}, {x: 2, y: 7}, {x: 7, y: 7}, {x: 12, y: 7}, {x: 2, y: 12}, {x: 7, y: 12}, {x: 12, y: 12}],

    4: [{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 12, y: 2 }, { x: 17, y: 2 }, { x: 2, y: 7 }, { x: 7, y: 7 }, { x: 12, y: 7 }, { x: 17, y: 7 }, { x: 2, y: 12 }, { x: 7, y: 12 }, { x: 12, y: 12 }, { x: 17, y: 12 }, { x: 2, y: 17 }, { x: 7, y: 17 }, { x: 12, y: 17 }, { x: 17, y: 17 }],

    5: [{ x: 3, y: 1 }, { x: 10, y: 2 }, { x: 16, y: 1 }, { x: 3, y: 7 }, { x: 9, y: 7 }, { x: 16, y: 7 }, { x: 3, y: 12 }, { x: 10, y: 12 }, { x: 16, y: 12 }, { x: 3, y: 18 }, { x: 9, y: 17 }, { x: 16, y: 18 }]
  };

  const threshold = 0.3;

  // 建立右側色條刻度。
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

  // 用外層容器包住地圖，方便疊加 X/Y 軸刻度。
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  const xAxis = document.createElement('div');
  xAxis.id = 'x-axis';
  xAxis.style.position = 'absolute';
  xAxis.style.top = '-24px';
  xAxis.style.left = '0';
  xAxis.style.width = `${gridSize * 30}px`;

  const yAxis = document.createElement('div');
  yAxis.id = 'y-axis';
  yAxis.style.position = 'absolute';
  yAxis.style.top = '0';
  yAxis.style.left = '-34px';
  yAxis.style.height = `${gridSize * 30}px`;

  container.appendChild(clickableBox);
  container.appendChild(xAxis);
  container.appendChild(yAxis);

  document.querySelector('.interactive-panel').prepend(container);

  // 滑鼠移到格子時顯示的提示框。
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'none';
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '5px 10px';
  tooltip.style.borderRadius = '5px';
  tooltip.style.fontSize = '12px';
  tooltip.style.pointerEvents = 'none';
  document.body.appendChild(tooltip);

  // 依指定大小重建地圖，並套用預設配置。
  function renderGrid(size, layout = []) {
    clickableBox.innerHTML = '';
    clickableBox.style.display = 'grid';
    clickableBox.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    clickableBox.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  

    const boxSize = 300;
    const cellSize = Math.floor(boxSize / size);
    const cells = [];

    renderAxes(size);

    // 每次重繪都先重置感測器狀態。
    sensors.length = 0;
    sensorCount = 0;
    gbestDisplay.textContent = `Sensor Count: ${sensorCount}`;

    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.index = i;
      cell.style.backgroundColor = 'rgb(0, 45, 255)';
      cells[i] = false;

      const x = i % size;
      const y = Math.floor(i / size);

      const isSensor = layout.some(sensor => sensor.x === x && sensor.y === y);
      if (isSensor) {
        cell.classList.add('sensor');
        sensors.push({ x, y });
        sensorCount++;
      }

        // 點擊格子可切換是否放置感測器。
      cell.addEventListener('click', function () {

        if (cell.classList.contains('sensor')) {
          cell.classList.remove('sensor');
          sensors.splice(sensors.findIndex(s => s.x === x && s.y === y), 1);
          sensorCount--;
        } else {
          cell.classList.add('sensor');
          sensors.push({ x, y });
          sensorCount++;
        }

        gbestDisplay.textContent = `${sensorCount}`;
        calculateDetectionProbability(size, sensors, clickableBox);
      });

      cell.addEventListener('mousemove', function (e) {
        // 顯示目前格子的偵測機率與門檻值。
        const probability = cell.dataset.probability || 0;
        const thresholdText = threshold.toFixed(2);
      

        tooltip.innerHTML = `
          Detection Probability: ${parseFloat(probability).toFixed(3)}<br>
          Threshold: ${thresholdText}
        `;
      

        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY - 10}px`;
        tooltip.style.display = 'block';
      });

      cell.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });

      clickableBox.appendChild(cell);
    }

    gbestDisplay.textContent = `${sensorCount}`;
    calculateDetectionProbability(size, sensors, clickableBox);
  }

  function renderAxes(gridSize) {
  // 依據目前地圖實際尺寸重新計算刻度位置。
    let boxWidth = clickableBox.clientWidth;
    let boxHeight = clickableBox.clientHeight;

    if (boxWidth === 0) boxWidth = 300;
    if (boxHeight === 0) boxHeight = 300;

    const cellWidth = boxWidth / gridSize;
    const cellHeight = boxHeight / gridSize;

    let fontSize = Math.min(cellWidth, cellHeight) * 0.7;
    if (fontSize === 0 || fontSize > 14) fontSize = 14;

    xAxis.innerHTML = '';
    yAxis.innerHTML = '';
    xAxis.style.top = '-24px';
    xAxis.style.left = '0';
    xAxis.style.width = `${boxWidth}px`;
    yAxis.style.top = '0';
    yAxis.style.left = '-34px';
    yAxis.style.height = `${boxHeight}px`;

    for (let i = 0; i < gridSize; i++) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = '0';
      label.style.left = `${(i + 0.5) * cellWidth}px`;
      label.style.width = '0';
      label.style.textAlign = 'center';
      label.style.fontSize = `${fontSize}px`;
      label.style.transform = 'translateX(-50%)';
      label.style.whiteSpace = 'nowrap';
      label.textContent = i % 5 === 0 ? i + 1 : '';
      xAxis.appendChild(label);
    }

    for (let i = 0; i < gridSize; i++) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = `${(i + 0.5) * cellHeight}px`;
      label.style.left = '0';
      label.style.width = '26px';
      label.style.height = `${cellHeight}px`;
      label.style.textAlign = 'right';
      label.style.fontSize = `${fontSize}px`;
      label.style.lineHeight = `${cellHeight}px`;
      label.style.transform = 'translateY(-50%)';
      label.style.whiteSpace = 'nowrap';
      label.textContent = i % 5 === 0 ? i + 1 : '';
      yAxis.appendChild(label);
    }
  }

  function calculateDetectionProbability(gridSize, sensors, grid) {
  // 由每個感測器向外擴散，累積各格子的偵測機率。

    const probabilities = Array(gridSize * gridSize).fill(0);
  
    
    sensors.forEach(sensor => {
      const sensorX = sensor.x;
      const sensorY = sensor.y;
  
      for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -5; dy <= 5; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5 || distance === 0) continue;
  
          const prob = 1 / distance;
          const targetX = sensorX + dx;
          const targetY = sensorY + dy;
  
          if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
            const index = targetY * gridSize + targetX;
            probabilities[index] = 1 - (1 - probabilities[index]) * (1 - prob);
          }
        }
      }
    });

    grid.childNodes.forEach((cell, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);

      const isSensor = sensors.some(sensor => sensor.x === x && sensor.y === y);
      if (isSensor) {
        probabilities[index] = 1;
      }

      cell.dataset.probability = probabilities[index];
    });
  
    probabilitiesCache = probabilities;
    applyProbabilitiesToGrid(probabilities, grid);

    const completionRate = calculateCompletionRate(grid);
    mapCheck.textContent = `${completionRate}% Completed`;
  }

  function applyProbabilitiesToGrid(probabilities, grid) {
  // 把機率映射成顏色，並標記未達門檻的格子。

    grid.childNodes.forEach((cell, index) => {
      if (cell.classList.contains('sensor')) {

        cell.style.backgroundColor = '#E2C6C4';
        cell.classList.remove('dissatisfy');
      } else {
        const probability = probabilities[index];
        cell.dataset.probability = probability;

        if (probability > threshold) {

          cell.style.backgroundColor = getColorFromProbability(probability);
          cell.classList.remove('dissatisfy');
        } else {
          cell.style.backgroundColor = getColorFromProbability(probability);
          cell.classList.add('dissatisfy');
        }
      }
    });
  }

  function getColorFromProbability(prob) {
  // 依機率做色階插值，產生熱度顏色。
    const colors = [
      { stop: 0.0, r: 0, g: 45, b: 255 },
      { stop: 0.2, r: 0, g: 95, b: 255 },
      { stop: 0.33, r: 0, g: 255, b: 255 },
      { stop: 0.4, r: 0, g: 255, b: 130 },
      { stop: 0.45, r: 84, g: 255, b: 0 },
      { stop: 0.55, r: 255, g: 255, b: 0 },
      { stop: 0.75, r: 255, g: 125, b: 0 },

      { stop: 1.0, r: 234, g: 0, b: 0 },

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

    return `rgb(0, 45, 255)`;
  }

  function calculateCompletionRate(grid) {
  // 計算目前地圖的完成度百分比。
    const totalCells = grid.childNodes.length;
    let nonDissatisfyCount = 0;
  

    grid.childNodes.forEach(cell => {
      if (!cell.classList.contains('dissatisfy')) {
        nonDissatisfyCount++;
      }
    });
  

    return ((nonDissatisfyCount / totalCells) * 100).toFixed(2);
  }

  solutionDropdown.addEventListener('change', function () {
  // 切換下拉選單時載入對應的預設地圖。
    const selectedValue = parseInt(this.value);
    let gridSize = 5;

    if (selectedValue === 1) gridSize = 5;
    else if (selectedValue === 2) gridSize = 10;
    else if (selectedValue === 3) gridSize = 15;
    else if (selectedValue === 4) gridSize = 20;
    else if (selectedValue === 5) gridSize = 20;

    renderGrid(gridSize, sensorLayouts[selectedValue] || []);
  });

  renderGrid(5, sensorLayouts[1] || []);
});


