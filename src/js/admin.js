/* =========================================================================
   admin.js — Admin dashboard (admin.html)
   Uses Supabase Auth for login and Supabase tables for all CRUD.
   ========================================================================= */
  // src/admin.js
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// The Bouncer: Checks user status immediately
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Not logged in? Kick them to the login page
    window.location.replace("login.html");
  } else {
    // Logged in? Reveal the dashboard
    document.body.style.display = "block"; 
  }
});

// Optional: Add a logout button
document.getElementById("logout-btn")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.replace("login.html");
  });
});

import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("add-project-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Gather the input values
  const title = document.getElementById("proj-title").value;
  const desc = document.getElementById("proj-desc").value;
  const tech = document.getElementById("proj-tech").value;
  const link = document.getElementById("proj-link").value;

  try {
    // 'projects' is the name of the collection. Firestore creates it automatically.
    await addDoc(collection(db, "projects"), {
      title: title,
      description: desc,
      techStack: tech,
      link: link,
      createdAt: new Date()
    });
    
    alert("Project added successfully!");
    form.reset(); // Clear the form
  } catch (error) {
    console.error("Error adding document: ", error);
  }
});
/* =========================================================================
   PDF.js (for resume parsing — loaded via CDN in admin.html)
   ========================================================================= */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/* =========================================================================
   LOCAL STATE (mirrors DB; updated after every successful write)
   ========================================================================= */
let state = {
  profile:      {},
  projects:     [],
  experience:   [],
  education:    [],
  skills:       [],
  testimonials: [],
};

/* =========================================================================
   LOAD ALL DATA
   ========================================================================= */
async function loadAll() {
  const [profile, projects, experience, education, skills, testimonials] = await Promise.all([
    DataStore.getProfile(),
    DataStore.getAll('projects'),
    DataStore.getAll('experience'),
    DataStore.getAll('education'),
    DataStore.getAll('skills'),
    DataStore.getAll('testimonials'),
  ]);
  state = { profile, projects, experience, education, skills, testimonials };
}

/* =========================================================================
   AUTH — Supabase login
   Login uses your Supabase user credentials.
   Create a user at: Supabase Dashboard → Authentication → Users → Add user
   ========================================================================= */
const loginScreen = document.getElementById('login-screen');
const dashboard   = document.getElementById('dashboard');
const authTitle = document.getElementById('auth-title');
const authCopy = document.getElementById('auth-copy');
const authSubmit = document.getElementById('auth-submit');
const authModeToggle = document.getElementById('auth-mode-toggle');
const authInfo = document.getElementById('login-info');
const ADMIN_EMAIL = 'mic1dev.me@gmail.com';
let authMode = 'login';

function isAllowedAdmin(session) {
  return session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
}

async function showUnauthorized() {
  dashboard.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  setAuthMode('login');
  authInfo.textContent = 'This admin page is only available to the site owner.';
  authInfo.classList.remove('hidden');
  await DataStore.signOut();
}

async function showDashboard(session) {
  if (!isAllowedAdmin(session)) {
    await showUnauthorized();
    return;
  }
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  await loadAll();
  renderDashboard();
}
function showLogin() {
  dashboard.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-email').focus();
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  authTitle.textContent = isSignup ? 'Create admin account' : 'Admin login';
  authCopy.textContent = isSignup
    ? 'Choose an email and password for your Supabase admin account.'
    : 'Use your Supabase account email and password.';
  authSubmit.textContent = isSignup ? 'Create account' : 'Log in';
  authModeToggle.textContent = isSignup ? 'I already have an admin account' : 'Create admin account';
  document.getElementById('login-error').classList.add('hidden');
  authInfo.classList.add('hidden');
}

// Check existing session on page load
DataStore.onAuthChange(async session => {
  if (session) await showDashboard(session);
  else showLogin();
});

