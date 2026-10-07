const CACHE='printly-shell-v15';
const SHELL=['/','/manifest.json','/logo.png','/mobile-ui.css','/mobile-ui.js','/desktop-ui.css','/desktop-ui.js','/touch-mobile.css','/icons.css','/activity.css'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin){return}event.respondWith(caches.match(event.request).then(cached=>{const network=fetch(event.request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>cached);return cached||network}))});
