/* =========================================================================
   main.js — Public portfolio page (index.html)
   Fetches all data from Supabase on load; subscribes to real-time updates
   so changes saved in admin.html appear instantly without a refresh.
   ========================================================================= */

let _state = {
  profile: {},
  projects: [],
  experience: [],
  education: [],
  skills: [],
  testimonials: [],
};
let activeFilter = 'All';

/* =========================================================================
   BOOT
   ========================================================================= */
async function init() {
  try {
    await loadAll();
    renderAll();
    subscribeRealtime();
  } catch (err) {
    console.error('Failed to load portfolio data:', err);
    showLoadError(err);
  }
}

async function loadAll() {
  const [profile, projects, experience, education, skills, testimonials] = await Promise.all([
    DataStore.getProfile(),
    DataStore.getAll('projects'),
    DataStore.getAll('experience'),
    DataStore.getAll('education'),
    DataStore.getAll('skills'),
    DataStore.getAll('testimonials'),
  ]);
  _state = { profile, projects, experience, education, skills, testimonials };
}

function showLoadError(err) {
  if (err?.message?.includes('YOUR_SUPABASE_URL')) {
    const banner = document.createElement('div');
    banner.className = 'fixed top-0 inset-x-0 z-[9999] bg-coral text-ink font-mono text-xs text-center py-3 px-4';
    banner.innerHTML = '⚠ Open <strong>data.js</strong> and replace <code>YOUR_SUPABASE_URL</code> and <code>YOUR_SUPABASE_ANON_KEY</code> with your project\'s values.';
    document.body.prepend(banner);
  }
}

/* =========================================================================
   REAL-TIME (Supabase Realtime channels)
   Any write from the admin page refreshes the public page automatically.
   ========================================================================= */
function subscribeRealtime() {
  const db = DataStore.db();
  const tables = ['profile','projects','experience','education','skills','testimonials'];
  tables.forEach(table => {
    db.channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
        await loadAll();
        renderAll();
      })
      .subscribe();
  });
}

/* =========================================================================
   RENDER — profile
   ========================================================================= */
function renderProfile() {
  const p = _state.profile;
  if (!p || !p.headline) return;

  startTypedLine(p.eyebrow || 'load_profile()');
  document.getElementById('hero-headline').textContent = p.headline;
  document.getElementById('hero-subhead').textContent  = p.subhead;
  document.getElementById('hero-calendly').href        = p.calendly || '#';
  document.getElementById('about-photo').src           = p.photo_url || p.photoUrl || 'Cherop.png';
  document.getElementById('about-bio').textContent     = p.bio;

  const resumeBtn = document.getElementById('resume-download');
  const resumeUrl = p.resume_url || p.resumeUrl || '';
  if (resumeUrl) {
    resumeBtn.href = resumeUrl;
    resumeBtn.classList.remove('opacity-50', 'pointer-events-none');
  } else {
    resumeBtn.href = '#';
    resumeBtn.classList.add('opacity-50', 'pointer-events-none');
  }

  document.getElementById('contact-email').href        = 'mailto:' + p.email;
  document.getElementById('contact-email-text').textContent = p.email;
  document.getElementById('contact-calendly').href     = p.calendly || '#';
  document.getElementById('contact-whatsapp').href     = p.whatsapp || '#';
  document.getElementById('footer-linkedin').href      = p.linkedin || '#';
  document.getElementById('footer-github').href        = p.github || '#';
  document.getElementById('footer-year').textContent   = new Date().getFullYear();

  const s1 = p.stat1 || '';
  const s2 = p.stat2 || '';
  const s3 = p.stat3 || '';
  const l1 = p.stat1_label || p.stat1Label || '';
  const l2 = p.stat2_label || p.stat2Label || '';
  const l3 = p.stat3_label || p.stat3Label || '';

  document.getElementById('hero-stats').innerHTML = `
    <div><p class="text-amber font-bold text-lg">${esc(s1)}</p><p class="text-muted">${esc(l1)}</p></div>
    <div><p class="text-teal font-bold text-lg">${esc(s2)}</p><p class="text-muted">${esc(l2)}</p></div>
    <div><p class="text-coral font-bold text-lg">${esc(s3)}</p><p class="text-muted">${esc(l3)}</p></div>
  `;
}

