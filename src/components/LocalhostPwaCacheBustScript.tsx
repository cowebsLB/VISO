/**
 * Runs in <head> before Next/React chunks load. Stale Serwist/admin SW + Cache Storage on
 * localhost often intercept `/_next/static/*` (layout.css, main-app.js, etc.) and return 404
 * because unregister/delete is async — the first paint can still use the old controller.
 * After unregister + cache delete completes, we reload (max 2× per tab session) so the next
 * load hits the network/dev server cleanly. Production hostnames are skipped.
 */
export function LocalhostPwaCacheBustScript() {
  const js = `
(function () {
  try {
    var h = location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return;

    var pReg =
      "serviceWorker" in navigator
        ? navigator.serviceWorker.getRegistrations().then(function (regs) {
            var n = regs.length;
            return Promise.all(
              regs.map(function (r) {
                return r.unregister();
              }),
            ).then(function () {
              return n;
            });
          })
        : Promise.resolve(0);

    var pCache =
      typeof caches !== "undefined"
        ? caches.keys().then(function (keys) {
            return Promise.all(
              keys.map(function (k) {
                return caches.delete(k);
              }),
            ).then(function () {
              return keys.length;
            });
          })
        : Promise.resolve(0);

    Promise.all([pReg, pCache]).then(function (pair) {
      var nReg = pair[0];
      var nCache = pair[1];
      if (nReg === 0 && nCache === 0) {
        try {
          sessionStorage.removeItem("__next_localhost_sw_nuke_reloads");
        } catch (e) {}
        return;
      }
      var guard = 0;
      try {
        guard = parseInt(
          sessionStorage.getItem("__next_localhost_sw_nuke_reloads") || "0",
          10,
        );
      } catch (e) {}
      if (guard >= 2) return;
      try {
        sessionStorage.setItem(
          "__next_localhost_sw_nuke_reloads",
          String(guard + 1),
        );
      } catch (e) {}
      location.reload();
    });
  } catch (e) {}
})();`.trim();

  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
