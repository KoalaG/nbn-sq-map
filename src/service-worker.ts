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

async function fromCacheFirst(cacheName: string, request: Request, days: number = cacheDuration) {

    if (request.headers.get('sw-no-cache')) {
        return await fromNetworkFirst(cacheName, request);
    }

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && isValid(cachedResponse)) {
        console.debug('fromCacheFirst: cached response', request.url)
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);

    let cacheCopy = networkResponse.clone();
    let headers = new Headers(cacheCopy.headers);
    headers.append('sw-fetched-on', new Date().getTime().toString());
    cache.put(request, new Response(cacheCopy.body, {
        status: cacheCopy.status,
        statusText: cacheCopy.statusText,
        headers: headers
    }));
    
    console.debug('fromCacheFirst: network response', request.url)
    return networkResponse;

}

async function fromNetworkFirst(cacheName: string, request: Request) {
    
    const cache = await caches.open(cacheName);

    try {
        const networkResponse = await fetch(request);
        let cacheCopy = networkResponse.clone();
        let headers = new Headers(cacheCopy.headers);
        headers.append('sw-fetched-on', new Date().getTime().toString());
        cache.put(request, new Response(cacheCopy.body, {
            status: cacheCopy.status,
            statusText: cacheCopy.statusText,
            headers: headers
        }));
        console.debug('fromNetworkFirst: network response', request.url)
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse && isValid(cachedResponse)) {
            console.debug('fromNetworkFirst: cached response', request.url)
            return cachedResponse;
        }
        throw error;
    }

}



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
        return event.respondWith(fromCacheFirst(`${cacheName}-tiles`, event.request, 30));
    }

    // API Requests
    if (event.request.url.includes('/nbn-bulk/map/')) {
        return event.respondWith(fromCacheFirst(`${cacheName}-places`, event.request, 0.5));
    }

    // Everything else
    if (event.request.url.startsWith(this.origin)) {
        return event.respondWith(fromNetworkFirst(`${cacheName}-other`, event.request));
    }

    console.log('Unhandled fetch event:', event.request.url);
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