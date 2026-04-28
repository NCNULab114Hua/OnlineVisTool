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
  const quickSolutionBtn = document.getElementById('quick-solution-btn');

  let gridSize = 5;
  let sensorCount = 0;
  const sensingRange = 5;
  const defaultConnectDistance = 8;
  const defaultThreshold = 0.3;
  const sensors = [];
  let probabilitiesCache = [];
  let historyStack = [];
  let isThresholdMode = false;
  let isConnectMode = false;
  let isGameMode = true;
  let connectionLines = [];
  let hasShownCompletionModal = false;
  let obstacleSet = new Set();
  let activeSensorKeys = new Set();
  let shouldAnimateFishOnNextUpdate = false;
  let fishAnimationTimeouts = [];
  let audioContext = null;
  let crunchAudioTemplate = null;
  let iceAudioTemplate = null;
  let fireAudioTemplate = null;
  let crunchAudioTimeouts = [];
  let activeCrunchAudios = [];

  const chipCrunchAudioPath = './audio/chip-crunch.wav';
  const iceMakeAudioPath = './audio/ice sound.wav';
  const fireSoundAudioPath = './audio/fire sound.wav';
  const skinStorageKey = 'meowtopia-skin-preferences';
  const catSkinAssets = {
    kuro: {
      name: 'Kuro Cat',
      map: './image/kuro.png',
      full: './image/full kuro.png'
    },
    gray: {
      name: 'Gray Cat',
      map: './image/gray.png',
      full: './image/full gray.png'
    },
    dinger: {
      name: 'Dinger Cat',
      map: './image/dinger.png',
      full: './image/full dinger.png'
    }
  };
  const fishSkinAssets = {
    classic: {
      name: 'Classic Fish',
      idle: './image/fish.png',
      eaten: './image/fish-bone.png',
      sound: 'crunch',
      frames: [
        { src: './image/fish-eat1.png', at: 350 },
        { src: './image/fish-eat2.png', at: 800 },
        { src: './image/fish-eat3.png', at: 1250 },
        { src: './image/fish-bone.png', at: 2000, isFinal: true }
      ]
    },
    hot: {
      name: 'Hot Fish',
      idle: './image/fish-hot1.png',
      eaten: './image/fish-hot5.png',
      sound: 'fire',
      frames: [
        { src: './image/fish-hot2.png', at: 350 },
        { src: './image/fish-hot3.png', at: 800 },
        { src: './image/fish-hot4.png', at: 1250 },
        { src: './image/fish-hot5.png', at: 2000, isFinal: true }
      ]
    },
    ice: {
      name: 'Ice Fish',
      idle: './image/fish-ice1.png',
      eaten: './image/fish-ice5.png',
      sound: 'ice',
      frames: [
        { src: './image/fish-ice2.png', at: 350 },
        { src: './image/fish-ice3.png', at: 800 },
        { src: './image/fish-ice4.png', at: 1250 },
        { src: './image/fish-ice5.png', at: 2000, isFinal: true }
      ]
    }
  };
  const skinPreferences = readSkinPreferences();

  const presetSolutionLayouts = {
    9: [
      { x: 10, y: 0 }, { x: 18, y: 0 }, { x: 36, y: 1 }, { x: 2, y: 2 },
      { x: 22, y: 2 }, { x: 29, y: 2 }, { x: 42, y: 2 }, { x: 48, y: 3 },
      { x: 15, y: 6 }, { x: 9, y: 7 }, { x: 2, y: 9 }, { x: 22, y: 9 },
      { x: 34, y: 9 }, { x: 27, y: 10 }, { x: 40, y: 10 }, { x: 47, y: 10 },
      { x: 16, y: 13 }, { x: 9, y: 14 }, { x: 25, y: 15 }, { x: 2, y: 16 },
      { x: 33, y: 16 }, { x: 24, y: 17 }, { x: 32, y: 17 }, { x: 40, y: 17 },
      { x: 47, y: 17 }, { x: 17, y: 19 }, { x: 9, y: 21 }, { x: 38, y: 22 },
      { x: 1, y: 23 }, { x: 46, y: 23 }, { x: 24, y: 24 }, { x: 30, y: 24 },
      { x: 16, y: 26 }, { x: 8, y: 28 }, { x: 38, y: 28 }, { x: 46, y: 29 },
      { x: 0, y: 30 }, { x: 30, y: 30 }, { x: 23, y: 31 }, { x: 15, y: 33 },
      { x: 39, y: 33 }, { x: 7, y: 34 }, { x: 32, y: 35 }, { x: 46, y: 35 },
      { x: 2, y: 38 }, { x: 17, y: 38 }, { x: 24, y: 38 }, { x: 10, y: 39 },
      { x: 31, y: 39 }, { x: 39, y: 40 }, { x: 46, y: 41 }, { x: 4, y: 42 },
      { x: 24, y: 45 }, { x: 6, y: 46 }, { x: 15, y: 46 }, { x: 19, y: 46 },
      { x: 28, y: 46 }, { x: 34, y: 46 }, { x: 2, y: 47 }, { x: 9, y: 47 },
      { x: 40, y: 47 }, { x: 47, y: 47 }
    ],
    13: [
      { x: 22, y: 0 }, { x: 35, y: 0 }, { x: 39, y: 0 }, { x: 44, y: 0 },
      { x: 45, y: 0 }, { x: 20, y: 1 }, { x: 42, y: 1 }, { x: 49, y: 1 },
      { x: 3, y: 2 }, { x: 10, y: 2 }, { x: 15, y: 2 }, { x: 6, y: 3 },
      { x: 25, y: 3 }, { x: 29, y: 3 }, { x: 41, y: 3 }, { x: 48, y: 3 },
      { x: 2, y: 4 }, { x: 32, y: 4 }, { x: 10, y: 5 }, { x: 38, y: 5 },
      { x: 47, y: 5 }, { x: 12, y: 6 }, { x: 19, y: 6 }, { x: 45, y: 6 },
      { x: 15, y: 7 }, { x: 33, y: 7 }, { x: 47, y: 7 }, { x: 1, y: 8 },
      { x: 6, y: 8 }, { x: 11, y: 8 }, { x: 41, y: 8 }, { x: 20, y: 9 },
      { x: 37, y: 9 }, { x: 49, y: 9 }, { x: 3, y: 10 }, { x: 37, y: 10 },
      { x: 9, y: 11 }, { x: 11, y: 11 }, { x: 27, y: 11 }, { x: 4, y: 12 },
      { x: 22, y: 12 }, { x: 42, y: 12 }, { x: 48, y: 12 }, { x: 12, y: 13 },
      { x: 14, y: 13 }, { x: 17, y: 13 }, { x: 35, y: 13 }, { x: 3, y: 14 },
      { x: 8, y: 14 }, { x: 48, y: 14 }, { x: 0, y: 15 }, { x: 38, y: 15 },
      { x: 44, y: 15 }, { x: 33, y: 16 }, { x: 4, y: 17 }, { x: 14, y: 17 },
      { x: 19, y: 17 }, { x: 9, y: 18 }, { x: 10, y: 18 }, { x: 24, y: 18 },
      { x: 37, y: 18 }, { x: 5, y: 19 }, { x: 30, y: 19 }, { x: 4, y: 20 },
      { x: 18, y: 20 }, { x: 22, y: 20 }, { x: 33, y: 20 }, { x: 12, y: 21 },
      { x: 49, y: 21 }, { x: 0, y: 22 }, { x: 12, y: 22 }, { x: 42, y: 22 },
      { x: 25, y: 23 }, { x: 5, y: 24 }, { x: 27, y: 24 }, { x: 36, y: 24 },
      { x: 10, y: 25 }, { x: 16, y: 26 }, { x: 17, y: 26 }, { x: 31, y: 26 },
      { x: 40, y: 26 }, { x: 47, y: 26 }, { x: 48, y: 27 }, { x: 1, y: 28 },
      { x: 9, y: 28 }, { x: 24, y: 28 }, { x: 35, y: 28 }, { x: 29, y: 29 },
      { x: 43, y: 29 }, { x: 37, y: 30 }, { x: 30, y: 31 }, { x: 44, y: 31 },
      { x: 47, y: 31 }, { x: 48, y: 31 }, { x: 3, y: 32 }, { x: 22, y: 32 },
      { x: 32, y: 32 }, { x: 11, y: 33 }, { x: 24, y: 33 }, { x: 34, y: 33 },
      { x: 40, y: 33 }, { x: 29, y: 34 }, { x: 36, y: 34 }, { x: 16, y: 35 },
      { x: 39, y: 35 }, { x: 30, y: 37 }, { x: 36, y: 37 }, { x: 40, y: 37 },
      { x: 45, y: 37 }, { x: 25, y: 38 }, { x: 8, y: 39 }, { x: 22, y: 39 },
      { x: 32, y: 39 }, { x: 49, y: 39 }, { x: 2, y: 40 }, { x: 15, y: 40 },
      { x: 36, y: 40 }, { x: 27, y: 41 }, { x: 33, y: 41 }, { x: 45, y: 41 },
      { x: 38, y: 42 }, { x: 41, y: 42 }, { x: 29, y: 43 }, { x: 48, y: 43 },
      { x: 24, y: 44 }, { x: 35, y: 45 }, { x: 11, y: 46 }, { x: 19, y: 46 },
      { x: 2, y: 47 }, { x: 29, y: 47 }, { x: 9, y: 48 }, { x: 40, y: 48 },
      { x: 46, y: 48 }, { x: 47, y: 48 }, { x: 26, y: 49 }, { x: 33, y: 49 }
    ]
  };

  const levelSizes = {
    1: 5,
    2: 10,
    3: 15,
    4: 20,
    5: 8,
    6: 12,
    7: 18,
    8: 30,
    9: 50,
    10: 12,
    11: 18,
    12: 24,
    13: 50,
    14: 10,
    15: 20,
    16: 25,
    17: 5,
    18: 5,
    19: 5
  };

  const missionOptions = [
    { value: 1, label: '5 x 5 map' },
    { value: 2, label: '10 x 10 map' },
    { value: 3, label: '15 x 15 map' },
    { value: 4, label: '20 x 20 map' },
    { value: 5, label: '8 x 8 wall map' },
    { value: 6, label: '12 x 12 wall map' },
    { value: 7, label: '18 x 18 maze map' },
    { value: 8, label: '30 x 30 city map' },
    { value: 9, label: '50 x 50 map' },
    { value: 10, label: '12 x 12 hotspot map' },
    { value: 11, label: '18 x 18 tier map' },
    { value: 12, label: '24 x 24 demand map' },
    { value: 13, label: '50 x 50 wildfire map' },
    { value: 14, label: '10 x 10 relay map' },
    { value: 15, label: '20 x 20 backbone map' },
    { value: 16, label: '25 x 25 network map' },
    { value: 17, label: '5 x 5 wall lesson' },
    { value: 18, label: '5 x 5 color lesson' },
    { value: 19, label: '5 x 5 relay lesson' }
  ];

  const obstacleMaps = {
    17: createWallPattern(5, [
      { x: 2, y: 0, length: 5, direction: 'v' }
    ]),
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

  const thresholdMaps = {
    18: [
      [0.3, 0.3, 0.4, 0.3, 0.3],
      [0.3, 0.42, 0.5, 0.42, 0.3],
      [0.4, 0.5, 0.68, 0.5, 0.4],
      [0.3, 0.42, 0.5, 0.42, 0.3],
      [0.3, 0.3, 0.4, 0.3, 0.3]
    ],
    10: createThresholdPattern(12, 0.24, [
      { type: 'circle', cx: 5.5, cy: 5.5, radius: 2.35, value: 0.62 },
      { type: 'rect', x: 0, y: 0, width: 3, height: 3, value: 0.46 },
      { type: 'rect', x: 9, y: 0, width: 3, height: 3, value: 0.46 },
      { type: 'rect', x: 0, y: 9, width: 3, height: 3, value: 0.46 },
      { type: 'rect', x: 9, y: 9, width: 3, height: 3, value: 0.46 },
      { type: 'diamond', cx: 5.5, cy: 5.5, radius: 4.5, value: 0.34 }
    ]),
    11: createThresholdPattern(18, 0.22, [
      { type: 'diamond', cx: 8.5, cy: 8.5, radius: 3.5, value: 0.6 },
      { type: 'rect', x: 6, y: 0, width: 6, height: 18, value: 0.4 },
      { type: 'rect', x: 0, y: 6, width: 18, height: 6, value: 0.4 },
      { type: 'circle', cx: 8.5, cy: 8.5, radius: 6.25, value: 0.3 }
    ]),
    12: createThresholdPattern(24, 0.2, [
      { type: 'circle', cx: 6, cy: 6, radius: 2.7, value: 0.62 },
      { type: 'circle', cx: 17, cy: 7, radius: 3, value: 0.62 },
      { type: 'circle', cx: 11.5, cy: 17, radius: 3.2, value: 0.62 },
      { type: 'rect', x: 8, y: 3, width: 8, height: 5, value: 0.44 },
      { type: 'rect', x: 5, y: 14, width: 14, height: 5, value: 0.44 },
      { type: 'diamond', cx: 11.5, cy: 11.5, radius: 8.5, value: 0.3 }
    ])
  };

  const relayMaps = {
    14: [{ x: 1, y: 8 }],
    15: [{ x: 2, y: 16 }, { x: 16, y: 3 }],
    16: [{ x: 3, y: 20 }, { x: 12, y: 4 }, { x: 21, y: 15 }],
    19: [{ x: 0, y: 4 }]
  };

  const relayConnectDistances = {
    14: 4,
    15: 6,
    16: 7,
    19: 3
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

  function createThresholdPattern(size, baseValue, zones = []) {
    const matrix = Array.from({ length: size }, () => Array(size).fill(baseValue));

    zones.forEach(zone => {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let matches = false;

          if (zone.type === 'rect') {
            matches = (
              x >= zone.x &&
              x < zone.x + zone.width &&
              y >= zone.y &&
              y < zone.y + zone.height
            );
          } else if (zone.type === 'circle') {
            const dx = x - zone.cx;
            const dy = y - zone.cy;
            matches = Math.sqrt(dx * dx + dy * dy) <= zone.radius;
          } else if (zone.type === 'diamond') {
            matches = Math.abs(x - zone.cx) + Math.abs(y - zone.cy) <= zone.radius;
          }

          if (matches) {
            matrix[y][x] = Math.max(matrix[y][x], zone.value);
          }
        }
      }
    });

    return matrix.map(row => row.map(value => Number(value.toFixed(2))));
  }

  function parseThresholdMatrix(rawText, size) {
    return rawText
      .trim()
      .split('\n')
      .map(line => line.trim().split(/\s+/).slice(0, size).map(Number))
      .slice(0, size);
  }

  thresholdMaps[13] = parseThresholdMatrix(String.raw`
0.3583 0.3583 0.3724 0.4031 0.4035 0.4326 0.4463 0.461 0.4541 0.457 0.4636 0.4577 0.4338 0.418 0.3903 0.3846 0.3583 0.3583 0.3583 0.3307 0.3085 0.2833 0.2592 0.2423 0.2233 0.2481 0.2764 0.3044 0.3375 0.3583 0.3646 0.4262 0.488 0.5937 0.6719 0.7195 0.7195 0.7536 0.7951 0.8276 0.8627 0.8889 0.8974 0.8943 0.8954 0.8946 0.8941 0.8941 0.8949 0.8963
0.3583 0.384 0.4127 0.4572 0.5018 0.5649 0.6036 0.627 0.6358 0.637 0.6285 0.6105 0.5907 0.5351 0.4787 0.4287 0.3915 0.3603 0.3583 0.3583 0.3466 0.3235 0.3001 0.2776 0.2556 0.2648 0.2852 0.3104 0.3401 0.3583 0.36 0.3944 0.4588 0.5775 0.6645 0.7123 0.7195 0.7406 0.7681 0.7999 0.8316 0.8575 0.8817 0.8993 0.9 0.9 0.9 0.9 0.9 0.8902
0.3935 0.4435 0.5168 0.6028 0.658 0.6852 0.7017 0.7083 0.7108 0.71 0.7125 0.7038 0.6898 0.6719 0.6263 0.5538 0.4726 0.4101 0.3763 0.3583 0.3583 0.3473 0.3216 0.2988 0.2746 0.2612 0.2802 0.3054 0.333 0.3568 0.3583 0.3842 0.4473 0.5602 0.6529 0.7025 0.7195 0.7289 0.7639 0.7882 0.819 0.8462 0.87 0.8927 0.8971 0.8991 0.8984 0.9 0.9 0.8894
0.4798 0.5784 0.6544 0.6929 0.7138 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7038 0.6681 0.6098 0.5123 0.4285 0.3825 0.3583 0.3583 0.3422 0.3175 0.2886 0.2702 0.2801 0.3032 0.3258 0.3518 0.3583 0.3753 0.4296 0.5238 0.6336 0.6928 0.7195 0.7209 0.7525 0.7767 0.8068 0.8352 0.8598 0.8837 0.8986 0.8992 0.8984 0.9 0.9 0.8894
0.6102 0.6749 0.7165 0.7195 0.7195 0.7238 0.7334 0.7459 0.7562 0.7522 0.751 0.7407 0.7297 0.7195 0.7195 0.7185 0.6935 0.6349 0.5333 0.4438 0.381 0.3583 0.3583 0.3356 0.3108 0.2819 0.2735 0.2986 0.3251 0.3475 0.3583 0.37 0.4129 0.484 0.6055 0.6715 0.7142 0.7195 0.7354 0.7672 0.7921 0.8186 0.8374 0.8619 0.8805 0.8986 0.897 0.8985 0.9 0.8894
0.6846 0.7195 0.7195 0.7195 0.7395 0.7591 0.775 0.7846 0.7902 0.7917 0.7885 0.7758 0.7628 0.7484 0.7306 0.7195 0.7195 0.7026 0.6335 0.5197 0.4159 0.3603 0.3583 0.3561 0.3241 0.2986 0.275 0.2904 0.3132 0.3372 0.3583 0.3583 0.3874 0.4547 0.5606 0.6472 0.7026 0.7195 0.7209 0.7503 0.7733 0.8001 0.8243 0.8473 0.8613 0.8789 0.8949 0.8972 0.9 0.8902
0.7195 0.7195 0.7275 0.754 0.7767 0.7962 0.8105 0.8227 0.8292 0.8308 0.8255 0.816 0.8006 0.7824 0.7639 0.7386 0.7195 0.7195 0.6977 0.6285 0.4827 0.4005 0.3601 0.3583 0.3408 0.3106 0.2842 0.285 0.3077 0.3309 0.3554 0.3583 0.3767 0.4248 0.5015 0.6097 0.6807 0.7186 0.7195 0.7298 0.756 0.7794 0.8023 0.8262 0.8418 0.858 0.8711 0.8838 0.8869 0.8947
0.7195 0.7285 0.7584 0.7855 0.8083 0.8299 0.8448 0.8595 0.8676 0.8641 0.8632 0.8485 0.835 0.816 0.7969 0.7686 0.7427 0.7195 0.7195 0.6862 0.5968 0.4442 0.3794 0.3583 0.3561 0.3234 0.291 0.2758 0.3005 0.3229 0.3431 0.3583 0.3592 0.3934 0.4513 0.5528 0.6389 0.6934 0.7195 0.7195 0.7335 0.7587 0.7799 0.7995 0.8174 0.8332 0.8459 0.8566 0.862 0.8765
0.7242 0.7532 0.7853 0.813 0.8374 0.8574 0.8774 0.8891 0.895 0.8951 0.8921 0.8831 0.8661 0.8454 0.821 0.7963 0.7671 0.7347 0.7195 0.7195 0.6437 0.5031 0.4058 0.3601 0.3583 0.3349 0.301 0.2784 0.2884 0.3126 0.3343 0.3576 0.3583 0.3756 0.4153 0.4849 0.594 0.6625 0.7068 0.7195 0.7195 0.7327 0.7534 0.775 0.7907 0.8054 0.8159 0.8269 0.835 0.8437
0.7473 0.7777 0.8079 0.8372 0.8647 0.8869 0.8979 0.8985 0.8992 0.8993 0.9 0.8986 0.8914 0.8717 0.8481 0.82 0.7869 0.7541 0.7202 0.7195 0.6861 0.5764 0.4374 0.3767 0.3583 0.3459 0.3121 0.2811 0.2769 0.2991 0.322 0.3444 0.3583 0.3592 0.3915 0.4318 0.5172 0.6082 0.667 0.7117 0.7195 0.7195 0.7304 0.7496 0.7655 0.778 0.7886 0.8 0.804 0.8132
0.7648 0.7969 0.8277 0.8584 0.8862 0.9 0.8985 0.8992 0.9 0.9 0.9 0.8991 0.897 0.8993 0.8722 0.8423 0.8072 0.7731 0.7376 0.7195 0.7102 0.6182 0.4714 0.3896 0.3583 0.3508 0.3188 0.2881 0.2706 0.2894 0.3102 0.3329 0.3539 0.3583 0.3648 0.3986 0.4459 0.5201 0.6122 0.6682 0.7067 0.7195 0.7195 0.7202 0.7371 0.7508 0.7623 0.7684 0.7775 0.7797
0.7769 0.8123 0.8454 0.8767 0.9 0.8985 0.9 0.9 0.9 0.9 0.9 0.9 0.8984 0.8985 0.8877 0.8545 0.8228 0.7886 0.7518 0.7195 0.7195 0.647 0.5018 0.4032 0.3583 0.3568 0.3231 0.2923 0.2662 0.2793 0.2996 0.3218 0.3379 0.3583 0.3583 0.3732 0.4068 0.4513 0.5268 0.6163 0.6629 0.6937 0.7186 0.7195 0.7195 0.7195 0.7319 0.7407 0.7438 0.7508
0.7857 0.8269 0.8598 0.8884 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8993 0.8671 0.8357 0.7992 0.7614 0.7224 0.7195 0.6605 0.525 0.415 0.361 0.3583 0.3261 0.2955 0.2666 0.2666 0.2829 0.303 0.3238 0.348 0.3583 0.3583 0.3735 0.4037 0.4472 0.5184 0.5935 0.6442 0.6793 0.7029 0.715 0.7195 0.7195 0.7195 0.7195 0.7195
0.7923 0.8308 0.8661 0.8971 0.8984 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8992 0.8986 0.875 0.8445 0.8076 0.7687 0.7281 0.7195 0.6728 0.546 0.4217 0.3627 0.3583 0.3269 0.2957 0.2669 0.2541 0.2724 0.2898 0.3108 0.3277 0.345 0.3583 0.3583 0.3677 0.3957 0.4313 0.4918 0.5556 0.612 0.6495 0.6763 0.6919 0.7034 0.7103 0.7168 0.7195
0.7881 0.835 0.8655 0.8964 0.8984 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8992 0.8986 0.8771 0.8457 0.8072 0.7691 0.7289 0.7195 0.6712 0.5492 0.4217 0.3628 0.3583 0.327 0.2962 0.2687 0.246 0.2581 0.275 0.2922 0.3141 0.3311 0.3466 0.3583 0.3583 0.3638 0.3844 0.4161 0.4546 0.4945 0.546 0.5926 0.6257 0.649 0.6581 0.6696 0.664
0.7883 0.8253 0.8585 0.8927 0.8985 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8986 0.8703 0.837 0.8014 0.765 0.7246 0.7195 0.6646 0.5352 0.4145 0.3628 0.3576 0.3263 0.2962 0.2669 0.2433 0.2471 0.2651 0.2776 0.2926 0.3135 0.3274 0.3445 0.3583 0.3583 0.3617 0.381 0.397 0.4197 0.4473 0.483 0.519 0.5568 0.5728 0.5825 0.5767
0.7812 0.8172 0.8489 0.8783 0.8986 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8942 0.8583 0.8267 0.7899 0.754 0.7195 0.7195 0.6521 0.5102 0.4057 0.3583 0.3576 0.3245 0.2959 0.2651 0.2433 0.2439 0.2543 0.2662 0.2785 0.2913 0.3101 0.3226 0.3378 0.3539 0.3583 0.3583 0.3583 0.3734 0.3903 0.4118 0.4235 0.4431 0.4538 0.465 0.4704
0.7677 0.8013 0.8328 0.8652 0.8935 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8938 0.9 0.8759 0.8452 0.812 0.7787 0.7412 0.7195 0.7153 0.6313 0.4906 0.3927 0.3583 0.3547 0.3245 0.2896 0.264 0.2629 0.2662 0.2779 0.2815 0.2852 0.2875 0.2926 0.3018 0.319 0.3307 0.3459 0.3583 0.3583 0.3583 0.3583 0.3665 0.3738 0.385 0.3951 0.3969 0.4032
0.7531 0.7857 0.8149 0.8485 0.871 0.8943 0.9 0.9 0.8984 0.9 0.8968 0.9 0.9 0.8818 0.8575 0.8258 0.7975 0.7641 0.7275 0.7195 0.6954 0.6002 0.4493 0.3754 0.3583 0.3451 0.3119 0.2839 0.2794 0.2908 0.2991 0.3066 0.3121 0.3122 0.3146 0.3137 0.3162 0.3115 0.313 0.3219 0.3345 0.343 0.3547 0.3583 0.3583 0.3583 0.3583 0.3591 0.3609 0.3592
0.73 0.7639 0.7923 0.8241 0.8477 0.8701 0.8842 0.8993 0.8993 0.8993 0.8979 0.8899 0.8776 0.8573 0.8309 0.8068 0.7729 0.7412 0.7195 0.7195 0.6657 0.5259 0.4141 0.3592 0.3583 0.3346 0.3071 0.2986 0.3112 0.3242 0.3335 0.3416 0.3466 0.3496 0.3495 0.3496 0.3488 0.3443 0.337 0.3292 0.3218 0.3203 0.3291 0.3378 0.3436 0.3517 0.3568 0.3583 0.3583 0.3583
0.7203 0.7392 0.7668 0.7962 0.8198 0.8394 0.8578 0.8689 0.8796 0.881 0.8709 0.8594 0.8464 0.8233 0.8043 0.7765 0.7503 0.7202 0.7195 0.7004 0.6095 0.4608 0.3868 0.3583 0.3583 0.3244 0.3161 0.3276 0.3473 0.3576 0.3583 0.3583 0.3583 0.3583 0.3592 0.3592 0.3583 0.3583 0.3583 0.3583 0.3525 0.3349 0.3226 0.3143 0.3204 0.3237 0.3278 0.3329 0.3352 0.3376
0.7195 0.7195 0.7397 0.7673 0.789 0.8098 0.8278 0.8335 0.8452 0.8471 0.8374 0.8285 0.8134 0.7983 0.774 0.7508 0.7195 0.7195 0.7133 0.6529 0.522 0.4096 0.366 0.3583 0.3445 0.3235 0.345 0.3583 0.3583 0.3583 0.3679 0.3756 0.389 0.4015 0.4097 0.404 0.3968 0.3817 0.373 0.3583 0.3583 0.3583 0.3547 0.3322 0.3128 0.3013 0.3042 0.3095 0.3117 0.3101
0.7013 0.7195 0.7195 0.7327 0.7554 0.7758 0.7892 0.7998 0.8087 0.8083 0.8028 0.7918 0.7792 0.7626 0.7415 0.7209 0.7195 0.7165 0.6655 0.5736 0.4443 0.3804 0.3591 0.3583 0.3298 0.3539 0.3583 0.3601 0.3716 0.4002 0.4319 0.4643 0.5054 0.5353 0.5407 0.5317 0.5099 0.4914 0.4515 0.411 0.3841 0.3621 0.3583 0.3583 0.3442 0.3187 0.2969 0.2865 0.288 0.288
0.6423 0.6982 0.7195 0.7195 0.7202 0.7372 0.7528 0.7615 0.7687 0.7685 0.7653 0.7543 0.7455 0.7276 0.7195 0.7195 0.7144 0.6653 0.5781 0.4615 0.3909 0.3583 0.3583 0.3414 0.3583 0.3583 0.3611 0.3878 0.4407 0.5024 0.5866 0.6349 0.6543 0.6719 0.676 0.6726 0.6642 0.6472 0.6082 0.5539 0.4676 0.4121 0.3708 0.3583 0.3583 0.3456 0.3201 0.2937 0.2739 0.2627
0.535 0.6369 0.6879 0.7165 0.7195 0.7195 0.7195 0.7231 0.729 0.7297 0.7239 0.7209 0.7195 0.7195 0.7195 0.702 0.6575 0.575 0.4667 0.3975 0.3583 0.3583 0.3487 0.3553 0.3583 0.3633 0.3997 0.4699 0.5831 0.6579 0.694 0.7142 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7052 0.6737 0.626 0.5349 0.4357 0.3718 0.3583 0.3583 0.346 0.3141 0.2902 0.2665
0.4267 0.5018 0.5952 0.6502 0.6873 0.7114 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7156 0.6925 0.6664 0.6186 0.5389 0.4456 0.3933 0.3583 0.3583 0.3553 0.3509 0.3583 0.3642 0.4092 0.4919 0.6284 0.7029 0.7195 0.7195 0.7195 0.7202 0.729 0.7355 0.7319 0.729 0.7195 0.7195 0.7195 0.714 0.6628 0.5803 0.4463 0.38 0.3583 0.3583 0.3371 0.3069 0.2797
0.3674 0.3975 0.4537 0.5103 0.5781 0.6299 0.6527 0.6658 0.6735 0.6732 0.6714 0.6542 0.6277 0.6018 0.5389 0.4682 0.4193 0.3723 0.3583 0.3583 0.3576 0.3406 0.3583 0.3583 0.4092 0.5088 0.6423 0.7047 0.7195 0.7195 0.7282 0.7486 0.7639 0.7731 0.7765 0.7772 0.7673 0.7566 0.7392 0.7195 0.7195 0.7185 0.6805 0.5808 0.4404 0.3769 0.3583 0.3583 0.3316 0.2986
0.3583 0.3601 0.3834 0.4101 0.4479 0.4875 0.5237 0.546 0.559 0.5559 0.5477 0.5304 0.4941 0.458 0.4248 0.3888 0.3593 0.3583 0.3583 0.3509 0.331 0.3561 0.3583 0.3922 0.4776 0.6198 0.6976 0.7195 0.7195 0.7428 0.7646 0.788 0.8064 0.8149 0.8229 0.822 0.812 0.7976 0.7792 0.7559 0.7299 0.7195 0.7195 0.674 0.5539 0.4235 0.3632 0.3583 0.3451 0.3103
0.3531 0.3583 0.3583 0.3583 0.3692 0.3912 0.4049 0.4173 0.4281 0.4281 0.4201 0.412 0.3931 0.3809 0.3657 0.3583 0.3583 0.3568 0.3414 0.3235 0.3401 0.3583 0.3623 0.4355 0.5746 0.6915 0.7195 0.7195 0.744 0.7775 0.8013 0.8259 0.8433 0.8547 0.8608 0.858 0.8497 0.8367 0.8149 0.7886 0.761 0.7312 0.7195 0.7195 0.6452 0.4946 0.3974 0.3583 0.3583 0.3253
0.3243 0.3386 0.3524 0.3583 0.3583 0.3583 0.3583 0.3592 0.3601 0.3601 0.3583 0.3583 0.3583 0.3583 0.3583 0.3576 0.3414 0.3304 0.3133 0.3209 0.3554 0.3583 0.3977 0.4929 0.6526 0.7185 0.7195 0.7401 0.7746 0.8079 0.8333 0.8565 0.8767 0.892 0.8949 0.8949 0.8833 0.8698 0.8476 0.8232 0.7907 0.7588 0.7231 0.7195 0.6978 0.5883 0.4255 0.3721 0.3583 0.34
0.2966 0.3135 0.3234 0.3341 0.3502 0.3525 0.3576 0.3583 0.3583 0.3583 0.3583 0.3576 0.3524 0.3472 0.3372 0.3261 0.3139 0.302 0.2971 0.3282 0.3583 0.3602 0.4224 0.5722 0.6854 0.7195 0.7247 0.7665 0.7998 0.8338 0.8655 0.8869 0.8986 0.9 0.9 0.8985 0.8985 0.8986 0.8768 0.8486 0.8174 0.7853 0.7499 0.7195 0.7175 0.6456 0.4809 0.3866 0.3583 0.3497
0.2688 0.2855 0.2933 0.3005 0.3121 0.3183 0.3242 0.3274 0.3294 0.3295 0.3294 0.3255 0.322 0.3139 0.3077 0.2979 0.2872 0.2749 0.3001 0.3356 0.3583 0.3724 0.4661 0.6219 0.7093 0.7195 0.7443 0.7864 0.8256 0.8584 0.8912 0.8978 0.8983 0.8992 0.9 0.9 0.8992 0.8976 0.8993 0.8739 0.8418 0.805 0.7663 0.7268 0.7195 0.6779 0.5445 0.4113 0.3583 0.3575
0.2427 0.2561 0.2666 0.2758 0.2833 0.2889 0.2913 0.2964 0.2981 0.2988 0.2984 0.2945 0.2906 0.2859 0.2789 0.2716 0.2622 0.2775 0.3081 0.3446 0.3583 0.3873 0.4966 0.6472 0.7195 0.7195 0.7559 0.802 0.8399 0.8747 0.9 0.9 0.8992 0.9 0.9 0.9 0.9 0.9 0.9 0.8921 0.8598 0.8213 0.785 0.739 0.7195 0.6966 0.5836 0.4318 0.3648 0.3583
0.2337 0.2446 0.2443 0.2513 0.2563 0.2648 0.2673 0.2647 0.2669 0.2676 0.2665 0.2647 0.2651 0.2612 0.2532 0.2457 0.2507 0.2772 0.3096 0.3461 0.3583 0.3989 0.52 0.6646 0.7195 0.7283 0.7664 0.812 0.8529 0.8848 0.9 0.8983 0.9 0.9 0.9 0.9 0.9 0.9 0.8992 0.9 0.8692 0.8338 0.7949 0.7512 0.7195 0.7043 0.6011 0.4433 0.3698 0.3583
0.2323 0.2344 0.2348 0.2319 0.2413 0.2444 0.2458 0.2461 0.2453 0.2453 0.2458 0.244 0.2435 0.2428 0.2338 0.2358 0.2527 0.2785 0.3096 0.3467 0.3591 0.4055 0.52 0.6618 0.7195 0.7304 0.7755 0.8178 0.8591 0.8935 0.8985 0.9 0.9 0.9 0.9 0.9 0.9 0.9 0.8984 0.8971 0.8768 0.8394 0.7992 0.7538 0.7195 0.7076 0.6117 0.4493 0.3698 0.3583
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2358 0.2536 0.2768 0.3112 0.3468 0.3583 0.4006 0.5217 0.6622 0.7195 0.729 0.775 0.8149 0.8575 0.8907 0.8992 0.8976 0.9 0.9 0.9 0.9 0.9 0.9 0.8984 0.9 0.8703 0.8343 0.7949 0.7524 0.7195 0.7076 0.609 0.4472 0.3698 0.3583
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2358 0.2484 0.2793 0.3112 0.3446 0.3583 0.3907 0.5054 0.6554 0.7195 0.7202 0.7657 0.8075 0.8465 0.8811 0.8986 0.8959 0.9 0.9 0.9 0.9 0.9 0.8992 0.8984 0.8979 0.8631 0.827 0.7892 0.7426 0.7195 0.7012 0.5921 0.4329 0.3668 0.3583
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2358 0.2478 0.2724 0.3039 0.3379 0.3583 0.3783 0.4782 0.6326 0.7185 0.7195 0.7522 0.7904 0.8322 0.8658 0.8971 0.9 0.9 0.9 0.9 0.9 0.9 0.8985 0.8979 0.8832 0.8469 0.8141 0.7724 0.7303 0.7195 0.6801 0.5571 0.4181 0.361 0.3575
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2358 0.2452 0.2695 0.302 0.3345 0.3583 0.366 0.4401 0.5958 0.6972 0.7195 0.7334 0.7728 0.8105 0.843 0.8757 0.8978 0.9 0.9 0.9 0.9 0.9 0.8971 0.8896 0.86 0.8263 0.7945 0.7557 0.7195 0.7195 0.6584 0.5038 0.3933 0.3583 0.3513
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2351 0.2444 0.2607 0.2926 0.3245 0.3583 0.3592 0.408 0.5352 0.6679 0.7195 0.7195 0.7519 0.7886 0.8155 0.8469 0.872 0.892 0.8993 0.9 0.9 0.8964 0.8826 0.8594 0.8324 0.8025 0.7704 0.7341 0.7195 0.7055 0.615 0.4523 0.3756 0.3583 0.3444
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2351 0.2406 0.2557 0.282 0.3115 0.3481 0.3583 0.3732 0.453 0.6156 0.7077 0.7195 0.7238 0.7553 0.7892 0.8138 0.8357 0.8573 0.87 0.8737 0.8722 0.8615 0.8474 0.8251 0.8011 0.771 0.7435 0.7195 0.7195 0.6721 0.5248 0.4099 0.3583 0.3583 0.3335
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2324 0.2471 0.2717 0.302 0.3342 0.3583 0.3592 0.4025 0.5079 0.6593 0.7195 0.7195 0.7239 0.756 0.778 0.8013 0.8186 0.8305 0.8357 0.8345 0.8252 0.809 0.7879 0.7677 0.7392 0.7195 0.7195 0.7015 0.588 0.4435 0.3734 0.3583 0.3546 0.3147
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2314 0.2466 0.2593 0.2862 0.3175 0.3488 0.3583 0.3673 0.4274 0.5526 0.6606 0.7195 0.7195 0.7195 0.7385 0.7632 0.777 0.7855 0.7949 0.7923 0.7833 0.7673 0.7526 0.7304 0.7195 0.7195 0.6993 0.625 0.4663 0.3911 0.3583 0.3583 0.3325 0.3022
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2334 0.2309 0.2507 0.2745 0.3003 0.3286 0.3583 0.3583 0.379 0.4407 0.5598 0.6656 0.7153 0.7195 0.7195 0.721 0.7372 0.7459 0.754 0.7501 0.743 0.7284 0.7195 0.7195 0.7195 0.688 0.6253 0.4924 0.4044 0.3602 0.3583 0.345 0.3159 0.2831
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2319 0.2437 0.256 0.2789 0.309 0.3378 0.3583 0.3592 0.3769 0.4322 0.5331 0.635 0.6876 0.7145 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7195 0.7029 0.6646 0.5931 0.4814 0.4003 0.3593 0.3583 0.3539 0.322 0.3005 0.2628
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2358 0.2323 0.2462 0.268 0.2873 0.3141 0.3378 0.3583 0.3583 0.3751 0.4168 0.4827 0.5792 0.6403 0.67 0.6918 0.6956 0.7105 0.7091 0.6941 0.6801 0.6549 0.6086 0.5329 0.4471 0.3919 0.3583 0.3583 0.3576 0.3298 0.3008 0.278 0.2501
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2346 0.2488 0.268 0.2899 0.3142 0.3395 0.3583 0.3583 0.3613 0.3919 0.4319 0.4803 0.5445 0.576 0.5922 0.6048 0.6079 0.5938 0.5634 0.5042 0.4516 0.4071 0.3826 0.3601 0.3583 0.3524 0.3285 0.3037 0.2829 0.2599 0.2361
0.2323 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2415 0.2524 0.268 0.29 0.3142 0.3349 0.3547 0.3583 0.3583 0.3593 0.3906 0.4005 0.4276 0.4381 0.4499 0.4453 0.4313 0.423 0.3976 0.3656 0.3583 0.3583 0.3583 0.3451 0.3226 0.302 0.2826 0.2607 0.2423 0.2252
0.2307 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2344 0.2401 0.2497 0.268 0.2853 0.3069 0.3248 0.3407 0.3568 0.3583 0.3583 0.3583 0.3583 0.3639 0.3639 0.3639 0.3592 0.3583 0.3583 0.3583 0.3576 0.3518 0.3333 0.3143 0.2971 0.2778 0.2588 0.2437 0.2343 0.2252
0.2145 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2185 0.2233 0.2353 0.2612 0.2741 0.2926 0.3089 0.3211 0.3351 0.3457 0.3543 0.3575 0.3583 0.3575 0.3583 0.3575 0.3583 0.3495 0.3402 0.3291 0.3156 0.2996 0.2788 0.2585 0.2443 0.2313 0.2185 0.2185 0.2
`, 50);

  function renderSignalLegend() {
    statusBar.innerHTML = `
      <div class="signal-legend">
        <div class="signal-legend-title">Signal</div>
        <div class="signal-legend-item">
          <span class="signal-legend-icon empty"></span>
          <span class="signal-legend-label">0.0</span>
        </div>
        <div class="signal-legend-item">
          <span class="signal-legend-icon"><img src="./image/signal1.png" alt="Signal level 1"></span>
          <span class="signal-legend-label">&lt; 0.3</span>
        </div>
        <div class="signal-legend-item">
          <span class="signal-legend-icon"><img src="./image/signal2.png" alt="Signal level 2"></span>
          <span class="signal-legend-label">0.3 - 0.4</span>
        </div>
        <div class="signal-legend-item">
          <span class="signal-legend-icon"><img src="./image/signal3.png" alt="Signal level 3"></span>
          <span class="signal-legend-label">0.4 - 0.6</span>
        </div>
        <div class="signal-legend-item">
          <span class="signal-legend-icon"><img src="./image/signal4.png" alt="Signal level 4"></span>
          <span class="signal-legend-label">0.6 - 0.8</span>
        </div>
        <div class="signal-legend-item">
          <span class="signal-legend-icon"><img src="./image/signal5.png" alt="Signal level 5"></span>
          <span class="signal-legend-label">0.8 - 1.0</span>
        </div>
      </div>
    `;
  }

  function populateMissionOptions() {
    if (!solutionDropdown) {
      return;
    }

    const selectedValue = document.body.dataset.solution || solutionDropdown.value || '1';
    solutionDropdown.innerHTML = missionOptions
      .map(option => `<option value="${option.value}">${option.label}</option>`)
      .join('');
    solutionDropdown.value = selectedValue;
  }

  renderSignalLegend();
  populateMissionOptions();

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  const xAxis = document.createElement('div');
  xAxis.id = 'x-axis';
  const yAxis = document.createElement('div');
  yAxis.id = 'y-axis';
  const utilitySidebar = document.createElement('div');
  utilitySidebar.className = 'utility-sidebar';

  container.appendChild(clickableBox);
  container.appendChild(xAxis);
  container.appendChild(yAxis);
  const interactivePanel = document.querySelector('.interactive-panel');
  const controlPanel = interactivePanel.querySelector('.game-control-panel');
  interactivePanel.prepend(container);
  utilitySidebar.appendChild(statusBar);
  if (controlPanel) {
    utilitySidebar.appendChild(controlPanel);
  }
  interactivePanel.appendChild(utilitySidebar);

  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  document.body.appendChild(tooltip);

  const completionModal = document.createElement('div');
  completionModal.className = 'completion-modal';
  completionModal.innerHTML = `
    <div class="completion-card">
      <button class="completion-close" type="button" aria-label="Close completion message">x</button>
      <img class="completion-image" src="./image/full kuro.png" alt="Mission complete cat">
      <h2 id="completion-title">Mission Complete!</h2>
      <p id="completion-message"></p>
    </div>
  `;
  document.body.appendChild(completionModal);

  const completionTitle = document.getElementById('completion-title');
  const completionMessage = document.getElementById('completion-message');
  const completionClose = completionModal.querySelector('.completion-close');
  const completionImage = completionModal.querySelector('.completion-image');
  const tutorialKey = document.body.dataset.tutorial || '';

  function getTutorialMarkup(key) {
    if (key === 'place-cat') {
      return `
        <div class="tutorial-card">
          <div class="tutorial-title-row">
            <div class="tutorial-badge">How To Play</div>
            <h2>Put A Cat On The Map</h2>
          </div>
          <p class="tutorial-caption">Tap one tile, then watch nearby fish get eaten.</p>
          <div class="tutorial-scene-grid">
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">1. Find a fish tile</div>
              <div class="tutorial-mini-board">
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
              </div>
            </div>
            <div class="tutorial-arrow" aria-hidden="true">&rarr;</div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">2. Tap one square</div>
              <div class="tutorial-mini-board is-tap-board">
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell is-target">
                  <span class="tutorial-tap-ring"></span>
                  <img src="./image/fish.png" alt="">
                </div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish.png" alt=""></div>
              </div>
            </div>
            <div class="tutorial-arrow" aria-hidden="true">&rarr;</div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">3. The cat eats nearby fish</div>
              <div class="tutorial-mini-board is-result-board">
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell is-cat-cell"><img src="./image/kuro.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
                <div class="tutorial-mini-cell"><img src="./image/fish-bone.png" alt=""></div>
              </div>
            </div>
          </div>
          <button class="tutorial-ok-button" type="button">OK!</button>
        </div>
      `;
    }

    if (key === 'wall-block') {
      return `
        <div class="tutorial-card tutorial-wall-card">
          <div class="tutorial-title-row">
            <div class="tutorial-badge">Wall Lesson</div>
            <h2>Walls Stop Cats</h2>
          </div>
          <p class="tutorial-caption">If a wall is in the way, the cat cannot see or eat that fish.</p>
          <div class="tutorial-wall-grid tutorial-wall-lesson-grid">
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">No wall</div>
              <img class="tutorial-reference-image" src="./image/tutorial-wall-open.png?v=2" alt="No wall tutorial example">
            </div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">With wall</div>
              <img class="tutorial-reference-image" src="./image/tutorial-wall-blocked.png?v=2" alt="Wall tutorial example">
            </div>
          </div>
          <button class="tutorial-ok-button" type="button">OK!</button>
        </div>
      `;
    }

    if (key === 'threshold-zones') {
      return `
        <div class="tutorial-card tutorial-threshold-card">
          <div class="tutorial-title-row">
            <div class="tutorial-badge">Color Lesson</div>
            <h2>Red Fish Need Help</h2>
          </div>
          <p class="tutorial-caption">Red fish are harder. A cat must be closer, or more cats can help.</p>
          <div class="tutorial-threshold-grid">
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">1. Red fish are harder</div>
              <img class="tutorial-reference-image tutorial-threshold-image" src="./image/3-1.png?v=1" alt="Red fish need stronger coverage">
            </div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">2. Too far away</div>
              <img class="tutorial-reference-image tutorial-threshold-image" src="./image/3-2.png?v=1" alt="Cat is too far from the red fish">
            </div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">3. Move closer</div>
              <img class="tutorial-reference-image tutorial-threshold-image" src="./image/3-3.png?v=1" alt="Cat moves closer to cover red fish">
            </div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">4. Add more cats</div>
              <img class="tutorial-reference-image tutorial-threshold-image" src="./image/3-4.png?v=1" alt="More cats help cover red fish">
            </div>
          </div>
          <button class="tutorial-ok-button" type="button">OK!</button>
        </div>
      `;
    }

    if (key === 'relay-link') {
      return `
        <div class="tutorial-card tutorial-relay-card">
          <div class="tutorial-title-row">
            <div class="tutorial-badge">Pills Lesson</div>
            <h2>Link Or No Link</h2>
          </div>
          <p class="tutorial-caption">No link: the cat stays gray. Link: the cat can eat fish.</p>
          <div class="tutorial-wall-grid tutorial-relay-grid">
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">No link</div>
              <img class="tutorial-reference-image tutorial-flow-image tutorial-relay-image" src="./image/tutorial-relay-disconnected.png?v=1" alt="Disconnected cat example">
            </div>
            <div class="tutorial-scene-card">
              <div class="tutorial-scene-label">Link to pills</div>
              <img class="tutorial-reference-image tutorial-flow-image tutorial-relay-image" src="./image/tutorial-relay-connected.png?v=1" alt="Connected cat example">
            </div>
          </div>
          <button class="tutorial-ok-button" type="button">OK!</button>
        </div>
      `;
    }

    return '';
  }

  const tutorialMarkup = getTutorialMarkup(tutorialKey);
  let tutorialModal = null;
  let tutorialOkButton = null;
  if (tutorialMarkup) {
    tutorialModal = document.createElement('div');
    tutorialModal.className = 'tutorial-modal show';
    tutorialModal.innerHTML = tutorialMarkup;
    document.body.appendChild(tutorialModal);
    tutorialOkButton = tutorialModal.querySelector('.tutorial-ok-button');
  }

  function readSkinPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(skinStorageKey) || '{}');
      return {
        fish: fishSkinAssets[saved.fish] ? saved.fish : 'classic',
        cat: catSkinAssets[saved.cat] ? saved.cat : 'kuro'
      };
    } catch (error) {
      return { fish: 'classic', cat: 'kuro' };
    }
  }

  function getCatSkin() {
    return catSkinAssets[skinPreferences.cat] || catSkinAssets.kuro;
  }

  function getFishSkin() {
    return fishSkinAssets[skinPreferences.fish] || fishSkinAssets.classic;
  }

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
    const sensorIcon = labelBoxes[0]?.querySelector('.sensor-box');
    const fishIcon = labelBoxes[1]?.querySelector('.dissatisfy-box');

    if (labelBoxes[0]) {
      labelBoxes[0].lastChild.textContent = isGameMode ? ' : Cat' : ' : Sensor';
    }
    if (labelBoxes[1]) {
      labelBoxes[1].lastChild.textContent = isGameMode ? ' : Fish' : ' : Weak Zone';
    }
    if (sensorIcon) {
      sensorIcon.style.backgroundImage = isGameMode
        ? `url("${getCatSkin().map}")`
        : 'url("./image/signal.svg")';
    }
    if (fishIcon) {
      fishIcon.style.backgroundImage = isGameMode
        ? `url("${getFishSkin().idle}")`
        : '';
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

  function syncActionButtonLabels() {
    [thresholdBtn, undoBtn, saveMapBtn].forEach(button => {
      if (!button) {
        return;
      }
      button.textContent = button.title || button.getAttribute('aria-label') || button.textContent;
    });
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

  function clearCrunchAudioPlayback() {
    crunchAudioTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    crunchAudioTimeouts = [];

    activeCrunchAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeCrunchAudios = [];
  }

  function clearFishAnimations() {
    fishAnimationTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    fishAnimationTimeouts = [];
    clearCrunchAudioPlayback();

    const entities = clickableBox.querySelectorAll('.cell-entity.eating');
    entities.forEach(entity => entity.classList.remove('eating'));
  }

  function getCrunchAudioTemplate() {
    if (typeof Audio === 'undefined') {
      return null;
    }

    if (!crunchAudioTemplate) {
      crunchAudioTemplate = new Audio(chipCrunchAudioPath);
      crunchAudioTemplate.preload = 'auto';
      crunchAudioTemplate.load();
    }

    return crunchAudioTemplate;
  }

  function getIceAudioTemplate() {
    if (typeof Audio === 'undefined') {
      return null;
    }

    if (!iceAudioTemplate) {
      iceAudioTemplate = new Audio(iceMakeAudioPath);
      iceAudioTemplate.preload = 'auto';
      iceAudioTemplate.load();
    }

    return iceAudioTemplate;
  }

  function getFireAudioTemplate() {
    if (typeof Audio === 'undefined') {
      return null;
    }

    if (!fireAudioTemplate) {
      fireAudioTemplate = new Audio(fireSoundAudioPath);
      fireAudioTemplate.preload = 'auto';
      fireAudioTemplate.load();
    }

    return fireAudioTemplate;
  }

  function removeTrackedCrunchAudio(audio) {
    activeCrunchAudios = activeCrunchAudios.filter(item => item !== audio);
  }

  function getAudioContext() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return null;
    }

    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    return audioContext;
  }

  function scheduleCrunchBurst(ctx, startTime, duration, intensity = 1, brightness = 1) {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const fade = Math.pow(1 - progress, 2.8);
      const crispNoise = (Math.random() * 2 - 1) * 0.46 * fade;
      const crackle = (Math.random() > 0.68 ? (Math.random() * 2 - 1) * 2.2 : 0) * fade;
      const splinter = (Math.random() > 0.88 ? (Math.random() * 2 - 1) * 2.9 : 0) * fade;
      const shard = (Math.random() > 0.965 ? (Math.random() * 2 - 1) * 3.4 : 0) * fade;
      channelData[i] = crispNoise + crackle + splinter + shard;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime((2800 + Math.random() * 1700) * brightness, startTime);
    bandpass.Q.setValueAtTime(6.8, startTime);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1800, startTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(8600, startTime);

    const transientBoost = ctx.createBiquadFilter();
    transientBoost.type = 'peaking';
    transientBoost.frequency.setValueAtTime(3600 * brightness, startTime);
    transientBoost.Q.setValueAtTime(2.2, startTime);
    transientBoost.gain.setValueAtTime(10, startTime);

    const crunchSnap = ctx.createBiquadFilter();
    crunchSnap.type = 'peaking';
    crunchSnap.frequency.setValueAtTime(5400 * brightness, startTime);
    crunchSnap.Q.setValueAtTime(3.2, startTime);
    crunchSnap.gain.setValueAtTime(8, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18 * intensity, startTime + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(transientBoost);
    transientBoost.connect(crunchSnap);
    crunchSnap.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);
  }

  function playSyntheticCrunchSequence(durationMs = 2000) {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    const startTime = ctx.currentTime + 0.02;
    const totalDuration = durationMs / 1000;
    const clusters = [
      { at: 0.00, offsets: [0.00, 0.035, 0.075], intensity: 1.08, brightness: 1.06 },
      { at: 0.34, offsets: [0.00, 0.03, 0.065, 0.11], intensity: 1.14, brightness: 1.12 },
      { at: 0.78, offsets: [0.00, 0.04, 0.082], intensity: 1.02, brightness: 1.04 },
      { at: 1.14, offsets: [0.00, 0.028, 0.058, 0.09, 0.13], intensity: 1.2, brightness: 1.16 },
      { at: 1.60, offsets: [0.00, 0.036, 0.072, 0.11], intensity: 1.1, brightness: 1.08 }
    ];

    clusters.forEach(cluster => {
      cluster.offsets.forEach((offset, index) => {
        const burstStart = startTime + Math.min(totalDuration - 0.04, cluster.at + offset);
        const burstDuration = 0.018 + index * 0.007;
        const intensity = cluster.intensity * (1 + index * 0.08);
        const brightness = cluster.brightness + index * 0.06;
        scheduleCrunchBurst(ctx, burstStart, burstDuration, intensity, brightness);
      });
    });
  }

  function playFireCrackleBurst(ctx, startTime, duration = 0.09, intensity = 1) {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const ember = (Math.random() * 2 - 1) * 0.4;
      const spark = Math.random() > 0.93 ? (Math.random() * 2 - 1) * 2.6 : 0;
      const fade = Math.pow(1 - progress, 1.7);
      channelData[i] = (ember + spark) * fade;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(450, startTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3600 + Math.random() * 1200, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.11 * intensity, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(startTime);
    source.stop(startTime + duration);
  }

  function playFireSequence(durationMs = 2000) {
    const template = getFireAudioTemplate();
    const clipDurationMs = Math.min(2200, Math.max(900, durationMs));

    if (template) {
      const fireAudio = template.cloneNode(true);
      fireAudio.preload = 'auto';
      fireAudio.currentTime = 0;
      fireAudio.volume = 0.82;
      fireAudio.playbackRate = 1;
      activeCrunchAudios.push(fireAudio);

      const playPromise = fireAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          fireAudio.pause();
          fireAudio.currentTime = 0;
          removeTrackedCrunchAudio(fireAudio);
          playSyntheticFireSequence(durationMs);
        });
      }

      const fadeStartMs = Math.max(0, clipDurationMs - 360);
      const fadeTimeoutId = window.setTimeout(() => {
        const startVolume = fireAudio.volume;
        const fadeSteps = 6;

        for (let i = 0; i < fadeSteps; i++) {
          const stepTimeoutId = window.setTimeout(() => {
            fireAudio.volume = Math.max(0, startVolume * (1 - (i + 1) / fadeSteps));
          }, i * 55);
          crunchAudioTimeouts.push(stepTimeoutId);
        }
      }, fadeStartMs);
      crunchAudioTimeouts.push(fadeTimeoutId);

      const stopTimeoutId = window.setTimeout(() => {
        fireAudio.pause();
        fireAudio.currentTime = 0;
        removeTrackedCrunchAudio(fireAudio);
      }, clipDurationMs);
      crunchAudioTimeouts.push(stopTimeoutId);
      return;
    }

    playSyntheticFireSequence(durationMs);
  }

  function playSyntheticFireSequence(durationMs = 2000) {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    const burstCount = Math.max(8, Math.floor(durationMs / 110));
    for (let i = 0; i < burstCount; i++) {
      const timeoutId = window.setTimeout(() => {
        playFireCrackleBurst(ctx, ctx.currentTime + 0.01, 0.08 + Math.random() * 0.08, 0.82 + Math.random() * 0.55);
      }, i * 105 + Math.random() * 40);
      crunchAudioTimeouts.push(timeoutId);
    }
  }

  function playIceSparkle(ctx, startTime, duration = 0.12, intensity = 1) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const shimmer = ctx.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1300 + Math.random() * 500, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(2600 + Math.random() * 700, startTime + duration);

    shimmer.type = 'highpass';
    shimmer.frequency.setValueAtTime(900, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.06 * intensity, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(shimmer);
    shimmer.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  function playIceFreezeSweep(ctx, startTime, duration = 1.1) {
    const oscillator = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(1720, startTime + duration);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(1040, startTime + 0.04);
    overtone.frequency.exponentialRampToValueAtTime(3440, startTime + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, startTime);
    filter.frequency.exponentialRampToValueAtTime(4200, startTime + duration);
    filter.Q.setValueAtTime(5.5, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.045, startTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.018, startTime + duration * 0.72);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(filter);
    overtone.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    overtone.start(startTime + 0.04);
    oscillator.stop(startTime + duration);
    overtone.stop(startTime + duration);
  }

  function playSyntheticIceSequence(durationMs = 2000) {
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    playIceFreezeSweep(ctx, ctx.currentTime + 0.04, 1.0);

    [80, 300, 560, 900, 1240, 1580].forEach((time, index) => {
      const timeoutId = window.setTimeout(() => {
        playIceSparkle(ctx, ctx.currentTime + 0.01, 0.08 + index * 0.01, 0.72 + index * 0.06);
      }, Math.min(durationMs - 120, time));
      crunchAudioTimeouts.push(timeoutId);
    });
  }

  function playIceSequence(durationMs = 2000) {
    const template = getIceAudioTemplate();
    if (!template) {
      playSyntheticIceSequence(durationMs);
      return;
    }

    const iceAudio = template.cloneNode(true);
    const clipDurationMs = Math.min(2300, Math.max(900, durationMs));

    iceAudio.preload = 'auto';
    iceAudio.volume = 0.78;
    iceAudio.playbackRate = 1;
    iceAudio.currentTime = 0;
    activeCrunchAudios.push(iceAudio);

    const playPromise = iceAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        iceAudio.pause();
        iceAudio.currentTime = 0;
        removeTrackedCrunchAudio(iceAudio);
        playSyntheticIceSequence(durationMs);
      });
    }

    const fadeStartMs = Math.max(0, clipDurationMs - 360);
    const fadeTimeoutId = window.setTimeout(() => {
      const fadeSteps = 6;
      const startVolume = iceAudio.volume;

      for (let i = 0; i < fadeSteps; i++) {
        const stepTimeoutId = window.setTimeout(() => {
          iceAudio.volume = Math.max(0, startVolume * (1 - (i + 1) / fadeSteps));
        }, i * 55);
        crunchAudioTimeouts.push(stepTimeoutId);
      }
    }, fadeStartMs);
    crunchAudioTimeouts.push(fadeTimeoutId);

    const stopTimeoutId = window.setTimeout(() => {
      iceAudio.pause();
      iceAudio.currentTime = 0;
      removeTrackedCrunchAudio(iceAudio);
    }, clipDurationMs);
    crunchAudioTimeouts.push(stopTimeoutId);
  }

  function scheduleCrunchAudioBite(startAtMs, options = {}, onFailure = null) {
    const template = getCrunchAudioTemplate();
    if (!template) {
      onFailure?.();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const biteAudio = template.cloneNode(true);
      biteAudio.preload = 'auto';
      biteAudio.volume = options.volume ?? 1;
      biteAudio.playbackRate = options.playbackRate ?? 1;
      biteAudio.currentTime = 0;

      activeCrunchAudios.push(biteAudio);

      const playPromise = biteAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          biteAudio.pause();
          biteAudio.currentTime = 0;
          removeTrackedCrunchAudio(biteAudio);
          onFailure?.();
        });
      }

      const stopTimeoutId = window.setTimeout(() => {
        biteAudio.pause();
        biteAudio.currentTime = 0;
        removeTrackedCrunchAudio(biteAudio);
      }, options.durationMs ?? 190);
      crunchAudioTimeouts.push(stopTimeoutId);
    }, startAtMs);

    crunchAudioTimeouts.push(timeoutId);
  }

  function playCrunchSequence(durationMs = 2000) {
    const biteMoments = [
      { at: 0, volume: 0.96, playbackRate: 1.02, durationMs: 190 },
      { at: 350, volume: 1, playbackRate: 1.05, durationMs: 190 },
      { at: 800, volume: 0.98, playbackRate: 1.01, durationMs: 200 },
      { at: 1250, volume: 1, playbackRate: 1.04, durationMs: 205 },
      { at: Math.min(durationMs - 220, 1660), volume: 0.88, playbackRate: 1.08, durationMs: 165 }
    ];

    let hasFallenBackToSynth = false;
    const handleAudioFailure = function () {
      if (hasFallenBackToSynth) {
        return;
      }
      hasFallenBackToSynth = true;
      clearCrunchAudioPlayback();
      playSyntheticCrunchSequence(durationMs);
    };

    biteMoments.forEach((bite, index) => {
      scheduleCrunchAudioBite(bite.at, bite, index === 0 ? handleAudioFailure : null);
    });
  }

  function playEatSoundSequence(durationMs = 2000) {
    if (getFishSkin().sound === 'fire') {
      playFireSequence(durationMs);
      return;
    }

    if (getFishSkin().sound === 'ice') {
      playIceSequence(durationMs);
      return;
    }

    playCrunchSequence(durationMs);
  }

  function runFishEatAnimation(entityLayer) {
    if (!entityLayer) {
      return;
    }

    const fishSkin = getFishSkin();
    const frames = fishSkin.frames;

    entityLayer.classList.add('eating');
    entityLayer.src = fishSkin.idle;
    entityLayer.style.display = 'block';
    entityLayer.style.padding = '11%';
    entityLayer.style.boxSizing = 'border-box';

    frames.forEach(frame => {
      const timeoutId = window.setTimeout(() => {
        entityLayer.src = frame.src;
        if (frame.isFinal) {
          entityLayer.classList.remove('eating');
          entityLayer.style.padding = '12%';
        }
      }, frame.at);
      fishAnimationTimeouts.push(timeoutId);
    });
  }

  function showCompletionModal() {
    if (hasShownCompletionModal) {
      return;
    }

    hasShownCompletionModal = true;
    if (completionImage) {
      completionImage.src = isGameMode ? getCatSkin().full : './image/signal.svg';
      completionImage.alt = isGameMode ? 'Mission complete cat' : 'Mission complete signal';
    }
    if (completionTitle) {
      completionTitle.textContent = isGameMode ? 'Purrfect! Tummies are full!' : 'Mission Complete!';
    }
    if (completionMessage) {
      completionMessage.textContent = isGameMode
        ? `${sensorCount} ${sensorCount === 1 ? 'cat' : 'cats'} ate all the fish!`
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

  function updateConnectModeForLevel(level = getSelectedLevel()) {
    isConnectMode = isRelayChallengeLevel(level);
    if (!isConnectMode) {
      clearConnections();
    }
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

  function getRelayNodesForLevel(level = getSelectedLevel()) {
    return relayMaps[level] || [];
  }

  function isRelayChallengeLevel(level = getSelectedLevel()) {
    return (level >= 14 && level <= 16) || level === 19;
  }

  function getConnectDistanceForLevel(level = getSelectedLevel()) {
    return relayConnectDistances[level] || defaultConnectDistance;
  }

  function isRelayNode(x, y, level = getSelectedLevel()) {
    return getRelayNodesForLevel(level).some(node => node.x === x && node.y === y);
  }

  function getThresholdMapForLevel(level) {
    return thresholdMaps[level] || null;
  }

  function getThresholdForCell(x, y, level = getSelectedLevel()) {
    const thresholdMap = getThresholdMapForLevel(level);
    return thresholdMap?.[y]?.[x] ?? defaultThreshold;
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

  function buildConnectivityData(sensorList, level = getSelectedLevel()) {
    const relayNodes = getRelayNodesForLevel(level).map((node, index) => ({
      ...node,
      key: `relay-${index}`,
      kind: 'relay'
    }));
    const sensorNodes = sensorList.map(sensor => ({
      ...sensor,
      key: `${sensor.x},${sensor.y}`,
      kind: 'sensor'
    }));
    const allNodes = [...relayNodes, ...sensorNodes];
    const adjacency = new Map();
    const edges = [];

    allNodes.forEach(node => adjacency.set(node.key, []));

    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const nodeA = allNodes[i];
        const nodeB = allNodes[j];
        const distance = Math.sqrt(
          Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2)
        );

        if (distance <= getConnectDistanceForLevel(level) && hasLineOfSight(nodeA, nodeB.x, nodeB.y)) {
          adjacency.get(nodeA.key).push(nodeB.key);
          adjacency.get(nodeB.key).push(nodeA.key);
          edges.push({ from: nodeA, to: nodeB });
        }
      }
    }

    const visited = new Set();
    const queue = relayNodes.map(node => node.key);

    if (relayNodes.length === 0) {
      sensorNodes.forEach(node => visited.add(node.key));
    } else {
      queue.forEach(key => visited.add(key));
      while (queue.length > 0) {
        const currentKey = queue.shift();
        const neighbors = adjacency.get(currentKey) || [];
        neighbors.forEach(neighborKey => {
          if (!visited.has(neighborKey)) {
            visited.add(neighborKey);
            queue.push(neighborKey);
          }
        });
      }
    }

    return {
      relayNodes,
      edges,
      activeSensorKeys: new Set(sensorNodes.filter(node => visited.has(node.key)).map(node => node.key)),
      activeNodeKeys: visited
    };
  }

  function connectSensors() {
    clearConnections();

    const cellSize = clickableBox.offsetWidth / gridSize;
    const connectivityData = buildConnectivityData(sensors);

    connectivityData.edges.forEach(edge => {
      const line = document.createElement('div');
      line.classList.add('connection-line');

      const isActiveEdge = connectivityData.activeNodeKeys.has(edge.from.key) &&
        connectivityData.activeNodeKeys.has(edge.to.key);

      if (isGameMode) {
        line.classList.add(isActiveEdge ? 'game-connection-line' : 'inactive-connection-line');
      } else if (!isActiveEdge) {
        line.classList.add('inactive-connection-line');
      }

      const startX = (edge.from.x + 0.5) * cellSize;
      const startY = (edge.from.y + 0.5) * cellSize;
      const endX = (edge.to.x + 0.5) * cellSize;
      const endY = (edge.to.y + 0.5) * cellSize;
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

  function hasVariableThresholdMap(level = getSelectedLevel()) {
    return Array.isArray(getThresholdMapForLevel(level));
  }

  function getGameTerrainColorFromThreshold(cellThreshold, isSatisfied) {
    if (isSatisfied) {
      if (cellThreshold >= 0.55) {
        return '#7edc7d';
      }
      if (cellThreshold >= 0.42) {
        return '#9ae27f';
      }
      if (cellThreshold >= 0.3) {
        return '#b9ea86';
      }
      return '#d6f1a0';
    }

    if (cellThreshold >= 0.55) {
      return '#ff8da1';
    }
    if (cellThreshold >= 0.42) {
      return '#ffb16d';
    }
    if (cellThreshold >= 0.3) {
      return '#ffd86f';
    }
    return '#fff1a8';
  }

  function getProfessionalSignalImage(probability) {
    if (probability <= 0) {
      return '';
    }
    if (probability < 0.3) {
      return './image/signal1.png';
    }
    if (probability < 0.4) {
      return './image/signal2.png';
    }
    if (probability < 0.6) {
      return './image/signal3.png';
    }
    if (probability < 0.8) {
      return './image/signal4.png';
    }
    return './image/signal5.png';
  }

  function getProfessionalThresholdColor(cellThreshold) {
    const colorStops = [
      { stop: 0.2, r: 180, g: 156, b: 245 },
      { stop: 0.3, r: 136, g: 162, b: 245 },
      { stop: 0.4, r: 123, g: 197, b: 243 },
      { stop: 0.5, r: 122, g: 223, b: 203 },
      { stop: 0.6, r: 156, g: 231, b: 120 },
      { stop: 0.7, r: 201, g: 241, b: 117 },
      { stop: 0.8, r: 247, g: 227, b: 118 },
      { stop: 0.86, r: 251, g: 187, b: 92 },
      { stop: 0.93, r: 250, g: 128, b: 92 },
      { stop: 1.0, r: 243, g: 88, b: 112 }
    ];

    if (cellThreshold <= colorStops[0].stop) {
      return `rgb(${colorStops[0].r}, ${colorStops[0].g}, ${colorStops[0].b})`;
    }

    for (let i = 0; i < colorStops.length - 1; i++) {
      const start = colorStops[i];
      const end = colorStops[i + 1];
      if (cellThreshold >= start.stop && cellThreshold <= end.stop) {
        const ratio = (cellThreshold - start.stop) / (end.stop - start.stop);
        const r = Math.round(start.r + ratio * (end.r - start.r));
        const g = Math.round(start.g + ratio * (end.g - start.g));
        const b = Math.round(start.b + ratio * (end.b - start.b));
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    const lastStop = colorStops[colorStops.length - 1];
    return `rgb(${lastStop.r}, ${lastStop.g}, ${lastStop.b})`;
  }

  function calculateCompletionRate(grid) {
    const cells = Array.from(grid.childNodes).filter(cell => cell.classList.contains('grid-cell'));
    const playableCells = cells.filter(cell => !cell.classList.contains('wall') && !cell.classList.contains('relay-node'));
    if (playableCells.length === 0) {
      return '0.00';
    }
    const satisfied = playableCells.filter(cell => !cell.classList.contains('dissatisfy')).length;
    return ((satisfied / playableCells.length) * 100).toFixed(2);
  }

  function applyProbabilitiesToGrid(probabilities, grid) {
    const cells = Array.from(grid.childNodes).filter(cell => cell.classList.contains('grid-cell'));
    const shouldAnimateFish = isGameMode && shouldAnimateFishOnNextUpdate;
    let animatedFishCount = 0;

    clearFishAnimations();

    cells.forEach((cell, index) => {
      const entityLayer = cell.querySelector('.cell-entity');
      const relayBadge = cell.querySelector('.relay-distance-badge');
      const wasDissatisfied = cell.classList.contains('dissatisfy');
      const setEntityImage = function (src, size = '100%') {
        if (!entityLayer) {
          return;
        }
        entityLayer.src = src || '';
        entityLayer.style.display = src ? 'block' : 'none';
        entityLayer.style.padding = src ? `calc((100% - ${size}) / 2)` : '0';
        entityLayer.style.boxSizing = 'border-box';
      };
      const setRelayBadge = function (label = '') {
        if (!relayBadge) {
          return;
        }
        relayBadge.textContent = label;
        relayBadge.style.display = label ? 'flex' : 'none';
      };

      if (cell.classList.contains('wall')) {
        cell.style.backgroundColor = '#d9d4c7';
        cell.style.backgroundImage = 'url("./image/wall.png")';
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundPosition = 'center';
        cell.style.backgroundRepeat = 'no-repeat';
        setEntityImage('');
        setRelayBadge('');
        cell.classList.remove('dissatisfy');
        cell.classList.remove('inactive-sensor');
        return;
      }

      if (cell.classList.contains('relay-node')) {
        cell.style.backgroundColor = isGameMode ? '#fff4cf' : '#edf5ff';
        cell.style.backgroundImage = '';
        cell.style.backgroundSize = '';
        cell.style.backgroundPosition = '';
        cell.style.backgroundRepeat = '';
        setEntityImage(isGameMode ? './image/pills.png' : './image/sensor.png', '72%');
        setRelayBadge(String(getConnectDistanceForLevel()));
        cell.classList.remove('dissatisfy');
        cell.classList.remove('inactive-sensor');
        return;
      }

      if (cell.classList.contains('sensor')) {
        const sensorKey = `${index % gridSize},${Math.floor(index / gridSize)}`;
        const isActiveSensor = activeSensorKeys.has(sensorKey);

        cell.style.backgroundColor = isActiveSensor
          ? (isGameMode ? '#fff7d7' : '#ffe2ea')
          : '#d7dbe3';
        cell.style.backgroundImage = '';
        cell.style.backgroundSize = '';
        cell.style.backgroundPosition = '';
        cell.style.backgroundRepeat = '';
        setEntityImage(isGameMode ? getCatSkin().map : './image/signal.svg', '100%');
        setRelayBadge('');
        cell.classList.remove('dissatisfy');
        cell.classList.toggle('inactive-sensor', !isActiveSensor);
        return;
      }

      const probability = probabilities[index] || 0;
      const cellThreshold = parseFloat(cell.dataset.threshold || defaultThreshold);
      const isSatisfied = probability > cellThreshold;
      const activeColor = getColorFromProbability(probability);
      const variableThresholdTerrainColor = getGameTerrainColorFromThreshold(cellThreshold, isSatisfied);
      const gameCellColor = isThresholdMode
        ? getGameColorFromProbability(probability)
        : hasVariableThresholdMap()
          ? variableThresholdTerrainColor
          : isSatisfied
            ? '#b8f28f'
            : '#ffd6e5';

      if (isSatisfied) {
        if (isGameMode) {
          cell.style.backgroundColor = gameCellColor;
          cell.style.backgroundImage = '';
          cell.style.backgroundSize = '';
          cell.style.backgroundPosition = '';
          cell.style.backgroundRepeat = '';
          if (shouldAnimateFish && wasDissatisfied) {
            runFishEatAnimation(entityLayer);
            animatedFishCount++;
          } else {
            setEntityImage(getFishSkin().eaten, '76%');
          }
          setRelayBadge('');
        } else {
          const signalImage = getProfessionalSignalImage(probability);
          cell.style.backgroundColor = hasVariableThresholdMap()
            ? getProfessionalThresholdColor(cellThreshold)
            : '#eef5fb';
          cell.style.backgroundImage = '';
          cell.style.backgroundSize = '';
          cell.style.backgroundPosition = '';
          cell.style.backgroundRepeat = '';
          setEntityImage(signalImage, signalImage ? '74%' : '100%');
          setRelayBadge('');
        }
        cell.classList.remove('dissatisfy');
        cell.classList.remove('inactive-sensor');
      } else {
        if (isGameMode) {
          cell.style.backgroundColor = gameCellColor;
          cell.style.backgroundImage = '';
          cell.style.backgroundSize = '';
          cell.style.backgroundPosition = '';
          cell.style.backgroundRepeat = '';
          setEntityImage(getFishSkin().idle, '78%');
          setRelayBadge('');
        } else {
          const signalImage = getProfessionalSignalImage(probability);
          cell.style.backgroundColor = hasVariableThresholdMap()
            ? getProfessionalThresholdColor(cellThreshold)
            : '#f8fbff';
          cell.style.backgroundImage = '';
          cell.style.backgroundSize = '';
          cell.style.backgroundPosition = '';
          cell.style.backgroundRepeat = '';
          setEntityImage(signalImage, signalImage ? '74%' : '100%');
          setRelayBadge('');
        }
        cell.classList.add('dissatisfy');
        cell.classList.remove('inactive-sensor');
      }

    });

    if (animatedFishCount > 0) {
      playEatSoundSequence(2000);
    }

    shouldAnimateFishOnNextUpdate = false;
  }

  function calculateDetectionProbability(size, sensorList, grid) {
    const probabilities = Array(size * size).fill(0);
    const connectivityData = buildConnectivityData(sensorList);
    const activeSensors = sensorList.filter(sensor => connectivityData.activeSensorKeys.has(`${sensor.x},${sensor.y}`));

    activeSensorKeys = connectivityData.activeSensorKeys;

    activeSensors.forEach(sensor => {
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
          cell.dataset.threshold = getThresholdForCell(x, y, getSelectedLevel());
          return;
        }
        if (activeSensors.some(sensor => sensor.x === x && sensor.y === y)) {
          probabilities[index] = 1;
        }
        cell.dataset.probability = probabilities[index];
        cell.dataset.threshold = getThresholdForCell(x, y, getSelectedLevel());
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
    activeSensorKeys = new Set();
    shouldAnimateFishOnNextUpdate = false;

    const cells = Array.from(clickableBox.childNodes).filter(cell => cell.classList.contains('grid-cell'));
    cells.forEach(cell => {
      const entityLayer = cell.querySelector('.cell-entity');
      cell.classList.remove('sensor');
      cell.classList.remove('dissatisfy');
      cell.classList.remove('inactive-sensor');
      if (entityLayer) {
        entityLayer.src = '';
        entityLayer.style.display = 'none';
        entityLayer.style.padding = '0';
        entityLayer.style.filter = 'none';
      }
      cell.style.backgroundColor = cell.classList.contains('wall')
        ? '#d9d4c7'
        : cell.classList.contains('relay-node')
          ? (isGameMode ? '#fff4cf' : '#edf5ff')
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
      const entityLayer = document.createElement('img');
      const relayBadge = document.createElement('span');
      const x = i % size;
      const y = Math.floor(i / size);

      cell.classList.add('grid-cell');
      entityLayer.className = 'cell-entity';
      relayBadge.className = 'relay-distance-badge';
      relayBadge.setAttribute('aria-hidden', 'true');
      entityLayer.alt = '';
      entityLayer.draggable = false;
      entityLayer.style.display = 'none';
      relayBadge.style.display = 'none';
      cell.dataset.index = i;
      cell.dataset.probability = 0;
      cell.dataset.threshold = getThresholdForCell(x, y, getSelectedLevel());
      if (isObstacle(x, y)) {
        cell.classList.add('wall');
      }
      if (isRelayNode(x, y)) {
        cell.classList.add('relay-node');
      }
      cell.style.backgroundColor = isObstacle(x, y)
        ? '#d9d4c7'
        : isRelayNode(x, y)
          ? (isGameMode ? '#fff4cf' : '#edf5ff')
        : isGameMode ? '#fff7d7' : 'rgb(0, 45, 255)';
      cell.appendChild(entityLayer);
      cell.appendChild(relayBadge);

      cell.addEventListener('click', function () {
        if (cell.classList.contains('wall') || cell.classList.contains('relay-node')) {
          return;
        }
        saveMapState();

        if (cell.classList.contains('sensor')) {
          shouldAnimateFishOnNextUpdate = false;
          cell.classList.remove('sensor');
          cell.classList.remove('inactive-sensor');
          const sensorIndex = sensors.findIndex(sensor => sensor.x === x && sensor.y === y);
          if (sensorIndex !== -1) {
            sensors.splice(sensorIndex, 1);
          }
          sensorCount--;
        } else {
          shouldAnimateFishOnNextUpdate = true;
          cell.classList.add('sensor');
          cell.classList.remove('inactive-sensor');
          sensors.push({ x, y });
          sensorCount++;
        }

        updateCounters();
        calculateDetectionProbability(size, sensors, clickableBox);
      });

      cell.addEventListener('mousemove', function (event) {
        if (cell.classList.contains('relay-node')) {
          tooltip.innerHTML = `${isGameMode ? 'Pills Hub' : 'Relay Sensor'}<br>Link Distance: ${getConnectDistanceForLevel()}`;
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY - 10}px`;
          tooltip.style.display = 'block';
          return;
        }

        const probability = parseFloat(cell.dataset.probability || '0');
        const cellThreshold = parseFloat(cell.dataset.threshold || defaultThreshold);
        tooltip.innerHTML = `Detection Probability: ${probability.toFixed(3)}<br>Threshold: ${cellThreshold.toFixed(2)}`;
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
  tutorialOkButton?.addEventListener('click', function () {
    tutorialModal?.classList.remove('show');
  });

  function exportMap() {
    const selectedLevel = getSelectedLevel();
    const thresholdMap = getThresholdMapForLevel(selectedLevel);
    const limitMatrix = thresholdMap || Array.from({ length: gridSize }, () => new Array(gridSize).fill(defaultThreshold));
    const output = [];
    output.push(`Map :\n${gridSize}x${gridSize}`);
    output.push(`Sensing_range : ${sensingRange}`);
    output.push(`Connect : ${getConnectDistanceForLevel()}`);
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

  function loadPresetSolution() {
    const selectedLevel = getSelectedLevel();
    const presetLayout = presetSolutionLayouts[selectedLevel];

    if (!presetLayout) {
      return;
    }

    saveMapState();
    shouldAnimateFishOnNextUpdate = false;
    hasShownCompletionModal = false;
    updateGrid(presetLayout.map(sensor => ({ x: sensor.x, y: sensor.y })));
  }

  thresholdBtn?.addEventListener('click', function () {
    isThresholdMode = !isThresholdMode;
    shouldAnimateFishOnNextUpdate = false;
    const label = isThresholdMode ? 'Simple View' : 'Coverage View';
    thresholdBtn.textContent = label;
    thresholdBtn.title = label;
    thresholdBtn.setAttribute('aria-label', label);
    applyProbabilitiesToGrid(probabilitiesCache, clickableBox);
  });

  quickSolutionBtn?.addEventListener('click', loadPresetSolution);

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
    shouldAnimateFishOnNextUpdate = false;
    hasShownCompletionModal = false;
    updateModeUI();
    applyProbabilitiesToGrid(probabilitiesCache, clickableBox);
    const completionRate = calculateCompletionRate(clickableBox);
    updateCompletionText(completionRate);
    checkCompletion(completionRate);
  });

  solutionDropdown?.addEventListener('change', function () {
    updateConnectModeForLevel(getSelectedLevel());
    renderGrid(getSelectedGridSize(), []);
  });

  connectBtn?.remove();
  updateConnectModeForLevel(getSelectedLevel());
  updateModeUI();
  syncActionButtonLabels();
  renderGrid(getSelectedGridSize(), []);
});
