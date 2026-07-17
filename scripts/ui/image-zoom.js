const ZOOM_SELECTOR = [
  'img.wizard-item__img',
  'img.wizard-selected__img',
  'img.guidance-item__img',
  'img.feat-option__img',
  'img.item-option__img',
  'img.spell-option__img',
].join(', ');

const ZOOM_EXCLUDED_SELECTOR = '.wizard-browser--background, .wizard-item-grid--gallery, .guidance-list--gallery';
const SHOW_DELAY_MS = 120;
const CURSOR_OFFSET = 18;

let zoomEl = null;
let zoomImg = null;
let showTimeout = null;
let activeSrc = null;

function ensureZoomElement() {
  if (zoomEl) return zoomEl;
  zoomEl = document.createElement('div');
  zoomEl.className = 'pf2e-leveler-image-zoom';
  zoomImg = document.createElement('img');
  zoomEl.appendChild(zoomImg);
  document.body.appendChild(zoomEl);
  return zoomEl;
}

export function clampZoomPosition(clientX, clientY, viewportWidth, viewportHeight, boxWidth, boxHeight) {
  let left = clientX + CURSOR_OFFSET;
  let top = clientY + CURSOR_OFFSET;
  if (left + boxWidth > viewportWidth) left = clientX - CURSOR_OFFSET - boxWidth;
  if (top + boxHeight > viewportHeight) top = clientY - CURSOR_OFFSET - boxHeight;
  left = Math.max(4, left);
  top = Math.max(4, top);
  return { left, top };
}

function positionZoom(event) {
  if (!zoomEl) return;
  const rect = zoomEl.getBoundingClientRect();
  const { left, top } = clampZoomPosition(event.clientX, event.clientY, window.innerWidth, window.innerHeight, rect.width, rect.height);
  zoomEl.style.left = `${left}px`;
  zoomEl.style.top = `${top}px`;
}

function showZoom(img, event) {
  const src = img.currentSrc || img.src;
  if (!src) return;
  ensureZoomElement();
  activeSrc = src;
  zoomImg.src = src;
  zoomEl.classList.add('is-visible');
  positionZoom(event);
}

function hideZoom() {
  clearTimeout(showTimeout);
  showTimeout = null;
  activeSrc = null;
  zoomEl?.classList.remove('is-visible');
}

let initialized = false;

export function initImageZoomPreview() {
  if (initialized) return;
  initialized = true;

  document.addEventListener(
    'mouseover',
    (event) => {
      const img = event.target?.closest?.(ZOOM_SELECTOR);
      if (!img || img.closest(ZOOM_EXCLUDED_SELECTOR)) return;
      clearTimeout(showTimeout);
      showTimeout = setTimeout(() => showZoom(img, event), SHOW_DELAY_MS);
    },
    true,
  );

  document.addEventListener(
    'mousemove',
    (event) => {
      if (!activeSrc) return;
      positionZoom(event);
    },
    true,
  );

  document.addEventListener(
    'mouseout',
    (event) => {
      const img = event.target?.closest?.(ZOOM_SELECTOR);
      if (!img) return;
      if (img.contains(event.relatedTarget)) return;
      hideZoom();
    },
    true,
  );

  window.addEventListener('blur', hideZoom);
}
