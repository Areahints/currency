self.addEventListener('install', e => {

    e.waitUntil(
        caches.open('prog-conv-v1').then(function(cache){
            return cache.addAll([
                        './',
                        './assets/jquery.min.js',
                        './assets/style.css',
                        './assets/idbconfig.js',
                        './assets/controller.js',
            ])
        })
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    if(requestUrl.origin === "https://free.currencyconverterapi.com"){
        fetchNetwork(event);
    }else{
        fetchCache(event);
    }
  });

  function fetchCache(event) {
    let response = null;
    event.respondWith(fromCache(event.request)
        .catch(() => fetch(event.request.clone())
            .then((resp) => {
                response = resp;
                return update(event.request, resp.clone());
            })
            .then(() => response)));
  }

  function fetchNetwork(event){
      event.respondWith(fetch(event.request.clone()));            
  }

  function fromCache(request) {
    return caches.open('prog-conv-v1').then((cache) => {
      return cache.match(request).then((matching) => {
        return matching || Promise.reject('no-match');
      });
    });
  }
  
  function update(request, response) {
    return caches.open('prog-conv-v1').then((cache) => cache.put(request, response));
  }