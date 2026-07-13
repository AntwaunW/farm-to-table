// Reads the JSON payload the prerender script (client/scripts/prerender.js) embeds
// as <script id="__PRELOADED_STATE__" type="application/json"> in prerendered pages.
// Removes the tag after reading so it can't be mistaken for fresh data on later
// client-side navigations to the same component.
export const getPreloadedState = () => {
  const el = document.getElementById('__PRELOADED_STATE__');
  if (!el) return null;

  el.remove();

  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
};