document.getElementById('login-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = ev.target.querySelector('button[type="submit"]');

  if (email.toLowerCase() !== ADMIN_EMAIL) {
    errEl.textContent = 'This admin page is only available to the site owner.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled   = true;
  btn.textContent = 'Signing in…';
  errEl.classList.add('hidden');
  authInfo.classList.add('hidden');

  try {
    if (authMode === 'signup') {
      const result = await DataStore.signUp(email, password);
      if (result.session) {
        await showDashboard(result.session);
      } else {
        setAuthMode('login');
        authInfo.textContent = 'Account created. Check your email to confirm it, then log in.';
        authInfo.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Log in';
      }
    } else {
      await DataStore.signIn(email, password);
      // onAuthChange fires and calls showDashboard()
    }
  } catch (err) {
    errEl.textContent = err.message || 'Incorrect email or password.';
    errEl.classList.remove('hidden');
    btn.disabled    = false;
    btn.textContent = authMode === 'signup' ? 'Create account' : 'Log in';
  }
});

authModeToggle.addEventListener('click', () => {
  setAuthMode(authMode === 'signup' ? 'login' : 'signup');
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await DataStore.signOut();
});

/* =========================================================================
   TABS
   ========================================================================= */
const panels = {
  profile:      document.getElementById('panel-profile'),
  projects:     document.getElementById('panel-projects'),
  experience:   document.getElementById('panel-experience'),
  education:    document.getElementById('panel-education'),
  skills:       document.getElementById('panel-skills'),
  testimonials: document.getElementById('panel-testimonials'),
  settings:     document.getElementById('panel-settings'),
};

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    Object.values(panels).forEach(p => p.classList.add('hidden'));
    panels[tab.dataset.tab].classList.remove('hidden');
  });
});

/* =========================================================================
   DASHBOARD RENDER
   ========================================================================= */
function renderDashboard() {
  fillProfileForm();
  renderList('projects',     'project');
  renderList('experience',   'experience');
  renderList('education',    'education');
  renderList('skills',       'skill');
  renderList('testimonials', 'testimonial');
}

/* =========================================================================
   PROFILE & BRANDING
   ========================================================================= */
function fillProfileForm() {
  const p    = state.profile;
  const form = document.getElementById('profile-form');
  const map  = {
    headline: 'headline', subhead: 'subhead', bio: 'bio',
    email: 'email', whatsapp: 'whatsapp', calendly: 'calendly',
    linkedin: 'linkedin', github: 'github',
    stat1: 'stat1', stat1Label: 'stat1_label',
    stat2: 'stat2', stat2Label: 'stat2_label',
    stat3: 'stat3', stat3Label: 'stat3_label',
  };
  for (const [field, key] of Object.entries(map)) {
    const el = form.elements[field];
    if (el) el.value = p[key] || p[field] || '';
  }
  const photoEl = document.getElementById('photo-preview');
  photoEl.src = p.photo_url || p.photoUrl || 'assets/Cherop.png';
  updateResumeStatus();
}

function updateResumeStatus(message) {
  const el = document.getElementById('resume-status');
  const btn = document.getElementById('btn-reparse-resume');
  const has = !!(state.profile.resume_url || state.profile.resumeUrl);
  el.textContent = message || (has ? 'A resume file is uploaded.' : 'No resume uploaded yet.');
  btn.classList.toggle('hidden', !has);
}

/* ── photo upload ─────────────────────────────────────────── */
document.getElementById('photo-input').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }

  const btn = ev.target.closest('.flex').querySelector('p') || document.getElementById('resume-status');
  try {
    // Try Supabase Storage first; fall back to base64 if Storage isn't set up
    let url;
    try {
      url = await DataStore.uploadFile('photos', `profile-photo.${file.name.split('.').pop()}`, file);
    } catch {
      url = await fileToDataUrl(file);   // base64 fallback
    }
    await DataStore.saveProfile({ photo_url: url });
    state.profile.photo_url = url;
    document.getElementById('photo-preview').src = url;
    flashSaved('profile-saved-msg');
  } catch (err) {
    alert('Could not save photo: ' + err.message);
  }
});

