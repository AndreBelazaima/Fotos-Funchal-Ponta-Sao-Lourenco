// Botao "Visão Geral" na barra do topo (mapa e paginas de progresso): abre um painel com o
// resumo do projeto (progresso global, barras dos troços, qualidade). Dados: resumo.js (gerado pelo robo).
(function () {
  var d = document;
  var bar = d.querySelector('.topbar');
  if (!bar || d.getElementById('vgBtn')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = d.createElement('style');
  css.textContent =
    '.vg-btn{flex:0 0 auto; display:inline-flex; align-items:center; gap:7px; height:36px; padding:0 14px; margin:0 4px; border-radius:9px; cursor:pointer;' +
    'background:var(--gold,#D9A115); border:1px solid var(--gold,#D9A115); color:#3A2A00; font:700 12.5px/1 inherit; font-family:inherit; white-space:nowrap;}' +
    '.vg-btn:hover{filter:brightness(1.06);} .vg-btn svg{width:15px; height:15px;}' +
    '.vg-ov{position:fixed; inset:0; z-index:5000; background:rgba(14,15,17,.62); backdrop-filter:blur(3px); display:none; overflow-y:auto; padding:28px 16px 40px;}' +
    '.vg-ov.open{display:block;}' +
    '.vg{max-width:1080px; margin:0 auto; background:var(--paper,#F6F4EF); color:var(--ink,#22252A); border:1px solid var(--line,#E6E1D6); border-radius:20px;' +
    'box-shadow:0 24px 70px rgba(0,0,0,.45); padding:26px 28px 24px; position:relative; font-family:"IBM Plex Sans",system-ui,sans-serif;}' +
    '.vg-x{position:absolute; top:12px; right:14px; width:34px; height:34px; border-radius:50%; border:1px solid var(--line-strong,#D6D0C2); background:var(--surface,#fff);' +
    'color:var(--ink,#22252A); font-size:20px; line-height:1; cursor:pointer;}' +
    '.vg-x:hover{border-color:var(--gold,#D9A115);}' +
    '.vg h2,.vg h3{font-family:"Archivo",system-ui,sans-serif; margin:0;}' +
    '.vg-eyebrow{font-size:11px; text-transform:uppercase; letter-spacing:.14em; color:var(--ink-soft,#5B5F65); font-weight:600;}' +
    '.vg-top{display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; padding-right:40px;}' +
    '.vg-big{font-family:"Archivo",sans-serif; font-weight:800; font-size:clamp(52px,9vw,92px); line-height:.95; letter-spacing:-.02em;}' +
    '.vg-big small{font-size:.42em; color:var(--gold-dark,#AD7C0C); margin-left:4px;}' +
    '.vg-sub{font-size:14px; color:var(--ink-soft,#5B5F65); margin-top:6px;} .vg-sub b{color:var(--ink,#22252A); font-weight:600;}' +
    '.vg-meta{display:flex; gap:24px; flex-wrap:wrap;} .vg-meta div{display:flex; flex-direction:column; gap:2px;}' +
    '.vg-meta .v{font-family:"IBM Plex Mono",monospace; font-size:22px; font-weight:600;}' +
    '.vg-meta .l{font-size:10px; text-transform:uppercase; letter-spacing:.07em; color:var(--ink-soft,#5B5F65); font-weight:600;}' +
    '.vg-tracks{display:flex; flex-direction:column; gap:22px; margin-top:24px;}' +
    '.vg-th{display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:8px;}' +
    '.vg-th h3{font-size:16px; font-weight:700;} .vg-th h3 span{color:var(--ink-soft,#5B5F65);}' +
    '.vg-chip{display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600; margin-left:9px; vertical-align:2px;}' +
    '.vg-chip.done{background:rgba(75,127,82,.16); color:var(--good,#4B7F52);}' +
    '.vg-chip.live{background:rgba(217,161,21,.2); color:var(--gold-dark,#AD7C0C);}' +
    '.vg-chip.live::before{content:""; width:7px; height:7px; border-radius:50%; background:var(--gold,#D9A115); animation:vgp 1.6s ease-in-out infinite;}' +
    '@keyframes vgp{0%,100%{opacity:1; transform:scale(1);} 50%{opacity:.35; transform:scale(.7);}}' +
    '.vg-nums{font-family:"IBM Plex Mono",monospace; font-size:14px; color:var(--ink-soft,#5B5F65);} .vg-nums b{color:var(--ink,#22252A); font-size:19px; font-weight:600;}' +
    '.vg-bar{position:relative; height:26px; border-radius:99px; background:var(--vg-track,rgba(127,127,127,.2)); overflow:hidden; box-shadow:inset 0 1px 3px rgba(0,0,0,.12);}' +
    '.vg-fill{position:absolute; inset:0 auto 0 0; width:0; border-radius:99px; background:linear-gradient(90deg,#E9B73A,#D9A115 55%,#C48E0C); transition:width 1.5s cubic-bezier(.16,1,.3,1); box-shadow:0 0 16px rgba(217,161,21,.5);}' +
    '.vg-fill.done{background:linear-gradient(90deg,#5E9A66,#4B7F52); box-shadow:0 0 16px rgba(75,127,82,.45);}' +
    '.vg-ticks{display:flex; justify-content:space-between; font-family:"IBM Plex Mono",monospace; font-size:10px; color:var(--ink-soft,#5B5F65); margin-top:5px; padding:0 3px;}' +
    '.vg-foot{display:flex; gap:9px; flex-wrap:wrap; margin-top:11px; align-items:center;}' +
    '.vg-a{display:inline-flex; align-items:center; gap:6px; padding:7px 13px; border-radius:9px; border:1px solid var(--line-strong,#D6D0C2); background:var(--surface,#fff); font-size:12px; font-weight:600; color:var(--ink,#22252A); text-decoration:none;}' +
    '.vg-a:hover{border-color:var(--gold,#D9A115);} .vg-a.p{background:var(--ink,#22252A); color:var(--on-ink,#fff); border-color:var(--ink,#22252A);} .vg-a svg{width:13px; height:13px;}' +
    '.vg-today{margin-left:auto; font-size:12px; color:var(--ink-soft,#5B5F65);} .vg-today b{color:var(--ink,#22252A);}' +
    '.vg-st{font-size:12px; text-transform:uppercase; letter-spacing:.12em; color:var(--ink-soft,#5B5F65); font-weight:700; margin:24px 2px 10px;}' +
    '.vg-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(215px,1fr)); gap:14px;}' +
    '.vg-q{background:var(--surface,#fff); border:1px solid var(--line,#E6E1D6); border-radius:16px; padding:18px 18px 16px; display:flex; flex-direction:column; gap:8px; box-shadow:var(--shadow,0 6px 24px rgba(34,37,42,.12));}' +
    '.vg-q h3{font-size:11.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-soft,#5B5F65); font-weight:700;}' +
    '.vg-rw{display:flex; align-items:center; gap:14px;} .vg-ring{width:92px; height:92px; flex:0 0 auto;}' +
    '.vg-ring .bg{stroke:var(--vg-track,rgba(127,127,127,.2));} .vg-ring .fg{stroke:var(--good,#4B7F52); transition:stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1);}' +
    '.vg-ring text{font-family:"Archivo",sans-serif; font-weight:800; fill:var(--ink,#22252A);}' +
    '.vg-num{font-family:"IBM Plex Mono",monospace; font-size:24px; font-weight:600; line-height:1.1;} .vg-num small{font-size:13px; color:var(--ink-soft,#5B5F65); font-weight:500;}' +
    '.vg-q p{margin:0; font-size:12px; color:var(--ink-soft,#5B5F65); line-height:1.5;} .vg-q p b{color:var(--ink,#22252A);}' +
    '.vg-scale{position:relative; height:11px; border-radius:99px; background:linear-gradient(90deg,#4B7F52 0%,#D9A115 70%,#C1471D 100%); margin-top:6px;}' +
    '.vg-scale i{position:absolute; top:-5px; left:0; width:4px; height:21px; border-radius:3px; background:var(--ink,#22252A); box-shadow:0 0 0 3px var(--surface,#fff); transition:left 1.5s cubic-bezier(.16,1,.3,1);}' +
    '.vg-scl{display:flex; justify-content:space-between; font-size:10px; color:var(--ink-soft,#5B5F65); font-family:"IBM Plex Mono",monospace;}' +
    '.vg-note{font-size:11px; color:var(--ink-soft,#5B5F65); margin-top:16px;}' +
    '@media (max-width:640px){ .vg{padding:20px 16px;} .vg-btn span{display:none;} .vg-today{margin-left:0;} }' +
    '@media (prefers-reduced-motion:reduce){ .vg-fill,.vg-ring .fg,.vg-scale i{transition:none;} .vg-chip.live::before{animation:none;} }';
  d.head.appendChild(css);

  function pt(n, dec) { return Number(n).toLocaleString('pt-PT', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  function countUp(el, to, dec, ms) {
    if (reduce || !isFinite(to)) { el.textContent = pt(to, dec); return; }
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pt(to * e, dec);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function ring(pct, label) {
    var r = 38, c = 2 * Math.PI * r;
    return '<svg class="vg-ring" viewBox="0 0 92 92" data-pct="' + pct + '">' +
      '<circle class="bg" cx="46" cy="46" r="' + r + '" fill="none" stroke-width="9"/>' +
      '<circle class="fg" cx="46" cy="46" r="' + r + '" fill="none" stroke-width="9" stroke-linecap="round" transform="rotate(-90 46 46)" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-c="' + c.toFixed(1) + '"/>' +
      '<text x="46" y="51" text-anchor="middle" font-size="16">' + label + '</text></svg>';
  }
  function track(t) {
    var done = t.concluido || t.pct >= 99.95;
    var chip = done ? '<span class="vg-chip done">&#10003; Concluído</span>' : '<span class="vg-chip live">Em curso</span>';
    var hoje = t.hoje && t.hoje.linhas ? '<span class="vg-today">Hoje: <b>' + t.hoje.linhas + '</b> ' + (t.hoje.linhas === 1 ? 'linha' : 'linhas') + ' &middot; <b>' + pt(t.hoje.metros, 0) + '</b> m</span>' : '';
    var ticks = [0, 0.25, 0.5, 0.75, 1].map(function (f) { return '<span>' + pt(t.total_km * f, f === 0 ? 0 : (f === 1 ? 2 : 1)) + ' km</span>'; }).join('');
    var q = t.mapa.indexOf('?') >= 0 ? '&' : '?';
    return '<div><div class="vg-th"><h3>Funchal <span>&rarr;</span> ' + t.nome + chip + '</h3>' +
      '<div class="vg-nums"><b data-km="' + t.nivelados_km + '">0</b> / ' + pt(t.total_km, 2) + ' km &nbsp;&middot;&nbsp; <b data-pct="' + t.pct + '">0</b>%</div></div>' +
      '<div class="vg-bar"><div class="vg-fill' + (done ? ' done' : '') + '" data-w="' + Math.min(100, t.pct) + '"></div></div><div class="vg-ticks">' + ticks + '</div>' +
      '<div class="vg-foot"><a class="vg-a p" href="index_novo.html' + t.mapa.replace('index.html', '') + q + 'replay=1"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>Replay do avanço</a>' +
      '<a class="vg-a" href="' + t.mapa + '">Mapa e fotografias</a><a class="vg-a" href="' + t.progresso + '">Detalhe das linhas</a>' + hoje + '</div></div>';
  }

  var ov = d.createElement('div');
  ov.className = 'vg-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Visão geral do projeto');
  ov.innerHTML = '<div class="vg"><button type="button" class="vg-x" aria-label="Fechar" title="Fechar">&times;</button><div id="vgBody"></div></div>';
  d.body.appendChild(ov);

  function render(R) {
    var T = R.trocos || [];
    var sum = function (f) { return T.reduce(function (s, t) { return s + (f(t) || 0); }, 0); };
    var total = sum(function (t) { return t.total_km; }), niv = sum(function (t) { return t.nivelados_km; });
    var pct = total ? 100 * niv / total : 0;
    var nL = sum(function (t) { return t.linhas; }), nA = sum(function (t) { return t.aprovadas; }), nT = sum(function (t) { return t.aprov_tec; });
    var pA = nL ? 100 * nA / nL : 0, pT = nL ? 100 * nT / nL : 0;
    var ef = T.filter(function (t) { return t.ef_medio_pct_tol != null && t.linhas; });
    var efm = ef.length ? ef.reduce(function (s, t) { return s + t.ef_medio_pct_tol * t.linhas; }, 0) / ef.reduce(function (s, t) { return s + t.linhas; }, 0) : null;
    var best = T.map(function (t) { return t.melhor; }).filter(Boolean).sort(function (a, b) { return a.pct - b.pct; })[0];
    var wr = T.filter(function (t) { return t.rendimento_mh; });
    var rend = wr.length ? wr.reduce(function (s, t) { return s + t.rendimento_mh * t.linhas; }, 0) / wr.reduce(function (s, t) { return s + t.linhas; }, 0) : null;
    var dias = Math.max.apply(null, [0].concat(T.map(function (t) { return t.dias_trabalho || 0; })));
    var por = function (f) { return T.filter(function (t) { return t.linhas; }).map(function (t) { return t.nome + ': <b>' + f(t) + '</b>'; }).join(' &middot; '); };
    var min = R.gerado ? Math.round((Date.now() - Date.parse(R.gerado)) / 60000) : null;

    d.getElementById('vgBody').innerHTML =
      '<div class="vg-top"><div><div class="vg-eyebrow">Progresso global do traçado</div><div class="vg-big"><span id="vgPct">0</span><small>%</small></div>' +
      '<div class="vg-sub"><b>' + pt(niv, 1) + '</b> km nivelados de <b>' + pt(total, 2) + '</b> km planeados</div></div>' +
      '<div class="vg-meta"><div><span class="v">' + pt(sum(function (t) { return t.estacoes; }), 0) + '</span><span class="l">Estações</span></div>' +
      '<div><span class="v">' + dias + '</span><span class="l">Dias de trabalho</span></div>' +
      '<div><span class="v">' + (rend ? pt(rend, 0) : '–') + '</span><span class="l">Rendimento (m/h)</span></div></div></div>' +
      '<div class="vg-tracks">' + T.map(track).join('') + '</div>' +
      '<div class="vg-st">Qualidade do nivelamento</div><div class="vg-grid">' +
      '<div class="vg-q"><h3>Linhas aprovadas</h3><div class="vg-rw">' + ring(pA, nA + '/' + nL) + '<div><div class="vg-num">' + pt(pA, 0) + '<small>%</small></div><p>Dentro da tolerância do sistema.</p></div></div><p>' + por(function (t) { return t.aprovadas + '/' + t.linhas; }) + '</p></div>' +
      '<div class="vg-q"><h3>Caderno de encargos</h3><div class="vg-rw">' + ring(pT, nT + '/' + nL) + '<div><div class="vg-num">' + pt(pT, 0) + '<small>%</small></div><p>EF ≤ 1,5 mm·√L (L em km).</p></div></div><p>' + por(function (t) { return t.aprov_tec + '/' + t.linhas; }) + '</p></div>' +
      '<div class="vg-q"><h3>Erro de fecho médio</h3><div class="vg-num">' + (efm == null ? '–' : pt(efm, 0)) + '<small>% da tolerância</small></div><div class="vg-scale"><i data-left="' + (efm == null ? 0 : Math.min(100, efm)) + '"></i></div><div class="vg-scl"><span>0%</span><span>tolerância</span><span>100%</span></div><p>Mais à esquerda = mais preciso.</p></div>' +
      '<div class="vg-q"><h3>Melhor linha</h3>' + (best ? '<div class="vg-num">' + best.linha + '</div><p>Erro de fecho de <b>' + pt(best.ef, 2) + ' mm</b> para uma tolerância de <b>' + pt(best.toll, 2) + ' mm</b> (' + best.pct + '% da tolerância).</p>' : '<p>–</p>') + '</div></div>' +
      '<div class="vg-note">Dados do sistema de monitorização Galileo2000' + (min != null && min >= 0 ? ' &middot; atualizado há ' + (min < 60 ? min + ' min' : Math.floor(min / 60) + ' h') : '') + '.</div>';

    requestAnimationFrame(function () { requestAnimationFrame(function () {
      countUp(d.getElementById('vgPct'), pct, 0, 1500);
      d.querySelectorAll('.vg-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      d.querySelectorAll('.vg [data-km]').forEach(function (e) { countUp(e, +e.dataset.km, 2, 1500); });
      d.querySelectorAll('.vg [data-pct]').forEach(function (e) { if (e.tagName === 'B') countUp(e, +e.dataset.pct, 1, 1500); });
      d.querySelectorAll('.vg-ring').forEach(function (r) { var fg = r.querySelector('.fg'), c = +fg.dataset.c; fg.style.strokeDashoffset = c * (1 - (+r.dataset.pct) / 100); });
      d.querySelectorAll('.vg-scale i').forEach(function (i) { i.style.left = 'calc(' + i.dataset.left + '% - 2px)'; });
    }); });
  }

  function load(cb) {
    var s = d.createElement('script');
    s.src = 'resumo.js?t=' + Date.now();   // sem cache: mostra sempre os numeros mais recentes
    s.onload = function () { s.remove(); cb(window.RESUMO); };
    s.onerror = function () { s.remove(); cb(null); };
    d.head.appendChild(s);
  }
  function open() {
    ov.classList.add('open'); d.documentElement.style.overflow = 'hidden';
    d.getElementById('vgBody').innerHTML = '<p style="padding:30px 0;color:var(--ink-soft,#5B5F65)">A carregar…</p>';
    load(function (R) {
      if (R && R.trocos) render(R);
      else d.getElementById('vgBody').innerHTML = '<p style="padding:30px 0;color:var(--ink-soft,#5B5F65)">Sem dados para mostrar de momento.</p>';
    });
  }
  function close() { ov.classList.remove('open'); d.documentElement.style.overflow = ''; }
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  ov.querySelector('.vg-x').addEventListener('click', close);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });

  var btn = d.createElement('button');
  btn.type = 'button'; btn.id = 'vgBtn'; btn.className = 'vg-btn'; btn.title = 'Resumo do projeto: progresso, troços e qualidade';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg><span>Visão Geral</span>';
  btn.addEventListener('click', open);
  var anchor = bar.querySelector('.proj-title');
  if (anchor && anchor.nextSibling) bar.insertBefore(btn, anchor.nextSibling); else bar.appendChild(btn);

  if (/[?&]vg=1/.test(location.search)) open();   // abre logo o painel (ligacao direta)
})();
