// Sunset Cover Studio — the poster renderer. Everything the cover looks like
// lives here: the panel grid, the photo crop math, the colour grades and the
// big slanted caption lettering. No game art, no game fonts: the lettering is
// drawn with the browser's own bold system face, filled with a sunset gradient.

export const POSTER_SIZES = {
  square: { label: 'Square — 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait — 1080 × 1350', width: 1080, height: 1350 },
  wide: { label: 'Wide — 1920 × 1080', width: 1920, height: 1080 },
};

export const LAYOUTS = {
  triptych: { label: 'Triptych — hero + two panels', panels: 3 },
  split: { label: 'Split — two tall panels', panels: 2 },
  hero: { label: 'Hero — one big photo', panels: 1 },
};

export const GRADES = {
  sunset: {
    label: 'Vice sunset',
    top: 'rgba(255, 110, 60, 0.04)',
    bottom: 'rgba(255, 46, 136, 0.40)',
    band: ['#2b0a3e', '#c2187a', '#ff7a59'],
    title: ['#fff7ae', '#ffd166', '#ff7a59', '#ff2e88'],
    sun: ['#ffe66d', '#ff9d5c', '#ff2e88'],
    frame: '#ffffff',
  },
  neon: {
    label: 'Neon night',
    top: 'rgba(0, 229, 255, 0.22)',
    bottom: 'rgba(255, 46, 136, 0.48)',
    band: ['#0a1030', '#5b21b6', '#00b8d4'],
    title: ['#ffffff', '#7df9ff', '#c084fc', '#ff2e88'],
    sun: ['#7df9ff', '#c084fc', '#ff2e88'],
    frame: '#7df9ff',
  },
  gold: {
    label: 'Palm gold',
    top: 'rgba(255, 190, 80, 0.05)',
    bottom: 'rgba(255, 120, 20, 0.36)',
    band: ['#2a1503', '#92400e', '#f59e0b'],
    title: ['#fff8dc', '#ffd166', '#ff9d00', '#fff3c4'],
    sun: ['#fff3c4', '#ffd166', '#ff9d00'],
    frame: '#ffe9a8',
  },
  noir: {
    label: 'Noir',
    top: 'rgba(255, 255, 255, 0.02)',
    bottom: 'rgba(0, 0, 0, 0.42)',
    band: ['#0d0d0d', '#2b2b2b', '#4d4d4d'],
    title: ['#ffffff', '#e5e5e5', '#bdbdbd', '#ffffff'],
    sun: ['#f5f5f5', '#c9c9c9', '#8a8a8a'],
    frame: '#e5e5e5',
  },
};

/** A fresh, empty poster state: three photo slots, one crop each. */
export function freshPosterState() {
  return {
    layout: 'triptych',
    grade: 'sunset',
    size: 'square',
    caption: 'Sunset Heist',
    subtitle: 'VICE CITY • AFTER DARK',
    photos: [null, null, null],
    crops: [
      { zoom: 1, dx: 0, dy: 0 },
      { zoom: 1, dx: 0, dy: 0 },
      { zoom: 1, dx: 0, dy: 0 },
    ],
  };
}

/** How many panels the current layout shows. */
export function panelCount(state) {
  return LAYOUTS[state.layout]?.panels ?? 3;
}

/** Geometry of one poster: its panel rectangles and its caption band.
 * The panels sit above the caption band, never underneath it. */
export function layoutGeometry(width, height, layout, sizeKey) {
  const gap = Math.max(8, Math.round(Math.min(width, height) * 0.014));
  const bandH = Math.round(height * (sizeKey === 'wide' ? 0.34 : 0.27));
  const bandY = height - bandH;
  const innerW = width - gap * 2;
  const innerH = bandY - gap * 2;
  const x0 = gap;
  const y0 = gap;
  let rects;
  if (layout === 'hero') rects = [{ x: x0, y: y0, w: innerW, h: innerH }];
  else if (layout === 'split') {
    const half = (innerW - gap) / 2;
    rects = [
      { x: x0, y: y0, w: half, h: innerH },
      { x: x0 + half + gap, y: y0, w: half, h: innerH },
    ];
  } else {
    const heroW = innerW * 0.6;
    const sideW = innerW - heroW - gap;
    const sideH = (innerH - gap) / 2;
    rects = [
      { x: x0, y: y0, w: heroW, h: innerH },
      { x: x0 + heroW + gap, y: y0, w: sideW, h: sideH },
      { x: x0 + heroW + gap, y: y0 + sideH + gap, w: sideW, h: sideH },
    ];
  }
  return { rects, bandY, bandH, gap };
}

