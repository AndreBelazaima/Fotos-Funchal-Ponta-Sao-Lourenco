/* Service worker: deixa o mapa funcionar sem rede (campo, zonas sem cobertura).
   - Páginas, scripts e dados (mapdata*.js, progresso*.html, ...): rede primeiro, cache se não houver rede,
     para o robô de atualização continuar a mostrar sempre a versão mais recente quando há ligação.
   - Fotografias: mostra a guardada e atualiza em segundo plano (as fotos podem ser substituídas).
   - Mosaicos do mapa, letras e bibliotecas: cache primeiro.
   A descarga prévia dos mosaicos e das fotos faz-se em offline.js (botão "Guardar para uso offline"). */
const V = 'v1';
const SHELL = 'shell-' + V, FOTOS = 'fotos-' + V, MAPAS = 'mapas-' + V, LIBS = 'libs-' + V;
const ATUAIS = [SHELL, FOTOS, MAPAS, LIBS];
const MAX_MAPAS = 9000;

const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'mapdata.js', 'mapdata_rb.js', 'derivacoes.js', 'linhas_mapa.js', 'linhas_mapa_rb.js', 'resumo.js',
  'qrcode-generator.js', 'fullscreen.js', 'visaogeral.js', 'ficha.js', 'perto.js', 'offline.js',
  'progresso.html', 'progresso_rb.html'
];
const BIBLIOTECAS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/layers.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/layers-2x.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'
];

// Vai buscar com CORS (resposta "transparente" ocupa muito mais quota); se falhar, usa o pedido original.
async function buscar(req) {
  if (new URL(req.url).origin !== self.location.origin) {
    try { const r = await fetch(req.url, { mode: 'cors' }); if (r.ok) return r; } catch (e) {}
  }
  return fetch(req);
}
async function guardarTolerante(cache, urls) {
  await Promise.all(urls.map(async u => {
    try { const r = await buscar(new Request(u)); if (r.ok) await cache.put(u, r); } catch (e) {}
  }));
}
async function limitar(nome, max) {
  const c = await caches.open(nome), ks = await c.keys();
  for (let i = 0; i < ks.length - max; i++) await c.delete(ks[i]);
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    await guardarTolerante(await caches.open(SHELL), PRECACHE);
    await guardarTolerante(await caches.open(LIBS), BIBLIOTECAS);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!ATUAIS.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const procurar = (req, opts) => caches.match(req, Object.assign({ ignoreVary: true }, opts || {}));

async function redePrimeiro(req) {
  try {
    const r = await fetch(req, { cache: 'no-cache' });
    if (r.ok && req.method === 'GET') { const c = await caches.open(SHELL); c.put(req, r.clone()); }
    return r;
  } catch (e) {
    return (await procurar(req)) || (await procurar(req, { ignoreSearch: true })) ||
      (req.mode === 'navigate' ? await procurar('index.html', { ignoreSearch: true }) : null) ||
      Response.error();
  }
}
async function cachePrimeiro(req, nome, max) {
  const hit = await procurar(req);
  if (hit) return hit;
  const r = await buscar(req);
  if (r.ok) { const c = await caches.open(nome); await c.put(req.url, r.clone()); if (max) limitar(nome, max); }
  return r;
}
async function validarEmFundo(req) {
  const hit = await procurar(req);
  const rede = buscar(req).then(async r => { if (r.ok) (await caches.open(FOTOS)).put(req.url, r.clone()); return r; });
  if (hit) { rede.catch(() => {}); return hit; }
  return rede;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const mesma = u.origin === self.location.origin;
  const imagem = /\.(jpe?g|png|webp)$/i.test(u.pathname);

  if (/tile\.openstreetmap\.org|arcgisonline\.com/.test(u.host)) {
    e.respondWith(cachePrimeiro(req, MAPAS, MAX_MAPAS).catch(() => Response.error()));
  } else if (/unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.host)) {
    e.respondWith(cachePrimeiro(req, LIBS).catch(() => Response.error()));
  } else if (/\.github\.io$/.test(u.host) && imagem && !/icon-/.test(u.pathname)) {
    e.respondWith(validarEmFundo(req).catch(() => Response.error()));
  } else if (mesma) {
    e.respondWith(redePrimeiro(req));
  }
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
