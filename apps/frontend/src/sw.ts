import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;
(self as any).addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SKIP_WAITING")
    (self as any).skipWaiting();
});
// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);
