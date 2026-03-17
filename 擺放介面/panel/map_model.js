document.addEventListener('DOMContentLoaded', function () {
  // 動態引入 CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = './panel/map_model_style.css';
  document.head.appendChild(cssLink);

  // 其他邏輯
  const clickableBox = document.getElementById('clickable-box');
  const solutionDropdown = document.getElementById('solution');
  const statusBar = document.getElementById('status-bar');
  const gbestDisplay = document.getElementById('gbest');
  const mapCheck = document.getElementById('map-check');
  
  let sensorCount = 0; // 追蹤 sensor 的總數量
  let gridSize = 5; // 初始 Grid 大小
  const sensors = []; // 儲存所有 sensor 位置
  let probabilitiesCache = null; // 儲存機率狀態

  //初始sensor擺放位置
  const sensorLayouts = {
    1: [{ x: 2, y: 2 }], // 最佳化的 5 × 5 解

    2: [{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 2, y: 7 }, { x: 7, y: 7 }], // 10 × 10 初始位置

    3: [{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 12, y: 2 }, { x: 17, y: 2 }, { x: 2, y: 7 }, { x: 7, y: 7 }, { x: 12, y: 7 }, { x: 17, y: 7 }, { x: 2, y: 12 }, { x: 7, y: 12 }, { x: 12, y: 12 }, { x: 17, y: 12 }, { x: 2, y: 17 }, { x: 7, y: 17 }, { x: 12, y: 17 }, { x: 17, y: 17 }], // 20 × 20 初始位置

    4: [{ x: 3, y: 1 }, { x: 10, y: 2 }, { x: 16, y: 1 }, { x: 3, y: 7 }, { x: 9, y: 7 }, { x: 16, y: 7 }, { x: 3, y: 12 }, { x: 10, y: 12 }, { x: 16, y: 12 }, { x: 3, y: 18 }, { x: 9, y: 17 }, { x: 16, y: 18 }] // 最佳化的 20 × 20 解
  };

  // 根據 Threshold 統一顯示顏色，這裡設置 threshold = 0.3
  const threshold = 0.3;

  // 清空狀態條內部
  statusBar.innerHTML = '';
  // 生成 0~1 的刻度，每間隔 0.1
  for (let i = 0; i <= 10; i++) {
    const value = (1 - i / 10).toFixed(1); // 倒序顯示 1 -> 0

    // 刻度線
    const scaleLine = document.createElement('div');
    scaleLine.classList.add('scale-line');
    scaleLine.style.top = `${(i / 10) * 100}%`;

    // 刻度數字
    const scaleText = document.createElement('div');
    scaleText.classList.add('status-bar-scale');
    scaleText.style.top = `${(i / 10) * 100}%`;
    scaleText.textContent = value;

    // 添加到狀態條
    statusBar.appendChild(scaleLine);
    statusBar.appendChild(scaleText);
  }

  // 包装 clickableBox 与 x/y 轴
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  // 创建 X 和 Y 轴容器
  const xAxis = document.createElement('div');
  xAxis.id = 'x-axis';
  xAxis.style.position = 'absolute';
  xAxis.style.top = '-20px'; // X 軸應該在 clickableBox 下方對齊
  xAxis.style.left = '-5px'; // 對齊 clickableBox 左側
  xAxis.style.width = `${gridSize * 30}px`; // 動態寬度：格子數量 * 格子大小
  xAxis.style.display = 'grid';
  xAxis.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`; // 每個格子一個區間

  const yAxis = document.createElement('div');
  yAxis.id = 'y-axis';
  yAxis.style.position = 'absolute';
  yAxis.style.top = '0'; // 與 clickableBox 頂部對齊
  yAxis.style.left = '-20'; // 在 clickableBox 左側
  yAxis.style.height = `${gridSize * 30}px`; // 動態高度：格子數量 * 格子大小
  yAxis.style.display = 'grid';
  yAxis.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`; // 每個格子一個區間

  // 添加 X 和 Y 轴容器到父级容器
  container.appendChild(clickableBox);
  container.appendChild(xAxis);
  container.appendChild(yAxis);

  // 将容器插入页面
  document.querySelector('.interactive-panel').prepend(container);

  // 滑鼠事件
  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'none'; // 預設不顯示
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '5px 10px';
  tooltip.style.borderRadius = '5px';
  tooltip.style.fontSize = '12px';
  tooltip.style.pointerEvents = 'none'; // 防止 tooltip 擋到滑鼠事件
  document.body.appendChild(tooltip);

  // 生成每個格子
  function renderGrid(size, layout = []) {
    clickableBox.innerHTML = ''; // 清空原本內容
    clickableBox.style.display = 'grid';
    clickableBox.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    clickableBox.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  
    // 計算每個格子的大小
    const boxSize = 300; // 黑色框框大小 (已在CSS固定300px)
    const cellSize = Math.floor(boxSize / size);
    const cells = []; // 儲存格子狀態

    // 渲染轴标签
    renderAxes(size);

    // 清空 sensors 與計數
    sensors.length = 0;
    sensorCount = 0;
    gbestDisplay.textContent = `Sensor Count: ${sensorCount}`;

    // 生成格子
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      cell.dataset.index = i; // 設置格子索引
      cell.style.backgroundColor = 'rgb(0, 45, 255)'; // 預設為深藍色
      cells[i] = false; // 初始狀態：沒有 sensor

      const x = i % size;
      const y = Math.floor(i / size);

      // 檢查是否需要擺放初始 sensor
      const isSensor = layout.some(sensor => sensor.x === x && sensor.y === y);
      if (isSensor) {
        cell.classList.add('sensor');
        sensors.push({ x, y });
        sensorCount++;
      }

      // 點擊事件：添加/移除 sensor
      cell.addEventListener('click', function () {
        // 點擊邏輯：添加/移除 sensor
        if (cell.classList.contains('sensor')) {
          cell.classList.remove('sensor');
          sensors.splice(sensors.findIndex(s => s.x === x && s.y === y), 1);
          sensorCount--;
        } else {
          cell.classList.add('sensor');
          sensors.push({ x, y });
          sensorCount++;
        }

        // 更新 Gbest 顯示
        gbestDisplay.textContent = `${sensorCount}`;
        calculateDetectionProbability(size, sensors, clickableBox);
      });
      // 滑鼠靠近時顯示 Tooltip
      cell.addEventListener('mousemove', function (e) {
        const probability = cell.dataset.probability || 0; // 取得當前機率
        const thresholdText = threshold.toFixed(2); // 取得 threshold
      
        // 更新 Tooltip 內容
        tooltip.innerHTML = `
          Detection Probability: ${parseFloat(probability).toFixed(3)}<br>
          Threshold: ${thresholdText}
        `;
      
        // 設置 Tooltip 位置（滑鼠右上角）
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY - 10}px`;
        tooltip.style.display = 'block';
      });
      // 滑鼠離開時隱藏 Tooltip
      cell.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });

      clickableBox.appendChild(cell);
    }

    gbestDisplay.textContent = `${sensorCount}`;
    calculateDetectionProbability(size, sensors, clickableBox);
  }
  // 生成xy軸標籤
  function renderAxes(gridSize) {
    // 獲取 clickableBox 的寬度和高度
    let boxWidth = clickableBox.offsetWidth;
    let boxHeight = clickableBox.offsetHeight;

    // 計算每個格子的大小
    if(boxWidth === 0 ) boxWidth = 300 - 8;
    if(boxHeight === 0) boxHeight = 300 - 8;
    const cellWidth = boxWidth / gridSize;
    const cellHeight = boxHeight / gridSize;

    let fontSize = Math.min(cellWidth, cellHeight) * 0.7; // 字體大小為格子大小的 70%
    if(fontSize === 0 || fontSize > 14) fontSize = 14;

    // 清空 X 和 Y 軸內容
    xAxis.innerHTML = '';
    yAxis.innerHTML = '';

    // 生成 X 軸標籤（從左到右）
    for (let i = 0; i < gridSize; i++) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = `-1px`; // 固定在網格正下方
      label.style.left = `${8 + i * cellWidth}px`; // 動態計算每個標籤的位置
      label.style.width = `${cellWidth}px`;
      label.style.textAlign = 'center';
      label.style.fontSize = `${fontSize}px`; // 動態設置字體大小

      // 每 5 格顯示一次標籤
      if (i % 5 === 0) {
        label.textContent = i + 1; // 從 1 開始
      } else {
        label.textContent = ''; // 中間不顯示
      }

      xAxis.appendChild(label);
    }

    // 生成 Y 軸標籤（從上到下）
    for (let i = 0; i < gridSize; i++) {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.top = `${4 + i * cellHeight}px`; // 動態計算每個標籤的位置
      label.style.left = `10px`; // 固定在 clickableBox 左側
      label.style.height = `${cellHeight}px`;
      label.style.textAlign = 'right';
      label.style.fontSize = `${fontSize}px`; // 動態設置字體大小
      label.style.lineHeight = `${cellHeight}px`; // 垂直置中

      // 每 5 格顯示一次標籤
      if (i % 5 === 0) {
        label.textContent = i + 1; // 從 1 開始
      } else {
        label.textContent = ''; // 中間不顯示
      }

      yAxis.appendChild(label);
    }
  }
  // 計算map的偵測機率
  function calculateDetectionProbability(gridSize, sensors, grid) {
    // 初始化所有格子的機率為 0
    const probabilities = Array(gridSize * gridSize).fill(0);
  
    
    sensors.forEach(sensor => {
      const sensorX = sensor.x;
      const sensorY = sensor.y;
  
      for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -5; dy <= 5; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy); // 計算歐幾里得距離
          if (distance > 5 || distance === 0) continue; // 超出範圍或自身略過
  
          const prob = 1 / distance; // 偵測機率是距離的倒數
          const targetX = sensorX + dx;
          const targetY = sensorY + dy;
  
          if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
            const index = targetY * gridSize + targetX;
            probabilities[index] = 1 - (1 - probabilities[index]) * (1 - prob); // 疊加公式
          }
        }
      }
    });

    // 將放置 sensor 的格子機率設為 1
    grid.childNodes.forEach((cell, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);

      const isSensor = sensors.some(sensor => sensor.x === x && sensor.y === y);
      if (isSensor) {
        probabilities[index] = 1; // 強制設為 1
      }

      // 儲存機率到格子 dataset
      cell.dataset.probability = probabilities[index];
    });
  
    probabilitiesCache = probabilities; // 更新 cache
    applyProbabilitiesToGrid(probabilities, grid);

    // 更新完成率
    const completionRate = calculateCompletionRate(grid);
    mapCheck.textContent = `${completionRate}% Completed`;
  }
  // 更新格子的狀態
  function applyProbabilitiesToGrid(probabilities, grid) {
    // 根據機率更新格子顏色
    grid.childNodes.forEach((cell, index) => {
      if (cell.classList.contains('sensor')) {
        // 如果是 sensor，顏色保持黑色
        cell.style.backgroundColor = 'black';
        cell.classList.remove('dissatisfy'); // 移除紅色斜線
      } else {
        const probability = probabilities[index];
        cell.dataset.probability = probability; // 儲存機率

        if (probability > threshold) {
          // 機率大於 Threshold，顯示機率顏色
          cell.style.backgroundColor = getColorFromProbability(probability);
          cell.classList.remove('dissatisfy'); // 移除紅色斜線
        } else {
          cell.style.backgroundColor = getColorFromProbability(probability);
          cell.classList.add('dissatisfy'); // 添加紅色斜線
        }
      }
    });
  }
  // 更新 getColorFromProbability 函數
  function getColorFromProbability(prob) {
    const colors = [
      { stop: 0.0, r: 0, g: 45, b: 255 },     // 深藍色
      { stop: 0.2, r: 0, g: 95, b: 255 },     // 藍色
      { stop: 0.33, r: 0, g: 255, b: 255 },    // 淺藍色
      { stop: 0.4, r: 0, g: 255, b: 130 },    // 藍綠色
      { stop: 0.45, r: 84, g: 255, b: 0 },     // 綠色
      { stop: 0.55, r: 255, g: 255, b: 0 },    // 黃色
      { stop: 0.7, r: 255, g: 125, b: 0 },    // 橘色
      { stop: 0.8, r: 255, g: 29, b: 0 },     // 橘紅色
      { stop: 0.9, r: 234, g: 0, b: 0 },      // 紅色
      { stop: 1.0, r: 198, g: 0, b: 0 }       // 深紅色
    ];

    // 遍歷顏色區間，找到當前機率所在範圍
    for (let i = 0; i < colors.length - 1; i++) {
      const start = colors[i];
      const end = colors[i + 1];

      if (prob >= start.stop && prob <= end.stop) {
        const ratio = (prob - start.stop) / (end.stop - start.stop); // 計算插值比例

        // 線性插值計算 RGB 值
        const r = Math.floor(start.r + ratio * (end.r - start.r));
        const g = Math.floor(start.g + ratio * (end.g - start.g));
        const b = Math.floor(start.b + ratio * (end.b - start.b));

        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    return `rgb(0, 45, 255)`; // 預設返回深藍色
  }
  // 計算完成率
  function calculateCompletionRate(grid) {
    const totalCells = grid.childNodes.length; // 格子總數
    let nonDissatisfyCount = 0;
  
    // 遍歷所有格子，計算非 dissatisfy 的數量
    grid.childNodes.forEach(cell => {
      if (!cell.classList.contains('dissatisfy')) {
        nonDissatisfyCount++;
      }
    });
  
    // 計算完成率並返回百分比
    return ((nonDissatisfyCount / totalCells) * 100).toFixed(2); // 保留兩位小數
  }
  // 根據選項更新格子
  solutionDropdown.addEventListener('change', function () {
    const selectedValue = parseInt(this.value);
    let gridSize = 5; // 預設值

    if (selectedValue === 1) gridSize = 5;
    else if (selectedValue === 2) gridSize = 10;
    else if (selectedValue === 3) gridSize = 20;
    else if (selectedValue === 4) gridSize = 20; // 最佳化的解 20×20

    // 傳入對應的初始 sensor 位置
    renderGrid(gridSize, sensorLayouts[selectedValue] || []);
  });

  renderGrid(5, sensorLayouts[1] || []);
});