/* ── resume upload ───────────────────────────────────────── */
document.getElementById('resume-input').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') { alert('Please choose a PDF file.'); return; }

  try {
    let url;
    try {
      url = await DataStore.uploadFile('resumes', 'resume.pdf', file);
    } catch {
      if (file.size > 4 * 1024 * 1024) { alert('PDF too large (>4 MB) for inline storage. Host it elsewhere and paste the URL instead.'); return; }
      url = await fileToDataUrl(file);
    }
    await DataStore.saveProfile({ resume_url: url });
    state.profile.resume_url = url;
    await readResumeIntoSite(file);
  } catch (err) {
    alert('Could not save resume: ' + err.message);
  }
});

document.getElementById('resume-url-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const url = document.getElementById('resume-url-input').value.trim();
  if (!url) return;
  try {
    await DataStore.saveProfile({ resume_url: url });
    state.profile.resume_url = url;
    document.getElementById('resume-url-input').value = '';
    updateResumeStatus('Resume URL saved.');
    flashSaved('resume-saved-msg');
    // best-effort parse
    try {
      const res = await fetch(url);
      if (res.ok) await readResumeIntoSite(await res.blob());
    } catch { /* silent */ }
  } catch (err) {
    alert('Could not save resume URL: ' + err.message);
  }
});

document.getElementById('btn-reparse-resume').addEventListener('click', async () => {
  const url = state.profile.resume_url || state.profile.resumeUrl;
  if (!url) return;
  try {
    updateResumeStatus('Reading resume…');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    await readResumeIntoSite(await res.blob());
  } catch {
    updateResumeStatus('Could not re-read that file — add Experience/Education/Skills manually.');
  }
});

/* ── profile form save ───────────────────────────────────── */
document.getElementById('profile-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const updates = {};
  for (const [key, value] of fd.entries()) updates[key] = String(value).trim();
  // map form field names → DB column names
  const rename = {
    stat1Label: 'stat1_label', stat2Label: 'stat2_label', stat3Label: 'stat3_label',
  };
  const final = {};
  for (const [k, v] of Object.entries(updates)) final[rename[k] || k] = v;

  try {
    await DataStore.saveProfile(final);
    Object.assign(state.profile, final);
    flashSaved('profile-saved-msg');
  } catch (err) {
    alert('Could not save profile: ' + err.message);
  }
});

/* =========================================================================
   PDF RESUME PARSING 
   ========================================================================= */
async function readResumeIntoSite(fileOrBlob) {
  if (!window.pdfjsLib) {
    updateResumeStatus('PDF reader not loaded — add Experience/Education/Skills manually.');
    return;
  }
  updateResumeStatus('Reading resume…');
  try {
    const buf = await fileOrBlob.arrayBuffer();
    const lines = await extractPdfLines(buf);
    const parsed = parseResumeLines(lines);
    const foundAnything = parsed.experience.length || parsed.education.length || parsed.skills.length;

    if (!foundAnything) {
      updateResumeStatus('Uploaded — could not auto-parse sections, add them manually.');
      return;
    }

    const hasExisting = state.experience.length || state.education.length || state.skills.length;
    if (hasExisting) {
      const ok = confirm('Replace current Experience, Education & Skills with what was found in the PDF?');
      if (!ok) { updateResumeStatus('Upload kept — existing entries unchanged.'); return; }
    }

    const summary = [];
    if (parsed.experience.length) {
      // delete existing, insert new
      for (const e of state.experience) await DataStore.remove('experience', e.id);
      for (let i = 0; i < parsed.experience.length; i++) {
        const { id: _id, ...rest } = parsed.experience[i];
        await DataStore.insert('experience', { ...rest, sort_order: i });
      }
      summary.push(`${parsed.experience.length} experience entries`);
    }
    if (parsed.education.length) {
      for (const e of state.education) await DataStore.remove('education', e.id);
      for (let i = 0; i < parsed.education.length; i++) {
        const { id: _id, ...rest } = parsed.education[i];
        await DataStore.insert('education', { ...rest, sort_order: i });
      }
      summary.push(`${parsed.education.length} education entries`);
    }
    if (parsed.skills.length) {
      for (const s of state.skills) await DataStore.remove('skills', s.id);
      for (let i = 0; i < parsed.skills.length; i++) {
        const { id: _id, ...rest } = parsed.skills[i];
        await DataStore.insert('skills', { ...rest, sort_order: i });
      }
      summary.push(`${parsed.skills.length} skill groups`);
    }

    await loadAll();
    renderDashboard();
    updateResumeStatus(`Parsed ${summary.join(', ')} — review in the tabs below.`);
  } catch (err) {
    console.error(err);
    updateResumeStatus('Parsing failed — add sections manually.');
  }
}

