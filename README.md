# Demo customizer

The panel on the Bright Themes demo sites: try the theme's settings, browse the other themes, buy.

## How it works

Settings are rendered by Ghost, not imitated in the browser. A change POSTs the current page with the
`x-ghost-preview` header (what Ghost Admin's design preview uses), and the answer is shown in an iframe over the
page. Ghost merges the values sent with the site's own:

- `c`: accent color, `hf` / `bf`: heading and body font (Ghost's font names), `cover`: site cover image
- `custom`: URL-encoded JSON of the theme's custom settings, e.g. `{"site_background":"cream"}`

Nothing is stored: a reload or a link click shows the demo as it is.

The controls come from each theme's `config.custom` (`src/themes.json`, written by `npm run sync`). Text, image,
link and ID settings are left out; homepage settings show on the home page, post settings on posts and pages.
`overrides` in `src/config.js` hides or shows settings, renames them, or adds cover images for a theme.

## Commands

- `npm run sync`: copies every theme's settings into `src/themes.json`, from the theme repos next to this one
  (or `THEMES_DIR`). Run it after a theme's settings change.
- `npm run build`: writes `dist/customize.js`, which is committed: the demos load it from jsDelivr at a commit.

## On a demo

**Settings › Code injection › Site footer**, with the theme's slug and this repo's commit:

```html
<script>!function(t){function i(){var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/gh/brightthemes/demo-customizer@<commit>/dist/customize.js";s.dataset.theme=t;document.body.appendChild(s)}function l(){"requestIdleCallback"in window?requestIdleCallback(i,{timeout:3e3}):setTimeout(i,2e3)}document.readyState=="complete"?l():addEventListener("load",l)}("<slug>")</script>
```
