var cacheName = 'test-v1';
var filesToCache = [
  './index.html',
  './css/app.css',
  './js/app.js',
  /* ...and other assets (jQuery, Materialize, fonts, etc) */
  /* css */
  './css/materialize.min.css',
  './css/offline-theme-default.css',
  './css/offline-language-english.css',
  /* js */
  './js/jquery-2.2.4.js',
  './js/materialize.min.js'
  //'./js/offline.min.js'

];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    },function(err){
      console.log(err)
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    },function(err){
      console.log(err)
    })
  );
  return self.clients.claim();
});


self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);
  console.dir(e.request);
  console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      //console.log(response)
      return response || fetch(e.request);
    },function(err){
      console.log(err);
    })
  );
});

/*
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  console.dir(e.request);

  // serve the horse SVG from the cache if the request is
  // same-origin and the path is '/dog.svg'
  if (url.origin == location.origin) {
      e.respondWith(
         caches.match(url)
            .then(function(response) {
                console.log(response);
                return response || fetch(e.request);
            })
       );
  }
});

*/