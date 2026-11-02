/* "Marcas mais próximas de mim": usa a localização do aparelho e indica as 3 marcas mais próximas,
   com a distância, o rumo e atalhos para ver no mapa e navegar (Google Maps / Waze). */
(function(){
  if(typeof map === 'undefined' || typeof POINTS === 'undefined') return;
  const nf = (v, d) => v.toLocaleString('pt-PT', { minimumFractionDigits:d, maximumFractionDigits:d });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const dist = (a, b) => {
    const R = 6371008.8, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
    const h = Math.sin(dLa/2)**2 + Math.cos(a.lat*r) * Math.cos(b.lat*r) * Math.sin(dLo/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const rumo = (a, b) => {
    const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r);
    const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  };
  const pontos = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const cardeal = deg => pontos[Math.round(deg / 45) % 8];
  const fmtDist = m => m < 1000 ? Math.round(m) + ' m' : nf(m / 1000, m < 10000 ? 2 : 1) + ' km';

  const css = document.createElement('style');
  css.textContent =
    '.perto-ctl{margin-left:12px !important; box-shadow:var(--shadow) !important; border:none !important; border-radius:10px !important; overflow:hidden;}' +
    '.perto-ctl a{display:flex; align-items:center; justify-content:center; width:30px; height:30px; background:var(--surface,#fff); color:var(--ink,#222) !important; cursor:pointer;}' +
    '.perto-ctl a:hover{background:var(--paper,#f6f4ef);} .perto-ctl a.ativo{background:var(--ink,#222); color:var(--on-ink,#fff) !important;}' +
    '.perto-ctl svg{width:17px; height:17px; stroke:currentColor; fill:none; stroke-width:2; stroke-linecap:round;}' +
    '.perto-card{position:absolute; z-index:850; top:12px; left:56px; width:min(340px, calc(100% - 72px)); background:var(--surface,#fff); color:var(--ink,#222);' +
    ' border:1px solid var(--line,#e6e1d6); border-radius:12px; box-shadow:var(--shadow); padding:10px 12px 10px; font-size:12px; display:none;}' +
    '.perto-card.aberto{display:block;} .perto-card h4{margin:0; font-size:12.5px; font-weight:700; display:flex; justify-content:space-between; align-items:center; gap:8px;}' +
    '.perto-card .x{background:none; border:none; cursor:pointer; font-size:18px; line-height:1; color:var(--ink-soft,#777); padding:0 2px;}' +
    '.perto-card .est{color:var(--ink-soft,#777); font-size:11px; margin:3px 0 6px;} .perto-card .aviso{background:#fdf3d8; color:#6b4e00; border-radius:8px; padding:6px 8px; margin:0 0 6px; font-size:11px;}' +
    '.perto-card .lin{display:grid; grid-template-columns:auto 1fr auto; gap:2px 8px; align-items:center; padding:7px 0; border-top:1px solid var(--line,#e6e1d6);}' +
    '.perto-card .dot{width:10px; height:10px; border-radius:50%; grid-row:1 / span 2;} .perto-card .nome{font-weight:700; font-size:13px;}' +
    '.perto-card .tipo{color:var(--ink-soft,#777); font-weight:400; font-size:11px; margin-left:4px;} .perto-card .d{font-family:"IBM Plex Mono",monospace; font-weight:600; text-align:right;}' +
    '.perto-card .acc{grid-column:2 / span 2; display:flex; gap:6px; flex-wrap:wrap;}' +
    '.perto-card .acc a, .perto-card .acc button{font-size:11px; padding:3px 9px; border:1px solid var(--line,#e6e1d6); border-radius:7px; background:var(--paper,#f6f4ef); color:var(--ink,#222); text-decoration:none; cursor:pointer; font-family:inherit;}' +
    '.perto-card .acc a:hover, .perto-card .acc button:hover{border-color:var(--gold,#E5AC14);}' +
    '.perto-card .rod{display:flex; justify-content:flex-end; padding-top:6px; border-top:1px solid var(--line,#e6e1d6);}' +
    '.perto-card .rod button{font-size:11px; padding:3px 9px; border:1px solid var(--line,#e6e1d6); border-radius:7px; background:none; color:var(--ink,#222); cursor:pointer; font-family:inherit;}';
  document.head.appendChild(css);

  const card = document.createElement('div');
  card.className = 'perto-card';
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', 'Marcas mais próximas');
  map.getContainer().appendChild(card);
  L.DomEvent.disableClickPropagation(card);
  L.DomEvent.disableScrollPropagation(card);

  let btn, camada = null;
  function limpar(){ if(camada){ map.removeLayer(camada); camada = null; } }
  function fechar(){ card.classList.remove('aberto'); limpar(); btn && btn.classList.remove('ativo'); }
  function mensagem(html){ card.innerHTML = '<h4>Marcas mais próximas<button class="x" aria-label="Fechar">&times;</button></h4><div class="est">' + html + '</div>'; ligar(); card.classList.add('aberto'); }
  function ligar(){ const x = card.querySelector('.x'); if(x) x.onclick = fechar; const r = card.querySelector('.rec'); if(r) r.onclick = localizar; }

  function mostrar(pos){
    const eu = { lat: pos.coords.latitude, lon: pos.coords.longitude }, prec = pos.coords.accuracy;
    const lista = POINTS.map(p => ({ p, d: dist(eu, p), b: rumo(eu, p) })).sort((a, b) => a.d - b.d).slice(0, 3);
    limpar();
    camada = L.layerGroup().addTo(map);
    L.circle([eu.lat, eu.lon], { radius: Math.max(prec, 3), color:'#1971C2', weight:1, fillColor:'#1971C2', fillOpacity:.12, interactive:false }).addTo(camada);
    L.circleMarker([eu.lat, eu.lon], { radius:7, color:'#fff', weight:3, fillColor:'#1971C2', fillOpacity:1, interactive:false }).addTo(camada);
    L.polyline([[eu.lat, eu.lon], [lista[0].p.lat, lista[0].p.lon]], { color:'#1971C2', weight:2, dashArray:'5,6', interactive:false }).addTo(camada);
    map.fitBounds(L.latLngBounds([[eu.lat, eu.lon], [lista[0].p.lat, lista[0].p.lon]]).pad(0.5), { maxZoom: 18 });

    const longe = lista[0].d > 5000;
    const linhas = lista.map(({ p, d, b }) => {
      const c = (typeof CATS !== 'undefined' && CATS[p.cat]) || { color:'#888', label:'' };
      return '<div class="lin"><i class="dot" style="background:' + c.color + '"></i><div><span class="nome">' + esc(p.n) + '</span><span class="tipo">' + esc(c.label) + '</span></div>' +
        '<div class="d">' + fmtDist(d) + ' · ' + cardeal(b) + '</div><div class="acc">' +
        '<button data-ver="' + esc(p.n) + '">Ver</button>' +
        '<a href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lon + '&travelmode=walking" target="_blank" rel="noopener">Google Maps</a>' +
        '<a href="https://waze.com/ul?ll=' + p.lat + ',' + p.lon + '&navigate=yes" target="_blank" rel="noopener">Waze</a></div></div>';
    }).join('');
    card.innerHTML = '<h4>Marcas mais próximas<button class="x" aria-label="Fechar">&times;</button></h4>' +
      '<div class="est">Precisão do GPS: ±' + Math.round(prec) + ' m · distâncias em linha reta</div>' +
      (longe ? '<div class="aviso">Está a ' + fmtDist(lista[0].d) + ' da marca mais próxima, ou seja, longe do traçado.</div>' : '') +
      linhas + '<div class="rod"><button class="rec">Atualizar posição</button></div>';
    card.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => { if(typeof selectPoint === 'function') selectPoint(b.getAttribute('data-ver'), true); });
    ligar();
    card.classList.add('aberto');
    btn && btn.classList.add('ativo');
  }

  function erro(e){
    const msg = e && e.code === 1 ? 'Sem permissão de localização. Permita o acesso à localização para este site nas definições do navegador e tente de novo.'
      : e && e.code === 3 ? 'O aparelho demorou demasiado a obter a posição. Tente de novo, de preferência ao ar livre.'
      : 'Não foi possível obter a posição deste aparelho.';
    mensagem(msg + ' <button class="rec" style="margin-left:4px">Tentar de novo</button>');
  }

  function localizar(){
    if(!navigator.geolocation || (window.isSecureContext === false)){ mensagem('Este navegador não permite obter a localização nesta página.'); return; }
    mensagem('A obter a sua posição…');
    navigator.geolocation.getCurrentPosition(mostrar, erro, { enableHighAccuracy:true, timeout:20000, maximumAge:10000 });
  }

  const Ctl = L.Control.extend({
    options: { position:'topleft' },
    onAdd: function(){
      const c = L.DomUtil.create('div', 'leaflet-bar leaflet-control perto-ctl');
      btn = L.DomUtil.create('a', '', c);
      btn.href = '#'; btn.title = 'Marcas mais próximas de mim'; btn.setAttribute('role', 'button'); btn.setAttribute('aria-label', 'Marcas mais próximas de mim');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
      L.DomEvent.disableClickPropagation(c);
      L.DomEvent.on(btn, 'click', e => { L.DomEvent.preventDefault(e); card.classList.contains('aberto') ? fechar() : localizar(); });
      return c;
    }
  });
  new Ctl().addTo(map);
})();
