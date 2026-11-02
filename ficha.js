/* Ficha (monografia) de marca em A4, pronta a imprimir ou guardar em PDF.
   Abre numa janela nova: uma ficha por ponto, com fotografia, dados e mapas de localizacao. */
(function(){
  const CAT_LABEL = { estaca:'Marca', test:'Testemunha', no:'Marco NP', aux:'Ponto auxiliar', sing:'Vértice / estação' };
  const nf = (v, d) => v.toLocaleString('pt-PT', { minimumFractionDigits:d, maximumFractionDigits:d });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // Mapa de satelite (Esri World Imagery) centrado no ponto, num quadro de lado 2*halfM metros.
  function mapaUrl(lat, lon, halfM, w, h){
    const R = 6378137, x = R * lon * Math.PI / 180, y = R * Math.log(Math.tan(Math.PI/4 + lat * Math.PI / 360));
    const hh = halfM * h / w;
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=' +
      [x - halfM, y - hh, x + halfM, y + hh].map(v => v.toFixed(1)).join(',') +
      '&bboxSR=3857&imageSR=3857&size=' + w + ',' + h + '&format=jpg&f=image';
  }

  function fichaHtml(p){
    const cat = CAT_LABEL[p.cat] || 'Ponto';
    const utm = (p.mE != null && p.pN != null) ? nf(p.mE, 2) + ' E / ' + nf(p.pN, 2) + ' N' : '—';
    const m = /^(\d+)$/.exec(p.n);   // marcas numeradas: o nome e o PK (ex.: 16200 = 16+200)
    const pk = m ? Math.floor(+m[1] / 1000) + '+' + String(+m[1] % 1000).padStart(3, '0') : null;
    const foto = p.hasImg
      ? '<img class="foto" src="' + esc(p.img) + '" alt="Fotografia da marca ' + esc(p.n) + '">'
      : '<div class="semfoto">Sem fotografia disponível</div>';
    return '<section class="ficha">' +
      '<div class="top"><div class="brand">GEOIDE<small>GEOSYSTEMS, SA</small></div><div class="tr">' + esc(SECAO.titulo) + '</div></div>' +
      '<div class="head"><div class="kind">' + esc(cat) + '</div><h1>' + esc(p.n) + '</h1></div>' +
      '<div class="grid"><div class="col foto-col">' + foto + '</div><div class="col">' +
        '<dl>' +
          '<div><dt>Cota (z)</dt><dd>' + nf(p.e, 2) + ' m</dd></div>' +
          '<div><dt>Coord. UTM 28N</dt><dd>' + utm + '</dd></div>' +
          '<div><dt>Lat / Lon (WGS84)</dt><dd>' + p.lat.toFixed(6) + ', ' + p.lon.toFixed(6) + '</dd></div>' +
          (pk ? '<div><dt>PK</dt><dd>' + pk + '</dd></div>' : '') +
        '</dl>' +
        '<div class="mapa"><img src="' + mapaUrl(p.lat, p.lon, 350, 700, 460) + '" alt=""><i class="pin"></i><span>Pormenor (≈ 700 m)</span></div>' +
        '<div class="mapa"><img src="' + mapaUrl(p.lat, p.lon, 3500, 700, 460) + '" alt=""><i class="pin"></i><span>Enquadramento (≈ 7 km)</span></div>' +
      '</div></div>' +
      '<div class="nota">Altimetria ligada à marca IH BH 42/11 (cota 3,990 m). Coordenadas WGS84 / UTM 28N. Imagens: Esri World Imagery.</div>' +
      '<div class="foot"><span>Geoide Geosystems, SA · ' + esc(SECAO.doc) + '</span><span>Ficha de ' + new Date().toLocaleDateString('pt-PT') + '</span></div>' +
    '</section>';
  }

  const CSS = '@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#1d1d1b;font-size:10pt}' +
    '.ficha{width:210mm;height:296mm;padding:13mm 15mm 10mm;position:relative;page-break-after:always;overflow:hidden}.ficha:last-child{page-break-after:auto}' +
    '.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.2px solid #E5AC14;padding-bottom:5px}' +
    '.brand{font-weight:800;letter-spacing:.14em;font-size:11pt}.brand small{display:block;color:#8E8F90;font-weight:600;letter-spacing:.2em;font-size:6.6pt}' +
    '.tr{font-size:8.5pt;color:#555;text-align:right}' +
    '.head{margin:9mm 0 5mm}.kind{display:inline-block;background:#E5AC14;color:#1d1d1b;font-size:8pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 9px;border-radius:3px}' +
    'h1{font-size:30pt;margin:3px 0 0;letter-spacing:-.01em;line-height:1.1}' +
    '.grid{display:grid;grid-template-columns:96mm 1fr;gap:8mm}.foto-col{display:flex;align-items:flex-start}' +
    '.foto{width:100%;height:auto;max-height:200mm;object-fit:contain;object-position:top;border:1px solid #cfc8b6;background:#f6f4ef}' +
    '.semfoto{width:100%;height:120mm;border:1px dashed #b9b29d;display:flex;align-items:center;justify-content:center;color:#8E8F90;font-size:10pt}' +
    'dl{margin:0 0 5mm}dl div{padding:5px 0;border-bottom:1px solid #e6e1d6}dt{font-size:7.2pt;color:#6b6b6b;text-transform:uppercase;letter-spacing:.06em}dd{margin:1px 0 0;font-size:10.5pt;font-weight:600}' +
    '.mapa{position:relative;margin-bottom:4mm;border:1px solid #cfc8b6;line-height:0}.mapa img{width:100%;height:auto;display:block}' +
    '.mapa .pin{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;background:#E5AC14;border:2.5px solid #111;border-radius:50%;box-shadow:0 0 0 2px #fff}' +
    '.mapa span{position:absolute;left:0;bottom:0;background:rgba(255,255,255,.88);font-size:7.2pt;line-height:1.3;padding:1px 6px;color:#333}' +
    '.nota{position:absolute;left:15mm;right:15mm;bottom:15mm;font-size:8pt;color:#666}' +
    '.foot{position:absolute;left:15mm;right:15mm;bottom:7mm;display:flex;justify-content:space-between;font-size:7pt;color:#8E8F90;border-top:1px solid #e6e1d6;padding-top:3px}' +
    '@media screen{body{background:#ddd}.ficha{background:#fff;margin:8px auto;box-shadow:0 1px 6px rgba(0,0,0,.25)}}';

  window.fichaMarca = function(arg){
    const nomes = Array.isArray(arg) ? arg : [arg];
    const pts = nomes.map(n => POINTS.find(p => p.n === n)).filter(Boolean);
    if(!pts.length) return;
    const w = window.open('', '_blank');
    if(!w){ alert('O navegador bloqueou a janela da ficha. Permita janelas pop-up para este site.'); return; }
    const titulo = pts.length === 1 ? 'Ficha ' + pts[0].n : 'Fichas das marcas (' + pts.length + ')';
    w.document.write('<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>' + CSS + '</style></head><body>' +
      pts.map(fichaHtml).join('') +
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
