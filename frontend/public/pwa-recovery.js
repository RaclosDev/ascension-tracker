/* eslint-disable no-undef */
(function () {
  // Capture unhandled module script load errors in capture phase
  // Essential for standalone PWAs where stale index.html might reference deleted chunk hashes
  var lockKey = 'ascension_pwa_recovery_lock';
  window.addEventListener(
    'error',
    function (e) {
      var msg = (e && (e.message || (e.error && e.error.message))) || '';
      var isChunkError =
        /importing.*module.*script|dynamically imported module|failed to fetch.*module|loading chunk|load chunk|mime type/i.test(
          msg,
        );
      if (isChunkError) {
        var last = Number(sessionStorage.getItem(lockKey) || 0);
        var now = Date.now();
        if (!last || now - last > 10000) {
          sessionStorage.setItem(lockKey, String(now));
          var cleanup = function () {
            if ('caches' in window) {
              caches
                .keys()
                .then(function (keys) {
                  return Promise.all(
                    keys.map(function (k) {
                      return caches.delete(k);
                    }),
                  );
                })
                .finally(function () {
                  window.location.reload();
                });
            } else {
              window.location.reload();
            }
          };

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker
              .getRegistrations()
              .then(function (regs) {
                return Promise.all(
                  regs.map(function (r) {
                    return r.unregister();
                  }),
                );
              })
              .finally(cleanup);
          } else {
            cleanup();
          }
        }
      }
    },
    true,
  );
})();
