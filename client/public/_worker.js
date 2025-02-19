export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      
      // Handle legal pages
      if (url.pathname === '/privacybeleid') {
        return fetch(new URL('/privacybeleid.html', request.url));
      }
      if (url.pathname === '/algemene-voorwaarden') {
        return fetch(new URL('/algemene-voorwaarden.html', request.url));
      }
  
      // All other requests go to the SPA
      return fetch(request);
    }
  };