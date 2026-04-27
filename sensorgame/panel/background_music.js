(function () {
  if (window.__meowtopiaBackgroundMusicReady) {
    return;
  }

  window.__meowtopiaBackgroundMusicReady = true;

  const musicPath = './audio/303 PM - しゃろう.mp3';
  const stateKey = 'meowtopia-background-music-state';
  const enabledKey = 'meowtopia-background-music-enabled';
  const syncIntervalMs = 900;
  const defaultVolume = 0.18;

  const music = new Audio(musicPath);
  music.loop = true;
  music.preload = 'auto';
  music.volume = defaultVolume;

  let syncTimer = null;
  let hasStarted = false;
  const toggleButton = document.getElementById('music-toggle-btn');
  const toggleIcon = toggleButton?.querySelector('img');

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(stateKey) || '{}');
    } catch (error) {
      return {};
    }
  }

  function isEnabled() {
    return localStorage.getItem(enabledKey) !== 'false';
  }

  function setToggleIcon() {
    if (!toggleButton || !toggleIcon) {
      return;
    }

    const enabled = isEnabled();
    toggleIcon.src = enabled ? './audio/sound.png' : './audio/no-sound.png';
    toggleIcon.alt = enabled ? 'Background music on' : 'Background music off';
    toggleButton.title = enabled ? 'Music On' : 'Music Off';
    toggleButton.setAttribute('aria-label', enabled ? 'Turn background music off' : 'Turn background music on');
  }

  function saveState() {
    if (!Number.isFinite(music.currentTime)) {
      return;
    }

    localStorage.setItem(stateKey, JSON.stringify({
      time: music.currentTime,
      updatedAt: Date.now(),
      duration: Number.isFinite(music.duration) ? music.duration : 0,
      playing: !music.paused,
      volume: music.volume
    }));
  }

  function restorePlaybackTime() {
    const saved = readState();
    const savedTime = Number(saved.time || 0);
    const duration = Number.isFinite(music.duration) && music.duration > 0
      ? music.duration
      : Number(saved.duration || 0);
    const elapsed = saved.updatedAt ? Math.max(0, (Date.now() - saved.updatedAt) / 1000) : 0;
    const restoredTime = duration > 0 ? (savedTime + elapsed) % duration : savedTime;

    if (Number.isFinite(restoredTime) && restoredTime > 0) {
      try {
        music.currentTime = restoredTime;
      } catch (error) {
        music.addEventListener('loadedmetadata', function () {
          music.currentTime = Math.min(restoredTime, music.duration || restoredTime);
        }, { once: true });
      }
    }
  }

  function startSyncTimer() {
    if (syncTimer) {
      return;
    }

    syncTimer = window.setInterval(saveState, syncIntervalMs);
  }

  function startMusic() {
    if (!isEnabled()) {
      setToggleIcon();
      return;
    }

    restorePlaybackTime();
    music.play()
      .then(() => {
        hasStarted = true;
        startSyncTimer();
        saveState();
      })
      .catch(() => {
        // Browsers may block music until the first user gesture.
      });
  }

  function startFromUserGesture() {
    if (hasStarted || !isEnabled()) {
      return;
    }

    startMusic();
  }

  function setMusicEnabled(enabled) {
    localStorage.setItem(enabledKey, enabled ? 'true' : 'false');
    if (enabled) {
      startMusic();
    } else {
      saveState();
      music.pause();
    }
    setToggleIcon();
  }

  music.addEventListener('loadedmetadata', restorePlaybackTime, { once: true });
  music.addEventListener('play', saveState);
  music.addEventListener('pause', saveState);
  music.addEventListener('ended', saveState);

  document.addEventListener('pointerdown', startFromUserGesture, true);
  document.addEventListener('keydown', startFromUserGesture, true);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      saveState();
    }
  });

  window.addEventListener('pagehide', saveState);
  window.addEventListener('beforeunload', saveState);
  toggleButton?.addEventListener('click', function () {
    setMusicEnabled(!isEnabled());
  });

  setToggleIcon();
  startMusic();
})();
