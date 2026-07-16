/* =========================================================================
   data.js — Supabase data layer for Joseph Micah's portfolio
   =========================================================================
   SETUP:
   1. Create a project at https://supabase.com
   2. Run supabase-setup.sql in the SQL Editor
   3. Replace the two constants below with your project's values:
      Dashboard → Settings → API → Project URL & anon public key
   ========================================================================= */

const SUPABASE_URL  = 'https://zvtirhvlwlsjzdqlxoms.supabase.co';   
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2dGlyaHZsd2xzanpkcWx4b21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzAyMzUsImV4cCI6MjA5MTA0NjIzNX0.mGEEu6Jm7eixK3PpDPeiGiXNK2pSxQbRT8mvcvOCrNI';

/* =========================================================================
   TAILWIND CONFIG (must stay in data.js so it loads before Tailwind)
   ========================================================================= */
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
        ink:       'rgb(var(--color-ink) / <alpha-value>)',
        surface:   'rgb(var(--color-surface) / <alpha-value>)',
        surface2:  'rgb(var(--color-surface2) / <alpha-value>)',
        line:      'rgb(var(--color-line) / <alpha-value>)',
        fg:        'rgb(var(--color-fg) / <alpha-value>)',
        muted:     'rgb(var(--color-muted) / <alpha-value>)',
        amber:     'rgb(var(--color-amber) / <alpha-value>)',
        amberhover:'rgb(var(--color-amberhover) / <alpha-value>)',
        teal:      'rgb(var(--color-teal) / <alpha-value>)',
        coral:     'rgb(var(--color-coral) / <alpha-value>)',
        violet:    'rgb(var(--color-violet) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
};
}
/* =========================================================================
   THEME (light/dark) — runs immediately on load to prevent flash
   ========================================================================= */
const Theme = (() => {
  const KEY = 'jm_theme';
  function get()    { return localStorage.getItem(KEY) || 'dark'; }
  function apply(m) { document.documentElement.setAttribute('data-theme', m); }
  function set(m)   { localStorage.setItem(KEY, m); apply(m); }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }
  apply(get());
  function wireToggle(id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', toggle);
  }
  return { get, set, toggle, wireToggle };
})();

/* =========================================================================
   SUPABASE CLIENT (loaded inline — no build step needed)
   We use the CDN build of @supabase/supabase-js v2.
   ========================================================================= */
// Loaded via <script> tag in HTML (see index.html / admin.html)
// window.supabase.createClient is available after that tag.

function getSupabase() {
  if (!window._sb) {
    if (!window.supabase) throw new Error('Supabase JS not loaded — add the CDN script tag.');
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      throw new Error('Set SUPABASE_URL and SUPABASE_ANON in data.js before going live.');
    }
    window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return window._sb;
}

/* =========================================================================
   DataStore — async Supabase-backed CRUD
   All methods return plain JS objects that match the shape the renderers
   already expect (same keys as the old localStorage schema).
   ========================================================================= */
