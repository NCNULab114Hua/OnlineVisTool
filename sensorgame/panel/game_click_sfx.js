(function () {
  if (window.__meowtopiaClickSfxReady) {
    return;
  }

  window.__meowtopiaClickSfxReady = true;

  const clickableSelector = [
    'button:not(:disabled)',
    'a[href]',
    'input[type="button"]:not(:disabled)',
    'input[type="submit"]:not(:disabled)',
    '[role="button"]:not([aria-disabled="true"])'
  ].join(',');

  const clickAudioPath = './audio/select09.mp3';
  const clickAudioPool = [];
  const maxPoolSize = 6;
  const navigationDelayMs = 220;
  let lastPlayTime = 0;

  function playClickSound(options = {}) {
    const nowMs = performance.now();
    if (!options.force && nowMs - lastPlayTime < 45) {
      return null;
    }
    lastPlayTime = nowMs;

    if (typeof Audio === 'undefined') {
      return null;
    }

    const reusableAudio = clickAudioPool.find(audio => audio.paused || audio.ended);
    const audio = reusableAudio || new Audio(clickAudioPath);

    if (!reusableAudio && clickAudioPool.length < maxPoolSize) {
      audio.preload = 'auto';
      clickAudioPool.push(audio);
    }

    audio.currentTime = 0;
    audio.volume = 0.75;
    audio.play().catch(() => {
      // Some browsers block audio until the first trusted user gesture finishes.
    });

    return audio;
  }

  function getClickableElement(target) {
    const clickableElement = target.closest(clickableSelector);
    if (!clickableElement) {
      return null;
    }

    return clickableElement.closest('[data-silent-click="true"]') ? null : clickableElement;
  }

  function shouldDelayNavigation(event, link) {
    if (!link || link.dataset.sfxNavigating === 'true') {
      return false;
    }

    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    if (link.target && link.target !== '_self') {
      return false;
    }

    if (link.hasAttribute('download')) {
      return false;
    }

    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return false;
    }

    return true;
  }

  document.addEventListener('pointerdown', function (event) {
    const clickableElement = getClickableElement(event.target);
    const link = clickableElement?.closest('a[href]');

    if (event.button !== 0 || !clickableElement || shouldDelayNavigation(event, link)) {
      return;
    }

    playClickSound();
  }, true);

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!shouldDelayNavigation(event, link)) {
      return;
    }

    event.preventDefault();
    const audio = playClickSound({ force: true });
    link.dataset.sfxNavigating = 'true';
    window.setTimeout(function () {
      window.location.href = link.href;
    }, navigationDelayMs);
  }, true);

  document.addEventListener('keydown', function (event) {
    if ((event.key !== 'Enter' && event.key !== ' ') || !getClickableElement(event.target)) {
      return;
    }

    playClickSound();
  }, true);
})();
