const CACHE="ffw-v2-19-2-dina4-ohne-vorschau";
const PRECACHE=["./js/features/statistics/statistics-engine.js","./js/features/reports/ipad-document-editor.js","./js/features/operations/operations.js","./js/features/reports/zip-terminpakete.js","./assets/einsatzbericht-vorlage-seite1.jpg","./assets/einsatzbericht-vorlage-seite2.jpg"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)));});
self.addEventListener("activate",event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))])));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;
 if(event.request.mode==="navigate"){event.respondWith(fetch(event.request).then(response=>{caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;}).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html"))));return;}
 if(/\.(?:js|css)$/i.test(url.pathname)){event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;}).catch(()=>caches.match(event.request)));return;}
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;})));
});