async function extractPdfLines(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.filter(i => i.str !== undefined)
      .map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));
    const rows = [];
    items.forEach(it => {
      let row = rows.find(r => Math.abs(r.y - it.y) <= 2.5);
      if (!row) { row = { y: it.y, items: [] }; rows.push(row); }
      row.items.push(it);
    });
    rows.sort((a, b) => b.y - a.y);
    let prevY = null;
    rows.forEach(row => {
      if (prevY !== null && prevY - row.y > 16) lines.push('');
      const text = row.items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      lines.push(text);
      prevY = row.y;
    });
    lines.push('');
  }
  return lines;
}

const RESUME_SECTION_MATCHERS = [
  { key: 'experience', re: /^(work|professional|employment)?\s*experience$/i },
  { key: 'education',  re: /^education(al background)?$/i },
  { key: 'skills',     re: /^(technical\s+|core\s+|key\s+)?skills?( &? ?tools)?$/i },
];
const DATE_RANGE_RE = /((19|20)\d{2}|present|current)/i;
const BULLET_RE     = /^[-•*·‣▪]\s+/;

function isLikelyHeaderLine(l) {
  if (!l || l.length > 40) return false;
  const letters = l.replace(/[^a-zA-Z]/g,'');
  return letters.length >= 3 && letters === letters.toUpperCase();
}
function matchSection(l) {
  for (const m of RESUME_SECTION_MATCHERS) if (m.re.test(l.trim())) return m.key;
  return null;
}
function isBulletLine(l) { return BULLET_RE.test(l); }
function stripBullet(l)  { return l.replace(BULLET_RE,'').trim(); }

function splitIntoParagraphs(lines) {
  const ps = []; let cur = [];
  lines.forEach(l => { if (!l) { if (cur.length) { ps.push(cur); cur = []; } } else cur.push(l); });
  if (cur.length) ps.push(cur);
  return ps;
}
function splitHeaderLine(l) { return l.split(/\s*[|·—–]\s*|\s{2,}/).map(s=>s.trim()).filter(Boolean); }

function parseExperienceParagraph(pl) {
  const pts = splitHeaderLine(pl[0]); let role=pts[0]||'', org='', period='';
  for (const p of pts.slice(1)) { if (DATE_RANGE_RE.test(p)&&!period) period=p; else if (!org) org=p; }
  let bs=1;
  if (pl[1]&&!isBulletLine(pl[1])) { if (DATE_RANGE_RE.test(pl[1])&&!period){period=pl[1].trim();bs=2;} else if (!org){org=pl[1].trim();bs=2;} }
  return { id: uid('e'), role, org, period, points: pl.slice(bs).map(stripBullet).filter(Boolean) };
}
function parseEducationParagraph(pl) {
  const pts = splitHeaderLine(pl[0]); let degree=pts[0]||'', org='', period='';
  for (const p of pts.slice(1)) { if (DATE_RANGE_RE.test(p)&&!period) period=p; else if (!org) org=p; }
  if (pl[1]) { if (DATE_RANGE_RE.test(pl[1])&&!period) period=pl[1].trim(); else if (!org) org=pl[1].trim(); }
  return { id: uid('ed'), degree, org, period };
}
function parseSkillsLines(lines) {
  const gs = [];
  lines.forEach(raw => {
    const l = stripBullet(raw); if (!l) return;
    const m = l.match(/^([A-Za-z][A-Za-z &/]{1,30}):\s*(.+)$/);
    if (m) { const items = m[2].split(/,|;|\u2022|\|/).map(s=>s.trim()).filter(Boolean); if (items.length) gs.push({ category:m[1].trim(), items }); }
    else { const items = l.split(/,|;|\u2022|\|/).map(s=>s.trim()).filter(Boolean); if (items.length) gs.push({ category:'Skills', items }); }
  });
  const merged = [];
  gs.forEach(g => { const last=merged[merged.length-1]; if (last&&last.category===g.category) last.items.push(...g.items); else merged.push({...g,items:[...g.items]}); });
  return merged.map(g => ({ id: uid('s'), category: g.category, items: g.items }));
}
function parseResumeLines(lines) {
  const buckets = { experience:[], education:[], skills:[] }; let current=null;
  lines.forEach(l => { if (isLikelyHeaderLine(l)) { current=matchSection(l); return; } if (current&&buckets[current]) buckets[current].push(l); });
  return {
    experience: splitIntoParagraphs(buckets.experience).map(parseExperienceParagraph).filter(e=>e.role),
    education:  splitIntoParagraphs(buckets.education).map(parseEducationParagraph).filter(e=>e.degree),
    skills:     parseSkillsLines(buckets.skills.filter(Boolean)),
  };
}