const DataStore = (() => {

  /* ── helpers ─────────────────────────────────────────────── */
  function db() { return getSupabase(); }

  function dbRow(row) {
    // Normalise Supabase snake_case → camelCase fields the renderers use
    if (!row) return null;
    return {
      ...row,
      // profile
      photoUrl:   row.photo_url,
      resumeUrl:  row.resume_url,
      stat1Label: row.stat1_label,
      stat2Label: row.stat2_label,
      stat3Label: row.stat3_label,
      // projects
      imageUrl:   row.image_url,
      // keep original keys too (some helpers use them)
      photo_url:  row.photo_url,
      resume_url: row.resume_url,
      image_url:  row.image_url,
    };
  }

  /* ── profile ─────────────────────────────────────────────── */
  async function getProfile() {
    const { data, error } = await db().from('profile').select('*').eq('id', 1).single();
    if (error) throw error;
    return dbRow(data);
  }

  async function saveProfile(updates) {
    // Convert camelCase back to snake_case for Supabase
    const row = {};
    const map = {
      photoUrl: 'photo_url', resumeUrl: 'resume_url',
      stat1Label: 'stat1_label', stat2Label: 'stat2_label', stat3Label: 'stat3_label',
    };
    for (const [k, v] of Object.entries(updates)) {
      row[map[k] || k] = v;
    }
    const { error } = await db().from('profile').update(row).eq('id', 1);
    if (error) throw error;
  }

  /* ── generic table CRUD ──────────────────────────────────── */
  async function getAll(table) {
    const { data, error } = await db().from(table).select('*').order('sort_order');
    if (error) throw error;
    return (data || []).map(dbRow);
  }

  async function insert(table, obj) {
    const row = toSnake(obj);
    const { data, error } = await db().from(table).insert(row).select().single();
    if (error) throw error;
    return dbRow(data);
  }

  async function update(table, id, obj) {
    const row = toSnake(obj);
    const { error } = await db().from(table).update(row).eq('id', id);
    if (error) throw error;
  }

  async function remove(table, id) {
    const { error } = await db().from(table).delete().eq('id', id);
    if (error) throw error;
  }

  /* ── auth (admin login via Supabase Auth) ────────────────── */
  async function signIn(email, password) {
    const { error } = await db().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await db().auth.signOut();
  }

  async function getSession() {
    const { data } = await db().auth.getSession();
    return data?.session ?? null;
  }

  function onAuthChange(cb) {
    db().auth.onAuthStateChange((_event, session) => cb(session));
  }

  /* ── Supabase Storage (for photo / resume / project images) ─ */
  async function uploadFile(bucket, path, file) {
    const { error } = await db().storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = db().storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /* ── helpers ─────────────────────────────────────────────── */
  function toSnake(obj) {
    const out = {};
    const map = {
      imageUrl: 'image_url', photoUrl: 'photo_url', resumeUrl: 'resume_url',
      stat1Label: 'stat1_label', stat2Label: 'stat2_label', stat3Label: 'stat3_label',
    };
    for (const [k, v] of Object.entries(obj)) {
      out[map[k] || k] = v;
    }
    // remove undefined/null id (let Supabase generate it)
    if (out.id === undefined || out.id === null) delete out.id;
    return out;
  }

  return {
    getProfile, saveProfile,
    getAll, insert, update, remove,
    signIn, signOut, getSession, onAuthChange,
    uploadFile,
    db,
  };
})();

/* =========================================================================
   UTILITIES (shared by main.js and admin.js)
   ========================================================================= */
function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* =========================================================================
   ENTITY SCHEMA (drives admin forms — unchanged from original)
   ========================================================================= */
const ID_PREFIX = { project:'p', experience:'e', education:'ed', skill:'s', testimonial:'t' };

const FIELD_DEFS = {
  project: [
    { key:'title',    label:'Project title',              type:'text',     required:true, placeholder:'e.g. Automated Sales Reporting in Google Sheets' },
    { key:'imageUrl', label:'Cover image',                type:'image',    placeholder:'https://…' },
    { key:'problem',  label:'Problem',                    type:'textarea', placeholder:'What was broken or costing the client time/money?' },
    { key:'solution', label:'Solution',                   type:'textarea', placeholder:'What did you build, and with what tools?' },
    { key:'result',   label:'Result',                     type:'textarea', placeholder:'What changed? Use a number if you can.' },
    { key:'tags',     label:'Tags (comma separated)',     type:'tags',     placeholder:'Python, SQL, Automation' },
    { key:'link',     label:'Live project / case study link (optional)', type:'text', placeholder:'https://…' },
  ],
  experience: [
    { key:'role',   label:'Role',                         type:'text',     required:true, placeholder:'e.g. Freelance Data Scientist' },
    { key:'org',    label:'Organization',                 type:'text',     placeholder:'e.g. Self-employed' },
    { key:'period', label:'Period',                       type:'text',     placeholder:'e.g. 2023 — present' },
    { key:'points', label:'Highlights (one per line)',    type:'lines',    placeholder:'Automated a weekly reporting pipeline\nCut manual QA time by 60%' },
  ],
  education: [
    { key:'degree', label:'Degree / certificate',         type:'text',     required:true, placeholder:'e.g. B.Sc. Data Science' },
    { key:'org',    label:'Institution',                  type:'text',     placeholder:'e.g. University of Nairobi' },
    { key:'period', label:'Period',                       type:'text',     placeholder:'e.g. 2019 — 2023' },
  ],
  skill: [
    { key:'category', label:'Category',                   type:'text',     required:true, placeholder:'e.g. Machine learning' },
    { key:'items',    label:'Skills (comma separated)',   type:'tags',     placeholder:'scikit-learn, Forecasting, Pandas' },
  ],
  testimonial: [
    { key:'quote', label:'Quote',                         type:'textarea', required:true, placeholder:'What did the client say about working with you?' },
    { key:'name',  label:'Client name',                   type:'text',     placeholder:'e.g. Amara K.' },
    { key:'role',  label:'Client role / company',         type:'text',     placeholder:'e.g. Ops Lead, Retailco' },
  ],
};