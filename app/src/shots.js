// Fixed scenes for screenshots. `?shot=editor` shows the editor with photos
// loaded; `?shot=cover` shows one exported-style cover alone, full-window.
// Params: photo / photo2 / photo3 pick the samples, caption sets the title,
// subtitle sets the tag line, layout / grade / size pick the look.
// window.__shotReady is set once the scene has painted twice.
export async function runShot(shot, query, api) {
  const pick = (name, fallback) => query.get(name) ?? fallback;
  const caption = pick('caption', 'Sunset Heist');
  const subtitle = pick('subtitle', 'VICE CITY • AFTER DARK');
  const layout = pick('layout', 'triptych');
  const grade = pick('grade', 'sunset');
  const size = pick('size', 'square');

  const loadSampleImage = (name) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `samples/${name}.jpg`;
  });

  const names = [pick('photo', 'pier'), pick('photo2', 'boulevard'), pick('photo3', 'pier')];
  for (let i = 0; i < 3; i += 1) {
    try {
      window.__posterState.photos[i] = await loadSampleImage(names[i]);
      window.__posterState.crops[i] = { zoom: 1, dx: 0, dy: 0 };
    } catch {
      // A missing sample leaves that panel on whatever it already holds.
    }
  }

  const captionInput = document.getElementById('caption');
  const subtitleInput = document.getElementById('subtitle');
  const layoutSelect = document.getElementById('layout');
  const gradeSelect = document.getElementById('grade');
  const sizeSelect = document.getElementById('size');
  if (captionInput) captionInput.value = caption;
  if (subtitleInput) subtitleInput.value = subtitle;
  if (layoutSelect) layoutSelect.value = layout;
  if (gradeSelect) gradeSelect.value = grade;
  if (sizeSelect) sizeSelect.value = size;

  api.setState({ layout, grade, size, caption, subtitle });
  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.refresh();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
