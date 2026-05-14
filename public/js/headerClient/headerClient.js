/**
 * Psicologic — Navigation Engine + Sidebar
 */

window.__PSICOLOGIC_READY = window.__PSICOLOGIC_READY || false;

/* ─── Icon map ───────────────────────────────────────────────────────────── */
const SVG = (d, extra = '') =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

const ICONS = {
  dashboard: SVG(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`),
  agenda:    SVG(`<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`),
  history:   SVG(`<path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 16V11H8"/>`),
  games:     SVG(`<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M8 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/>`),
  settings:  SVG(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.18V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>`),
  patients:  SVG(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>`),
  reports:   SVG(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`),
  video:     SVG(`<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>`),
  chat:      SVG(`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`),
  stats:     SVG(`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`),
  billing:   SVG(`<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>`),
  horario:   SVG(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`),
  profile:   SVG(`<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>`),
  default:   SVG(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/>`),
};

function getIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('dashboard') || n.includes('inicio')) return ICONS.dashboard;
  if (n.includes('agenda') || n.includes('cita') || n.includes('calendar')) return ICONS.agenda;
  if (n.includes('histor')) return ICONS.history;
  if (n.includes('jueg') || n.includes('game')) return ICONS.games;
  if (n.includes('horario')) return ICONS.horario;
  if (n.includes('config') || n.includes('setting')) return ICONS.settings;
  if (n.includes('paciente') || n.includes('patient') || n.includes('usuario') || n.includes('user')) return ICONS.patients;
  if (n.includes('reporte') || n.includes('report') || n.includes('informe')) return ICONS.reports;
  if (n.includes('video') || n.includes('meet') || n.includes('llamada')) return ICONS.video;
  if (n.includes('chat') || n.includes('mensaje')) return ICONS.chat;
  if (n.includes('estadistica') || n.includes('stat') || n.includes('analytic')) return ICONS.stats;
  if (n.includes('pago') || n.includes('billing') || n.includes('factura') || n.includes('metodo')) return ICONS.billing;
  if (n.includes('perfil') || n.includes('profile')) return ICONS.profile;
  return ICONS.default;
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
const ProgressBar = {
  el: null, bar: null,
  init() { this.el = document.getElementById('global-page-loader'); if (this.el) this.bar = this.el.firstElementChild; },
  start() { if (!this.el) this.init(); if (this.el) { this.el.classList.remove('opacity-0'); this.bar.style.width = '70%'; } },
  finish() {
    if (!this.el) return;
    this.bar.style.width = '100%';
    setTimeout(() => { this.el.classList.add('opacity-0'); setTimeout(() => this.bar.style.width = '0%', 300); }, 200);
  }
};

/* ─── Navigation ─────────────────────────────────────────────────────────── */
const Nav = {
  busy: false,
  async go(url) {
    if (window.location.pathname === url || this.busy) return;
    this.busy = true;
    ProgressBar.start();
    const main = document.querySelector('.main-content');
    if (main) { main.style.transition = 'opacity .2s ease'; main.style.opacity = '.3'; }
    try {
      const r = await fetch(url, { headers: { Accept: 'text/html' }, credentials: 'include' });
      if (!r.ok) throw 0;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      const nm = doc.querySelector('.main-content');
      if (main && nm) {
        history.pushState({}, '', url);
        main.innerHTML = nm.innerHTML;
        nm.querySelectorAll('script').forEach(s => {
          const ns = document.createElement('script');
          if (s.src) { ns.src = s.src; ns.async = false; document.head.appendChild(ns); }
          else setTimeout(() => { try { new Function(`try{${s.textContent}}catch(e){}`)(); } catch(_){} }, 0);
        });
        requestAnimationFrame(() => {
          main.style.opacity = '1';
          Sidebar.setActive(url);
          if (window.innerWidth < 640) Sidebar.hide();
        });
      }
    } catch(_) { window.location.href = url; }
    finally { this.busy = false; ProgressBar.finish(); }
  }
};

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
const Sidebar = {
  init() {
    if (window.__PSICOLOGIC_READY) { this.setActive(window.location.pathname); return; }
    this._listeners();
    this._loadMenu();
    window.__PSICOLOGIC_READY = true;
  },

  _listeners() {
    document.addEventListener('click', e => {
      // nav links
      const a = e.target.closest('a[data-navigate]');
      if (a) { e.preventDefault(); Nav.go(a.getAttribute('href')); }

      // dropdowns
      const btn = e.target.closest('[data-collapse-toggle]');
      if (btn) {
        const ul = document.getElementById(btn.dataset.collapseToggle);
        const ch = btn.querySelector('.sb-chevron');
        if (ul) { const open = !ul.classList.contains('hidden'); ul.classList.toggle('hidden'); ch?.classList.toggle('open', !open); }
      }

      if (e.target.closest('#sidebar-toggle')) this.show();
      if (e.target.closest('#sidebar-overlay') || e.target.closest('#sidebar-close')) this.hide();
    });
    window.addEventListener('popstate', () => Nav.go(window.location.pathname));
  },

  async _loadMenu() {
    const c = document.getElementById('sidebar-menu-client-dynamic');
    if (!c || window.location.pathname.includes('/agenda/meet')) return;
    try {
      const data = await (await fetch('/api/settings/games/menu', { credentials: 'include' })).json();
      const items = data[0]?.menu?.menu || [];
      c.innerHTML = items.filter(i => i.status !== false).map(i => {
        const label = i.name === 'config_agend' ? 'Config. Horario' : (i.nametext || i.name);
        if (Array.isArray(i.subItem) && i.subItem.length) return this._sub(label, i.subItem, i.name);
        const path = i.name === 'Historia Clinica' ? '/client/history/historias' : `/client/${i.name}`;
        return this._item(label, path);
      }).join('');
      this.setActive(window.location.pathname);
    } catch(_) { setTimeout(() => this._loadMenu(), 5000); }
  },

  _item(label, path) {
    return `<li><a href="${path}" data-navigate class="sb-link"><span class="sb-icon">${getIcon(label)}</span><span class="sb-label">${label}</span></a></li>`;
  },

  _sub(label, subs, key) {
    const id = `drop-${String(key).replace(/\s/g, '')}`;
    const base = label.toLowerCase().includes('jueg') ? '/client/games' : '/client/settings';
    const links = subs.map(s =>
      `<li><a href="${base}/${s.name}" data-navigate class="sb-sublink">${s.nametext || s.name}</a></li>`
    ).join('');
    return `<li>
      <button type="button" data-collapse-toggle="${id}" class="sb-dropdown-toggle sb-link">
        <span class="sb-icon">${getIcon(label)}</span>
        <span class="sb-label">${label}</span>
        <svg class="sb-chevron" width="14" height="14" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="m1 1 4 4 4-4"/>
        </svg>
      </button>
      <ul id="${id}" class="sb-sublist hidden">${links}</ul>
    </li>`;
  },

  show() {
    const s = document.getElementById('separator-sidebar');
    const o = document.getElementById('sidebar-overlay');
    if (s) s.style.transform = 'translateX(0)';
    if (o) o.style.display = 'block';
    document.body.style.overflow = 'hidden';
  },

  hide() {
    const s = document.getElementById('separator-sidebar');
    const o = document.getElementById('sidebar-overlay');
    if (s) s.style.transform = '';
    if (o) o.style.display = 'none';
    document.body.style.overflow = '';
  },

  setActive(url) {
    document.querySelectorAll('.sb-link').forEach(a => {
      const href = a.getAttribute('href');
      const on = href === url || (href && href !== '/client' && url.startsWith(href));
      a.classList.toggle('active', !!on);
      // legacy compat
      a.classList.remove('bg-gray-100', 'dark:bg-gray-700');
    });
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Sidebar.init());
else Sidebar.init();