function startTypedLine(text) {
  const el = document.getElementById('typed-line');
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { el.textContent = text; return; }
  el.textContent = '';
  let i = 0;
  const tick = () => {
    if (i <= text.length) { el.textContent = text.slice(0, i); i++; setTimeout(tick, 35); }
  };
  tick();
}

/* =========================================================================
   RENDER — skills
   ========================================================================= */
function renderSkills() {
  const wrap = document.getElementById('skills-list');
  wrap.innerHTML = _state.skills.map(s => `
    <div>
      <p class="font-mono text-xs text-muted mb-2">${esc(s.category)}</p>
      <div class="flex flex-wrap gap-2">
        ${(s.items || []).map(item => `<span class="chip bg-ink border border-line text-fg px-2.5 py-1 rounded">${esc(item)}</span>`).join('')}
      </div>
    </div>
  `).join('') || '<p class="text-muted font-mono text-sm">No skills listed yet.</p>';
}

/* =========================================================================
   RENDER — experience
   ========================================================================= */
function renderExperience() {
  const wrap = document.getElementById('experience-list');
  wrap.innerHTML = _state.experience.map(e => `
    <div class="border-l-2 border-line pl-5">
      <p class="font-mono text-xs text-amber">${esc(e.period)}</p>
      <h4 class="text-fg font-semibold mt-1">${esc(e.role)} · <span class="text-muted font-normal">${esc(e.org)}</span></h4>
      <ul class="mt-2 space-y-1 text-sm text-muted list-disc list-inside">
        ${(e.points || []).map(pt => `<li>${esc(pt)}</li>`).join('')}
      </ul>
    </div>
  `).join('') || '<p class="text-muted font-mono text-sm">No experience added yet.</p>';
}

/* =========================================================================
   RENDER — education
   ========================================================================= */
function renderEducation() {
  const wrap = document.getElementById('education-list');
  wrap.innerHTML = _state.education.map(e => `
    <div class="border-l-2 border-line pl-5">
      <p class="font-mono text-xs text-teal">${esc(e.period)}</p>
      <h4 class="text-fg font-semibold mt-1">${esc(e.degree)}</h4>
      <p class="text-sm text-muted">${esc(e.org)}</p>
    </div>
  `).join('') || '<p class="text-muted font-mono text-sm">No education added yet.</p>';
}

/* =========================================================================
   RENDER — projects (with filter)
   ========================================================================= */
function renderFilters() {
  const tags = ['All', ...new Set(_state.projects.flatMap(p => p.tags || []))];
  document.getElementById('project-filters').innerHTML = tags.map(t => `
    <button data-filter="${esc(t)}" class="px-3 py-1.5 rounded border ${t === activeFilter ? 'bg-amber text-ink border-amber' : 'border-line text-muted hover:text-fg'}">${esc(t)}</button>
  `).join('');
}

function renderProjects() {
  renderFilters();
  const list = activeFilter === 'All'
    ? _state.projects
    : _state.projects.filter(p => (p.tags || []).includes(activeFilter));

  const grid  = document.getElementById('projects-grid');
  const empty = document.getElementById('projects-empty');
  empty.classList.toggle('hidden', _state.projects.length > 0);

  grid.innerHTML = list.map((p, i) => {
    const img = p.image_url || p.imageUrl || '';
    return `
    <div data-id="${p.id}" class="project-card bg-surface border border-line rounded overflow-hidden hover:border-teal cursor-pointer">
      ${img ? `<img src="${esc(img)}" alt="" class="w-full h-40 object-cover">` : ''}
      <div class="p-7">
        <p class="chip text-muted mb-3">Out [${String(i + 1).padStart(2, '0')}]:</p>
        <h3 class="text-xl font-mono font-bold text-fg mb-2">${esc(p.title)}</h3>
        <p class="text-sm text-muted leading-relaxed">${esc(p.result)}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          ${(p.tags || []).map(t => `<span class="chip bg-ink border border-line text-muted px-2.5 py-1 rounded">${esc(t)}</span>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => openProjectView(card.dataset.id));
  });
}

/* =========================================================================
   RENDER — testimonials
   ========================================================================= */
