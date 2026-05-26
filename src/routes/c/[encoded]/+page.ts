// Dynamic route — can't prerender, the `[encoded]` segment is decoded at runtime.
// SPA fallback (404.html) serves this client-side.
export const prerender = false;
