import settings from './themes.json'

// The panel keeps to what changes the look without changing the layout: Ghost's brand color and fonts (in the
// panel itself), the theme's color settings, and per theme the settings listed in `show` (backgrounds, patterns,
// font weights, card styles: values the theme's CSS reads, not ones that switch partials).
// Per theme: show (setting keys), hide (keys, e.g. a color setting), labels (key → label), covers (Ghost's site cover).
export const overrides = {
  glass: {
    show: ['ui_font_family', 'headings_font_weight', 'site_background', 'site_background_overlay'],
    labels: { ui_font_family: 'UI font' },
    covers: [1, 2, 6, 7, 8, 9, 10, 11, 12].map((index) =>
      'https://glass.brightthemes.com/content/images/2026/10/glass-bg-' + index + '.jpg'
    ),
  },
  prose: { show: ['ui_font_family', 'heading_font_weight', 'divider_style', 'first_letter_drop_cap'], labels: { ui_font_family: 'UI font' } },
  gazet: { show: ['headings_font_weight', 'post_title_alignment', 'enable_dropcaps'] },
  brief: { show: ['hero_text_alignment'] },
  pulse: { show: ['styled_episode_number'] },
  array: { show: ['header_last_nav_item_styled', 'hero_background', 'tag_card_background'] },
  flair: { show: ['hero_background_style', 'post_card_style'] },
  bokeh: { show: ['grain_background', 'post_card_image_aspect_ratio'] },
  saaga: { show: ['post_card_image_aspect_ratio'] },
  curie: { show: ['styled_header_nav_items', 'post_card_image_aspect_ratio'] },
  maali: { show: ['enable_drop_caps'] },
  tuuli: { show: ['background_accent'] },
  fumio: { show: ['background_pattern', 'project_card_color'] },
  joben: { show: ['post_card_tag_accent_bg'] },
  yoffa: { show: ['hero_cover_image_aspect_ratio'] },
}

const included = (key, setting, extra) =>
  !(extra.hide || []).includes(key) && (setting.type === 'color' || (extra.show || []).includes(key))

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
    .filter(([key, setting]) => included(key, setting, extra))
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
