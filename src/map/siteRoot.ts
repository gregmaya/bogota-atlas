/** The site's root URL (with the /bogota-atlas/ base), absolute. */
export const siteRoot = () => new URL(import.meta.env.BASE_URL, window.location.href).href
