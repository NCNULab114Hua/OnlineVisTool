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
