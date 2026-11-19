// PALMERA BAY — GTA VI Trophy Guide tracker.
// Loads app/data/trophies.json (same-origin, offline), renders the 55-trophy
// checklist, saves progress in localStorage, and offers export / import.
// Filters: kind (story / missable / collectibles / activities / online),
// grade, text search, hide-earned, and a spoiler setting that hides the
// names and descriptions of story + hidden trophies until they are earned.
// Screenshot helpers (harmless query params): ?kind=, ?spoiler=1,
// ?select=<trophy id>, ?shot=roadmap|missable|editor.
const KEY = 'palmera-bay-gta6-trophies-v1';
const SPOILER_KEY = 'palmera-bay-gta6-spoiler-v1';
const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const hideEarnedEl = document.getElementById('hideEarned');
const spoilerEl = document.getElementById('spoiler');
const filterNoteEl = document.getElementById('filterNote');
const listHeadingEl = document.getElementById('listHeading');

const params = new URLSearchParams(location.search);
let kind = params.get('kind') || 'all';
let earned = new Set(loadEarned());
let selectedId = Number(params.get('select')) || null;
let spoilerOn = params.get('spoiler') === '1' || localStorage.getItem(SPOILER_KEY) === '1';
if (params.get('shot') === 'editor' || params.get('shot') === 'missable') spoilerOn = true;
if (params.get('shot') === 'missable') kind = 'missable';
if (params.get('shot') === 'roadmap') kind = 'all';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function isSpoilerHidden(t) {
  // Only trophies PlayStation itself hides (28 of them, incl. all story
  // trophies) are masked; the visible platinum stays visible.
  return spoilerOn && !earned.has(t.name) && t.hidden;
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind === 'online') return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderProgress() {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.name)) byGrade[t.grade]++;
  document.getElementById('progressText').textContent = `${earned.size} of ${trophies.length} earned`;
  document.getElementById('gradeText').textContent =
    `${byGrade.platinum} platinum · ${byGrade.gold} gold · ${byGrade.silver} silver · ${byGrade.bronze} bronze`;
  document.getElementById('barFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  for (const stage of [1, 2, 3, 4, 5]) {
    const el = document.getElementById('stage' + stage);
    if (!el) continue;
    const inStage = trophies.filter((t) => t.stage === stage);
    const done = inStage.filter((t) => earned.has(t.name)).length;
    el.textContent = ` — ${done}/${inStage.length} earned`;
  }
}

function renderList() {
  const list = visibleTrophies();
  rowsEl.replaceChildren();
  document.getElementById('emptyNote').hidden = list.length > 0;
  const kindName = kind === 'all' ? '55 trophies' : kind;
  listHeadingEl.textContent = kind === 'online'
    ? 'Checklist — Online trophies: none'
    : `Checklist — ${list.length} of ${trophies.length} shown (${kindName})`;
  filterNoteEl.textContent = kind === 'online'
    ? 'No online trophies: PowerPyx confirms all 55 are offline, single-player. Nothing to filter here.'
    : kind === 'missable'
      ? '1 possibly missable trophy (PowerPyx, unconfirmed whether the Chapter 1 meditation is required — do it anyway).'
      : '';
  for (const t of list) {
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (selectedId === t.id) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      renderAll();
    });
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 't-name';
    name.textContent = isSpoilerHidden(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
    const desc = document.createElement('div');
    desc.className = 't-desc';
    desc.textContent = isSpoilerHidden(t) ? 'Name and description hidden by the spoiler setting.' : t.description;
    const meta = document.createElement('div');
    meta.className = 't-meta';
    const gradeChip = document.createElement('span');
    gradeChip.className = `chip ${t.grade}`;
    gradeChip.textContent = gradeLabel(t);
    meta.append(gradeChip);
    const kindChip = document.createElement('span');
    kindChip.className = 'chip kind';
    kindChip.textContent = t.kind;
    meta.append(kindChip);
    if (t.hidden) {
      const hiddenChip = document.createElement('span');
      hiddenChip.className = 'chip hidden';
      hiddenChip.textContent = 'Hidden';
      meta.append(hiddenChip);
    }
    if (t.missable) {
      const missChip = document.createElement('span');
      missChip.className = 'chip missable';
      missChip.textContent = '⚠ Missable';
      meta.append(missChip);
    }
    body.append(name, desc, meta);
    const dot = document.createElement('span');
    dot.className = 'grade-dot';
    dot.textContent = t.grade === 'platinum' ? '👑' : t.grade === 'gold' ? '🥇' : t.grade === 'silver' ? '🥈' : '🥉';
    li.append(box, body, dot);
    li.addEventListener('click', () => {
      selectedId = t.id;
      renderAll();
    });
    rowsEl.append(li);
  }
  renderProgress();
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId) || null;
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Select a trophy on the left to read its guide and its source.</p>';
    return;
  }
  detailEl.replaceChildren();
  const h2 = document.createElement('h2');
  h2.textContent = isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = isSpoilerHidden(t)
    ? 'Official name and description hidden by the spoiler setting.'
    : `Official: “${t.description}” — ${gradeLabel(t)}${t.hidden ? ' · Hidden on PlayStation' : ''}${t.missable ? ' · Possibly missable' : ''}`;
  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  const sourceH = document.createElement('h3');
  sourceH.textContent = 'Source';
  const source = document.createElement('p');
  source.className = 'source';
  source.textContent = t.source + ': ';
  const link = document.createElement('a');
  link.href = t.source_url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = t.source_url;
  source.append(link);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'earn-btn';
  btn.textContent = earned.has(t.name) ? '✓ Earned — click to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name);
    else earned.add(t.name);
    saveEarned();
    renderAll();
  });
  detailEl.append(h2, official, guideH, guide, sourceH, source, btn);
}

function renderAll() {
  renderList();
  renderDetail();
}

document.getElementById('kinds').addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-kind]');
  if (!btn) return;
  kind = btn.dataset.kind;
  for (const b of document.querySelectorAll('#kinds button')) b.classList.toggle('on', b === btn);
  renderAll();
});
gradeEl.addEventListener('change', renderAll);
hideEarnedEl.addEventListener('change', renderAll);
searchEl.addEventListener('input', renderAll);
spoilerEl.checked = spoilerOn;
spoilerEl.addEventListener('change', () => {
  spoilerOn = spoilerEl.checked;
  saveSpoiler();
  renderAll();
});

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
    saveEarned();
    renderAll();
  } catch {
    filterNoteEl.textContent = 'Import failed: that file is not a trophy-progress export from this guide.';
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earned = new Set();
  saveEarned();
  renderAll();
});

for (const b of document.querySelectorAll('#kinds button')) b.classList.toggle('on', b.dataset.kind === kind);
if (selectedId === null) selectedId = 28;
// Screenshot views (?shot=cover|editor|missable|roadmap): compact the page
// so the checklist and the open guide fit one 1280x720 frame.
if (params.get('shot')) {
  document.body.classList.add('shot-view');
  if (params.get('shot') !== 'roadmap') document.getElementById('roadmap').style.display = 'none';
}
renderAll();
if (params.get('shot') === 'roadmap') {
  document.getElementById('roadmap').scrollIntoView();
}
