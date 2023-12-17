/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag
export type {};
declare const self: ServiceWorkerGlobalScope;


const cacheName = "nbn-tech-map-cache-v1";
const cacheDuration = 30;

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(["/", "/offline"]);
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            // Remove caches whose name is no longer valid
            return Promise.all(
            keys
                .filter(function (key) {
                    return key.indexOf(cacheName) !== 0;
                })
                .map(function (key) {
                    return caches.delete(key);
                })
            );
        })
    );
});

self.addEventListener("fetch", function(event) {

    const request = event.request;

    // Always fetch non-GET requests from the network
    if (request.method !== "GET") {
        event.respondWith(
            fetch(request).catch(function () {
                return caches.match("/offline");
            }) as Promise<Response>
        );
        return;
    }

    // Fetch map tiles from cache if available
    if (event.request.url.includes('/rastertiles/')) {
        event.respondWith(caches.open(`${cacheName}-tiles`).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                if (isValid(cachedResponse)) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    let cacheCopy = networkResponse.clone();
                    let headers = new Headers(cacheCopy.headers);
                    headers.append('sw-fetched-on', new Date().getTime().toString());
                    cache.put(event.request, new Response(cacheCopy.body, {
                        status: cacheCopy.status,
                        statusText: cacheCopy.statusText,
                        headers: headers
                    }));

                    return networkResponse;
                }).catch(() => {
                    return cachedResponse;
                });
            });
        }));
    }

    // API Requests
    if (event.request.url.includes('/nbn-bulk/map/')) {
        event.respondWith(caches.open(`${cacheName}-places`).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                if (isValid(cachedResponse)) {
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    let cacheCopy = networkResponse.clone();
                    let headers = new Headers(cacheCopy.headers);
                    headers.append('sw-fetched-on', new Date().getTime().toString());
                    cache.put(event.request, new Response(cacheCopy.body, {
                        status: cacheCopy.status,
                        statusText: cacheCopy.statusText,
                        headers: headers
                    }));

                    return networkResponse;
                }).catch(() => {
                    return cachedResponse;
                });
            });
        }));
    }

    if (event.request.url.startsWith(this.origin)) {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    // Stash a copy of this page in the cache
                    const copy = response.clone();
                    caches.open(`${cacheName}-other`).then(function (cache) {
                        cache.put(request, copy);
                    });
                    return response;
                })
                .catch(function () {
                    return caches.match(request).then(function (response) {
                        // return the cache response or the /offline page.
                        return response || caches.match("/offline");
                    });
                }) as Promise<Response>
          );
          return;
      
    }


    console.log('Unhanled fetch event:', event.request.url);
    return;

});

function isValid (response: Response, days=cacheDuration) {
    if (!response) {
        return false;
    }

    const fetchedOn = response.headers.get('sw-fetched-on');
    if (!fetchedOn) {
        return false;
    }

    const fetchedOnTime = parseInt(fetchedOn);
    if (isNaN(fetchedOnTime)) {
        return false;
    }

    return (new Date().getTime() - fetchedOnTime) < (days * 24 * 60 * 60 * 1000);
}