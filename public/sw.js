const CACHE = 'openclaw-v2'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  return self.clients.claim()
})

function shouldCache(request) {
  const url = request.url
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  return true
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (!shouldCache(e.request)) return
  e.respondWith(fetch(e.request).then(r => {
    if (!r.ok) return r
    const copy = r.clone()
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {})
    return r
  }).catch(() => caches.match(e.request)))
})
