/* Ficha (monografia) de marca em A4, pronta a imprimir ou guardar em PDF.
   Abre numa janela nova: uma ficha por ponto, com fotografia, dados, mapas de localizacao e marcas adjacentes. */
(function(){
  const CAT_LABEL = { estaca:'Marca', test:'Testemunha', no:'Marco NP', aux:'Ponto auxiliar', sing:'Vértice / estação' };
  const nf = (v, d) => v.toLocaleString('pt-PT', { minimumFractionDigits:d, maximumFractionDigits:d });
  const sgn = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // Mapa de satelite (Esri World Imagery) centrado no ponto, num quadro de lado 2*halfM metros.
  function mapaUrl(lat, lon, halfM, w, h){
    const R = 6378137, x = R * lon * Math.PI / 180, y = R * Math.log(Math.tan(Math.PI/4 + lat * Math.PI / 360));
    const hh = halfM * h / w;
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=' +
      [x - halfM, y - hh, x + halfM, y + hh].map(v => v.toFixed(1)).join(',') +
      '&bboxSR=3857&imageSR=3857&size=' + w + ',' + h + '&format=jpg&f=image';
  }

  function mapa(p, halfM, titulo, barraM, barraTxt){
    const larg = 2 * halfM;
    return '<figure class="mapa"><div class="mq"><img src="' + mapaUrl(p.lat, p.lon, halfM, 900, 520) + '" alt="">' +
      '<i class="pin"></i><b class="norte">N<em>&#8593;</em></b>' +
      '<div class="escala" style="width:' + (barraM / larg * 100).toFixed(2) + '%"><span>' + barraTxt + '</span></div></div>' +
      '<figcaption>' + titulo + '</figcaption></figure>';
  }

  function adjacentes(p){
    const i = PROFILE.indexOf(p);
    if(i < 0) return '';
    const lin = (q, rot) => '<tr><td class="rot">' + rot + '</td><td><b>' + esc(q.n) + '</b></td><td class="r">' + nf(q.e, 2) + '</td><td class="r">' +
      sgn(q.e - p.e, 2) + '</td><td class="r">' + nf(Math.abs(q.dist - p.dist), 0) + '</td></tr>';
    const linhas = (i > 0 ? lin(PROFILE[i-1], 'Anterior · para o Funchal') : '') +
                   (i < PROFILE.length - 1 ? lin(PROFILE[i+1], 'Seguinte · para ' + esc(SECAO.curto)) : '');
    if(!linhas) return '';
    return '<div class="sec">Marcas adjacentes no traçado</div><table><thead><tr><th></th><th>Ponto</th><th class="r">Cota (m)</th>' +
      '<th class="r">Desnível (m)</th><th class="r">Distância (m)</th></tr></thead><tbody>' + linhas + '</tbody></table>';
  }

  function fichaHtml(p, k, n){
    const cat = CAT_LABEL[p.cat] || 'Ponto';
    const utm = (p.mE != null && p.pN != null)
      ? '<div class="par"><span>E</span><b>' + nf(p.mE, 2) + ' m</b></div><div class="par"><span>N</span><b>' + nf(p.pN, 2) + ' m</b></div>'
      : '<div class="par"><b>—</b></div>';
    const m = /^(\d+)$/.exec(p.n);   // marcas numeradas: o nome e o PK (ex.: 16200 = 16+200)
    const pk = m ? Math.floor(+m[1] / 1000) + '+' + String(+m[1] % 1000).padStart(3, '0') : null;
    const foto = p.hasImg
      ? '<img src="' + esc(p.img) + '" alt="Fotografia da marca ' + esc(p.n) + '">'
      : '<div class="semfoto">Sem fotografia disponível</div>';
    return '<section class="ficha">' +
      '<header><div class="brand">GEOIDE<small>GEOSYSTEMS, SA</small></div>' +
        '<div class="tr"><b>Ficha de marca</b><br>' + esc(SECAO.titulo) + '</div></header>' +
      '<div class="head"><h1>' + esc(p.n) + '</h1><div class="tags"><span class="tag">' + esc(cat) + '</span>' +
        (pk ? '<span class="tag claro">PK ' + pk + '</span>' : '') + '</div></div>' +
      '<div class="grid">' +
        '<div class="fotoq"><div class="foto">' + foto + '</div></div>' +
        '<div class="dados">' +
          '<div class="cota"><span>Cota (z)</span><b>' + nf(p.e, 2) + '<small> m</small></b></div>' +
          '<div class="bloco"><span class="rot">Coordenadas UTM 28N</span>' + utm + '</div>' +
          '<div class="bloco"><span class="rot">Latitude / Longitude (WGS84)</span>' +
            '<div class="par"><span>φ</span><b>' + p.lat.toFixed(6) + '°</b></div>' +
            '<div class="par"><span>λ</span><b>' + p.lon.toFixed(6) + '°</b></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="mapas">' + mapa(p, 350, 'Pormenor', 100, '100 m') + mapa(p, 3500, 'Enquadramento', 1000, '1 km') + '</div>' +
      adjacentes(p) +
      '<div class="nota">Altimetria ligada à marca IH BH 42/11 (cota 3,990 m). Coordenadas WGS84 / UTM 28N. Imagens de satélite: Esri World Imagery.</div>' +
      '<footer><span>Geoide Geosystems, SA · ' + esc(SECAO.doc) + '</span><span>Ficha de ' + new Date().toLocaleDateString('pt-PT') +
        (n > 1 ? ' · ' + (k + 1) + ' de ' + n : '') + '</span></footer>' +
    '</section>';
  }

  const CSS = '@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#1d1d1b;font-size:10pt;line-height:1.35}' +
    '.ficha{width:210mm;height:296.5mm;padding:12mm 15mm 0;position:relative;page-break-after:always;overflow:hidden}.ficha:last-child{page-break-after:auto}' +
    'header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.4px solid #E5AC14;padding-bottom:5px}' +
    '.brand{font-weight:800;letter-spacing:.16em;font-size:12pt}.brand small{display:block;color:#8E8F90;font-weight:600;letter-spacing:.22em;font-size:6.6pt;margin-top:1px}' +
    '.tr{font-size:8.2pt;color:#666;text-align:right;line-height:1.4}.tr b{color:#1d1d1b;font-size:9pt;letter-spacing:.04em;text-transform:uppercase}' +
    '.head{display:flex;align-items:center;justify-content:space-between;margin:7mm 0 5mm}' +
    'h1{font-size:30pt;margin:0;letter-spacing:-.015em;line-height:1}' +
    '.tags{display:flex;gap:6px}.tag{background:#E5AC14;color:#1d1d1b;font-size:8.2pt;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 11px;border-radius:3px}' +
    '.tag.claro{background:#f1ede0;border:1px solid #d9d1b8;font-weight:600}' +
    '.grid{display:grid;grid-template-columns:97mm 1fr;gap:8mm}' +
    '.foto{width:97mm;height:129.5mm;border:1px solid #cfc8b6;background:#f6f4ef;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.foto img{width:100%;height:100%;object-fit:contain;display:block}.semfoto{color:#8E8F90;font-size:10pt}' +
    '.dados{display:flex;flex-direction:column;gap:4mm}' +
    '.cota{background:#faf8f2;border:1px solid #e6e1d6;border-left:4px solid #E5AC14;padding:3mm 4mm}' +
    '.cota span,.rot{display:block;font-size:7.2pt;color:#6b6b6b;text-transform:uppercase;letter-spacing:.07em}' +
    '.cota b{font-size:26pt;line-height:1.1;letter-spacing:-.01em}.cota small{font-size:12pt;font-weight:600;color:#555}' +
    '.bloco{border-bottom:1px solid #e6e1d6;padding-bottom:3mm}.par{display:flex;gap:7px;align-items:baseline;margin-top:2px}' +
    '.par span{width:12px;color:#8E8F90;font-size:9pt;font-weight:600}.par b{font-size:10.5pt;font-variant-numeric:tabular-nums}' +
    '.mapas{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:6mm}.mapa{margin:0}' +
    '.mq{position:relative;border:1px solid #cfc8b6;line-height:0;overflow:hidden}.mq img{width:100%;height:auto;display:block}' +
    '.pin{position:absolute;left:50%;top:50%;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;background:#E5AC14;border:2.5px solid #111;border-radius:50%;box-shadow:0 0 0 2px #fff}' +
    '.norte{position:absolute;right:6px;top:5px;background:rgba(255,255,255,.9);width:20px;height:24px;font-size:9pt;line-height:1;text-align:center;padding-top:3px;border-radius:3px}.norte em{display:block;font-style:normal;font-size:9pt;margin-top:1px}' +
    '.escala{position:absolute;left:8px;bottom:8px;height:6px;border:1.6px solid #fff;border-top:none;box-shadow:0 1px 2px rgba(0,0,0,.7)}' +
    '.escala span{position:absolute;left:0;bottom:6px;font-size:7.5pt;line-height:1;color:#fff;font-weight:700;text-shadow:0 0 3px #000,0 0 3px #000}' +
    'figcaption{font-size:8pt;color:#555;margin-top:3px;font-weight:600}' +
    '.sec{margin:6mm 0 2mm;font-size:9.5pt;font-weight:700;padding-left:7px;border-left:4px solid #E5AC14;line-height:1.2}' +
    'table{width:100%;border-collapse:collapse;font-size:9pt}th{text-align:left;font-size:7pt;color:#6b6b6b;text-transform:uppercase;letter-spacing:.05em;border-bottom:1.5px solid #8E8F90;padding:3px 6px}' +
    'td{padding:5px 6px;border-bottom:1px solid #e6e1d6}td.r,th.r{text-align:right;font-variant-numeric:tabular-nums}td.rot{color:#6b6b6b;font-size:8pt}' +
    '.nota{position:absolute;left:15mm;right:15mm;bottom:14mm;font-size:7.8pt;color:#777}' +
    'footer{position:absolute;left:15mm;right:15mm;bottom:7mm;display:flex;justify-content:space-between;font-size:7pt;color:#8E8F90;border-top:1px solid #e6e1d6;padding-top:3px}' +
    '@media screen{body{background:#ddd}.ficha{background:#fff;margin:8px auto;box-shadow:0 1px 6px rgba(0,0,0,.25)}}';

  window.fichaMarca = function(arg){
    const nomes = Array.isArray(arg) ? arg : [arg];
    const pts = nomes.map(n => POINTS.find(p => p.n === n)).filter(Boolean);
    if(!pts.length) return;
    const w = window.open('', '_blank');
    if(!w){ alert('O navegador bloqueou a janela da ficha. Permita janelas pop-up para este site.'); return; }
    const titulo = pts.length === 1 ? 'Ficha ' + pts[0].n : 'Fichas das marcas (' + pts.length + ')';
    w.document.write('<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>' + CSS + '</style></head><body>' +
      pts.map((p, k) => fichaHtml(p, k, pts.length)).join('') +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print()},400)})<\/script></body></html>');
    w.document.close();
  };

  // Fichas de todos os pontos visiveis na lista (respeita os filtros), pela ordem do perfil (Funchal -> fim)
  window.fichasVisiveis = function(){
    const lista = PROFILE.filter(p => typeof matchesFilter === 'function' ? matchesFilter(p) : true).map(p => p.n);
    if(lista.length > 12 && !confirm('Vão ser geradas ' + lista.length + ' fichas (uma por página). Continuar?')) return;
    window.fichaMarca(lista);
  };
})();