function renderTestimonials() {
  const grid    = document.getElementById('testimonials-grid');
  const section = document.getElementById('testimonials');
  section.classList.toggle('hidden', _state.testimonials.length === 0);
  grid.innerHTML = _state.testimonials.map(t => `
    <div class="bg-ink border border-line rounded p-6">
      <p class="text-fg text-sm leading-relaxed">"${esc(t.quote)}"</p>
      <p class="font-mono text-xs text-amber mt-4">${esc(t.name)}<span class="text-muted"> — ${esc(t.role)}</span></p>
    </div>
  `).join('');
}

/* =========================================================================
   RENDER ALL
   ========================================================================= */
function renderAll() {
  renderProfile();
  renderSkills();
  renderExperience();
  renderEducation();
  renderProjects();
  renderTestimonials();
}

/* =========================================================================
   PROJECT DETAIL DIALOG
   ========================================================================= */
function openProjectView(id) {
  const p   = _state.projects.find(x => x.id === id);
  if (!p) return;
  const idx = _state.projects.findIndex(x => x.id === id) + 1;

  document.getElementById('pview-id').textContent       = String(idx).padStart(2, '0');
  document.getElementById('pview-title').textContent    = p.title;
  document.getElementById('pview-problem').textContent  = p.problem;
  document.getElementById('pview-solution').textContent = p.solution;
  document.getElementById('pview-result').textContent   = p.result;
  document.getElementById('pview-tags').innerHTML       = (p.tags || []).map(t =>
    `<span class="chip bg-ink border border-line text-muted px-2.5 py-1 rounded">${esc(t)}</span>`
  ).join('');

  const img = p.image_url || p.imageUrl || '';
  const imgEl = document.getElementById('pview-image');
  if (img) { imgEl.src = img; imgEl.classList.remove('hidden'); }
  else imgEl.classList.add('hidden');

  const link = document.getElementById('pview-link');
  if (p.link) { link.href = p.link; link.classList.remove('hidden'); }
  else link.classList.add('hidden');

  document.getElementById('dlg-project').showModal();
}

/* =========================================================================
   DIALOGS — close on × or backdrop click
   ========================================================================= */
document.querySelectorAll('[data-close-dialog]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach(dlg => {
  dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg.close(); });
});

/* =========================================================================
   FILTER CLICKS
   ========================================================================= */
document.getElementById('project-filters').addEventListener('click', ev => {
  const btn = ev.target.closest('[data-filter]');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  renderProjects();
});

/* =========================================================================
   CONTACT FORM (mailto fallback)
   ========================================================================= */
document.getElementById('contact-form').addEventListener('submit', ev => {
  ev.preventDefault();
  const name    = document.getElementById('cf-name').value.trim();
  const email   = document.getElementById('cf-email').value.trim();
  const message = document.getElementById('cf-message').value.trim();
  if (!name || !email || !message) return;
  const subject = encodeURIComponent('Project inquiry from ' + name);
  const body    = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:${_state.profile.email}?subject=${subject}&body=${body}`;
  const status = document.getElementById('cf-status');
  status.textContent = 'Opening your email app…';
  status.classList.remove('hidden');
});

/* =========================================================================
   NAV — mobile menu, smooth scroll, active link highlight, back-to-top
   ========================================================================= */
const menuBtn    = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
menuBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('flex');
  mobileMenu.classList.toggle('hidden', !open);
  menuBtn.setAttribute('aria-expanded', String(open));
  document.getElementById('menu-icon-open').classList.toggle('hidden', open);
  document.getElementById('menu-icon-close').classList.toggle('hidden', !open);
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.add('hidden');
  mobileMenu.classList.remove('flex');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.getElementById('menu-icon-open').classList.remove('hidden');
  document.getElementById('menu-icon-close').classList.add('hidden');
}));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', ev => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { ev.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

const navLinks = document.querySelectorAll('[data-nav]');
const sections = [...navLinks].map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
const navObs   = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('text-amber', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });
sections.forEach(s => navObs.observe(s));

const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => backToTop.classList.toggle('hidden', window.scrollY < 600));
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); revealObs.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

Theme.wireToggle('theme-toggle');
Theme.wireToggle('theme-toggle-mobile');

/* =========================================================================
   INIT
   ========================================================================= */
init();