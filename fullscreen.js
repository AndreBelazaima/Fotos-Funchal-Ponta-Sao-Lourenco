// Botoes da barra do topo (mapa e paginas de progresso):
//  - Tema claro/escuro (a escolha fica guardada no aparelho);
//  - "Ecrã inteiro" (Fullscreen API; nos browsers sem ela, ex: iPhone, nao aparece);
//  - "Tamanho" (A+): aumenta os textos e controlos para ecras grandes/TV (100% a 175%).
//    Numa Smart TV (Samsung/Tizen, LG, etc.) arranca automaticamente a 150%.
(function () {
  var d = document, el = d.documentElement;

  // ---------- Altura real do ecra ----------
  // Em algumas TVs/browsers 100vh e maior do que a area visivel (sobretudo em ecra inteiro) e o
  // fundo da pagina (perfil longitudinal) fica cortado. Usa-se window.innerHeight, sempre atualizado.
  function fitHeight() {
    var h = window.innerHeight;
    if (h > 0) el.style.setProperty('--app-h', h + 'px');
    if (window.map && map.invalidateSize) map.invalidateSize();
  }
  fitHeight();
  ['resize', 'orientationchange', 'fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    window.addEventListener(ev, function () { fitHeight(); setTimeout(fitHeight, 250); setTimeout(fitHeight, 1000); });
    d.addEventListener(ev, function () { fitHeight(); setTimeout(fitHeight, 250); setTimeout(fitHeight, 1000); });
  });

  // ---------- Diagnostico (?diag=1): mostra as medidas reais do ecra, para afinar o layout numa TV ----------
  if (/[?&]diag=1/.test(location.search)) {
    var box = d.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;background:rgba(0,0,0,.82);color:#0f0;font:12px/1.35 monospace;padding:8px 10px;border-radius:6px;max-width:94vw;white-space:pre-wrap;pointer-events:none;';
    d.body.appendChild(box);
    var upd = function () {
      var pp = d.getElementById('profilePanel'), r = pp ? pp.getBoundingClientRect() : null;
      box.textContent = 'inner ' + innerWidth + 'x' + innerHeight + ' | outer ' + outerWidth + 'x' + outerHeight + ' | screen ' + screen.width + 'x' + screen.height +
        ' | dpr ' + devicePixelRatio + ' | vh100 ' + (function () { var e = d.createElement('div'); e.style.cssText = 'position:fixed;top:0;height:100vh'; d.body.appendChild(e); var v = e.offsetHeight; e.remove(); return v; })() +
        '\nprofile ' + (r ? Math.round(r.top) + '..' + Math.round(r.bottom) : '-') + ' | app-h ' + el.style.getPropertyValue('--app-h') +
        '\nfs ' + !!(d.fullscreenElement || d.webkitFullscreenElement) + ' | ui ' + (el.style.getPropertyValue('--ui') || 1) + '\n' + navigator.userAgent;
    };
    upd(); setInterval(upd, 1000);
  }

  var bar = d.querySelector('.topbar');
  if (!bar) return;
  var isApp = window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches);

  // ---------- Tamanho da interface ----------
  var LEVELS = [1, 1.25, 1.5, 1.75];
  var KEY = 'ui-escala';
  var isTV = /SMART-?TV|Tizen|Web0S|NetCast|HbbTV|TV Safari/i.test(navigator.userAgent);
  function loadLevel() {
    try { var v = parseFloat(localStorage.getItem(KEY)); if (LEVELS.indexOf(v) >= 0) return v; } catch (e) {}
    return isTV ? 1.5 : 1;
  }
  var level = loadLevel();
  var uiCss = d.createElement('style');
  uiCss.textContent =
    '.ui-zoom:not(.ui-prog) .topbar, .ui-zoom:not(.ui-prog) .sidebar{zoom:var(--ui);}' +
    '.ui-zoom .topbar{flex-wrap:wrap; height:auto; min-height:60px; padding-top:6px; padding-bottom:6px; row-gap:6px;}' +
    '.ui-zoom .proj-title{flex:1 1 220px;}' +
    'html.ui-zoom.ui-prog{zoom:var(--ui);}' +
    '.ui-zoom .leaflet-bar a{width:calc(30px*var(--ui)) !important; height:calc(30px*var(--ui)) !important; line-height:calc(30px*var(--ui)) !important; font-size:calc(18px*var(--ui)) !important;}' +
    '.ui-zoom .leaflet-control-scale{font-size:calc(11px*var(--ui));}' +
    '.ui-zoom .leaflet-popup-content{font-size:calc(13px*var(--ui)); width:auto !important; min-width:calc(220px*var(--ui));}';
  d.head.appendChild(uiCss);
  function applyLevel() {
    el.style.setProperty('--ui', level);
    el.classList.toggle('ui-zoom', level !== 1);
    el.classList.toggle('ui-prog', !d.getElementById('map'));
    if (window.map && map.invalidateSize) setTimeout(function () { map.invalidateSize(); }, 50);
    window.dispatchEvent(new Event('resize'));
  }
  applyLevel();

  var request = el.requestFullscreen || el.webkitRequestFullscreen;
  var exit = d.exitFullscreen || d.webkitExitFullscreen;
  var btnCss = d.createElement('style');
  btnCss.textContent =
    '.tb-btn{flex:0 0 auto; min-width:36px; height:36px; margin-left:10px; display:inline-flex; align-items:center; justify-content:center;' +
    'background:var(--surface,#fff); border:1px solid var(--line-strong,#D6D0C2); border-radius:8px; color:var(--ink,#22252A); cursor:pointer; padding:0 8px; font:600 12px/1 inherit;}' +
    '.tb-btn:hover,.tb-btn:focus-visible{border-color:var(--gold,#D9A115); outline:none;} .tb-btn svg{width:18px; height:18px;}';
  d.head.appendChild(btnCss);
  // ---------- Tema claro / escuro ----------
  var tm = d.createElement('button');
  tm.type = 'button'; tm.className = 'tb-btn';
  var ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var MOON = '<svg ' + ICON_ATTRS + '><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN = '<svg ' + ICON_ATTRS + '><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function isDark() { return el.getAttribute('data-theme') === 'dark'; }
  function themeLabel() {
    tm.innerHTML = isDark() ? SUN : MOON;
    tm.title = isDark() ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    tm.setAttribute('aria-label', tm.title);
  }
  themeLabel();
  tm.addEventListener('click', function () {
    var dark = !isDark();
    if (dark) el.setAttribute('data-theme', 'dark'); else el.removeAttribute('data-theme');
    try { localStorage.setItem('tema', dark ? 'dark' : 'light'); } catch (e) {}
    themeLabel();
    window.dispatchEvent(new Event('themechange'));
  });
  bar.appendChild(tm);

  var sz = d.createElement('button');
  sz.type = 'button'; sz.className = 'tb-btn';
  function szLabel() { sz.innerHTML = 'A+ <span style="margin-left:4px;font-weight:500;opacity:.7">' + Math.round(level * 100) + '%</span>'; sz.title = 'Tamanho do texto e dos controlos (para TV)'; sz.setAttribute('aria-label', sz.title); }
  szLabel();
  sz.addEventListener('click', function () {
    level = LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length];
    try { localStorage.setItem(KEY, String(level)); } catch (e) {}
    applyLevel(); szLabel();
  });
  bar.appendChild(sz);

  // ---------- Ecra inteiro ----------
  if (!request || !exit || isApp) return;

  var css = d.createElement('style');
  css.textContent =
    '.fs-btn .fs-off{display:none;} .fs-on .fs-btn .fs-off{display:block;} .fs-on .fs-btn .fs-on-i{display:none;}';
  d.head.appendChild(css);

  var attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var b = d.createElement('button');
  b.type = 'button'; b.className = 'tb-btn fs-btn'; b.title = 'Ecrã inteiro'; b.setAttribute('aria-label', 'Ecrã inteiro');
  b.innerHTML =
    '<svg class="fs-on-i" ' + attrs + '><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>' +
    '<svg class="fs-off" ' + attrs + '><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>';

  function active() { return d.fullscreenElement || d.webkitFullscreenElement; }
  function sync() {
    var on = !!active();
    el.classList.toggle('fs-on', on);
    b.title = on ? 'Sair do ecrã inteiro' : 'Ecrã inteiro';
    b.setAttribute('aria-label', b.title);
  }
  b.addEventListener('click', function () {
    try {
      if (active()) exit.call(d); else request.call(el);
    } catch (e) { /* ignora: o browser pode recusar */ }
  });
  d.addEventListener('fullscreenchange', sync);
  d.addEventListener('webkitfullscreenchange', sync);
  bar.appendChild(b);
})();
