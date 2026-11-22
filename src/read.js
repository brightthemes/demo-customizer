// Reads a setting's current value from the page, with the reader `npm run sync` worked out from the theme's templates
// (or one from `overrides`):
//   { css: '--var' }                     a CSS variable (colors are returned as hex)
//   { css: '--var', scale: '--prefix-' } a CSS variable set to one of --prefix-<option>
//   { attr: 'data-x', values? }          the attribute's value (values maps it to an option)
//   { has: 'selector' }                  a boolean: whether the selector matches
//   { match: { option: 'selector' }, scope?, otherwise?, then? }
//                                        the first option whose selector matches; else `otherwise` when `scope`
//                                        is on the page, else the `then` reader
// Returns null when the page doesn't show it.

export function toHex(value, doc = document) {
  if (!value) return null
  const probe = doc.createElement('span')
  probe.style.color = ''
  probe.style.color = value
  if (!probe.style.color) return null
  probe.style.display = 'none'
  doc.body.append(probe)
  const rgb = getComputedStyle(probe).color
  probe.remove()
  const match = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (!match) return null
  return '#' + match.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

export function readSetting(reader, setting, doc = document) {
  if (!reader) return null
  const style = getComputedStyle(doc.body)
  const prop = (name) => style.getPropertyValue(name).trim()

  if (reader.match) {
    for (const [option, selector] of Object.entries(reader.match)) {
      if (doc.querySelector(selector)) return option
    }
    if (reader.otherwise && (!reader.scope || doc.querySelector(reader.scope))) return reader.otherwise
    return reader.then ? readSetting(reader.then, setting, doc) : null
  }
  if (reader.has) return doc.querySelector(reader.has) ? 'true' : 'false'
  if (reader.attr) {
    const el = doc.querySelector('[' + reader.attr + ']')
    if (!el) return null
    const value = el.getAttribute(reader.attr)
    return reader.values ? (reader.values[value] ?? null) : value
  }
  if (reader.css) {
    const value = prop(reader.css)
    if (!value) return null
    if (reader.scale) {
      const options = (setting.options || []).map((option) => (typeof option === 'object' ? option.value : option))
      return options.find((option) => prop(reader.scale + option) === value) ?? null
    }
    return setting.type === 'color' ? toHex(value, doc) : value
  }
  return null
}

// The font the theme itself uses for headings or body text, for the "Theme font" option.
export function themeFont(which, doc = document) {
  const el = which === 'heading' ? doc.querySelector('h1, h2') : doc.querySelector('main p, p') || doc.body
  if (!el) return ''
  return getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()
}

// Ghost's own font choice, when the site has one.
export function ghostFont(which, doc = document) {
  return getComputedStyle(doc.documentElement).getPropertyValue(which === 'heading' ? '--gh-font-heading' : '--gh-font-body').replace(/["']/g, '').trim()
}
