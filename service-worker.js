// Nome do cache atual
const CACHE_NAME = "assinatura-digital-v1";

// Arquivos a serem cacheados
const urlsToCache = ["/", "/index.html", "/style.css", "/app.js", "/icon.png"];

// Instalação do service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache aberto");
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativação do service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retorna a resposta do cache
      if (response) {
        return response;
      }

      // Clonar a requisição
      const fetchRequest = event.request.clone();

      // Fazer a requisição e armazenar no cache
      return fetch(fetchRequest).then((response) => {
        // Verificar se é uma resposta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clonar a resposta
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
