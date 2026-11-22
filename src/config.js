import settings from './themes.json'

// The panel keeps to what changes the look without changing the layout: Ghost's brand color and fonts (in the
// panel itself), the theme's color settings, and per theme the settings listed in `show` (backgrounds, patterns,
// font weights, card styles: values the theme's CSS reads, not ones that switch partials).
// Per theme: show (setting keys), hide (keys, e.g. a color setting), labels (key → label), covers (Ghost's site cover),
// read (key → reader, see src/read.js) where `npm run sync` can't work out how to read a setting from the page.
export const overrides = {
  glass: {
    show: ['ui_font_family', 'headings_font_weight', 'site_background', 'site_background_overlay'],
    labels: { ui_font_family: 'UI font' },
    read: { ui_font_family: { css: '--font-ui', scale: '--font-' } },
    covers: [1, 2, 6, 7, 8, 9, 10, 11, 12].map((index) =>
      'https://glass.brightthemes.com/content/images/2026/10/glass-bg-' + index + '.jpg'
    ),
  },
  prose: {
    show: ['ui_font_family', 'heading_font_weight', 'divider_style', 'first_letter_drop_cap'],
    labels: { ui_font_family: 'UI font' },
    read: { ui_font_family: { css: '--font-ui', scale: '--font-' } },
  },
  gazet: {
    show: ['headings_font_weight', 'post_title_alignment', 'enable_dropcaps'],
    read: { post_title_alignment: { match: { center: '[data-post-hero-content].text-center' }, scope: '[data-post-hero-content]', otherwise: 'left' } },
  },
  brief: {
    show: ['hero_text_alignment'],
    read: { hero_text_alignment: { match: { left: '[data-hero] > div.items-start' }, scope: '[data-hero] > div', otherwise: 'center' } },
  },
  pulse: { show: ['styled_episode_number'] },
  array: { show: ['header_last_nav_item_styled', 'hero_background'] },
  flair: {
    show: ['hero_background_style', 'post_card_style'],
    read: { post_card_style: { match: { bordered: '[data-post-card].border', shadowed: '[data-post-card].shadow-theme' }, scope: '[data-post-card]', otherwise: 'minimal' } },
  },
  bokeh: {
    show: ['grain_background', 'post_card_image_aspect_ratio'],
    read: { grain_background: { has: '[class*="before:bg-grain"]' } },
  },
  saaga: {
    show: ['post_card_image_aspect_ratio'],
    read: { post_card_image_aspect_ratio: { match: { hidden: '[data-images="hidden"]' }, then: { attr: 'data-aspect-ratio' } } },
  },
  curie: {
    show: ['styled_header_nav_items', 'post_card_image_aspect_ratio'],
    read: { styled_header_nav_items: { attr: 'data-nav-items', values: { 'last-two': 'Last two items', 'last-one': 'Last item', none: 'None' } } },
  },
  maali: { show: ['enable_drop_caps'] },
  tuuli: { show: ['background_accent'] },
  fumio: { show: ['background_pattern', 'project_card_color'] },
  joben: { show: ['post_card_tag_accent_bg'] },
  yoffa: {
    show: ['hero_cover_image_aspect_ratio'],
    read: {
      hero_cover_image_aspect_ratio: {
        match: Object.fromEntries(['hidden', '1/1', '16/9', '4/3', '3/4'].map((option) => [option,
          option === 'hidden' ? 'figure[class*="max-w-[400px]"].hidden' : `figure[class*="max-w-[400px]"][class*="aspect-[${option}]"]`])),
      },
    },
  },
  dashi: { read: { secondary_color: { css: '--color-secondary' } } },
}

const included = (key, setting, extra) =>
  !(extra.hide || []).includes(key) && (setting.type === 'color' || (extra.show || []).includes(key))

const humanize = (value) => {
  const text = String(value).replace(/[_-]+/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// The page decides which groups apply, as in Ghost Admin: homepage settings on the home page, post settings on posts
// and pages. The demo sites' extra home pages (routes to demo/home-2.hbs…, with a page's data) count as home pages.
export function pageGroup(body = document.body) {
  if (body.classList.contains('home-template') || [...body.classList].some((name) => /^page-home(-|$)/.test(name))) return 'homepage'
  if (body.classList.contains('post-template') || body.classList.contains('page-template')) return 'post'
  return null
}

// A homepage setting also shows on a page that isn't marked as one (a demo home whose route has no page data) when
// its reader finds it there: a hero or card attribute only appears where the setting applies.
export function controlsFor(themeId, group, found = () => false) {
  const extra = overrides[themeId] || {}
  const list = Object.entries(settings[themeId] || {})
    .filter(([key, setting]) => included(key, setting, extra))
    .map(([key, setting]) => [key, { ...setting, read: extra.read?.[key] || setting.read }])
    .filter(([, setting]) => !setting.group || setting.group === group ||
      (setting.group === 'homepage' && group !== 'post' && setting.read && !setting.read.has && found(setting)))
    .map(([key, setting]) => ({
      key,
      type: setting.type,
      label: extra.labels?.[key] || humanize(key),
      default: setting.default,
      read: setting.read,
      options: setting.type === 'boolean'
        ? [{ value: 'true', label: 'On' }, { value: 'false', label: 'Off' }]
        : (setting.options || []).map((value) => ({ value, label: humanize(value) })),
    }))
  return { settings: list, covers: extra.covers || [] }
}
