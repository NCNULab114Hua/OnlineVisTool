document.addEventListener('DOMContentLoaded', function () {
  const storageKey = 'meowtopia-skin-preferences';
  const openButton = document.getElementById('skin-picker-open');
  const modal = document.getElementById('skin-picker-modal');
  const okButton = document.getElementById('skin-picker-ok');
  const fishPreview = document.getElementById('fish-skin-preview');
  const catPreview = document.getElementById('cat-skin-preview');
  const fishName = document.getElementById('fish-skin-name');
  const catName = document.getElementById('cat-skin-name');

  const fishOptions = [
    { id: 'classic', name: 'Classic Fish', image: './image/fish.png' },
    { id: 'hot', name: 'Hot Fish', image: './image/fish-hot1.png' },
    { id: 'ice', name: 'Ice Fish', image: './image/fish-ice1.png' }
  ];

  const catOptions = [
    { id: 'kuro', name: 'Kuro Cat', image: './image/kuro.png' },
    { id: 'gray', name: 'Gray Cat', image: './image/gray.png' },
    { id: 'dinger', name: 'Dinger Cat', image: './image/dinger.png' }
  ];

  let selectedFishIndex = 0;
  let selectedCatIndex = 0;

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        fish: fishOptions.some(option => option.id === saved.fish) ? saved.fish : 'classic',
        cat: catOptions.some(option => option.id === saved.cat) ? saved.cat : 'kuro'
      };
    } catch (error) {
      return { fish: 'classic', cat: 'kuro' };
    }
  }

  function syncFromSavedPreferences() {
    const saved = readPreferences();
    selectedFishIndex = Math.max(0, fishOptions.findIndex(option => option.id === saved.fish));
    selectedCatIndex = Math.max(0, catOptions.findIndex(option => option.id === saved.cat));
    renderSelection();
  }

  function renderSelection() {
    const fish = fishOptions[selectedFishIndex];
    const cat = catOptions[selectedCatIndex];
    fishPreview.src = fish.image;
    fishPreview.alt = fish.name;
    fishName.textContent = fish.name;
    catPreview.src = cat.image;
    catPreview.alt = cat.name;
    catName.textContent = cat.name;
  }

  function cycleOption(type, direction) {
    if (type === 'fish') {
      selectedFishIndex = (selectedFishIndex + direction + fishOptions.length) % fishOptions.length;
    } else {
      selectedCatIndex = (selectedCatIndex + direction + catOptions.length) % catOptions.length;
    }
    renderSelection();
  }

  function openModal() {
    syncFromSavedPreferences();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  openButton?.addEventListener('click', openModal);
  okButton?.addEventListener('click', function () {
    localStorage.setItem(storageKey, JSON.stringify({
      fish: fishOptions[selectedFishIndex].id,
      cat: catOptions[selectedCatIndex].id
    }));
    closeModal();
  });

  modal?.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  modal?.querySelectorAll('.skin-arrow').forEach(button => {
    button.addEventListener('click', function () {
      const row = button.closest('.skin-picker-row');
      const pickerType = row?.dataset.picker || 'fish';
      const direction = Number(button.dataset.direction || 1);
      cycleOption(pickerType, direction);
    });
  });

  syncFromSavedPreferences();
});
