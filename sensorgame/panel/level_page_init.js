(function loadGameClickSfx() {
  if (window.__meowtopiaClickSfxReady || window.__meowtopiaClickSfxLoading) {
    return;
  }

  window.__meowtopiaClickSfxLoading = true;
  const script = document.createElement('script');
  script.src = './panel/game_click_sfx.js';
  script.defer = true;
  document.head.appendChild(script);
})();

(function loadBackgroundMusic() {
  if (window.__meowtopiaBackgroundMusicReady || window.__meowtopiaBackgroundMusicLoading) {
    return;
  }

  window.__meowtopiaBackgroundMusicLoading = true;
  const script = document.createElement('script');
  script.src = './panel/background_music.js';
  script.defer = true;
  document.head.appendChild(script);
})();

document.addEventListener('DOMContentLoaded', function () {
  const missionType = document.body.dataset.missionType;
  const solution = document.body.dataset.solution;

  if (missionType === 'small') {
    const solutionSelect = document.getElementById('solution');
    if (solutionSelect && solution) {
      solutionSelect.value = solution;
      solutionSelect.dispatchEvent(new Event('change'));
    }
  }

  if (missionType === 'large') {
    const solutionSelect = document.getElementById('solution-5050');
    const mapSizeInput = document.getElementById('map-size-input-5050');
    const mapSize = document.body.dataset.mapSize;
    const setMapSizeBtn = document.getElementById('set-map-size-btn-5050');

    if (solutionSelect && solution) {
      solutionSelect.value = solution;
      solutionSelect.dispatchEvent(new Event('change'));
    }

    if (mapSizeInput && mapSize) {
      mapSizeInput.value = mapSize;
    }

    if (setMapSizeBtn && document.body.dataset.emptyStart === 'true') {
      setMapSizeBtn.click();
    }
  }
});