/* =========================================================================
   GENERIC LIST RENDERING
   ========================================================================= */
const TABLE_FOR_KIND = {
  project:'projects', experience:'experience', education:'education',
  skill:'skills', testimonial:'testimonials',
};
const STATE_KEY_FOR_KIND = {
  project:'projects', experience:'experience', education:'education',
  skill:'skills', testimonial:'testimonials',
};

function summarize(kind, item) {
  if (kind==='project')     return { title:item.title, subtitle:(item.tags||[]).join(', ') };
  if (kind==='experience')  return { title:item.role,  subtitle:`${item.org||''} · ${item.period||''}` };
  if (kind==='education')   return { title:item.degree,subtitle:`${item.org||''} · ${item.period||''}` };
  if (kind==='skill')       return { title:item.category, subtitle:(item.items||[]).join(', ') };
  if (kind==='testimonial') return { title:item.name||'Untitled', subtitle:(item.quote||'').slice(0,60)+(item.quote?.length>60?'…':'') };
  return { title:'', subtitle:'' };
}

function renderList(stateKey, kind) {
  const wrap  = document.getElementById('list-' + stateKey);
  const items = state[stateKey] || [];

  wrap.innerHTML = items.map(item => {
    const { title, subtitle } = summarize(kind, item);
    const img = (kind==='project' && (item.image_url||item.imageUrl))
      ? `<img src="${esc(item.image_url||item.imageUrl)}" class="w-14 h-14 rounded object-cover border border-line flex-shrink-0" alt="">`
      : `<div class="w-14 h-14 rounded bg-surface2 border border-line flex-shrink-0"></div>`;

    return `
    <div class="flex items-center gap-4 bg-ink border border-line rounded p-4">
      ${kind==='project' ? img : ''}
      <div class="flex-1 min-w-0">
        <p class="text-fg font-semibold truncate">${esc(title)||'(untitled)'}</p>
        <p class="text-muted text-sm truncate">${esc(subtitle)}</p>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button data-edit data-id="${item.id}" class="font-mono text-xs border border-line hover:border-teal text-muted hover:text-fg px-3 py-1.5 rounded">Edit</button>
        <button data-delete data-id="${item.id}" class="font-mono text-xs border border-line hover:border-coral text-muted hover:text-coral px-3 py-1.5 rounded">Delete</button>
      </div>
    </div>`;
  }).join('') || `<p class="text-muted font-mono text-sm">Nothing here yet — use "Add" above to create the first one.</p>`;

  wrap.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => openEntityForm(kind, stateKey, btn.dataset.id))
  );
  wrap.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deleteItem(kind, stateKey, btn.dataset.id, btn))
  );
}

async function deleteItem(kind, stateKey, id, btn) {
  if (!confirm('Delete this item? This can\'t be undone.')) return;
  btn.disabled = true;
  try {
    await DataStore.remove(TABLE_FOR_KIND[kind], id);
    state[stateKey] = state[stateKey].filter(x => x.id !== id);
    renderList(stateKey, kind);
  } catch (err) {
    alert('Delete failed: ' + err.message);
    btn.disabled = false;
  }
}

