self.addEventListener('fetch', (event) => {
    // default behaviour: request the network
    event.respondWith(fetch(event.request));
});