/** The rectangles of the panels for a poster of w × h. */
export function panelRects(width, height, layout, sizeKey = 'square') {
  return layoutGeometry(width, height, layout, sizeKey).rects;
}

/** Clamp a crop so the photo can never be panned past its own edge. */
function clampCrop(rect, photo, crop) {
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const pw = photo.naturalWidth * base * crop.zoom;
  const ph = photo.naturalHeight * base * crop.zoom;
  const maxDx = pw > rect.w ? (pw - rect.w) / 2 / rect.w : 0;
  const maxDy = ph > rect.h ? (ph - rect.h) / 2 / rect.h : 0;
  return {
    zoom: Math.min(2.5, Math.max(1, crop.zoom)),
    dx: Math.min(maxDx, Math.max(-maxDx, crop.dx)),
    dy: Math.min(maxDy, Math.max(-maxDy, crop.dy)),
  };
}

/** Paint one photo into one panel, cover-fit, honouring its crop. */
function paintPhoto(ctx, photo, rect, crop, grade) {
  const c = clampCrop(rect, photo, crop);
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const scale = base * c.zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const x = rect.x + (rect.w - pw) / 2 + c.dx * rect.w;
  const y = rect.y + (rect.h - ph) / 2 + c.dy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (grade === 'noir') ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.05)';
  ctx.drawImage(photo, x, y, pw, ph);
  ctx.filter = 'none';
  ctx.restore();
}