document.querySelectorAll('[data-admin-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    const kind = btn.dataset.adminAdd;
    openEntityForm(kind, STATE_KEY_FOR_KIND[kind], null);
  });
});

/* =========================================================================
   ADD / EDIT FORM (dialog)
   ========================================================================= */
async function openEntityForm(kind, stateKey, id) {
  const fields   = FIELD_DEFS[kind];
  const existing = id ? state[stateKey].find(x => x.id === id) : null;
  document.getElementById('form-title').textContent = (existing ? 'Edit ' : 'Add ') + kind;

  const form = document.getElementById('entity-form');
  form.innerHTML = fields.map(f => fieldMarkup(f, existing ? (existing[f.key] ?? existing[snakeToCamel(f.key)]) : undefined)).join('') + `
    <div class="flex gap-3 pt-2">
      <button type="submit" id="entity-submit-btn" class="flex-1 bg-amber hover:bg-amberhover text-ink font-semibold py-2.5 rounded">${existing ? 'Save changes' : 'Add'}</button>
      <button type="button" data-close-dialog class="px-4 border border-line rounded text-muted hover:text-fg">Cancel</button>
    </div>
    <p id="entity-err" class="hidden font-mono text-xs text-coral"></p>`;

  form.querySelectorAll('[data-close-dialog]').forEach(b =>
    b.addEventListener('click', () => form.closest('dialog').close())
  );

  // Wire image upload fields
  fields.filter(f => f.type === 'image').forEach(f => {
    const fileInput = form.querySelector(`[data-image-file="${f.key}"]`);
    const urlInput  = form.querySelector(`[name="${f.key}"]`);
    const preview   = form.querySelector(`[data-image-preview="${f.key}"]`);
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0]; if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
      try {
        let url;
        try { url = await DataStore.uploadFile('project-images', `project-${Date.now()}.${file.name.split('.').pop()}`, file); }
        catch { url = await fileToDataUrl(file); }
        urlInput.value = url;
        preview.src = url; preview.classList.remove('hidden');
      } catch (err) { alert('Image upload failed: ' + err.message); }
    });
    urlInput.addEventListener('input', () => {
      if (urlInput.value) { preview.src = urlInput.value; preview.classList.remove('hidden'); }
      else preview.classList.add('hidden');
    });
  });

  form.onsubmit = async ev => {
    ev.preventDefault();
    const submitBtn = document.getElementById('entity-submit-btn');
    const errEl     = document.getElementById('entity-err');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    errEl.classList.add('hidden');

    const fd  = new FormData(form);
    const obj = {};
    fields.forEach(f => {
      const raw = fd.get(f.key) || '';
      if (f.type === 'tags')  obj[f.key] = raw.split(',').map(s=>s.trim()).filter(Boolean);
      else if (f.type === 'lines') obj[f.key] = raw.split('\n').map(s=>s.trim()).filter(Boolean);
      else obj[f.key] = raw.trim();
    });

    // Map camelCase field keys → snake_case DB columns
    const dbObj = {};
    for (const [k, v] of Object.entries(obj)) dbObj[camelToSnake(k)] = v;

    try {
      const table = TABLE_FOR_KIND[kind];
      if (existing) {
        await DataStore.update(table, existing.id, dbObj);
        const idx = state[stateKey].findIndex(x => x.id === existing.id);
        state[stateKey][idx] = { ...existing, ...obj, ...dbObj };
      } else {
        const sortOrder = state[stateKey].length;
        const created   = await DataStore.insert(table, { ...dbObj, sort_order: sortOrder });
        state[stateKey].push(created);
      }
      renderList(stateKey, kind);
      document.getElementById('dlg-form').close();
    } catch (err) {
      errEl.textContent = 'Save failed: ' + err.message;
      errEl.classList.remove('hidden');
      submitBtn.disabled  = false;
      submitBtn.textContent = existing ? 'Save changes' : 'Add';
    }
  };

  document.getElementById('dlg-form').showModal();
}

