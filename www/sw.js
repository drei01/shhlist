self.addEventListener('fetch', (event) => {
    console.log(`Request of ${event.request.url}`);

    // default behaviour: request the network
    event.respondWith(fetch(event.request));
});
