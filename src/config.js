import settings from './themes.json'

// Settings that make no sense to try on a demo: free text, uploads, links, IDs, and the theme's own font choices
// (Ghost's heading and body fonts in the panel take precedence over them).
const skip = (key, setting) =>
  setting.type === 'text' || setting.type === 'image' || /(^|_)(link|url|id|slugs|logo)(_|$)/.test(key) ||
  /^font_(headings|body|family)$/.test(key)

// Per theme, only where the generated settings need help:
// hide/show (setting keys), labels (key → label), covers (images for Ghost's site cover).
export const overrides = {
  glass: {
    covers: [1, 2, 6, 7, 8, 9, 10, 11, 12].map((index) =>
      'https://glass.brightthemes.com/content/images/2026/10/glass-bg-' + index + '.jpg'
    ),
  },
}

const humanize = (value) => {
  const text = String(value).replace(/[_-]+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The page decides which groups apply, as in Ghost Admin: homepage settings on the home page, post settings on posts and pages.
export function pageGroup(body = document.body) {
  if (body.classList.contains('home-template')) return 'homepage'
  if (body.classList.contains('post-template') || body.classList.contains('page-template')) return 'post'
  return null
}

export function controlsFor(themeId, group) {
  const extra = overrides[themeId] || {}
  const list = Object.entries(settings[themeId] || {})
    .filter(([key, setting]) => (extra.show || []).includes(key) || (!skip(key, setting) && !(extra.hide || []).includes(key)))
    .filter(([, setting]) => !setting.group || setting.group === group)
    .map(([key, setting]) => ({
      key,
      type: setting.type,
      label: extra.labels?.[key] || humanize(key),
      default: setting.default,
      options: setting.type === 'boolean'
        ? [{ value: 'true', label: 'On' }, { value: 'false', label: 'Off' }]
        : (setting.options || []).map((value) => ({ value, label: humanize(value) })),
    }))
  return { settings: list, covers: extra.covers || [] }
}