function fieldMarkup(f, rawValue) {
  const placeholder = f.placeholder ? esc(f.placeholder) : '';
  if (f.type === 'image') {
    const val = esc(rawValue ?? '');
    return `<div>
      <label class="block font-mono text-xs text-muted mb-1.5">${f.label}</label>
      <div class="flex items-center gap-4">
        <img data-image-preview="${f.key}" src="${val}" class="w-16 h-16 rounded object-cover border border-line upload-preview ${val ? '' : 'hidden'}" alt="">
        <div class="flex-1 space-y-2">
          <input type="file" accept="image/*" data-image-file="${f.key}" class="block w-full text-xs text-muted font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-line file:bg-surface2 file:text-fg file:text-xs">
          <input name="${f.key}" type="text" value="${val}" placeholder="${placeholder}" class="w-full bg-ink border border-line rounded px-3 py-2 text-xs text-fg focus:border-amber outline-none">
        </div>
      </div>
    </div>`;
  }
  if (f.type === 'textarea' || f.type === 'lines') {
    const val = esc(f.type === 'lines' ? (rawValue || []).join('\n') : (rawValue ?? ''));
    return `<div><label class="block font-mono text-xs text-muted mb-1.5">${f.label}</label>
      <textarea name="${f.key}" rows="3" placeholder="${placeholder}" class="w-full bg-ink border border-line rounded px-4 py-2.5 text-fg focus:border-amber outline-none">${val}</textarea></div>`;
  }
  const val = esc(f.type === 'tags' ? (rawValue || []).join(', ') : (rawValue ?? ''));
  return `<div><label class="block font-mono text-xs text-muted mb-1.5">${f.label}</label>
    <input name="${f.key}" type="text" ${f.required ? 'required' : ''} value="${val}" placeholder="${placeholder}" class="w-full bg-ink border border-line rounded px-4 py-2.5 text-fg focus:border-amber outline-none"></div>`;
}

document.getElementById('dlg-form').addEventListener('click', ev => {
  if (ev.target === document.getElementById('dlg-form')) ev.target.close();
});

/* =========================================================================
   SETTINGS — export / import / reset
   (Password change removed — use Supabase Auth dashboard instead)
   ========================================================================= */
document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'portfolio-data.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-import').addEventListener('click', () =>
  document.getElementById('import-file').click()
);

document.getElementById('import-file').addEventListener('change', async ev => {
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!confirm('Import this data? Existing content in the database will be replaced.')) return;

      // overwrite each table
      const upsertAll = async (table, items) => {
        for (const item of (items || [])) {
          const { id, ...rest } = item;
          await DataStore.db().from(table).upsert({ id, ...rest });
        }
      };

      if (imported.profile)      await DataStore.saveProfile(imported.profile);
      if (imported.projects)     await upsertAll('projects', imported.projects);
      if (imported.experience)   await upsertAll('experience', imported.experience);
      if (imported.education)    await upsertAll('education', imported.education);
      if (imported.skills)       await upsertAll('skills', imported.skills);
      if (imported.testimonials) await upsertAll('testimonials', imported.testimonials);

      await loadAll();
      renderDashboard();
      alert('Data imported successfully.');
    } catch (e) { alert("That file isn't valid JSON or the import failed: " + e.message); }
  };
  reader.readAsText(file);
  ev.target.value = '';
});

document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!confirm('Reset all content to starter defaults? This is permanent.')) return;
  // Just clear each table — re-seed by re-running supabase-setup.sql
  try {
    await DataStore.db().from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await DataStore.db().from('experience').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await DataStore.db().from('education').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await DataStore.db().from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await DataStore.db().from('testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await loadAll();
    renderDashboard();
    alert('Content cleared. Re-run supabase-setup.sql to restore starter data, or add your own.');
  } catch (err) { alert('Reset failed: ' + err.message); }
});

/* =========================================================================
   HELPERS
   ========================================================================= */
function camelToSnake(s) { return s.replace(/([A-Z])/g, '_$1').toLowerCase(); }
function snakeToCamel(s) { return s.replace(/_([a-z])/g, (_,c) => c.toUpperCase()); }

function flashSaved(id) {
  const el = document.getElementById(id); if (!el) return;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2200);
}

Theme.wireToggle('theme-toggle');
