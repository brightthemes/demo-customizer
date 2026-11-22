import { themes, headingFonts, bodyFonts } from './catalog.js'
import { controlsFor, pageGroup } from './config.js'
import { render, currentDocument } from './preview.js'
import { readSetting, themeFont, ghostFont } from './read.js'

const names = (list, own) => [{ value: '', label: own ? 'Theme font (' + own + ')' : 'Theme font' }, ...list.map((name) => ({ value: name, label: name }))]

function readAccent() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--ghost-accent-color').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase()
  const match = raw.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (!match) return '#1a1a1a'
  return '#' + [match[1], match[2], match[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
}

export function createCustomize(themeId, host) {
  const { settings, covers } = controlsFor(themeId, pageGroup())
  return {
    panel: null,
    shown: null,
    sheetHeight: null,
    themeId,
    settings,
    covers,
    accent: '#1a1a1a',
    accentChanged: false,
    heading: '',
    body: '',
    cover: '',
    values: {},
    current: {},
    busy: false,
    failed: false,
    headingOptions: names(headingFonts),
    bodyOptions: names(bodyFonts),
    timer: null,

    // What the demo shows now, read from the page before the panel draws its controls.
    init() {
      this.accent = readAccent()
      this.heading = ghostFont('heading')
      this.body = ghostFont('body')
      this.headingOptions = names(headingFonts, this.heading ? '' : themeFont('heading'))
      this.bodyOptions = names(bodyFonts, this.body ? '' : themeFont('body'))
      for (const setting of this.settings) {
        let value = null
        try { value = readSetting(setting.read, setting) } catch {}
        if (value === null || value === undefined) value = setting.type === 'boolean' ? String(Boolean(setting.default)) : setting.default
        if (value !== null && value !== undefined) this.current[setting.key] = String(value)
      }
    },

    shownValue(setting) {
      return this.values[setting.key] ?? this.current[setting.key] ?? ''
    },

    catalog() {
      return themes.filter((item) => item.slug !== this.themeId)
    },

    reveal() {
      this.el = this.$el
      const show = () => {
        this.$el.hidden = false
      }
      if ('requestIdleCallback' in window) requestIdleCallback(show, { timeout: 2000 })
      else setTimeout(show, 1500)
    },

    toggle(name) {
      if (this.panel === name) {
        this.close()
        return
      }
      this.shown = name
      this.panel = name
    },

    close() {
      if (!this.panel) return
      const root = this.el
      const sheet = root?.querySelector('[data-demo-sheet]')
      const drawer = root?.querySelector('[data-demo-drawer]')
      if (sheet) this.sheetHeight = sheet.getBoundingClientRect().height
      this.panel = null
      const finish = () => {
        this.sheetHeight = null
        if (this.panel) return
        this.shown = null
      }
      if (!drawer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish()
        return
      }
      const onEnd = (event) => {
        if (event.target !== drawer || event.propertyName !== 'width') return
        drawer.removeEventListener('transitionend', onEnd)
        finish()
      }
      drawer.addEventListener('transitionend', onEnd)
      setTimeout(() => {
        drawer.removeEventListener('transitionend', onEnd)
        finish()
      }, 320)
    },

    buyUrl() {
      return 'https://brightthemes.com/themes/' + this.themeId + '?ref=demo'
    },

    themesUrl() {
      return 'https://brightthemes.com/themes/?ref=demo'
    },

    // While the color picker moves, only the color variable changes; Ghost renders the page when it's let go.
    previewAccent(hex) {
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return
      currentDocument().documentElement.style.setProperty('--ghost-accent-color', hex)
    },

    setAccent(hex) {
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return
      this.accent = hex
      this.accentChanged = true
      this.update()
    },

    setFont(which, value) {
      this[which] = value
      this.update()
    },

    setCover(src) {
      this.cover = src
      this.update()
    },

    setValue(setting, value) {
      this.values[setting.key] = value
      this.update()
    },

    custom() {
      const result = {}
      for (const setting of this.settings) {
        if (!(setting.key in this.values)) continue
        const value = this.values[setting.key]
        result[setting.key] = setting.type === 'boolean' ? value === 'true' : value
      }
      return result
    },

    update() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.apply(), 150)
    },

    async apply() {
      this.busy = true
      this.failed = false
      try {
        await render({
          accent: this.accentChanged ? this.accent : '',
          heading: this.heading,
          body: this.body,
          cover: this.cover,
          custom: this.custom(),
        }, host)
      } catch {
        this.failed = true
      } finally {
        this.busy = false
      }
    },

    colorValue(setting) {
      const value = this.shownValue(setting)
      return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'
    },

    fillSelect(el, options, value) {
      el.replaceChildren()
      for (const option of options) {
        const node = document.createElement('option')
        node.value = option.value
        node.textContent = option.label
        el.appendChild(node)
      }
      el.value = value || ''
    },

    thumb(src) {
      return src.replace('/content/images/', '/content/images/size/w100/')
    },
  }
}
