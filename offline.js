/* Uso offline: regista o service worker (sw.js) e acrescenta o botão "Guardar para uso offline".
   O botão descarrega para o aparelho as fotografias e os mosaicos do mapa (ruas e satélite) ao longo do
   traçado do troço aberto; depois o mapa funciona sem rede. Mostra também um aviso quando não há ligação. */
(function(){
  if('serviceWorker' in navigator && location.protocol !== 'file:'){
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if(typeof map === 'undefined' || typeof POINTS === 'undefined' || typeof ROUTE === 'undefined' || !window.caches) return;

  const CACHE_MAPAS = 'mapas-v1', CACHE_FOTOS = 'fotos-v1';
  const ZOOMS = [11, 12, 13, 14, 15, 16, 17], BUFFER_M = 350;
  const CHAVE = 'offline_' + (typeof SECAO !== 'undefined' ? SECAO.id : 'psl');
  const nf = (v, d) => v.toLocaleString('pt-PT', { minimumFractionDigits:d, maximumFractionDigits:d });
  const mb = bytes => nf(bytes / 1048576, bytes < 10485760 ? 1 : 0) + ' MB';
  const lerGuardado = () => { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch(e) { return null; } };
  const gravarGuardado = o => { try { o ? localStorage.setItem(CHAVE, JSON.stringify(o)) : localStorage.removeItem(CHAVE); } catch(e) {} };

  // ---------- Lista do que há a descarregar ----------
  const urlRuas = (z, x, y) => 'https://' + 'abc'[Math.abs(x + y) % 3] + '.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png';
  const urlSat = (z, x, y) => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/' + z + '/' + y + '/' + x;

  function amostrasRota(){
    const out = [];
    ROUTE.forEach(seg => {
      for(let i = 0; i < seg.length - 1; i++){
        const a = seg[i], b = seg[i + 1];
        const m = Math.hypot((b[0] - a[0]) * 111000, (b[1] - a[1]) * 93000);
        const n = Math.max(1, Math.ceil(m / 30));
        for(let k = 0; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
      }
    });
    return out;
  }
  // Nível 18 (o que se abre ao escolher uma marca) só à volta das marcas, para não pesar demasiado.
  function tilesDaRota(amostras){
    const lista = [], marcas = POINTS.map(p => [p.lat, p.lon]);
    ZOOMS.concat(18).forEach(z => {
      const n = Math.pow(2, z), vistos = new Set(), buf = z === 18 ? 90 : BUFFER_M;
      (z === 18 ? marcas : amostras).forEach(([la, lo]) => {
        const x = (lo + 180) / 360 * n, y = (1 - Math.asinh(Math.tan(la * Math.PI / 180)) / Math.PI) / 2 * n;
        const r = buf / (40075016 / n * Math.cos(la * Math.PI / 180));
        for(let xx = Math.floor(x - r); xx <= Math.floor(x + r); xx++)
          for(let yy = Math.floor(y - r); yy <= Math.floor(y + r); yy++) vistos.add(xx + ',' + yy);
      });
      vistos.forEach(k => { const [x, y] = k.split(',').map(Number); lista.push({ url:urlRuas(z, x, y), tipo:'ruas' }, { url:urlSat(z, x, y), tipo:'sat' }); });
    });
    return lista;
  }
  let plano = null;
  function obterPlano(){
    if(!plano){
      const tiles = tilesDaRota(amostrasRota());
      const fotos = [...new Set(POINTS.map(p => p.img).filter(Boolean))];
      const nRuas = tiles.filter(t => t.tipo === 'ruas').length;
      plano = { tiles, fotos, estimativa: nRuas * 12000 + (tiles.length - nRuas) * 25000 + fotos.length * 280000 };
    }
    return plano;
  }

  // ---------- Interface ----------
  const css = document.createElement('style');
  css.textContent =
    '.offline-card{position:absolute; z-index:860; top:12px; left:56px; width:min(340px, calc(100% - 72px)); background:var(--surface,#fff); color:var(--ink,#222);' +
    ' border:1px solid var(--line,#e6e1d6); border-radius:12px; box-shadow:var(--shadow); padding:10px 12px; font-size:12px; display:none;}' +
    '.offline-card.aberto{display:block;} .offline-card h4{margin:0 0 4px; font-size:12.5px; font-weight:700; display:flex; justify-content:space-between; align-items:center;}' +
    '.offline-card .x{background:none; border:none; cursor:pointer; font-size:18px; line-height:1; color:var(--ink-soft,#777); padding:0 2px;}' +
    '.offline-card p{margin:4px 0 8px; line-height:1.45;} .offline-card .peq{color:var(--ink-soft,#777); font-size:11px;}' +
    '.offline-card .barra{height:8px; background:var(--paper,#f6f4ef); border:1px solid var(--line,#e6e1d6); border-radius:5px; overflow:hidden; margin:6px 0;}' +
    '.offline-card .barra i{display:block; height:100%; width:0; background:var(--gold,#E5AC14); transition:width .2s;}' +
    '.offline-card .acc{display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;}' +
    '.offline-card .acc button{font-size:11.5px; padding:5px 11px; border:1px solid var(--line,#e6e1d6); border-radius:7px; background:var(--paper,#f6f4ef); color:var(--ink,#222); cursor:pointer; font-family:inherit;}' +
    '.offline-card .acc button.prim{background:var(--gold,#E5AC14); border-color:var(--gold,#E5AC14); color:#222; font-weight:600;}' +
    '.offline-aviso{position:absolute; z-index:900; top:10px; left:50%; transform:translateX(-50%); background:#222; color:#fff; font-size:11.5px; padding:6px 14px; border-radius:16px;' +
    ' box-shadow:var(--shadow); display:none; white-space:nowrap; max-width:calc(100% - 140px); overflow:hidden; text-overflow:ellipsis;}' +
    '.offline-aviso.visivel{display:block;}';
  document.head.appendChild(css);

  const caixa = map.getContainer();
  const card = document.createElement('div');
  card.className = 'offline-card';
  card.setAttribute('role', 'region'); card.setAttribute('aria-label', 'Uso offline');
  caixa.appendChild(card);
  L.DomEvent.disableClickPropagation(card); L.DomEvent.disableScrollPropagation(card);

  const aviso = document.createElement('div');
  aviso.className = 'offline-aviso';
  aviso.textContent = 'Sem ligação · a usar os dados guardados neste aparelho';
  caixa.appendChild(aviso);
  const atualizarAviso = () => aviso.classList.toggle('visivel', navigator.onLine === false);
  window.addEventListener('online', atualizarAviso); window.addEventListener('offline', atualizarAviso); atualizarAviso();

  let btn, cancelar = false, aDescarregar = false;
  const nomeTroco = () => (typeof SECAO !== 'undefined' ? SECAO.curto : 'este troço');
  function fechar(){ if(aDescarregar) return; card.classList.remove('aberto'); btn && btn.classList.remove('ativo'); }
  function abrir(){
    const perto = document.querySelector('.perto-card.aberto .x'); if(perto) perto.click();
    card.classList.add('aberto'); btn && btn.classList.add('ativo'); desenhar();
  }
  function ligar(){
    const q = s => card.querySelector(s);
    if(q('.x')) q('.x').onclick = fechar;
    if(q('.go')) q('.go').onclick = descarregar;
    if(q('.stop')) q('.stop').onclick = () => { cancelar = true; };
    if(q('.del')) q('.del').onclick = remover;
  }
  function cabecalho(){ return '<h4>Uso offline · ' + nomeTroco() + (aDescarregar ? '' : '<button class="x" aria-label="Fechar">&times;</button>') + '</h4>'; }

  function desenhar(){
    const g = lerGuardado(), p = obterPlano();
    let html = cabecalho();
    if(g){
      const d = new Date(g.t);
      html += '<p>Guardado neste aparelho em <b>' + d.toLocaleDateString('pt-PT') + ' às ' + d.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' }) + '</b>: ' +
        g.fotos + ' fotografias e ' + g.mapas + ' mosaicos de mapa (ruas e satélite), cerca de ' + mb(g.bytes) + '.</p>' +
        '<p class="peq">Sem rede, o mapa, as marcas, as fotografias e a localização continuam a funcionar. Ao aproximar além do nível guardado, o mapa fica desfocado. Os dados de progresso atualizam-se sozinhos quando houver ligação.</p>' +
        '<div class="acc"><button class="go prim">Atualizar</button><button class="del">Remover</button></div>';
    } else {
      html += '<p>Guarde neste aparelho as fotografias e o mapa (ruas e satélite) ao longo do traçado, para os usar <b>sem rede</b> no terreno.</p>' +
        '<p class="peq">' + p.fotos.length + ' fotografias + ' + p.tiles.length + ' mosaicos de mapa, cerca de <b>' + mb(p.estimativa) + '</b>. Recomenda-se fazer com Wi-Fi.</p>' +
        '<div class="acc"><button class="go prim">Guardar para uso offline</button></div>';
    }
    card.innerHTML = html; ligar();
  }

  async function remover(){
    await caches.delete(CACHE_MAPAS); await caches.delete(CACHE_FOTOS);
    ['psl', 'rb'].forEach(k => { try { localStorage.removeItem('offline_' + k); } catch(e) {} });
    desenhar();
  }

  async function descarregar(){
    const p = obterPlano(), total = p.tiles.length + p.fotos.length;
    let feitos = 0, falhas = 0, bytes = 0, nFotos = 0, nMapas = 0;
    cancelar = false; aDescarregar = true; btn && btn.classList.add('ativo');
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch(e) {}
    card.innerHTML = cabecalho() + '<p class="txt">A guardar… 0 %</p><div class="barra"><i></i></div><p class="peq">Mantenha esta página aberta. Pode continuar a usar o mapa.</p><div class="acc"><button class="stop">Cancelar</button></div>';
    ligar();
    const txt = card.querySelector('.txt'), barra = card.querySelector('.barra i');
    const progresso = () => { const pc = Math.round(feitos / total * 100); txt.textContent = 'A guardar… ' + pc + ' % (' + feitos + ' de ' + total + ')'; barra.style.width = pc + '%'; };

    const cM = await caches.open(CACHE_MAPAS), cF = await caches.open(CACHE_FOTOS);
    const trabalhos = p.fotos.map(u => ({ url:u, foto:true })).concat(p.tiles.map(t => ({ url:t.url, foto:false })));
    let idx = 0;
    async function trabalhador(){
      while(!cancelar && idx < trabalhos.length){
        const t = trabalhos[idx++];
        try {
          if(!t.foto && await cM.match(t.url, { ignoreVary:true })){ nMapas++; }
          else {
            const r = await fetch(t.url, t.foto ? { cache:'no-cache' } : { mode:'cors' });
            if(!r.ok) throw new Error(r.status);
            const copia = r.clone(); const b = await r.blob(); bytes += b.size;
            await (t.foto ? cF : cM).put(t.url, copia);
            t.foto ? nFotos++ : nMapas++;
          }
        } catch(e) { falhas++; }
        feitos++; if(feitos % 5 === 0 || feitos === total) progresso();
      }
    }
    await Promise.all(Array.from({ length: 6 }, trabalhador));
    aDescarregar = false;

    if(cancelar){ desenhar(); return; }
    if(falhas > total * 0.1){
      card.innerHTML = cabecalho() + '<p>Não foi possível guardar tudo (' + falhas + ' ficheiros falharam), provavelmente por falta de rede ou de espaço no aparelho. O que já foi guardado mantém-se.</p><div class="acc"><button class="go prim">Tentar de novo</button></div>';
      ligar(); return;
    }
    gravarGuardado({ t:Date.now(), fotos:nFotos, mapas:nMapas, bytes:bytes });
    desenhar();
  }

  // ---------- Botão no mapa (por baixo do "marcas mais próximas") ----------
  const Ctl = L.Control.extend({
    options: { position:'topleft' },
    onAdd: function(){
      const c = L.DomUtil.create('div', 'leaflet-bar leaflet-control perto-ctl offline-ctl');
      btn = L.DomUtil.create('a', '', c);
      btn.href = '#'; btn.title = 'Guardar para uso offline'; btn.setAttribute('role', 'button'); btn.setAttribute('aria-label', 'Guardar para uso offline');
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"/></svg>';
      L.DomEvent.disableClickPropagation(c);
      L.DomEvent.on(btn, 'click', e => { L.DomEvent.preventDefault(e); card.classList.contains('aberto') ? fechar() : abrir(); });
      return c;
    }
  });
  new Ctl().addTo(map);
  // abrir o cartão de "marcas mais próximas" fecha este
  document.addEventListener('click', e => { if(e.target.closest && e.target.closest('.perto-ctl') && !e.target.closest('.offline-ctl')) fechar(); }, true);
})();