/** Paint the empty-panel placeholder: a striped sunset with a prompt. */
function paintEmptyPanel(ctx, rect, index, grade) {
  const g = GRADES[grade] ?? GRADES.sunset;
  const fill = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  fill.addColorStop(0, g.band[1]);
  fill.addColorStop(1, g.band[0]);
  ctx.fillStyle = fill;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = Math.max(3, rect.w * 0.02);
  for (let i = -2; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(rect.x + i * rect.w * 0.35, rect.y + rect.h);
    ctx.lineTo(rect.x + i * rect.w * 0.35 + rect.h * 0.7, rect.y);
    ctx.stroke();
  }
  ctx.restore();
  const size = Math.min(rect.w, rect.h) * 0.09;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `800 ${Math.max(14, size)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ADD PHOTO ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Paint the grade wash over one panel. */
function paintGradeWash(ctx, rect, grade) {
  const g = GRADES[grade] ?? GRADES.sunset;
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, g.top);
  wash.addColorStop(1, g.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draw the retro striped sun that sits behind the caption. */
function paintRetroSun(ctx, cx, cy, radius, grade) {
  const g = GRADES[grade] ?? GRADES.sunset;
  const sun = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
  sun.addColorStop(0, g.sun[0]);
  sun.addColorStop(0.55, g.sun[1]);
  sun.addColorStop(1, g.sun[2]);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.fillStyle = 'rgba(20, 9, 29, 0.5)';
  let barY = cy + radius * 0.08;
  let barH = radius * 0.05;
  while (barY < cy + radius) {
    ctx.fillRect(cx - radius, barY, radius * 2, barH);
    barY += barH + radius * 0.13;
    barH *= 1.45;
  }
  ctx.restore();
}

/** Fit the title across the band, shrinking until it fits. */
function paintTitle(ctx, text, cx, baseline, maxWidth, grade, size) {
  const g = GRADES[grade] ?? GRADES.sunset;
  const words = text.trim().toUpperCase();
  let fontSize = size;
  const setFont = (px) => {
    ctx.font = `italic 900 ${px}px "Arial Black", "Helvetica Neue", system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, px * 0.04)}px`; } catch { /* older canvas */ }
  };
  setFont(fontSize);
  while (ctx.measureText(words).width > maxWidth && fontSize > 20) {
    fontSize -= 4;
    setFont(fontSize);
  }
  const paint = ctx.createLinearGradient(cx - maxWidth / 2, 0, cx + maxWidth / 2, 0);
  g.title.forEach((stop, i) => paint.addColorStop(i / (g.title.length - 1), stop));
  ctx.save();
  // Shear around the baseline centre so the slant never shifts the title sideways.
  ctx.translate(cx, baseline);
  ctx.transform(1, 0, -0.08, 1, 0, 0);
  ctx.translate(-cx, -baseline);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 4, 18, 0.95)';
  ctx.lineWidth = Math.max(4, fontSize * 0.13);
  ctx.strokeText(words, cx, baseline);
  ctx.fillStyle = paint;
  ctx.fillText(words, cx, baseline);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  return fontSize;
}

/** Render the whole poster onto `canvas` from `state`. */
export function drawPoster(canvas, state) {
  const size = POSTER_SIZES[state.size] ?? POSTER_SIZES.square;
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  const w = size.width;
  const h = size.height;
  const grade = GRADES[state.grade] ? state.grade : 'sunset';
  const g = GRADES[grade];
  const { rects, bandY, bandH } = layoutGeometry(w, h, state.layout, state.size);

  ctx.fillStyle = '#14091d';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const photo = state.photos[i] ?? null;
    if (photo) paintPhoto(ctx, photo, rect, state.crops[i], grade);
    else paintEmptyPanel(ctx, rect, i, grade);
    paintGradeWash(ctx, rect, grade);
    ctx.strokeStyle = g.frame;
    ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.006);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // A thin neon diagonal stripe across the top edge, poster-style.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, Math.max(10, h * 0.012));
  ctx.clip();
  const stripe = ctx.createLinearGradient(0, 0, w, 0);
  stripe.addColorStop(0, g.sun[2]);
  stripe.addColorStop(0.5, g.sun[0]);
  stripe.addColorStop(1, g.sun[1]);
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, w, Math.max(10, h * 0.012));
  ctx.restore();

  // Caption band: sunset gradient, retro sun behind the title.
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, g.band[0]);
  band.addColorStop(0.55, g.band[1]);
  band.addColorStop(1, g.band[2]);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));

  const title = (state.caption ?? '').trim();
  if (title) {
    paintRetroSun(ctx, w / 2, bandY + bandH * 0.52, bandH * 0.62, grade);
    const titleSize = Math.min(bandH * 0.52, h * 0.085);
    const titleBase = paintTitle(ctx, title, w / 2, bandY + bandH * 0.58, w * 0.92, grade, titleSize);
    const sub = (state.subtitle ?? '').trim().toUpperCase();
    if (sub) {
      const subSize = Math.max(16, Math.min(titleSize * 0.26, h * 0.024));
      ctx.font = `700 ${subSize}px system-ui, sans-serif`;
      try { ctx.letterSpacing = `${subSize * 0.32}px`; } catch { /* older canvas */ }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = subSize * 0.3;
      ctx.fillText(sub, w / 2, bandY + bandH * 0.58 + titleBase * 0.62);
      ctx.shadowBlur = 0;
      try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    }
  }

  // Vignette: darken the corners so the middle pops.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Corner mark: small star + year, top right.
  const markSize = Math.max(16, h * 0.02);
  ctx.font = `800 ${markSize}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = markSize * 0.4;
  ctx.fillText('★ EST. 2026', w - Math.max(12, w * 0.015), Math.max(12, h * 0.02));
  ctx.shadowBlur = 0;
}

/** Render `state` at a chosen size onto a fresh canvas and return it. */
export function renderPoster(state, sizeKey) {
  const canvas = document.createElement('canvas');
  drawPoster(canvas, { ...state, size: sizeKey });
  return canvas;
}
