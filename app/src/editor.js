// Sunset Cover Studio — the editor wiring. It owns the poster state, builds the
// three photo slots, lets the user drag a photo inside its panel, and exports
// the finished poster as a PNG in the chosen post size. A `?shot=` query sets
// up a fixed scene for a screenshot instead (see shots.js).
import { drawPoster, freshPosterState, panelCount, panelRects, renderPoster, POSTER_SIZES } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('poster');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const layoutSelect = document.getElementById('layout');
const gradeSelect = document.getElementById('grade');
const sizeSelect = document.getElementById('size');
const statusLine = document.getElementById('status');
const slotsBox = document.getElementById('slots');
const selectedName = document.getElementById('selectedName');
const zoomSlider = document.getElementById('zoom');
const panXSlider = document.getElementById('panX');
const panYSlider = document.getElementById('panY');
const zoomOut = document.getElementById('zoomOut');
const panXOut = document.getElementById('panXOut');
const panYOut = document.getElementById('panYOut');

const state = freshPosterState();
let selected = 0;

/** Turn a File or URL into an image the canvas can paint. */
function imageFromSource(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${source}`));
    img.src = source;
  });
}

async function imageFromFile(file) {
  return imageFromSource(URL.createObjectURL(file));
}

/** Repaint the preview and sync the crop sliders with the selected panel. */
function refresh() {
  drawPoster(canvas, state);
  const crop = state.crops[selected];
  zoomSlider.value = String(crop.zoom);
  panXSlider.value = String(crop.dx);
  panYSlider.value = String(crop.dy);
  zoomOut.textContent = `${crop.zoom.toFixed(2)}×`;
  panXOut.textContent = crop.dx.toFixed(2);
  panYOut.textContent = crop.dy.toFixed(2);
  selectedName.textContent = `Panel ${selected + 1}`;
  document.querySelectorAll('.slot').forEach((slot, i) => {
    slot.classList.toggle('active', i === selected);
    const thumb = slot.querySelector('.thumb');
    if (state.photos[i]) {
      thumb.classList.remove('empty');
      thumb.style.backgroundImage = `url(${state.photos[i].src})`;
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
      thumb.textContent = '';
    } else {
      thumb.classList.add('empty');
      thumb.style.backgroundImage = '';
      thumb.textContent = '+';
    }
  });
}

/** Build the three photo slots: thumbnail, label, hidden file picker. */
function buildSlots() {
  slotsBox.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = String(i);
    const thumb = document.createElement('div');
    thumb.className = 'thumb empty';
    thumb.textContent = '+';
    const label = document.createElement('span');
    label.textContent = `Panel ${i + 1}`;
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    slot.append(thumb, label, picker);
    slot.addEventListener('click', (event) => {
      selectPanel(i);
      if (event.target !== picker) picker.click();
    });
    picker.addEventListener('change', async () => {
      const file = picker.files?.[0];
      if (!file) return;
      try {
        state.photos[i] = await imageFromFile(file);
        state.crops[i] = { zoom: 1, dx: 0, dy: 0 };
        selectPanel(i);
        statusLine.textContent = `Loaded ${file.name} into panel ${i + 1}.`;
      } catch {
        statusLine.textContent = 'That file could not be read as a photo.';
      }
    });
    slotsBox.append(slot);
  }
}

function selectPanel(i) {
  selected = i;
  refresh();
}

/** Which panel, if any, sits under a point on the preview canvas. */
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * canvas.width;
  const y = ((clientY - box.top) / box.height) * canvas.height;
  return panelRects(canvas.width, canvas.height, state.layout, state.size).findIndex(
    (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h,
  );
}

let dragging = null;
canvas.addEventListener('pointerdown', (event) => {
  const hit = panelAt(event.clientX, event.clientY);
  if (hit < 0) return;
  selectPanel(hit);
  dragging = { x: event.clientX, y: event.clientY, dx: state.crops[hit].dx, dy: state.crops[hit].dy };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const rects = panelRects(canvas.width, canvas.height, state.layout, state.size);
  const rect = rects[selected];
  state.crops[selected].dx = dragging.dx + ((event.clientX - dragging.x) / box.width) * (canvas.width / rect.w);
  state.crops[selected].dy = dragging.dy + ((event.clientY - dragging.y) / box.height) * (canvas.height / rect.h);
  refresh();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const hit = panelAt(event.clientX, event.clientY);
  const target = hit >= 0 ? hit : selected;
  selectPanel(target);
  state.crops[target].zoom = Math.min(2.5, Math.max(1, state.crops[target].zoom - event.deltaY * 0.001));
  refresh();
}, { passive: false });

zoomSlider.addEventListener('input', () => { state.crops[selected].zoom = Number(zoomSlider.value); refresh(); });
panXSlider.addEventListener('input', () => { state.crops[selected].dx = Number(panXSlider.value); refresh(); });
panYSlider.addEventListener('input', () => { state.crops[selected].dy = Number(panYSlider.value); refresh(); });

document.getElementById('fillAll').addEventListener('click', () => {
  const photo = state.photos[selected];
  if (!photo) { statusLine.textContent = 'Load a photo into the selected panel first.'; return; }
  for (let i = 0; i < 3; i += 1) {
    state.photos[i] = photo;
    state.crops[i] = { ...state.crops[selected] };
  }
  refresh();
  statusLine.textContent = 'One photo now fills every panel.';
});

async function loadSample(name) {
  try {
    const img = await imageFromSource(`samples/${name}.jpg`);
    state.photos[selected] = img;
    state.crops[selected] = { zoom: 1, dx: 0, dy: 0 };
    refresh();
    statusLine.textContent = `Sample ${name} loaded into panel ${selected + 1}.`;
  } catch {
    statusLine.textContent = 'The sample photo could not be loaded.';
  }
}
document.getElementById('samplePier').addEventListener('click', () => loadSample('pier'));
document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));

layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  if (selected >= panelCount(state)) selected = 0;
  refresh();
});
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; refresh(); });
captionInput.addEventListener('input', () => { state.caption = captionInput.value; refresh(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; refresh(); });
sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; refresh(); });

document.getElementById('export').addEventListener('click', () => {
  const key = sizeSelect.value;
  const size = POSTER_SIZES[key];
  const out = renderPoster(state, key);
  out.toBlob((blob) => {
    if (!blob) { statusLine.textContent = 'Export failed — try again.'; return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cover-${size.width}x${size.height}.png`;
    link.click();
    statusLine.textContent = `Saved cover-${size.width}x${size.height}.png (${size.width} × ${size.height}).`;
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }, 'image/png');
});

// Test hook: the screenshot script asks the app itself for an export.
window.__exportCover = (sizeKey) => {
  const out = renderPoster(state, sizeKey);
  return out.toDataURL('image/png');
};
window.__posterState = state;

// Screenshot scenes, or the live editor with the pier sample ready.
buildSlots();
const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query.get('shot'), query, {
    loadSample,
    setState(next) { Object.assign(state, next); refresh(); },
    refresh,
  });
} else {
  loadSample('pier');
}
