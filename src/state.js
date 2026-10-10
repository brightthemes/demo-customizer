import { themes, covers, headingFonts, bodyFonts, fontStylesheet } from './catalog.js'
import { controlsFor } from './config.js'

function contrastColor(hex) {
  const raw = String(hex).replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return '#ffffff'
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

function targetFor(control) {
  return control.target === 'html' ? document.documentElement : document.body
}

export function createCustomize(themeId) {
  return {
    panel: null,
    themeId,
    controls: controlsFor(themeId),
    brand: '#1a1a1a',
    heading: '',
    body: '',
    image: '',
    images: [],
    values: {},
    covers,
    headingOptions: headingFonts.map(([value, label]) => ({ value, label })),
    bodyOptions: bodyFonts.map(([value, label]) => ({ value, label })),
    catalog() {
      return themes.filter((item) => item.slug !== this.themeId)
    },

    reveal() {
      const show = () => {
        this.sync()
        this.$el.hidden = false
      }
      if ('requestIdleCallback' in window) requestIdleCallback(show, { timeout: 2000 })
      else setTimeout(show, 1500)
    },

    toggle(name) {
      this.panel = this.panel === name ? null : name
      if (this.panel === 'appearance') this.loadFonts()
    },

    loadFonts() {
      if (!this.controls.some((control) => control.type === 'fonts')) return
      if (document.getElementById('demo-ghost-fonts')) return
      const link = document.createElement('link')
      link.id = 'demo-ghost-fonts'
      link.rel = 'stylesheet'
      link.href = fontStylesheet
      document.head.appendChild(link)
    },

    buyUrl() {
      return 'https://brightthemes.com/themes/' + this.themeId + '?ref=demo'
    },

    visible(control) {
      if (!control.when) return true
      return this.values[control.when.attr] === control.when.value
    },

    sync() {
      this.brand = this.readBrand()
      for (const control of this.controls) {
        if (control.type !== 'select') continue
        const current = targetFor(control).getAttribute('data-' + control.attr) || control.options[0].value
        this.values[control.attr] = current
      }
      const imageControl = this.controls.find((control) => control.type === 'images')
      const current = imageControl ? this.readImage(imageControl.image) : ''
      const same = (src) => {
        if (!current || src === current) return src === current
        const id = (url) => {
          const match = String(url).match(/photo-[A-Za-z0-9_-]+/)
          return match ? match[0] : ''
        }
        const a = id(src)
        const b = id(current)
        return Boolean(a && a === b)
      }
      const extras = this.covers.filter((src) => !same(src)).slice(0, 5)
      this.images = current ? [current].concat(extras) : this.covers.slice()
      if (current) this.image = current
    },

    readImage(selector) {
      const img = document.querySelector(selector || '[data-background-image]')
      if (!img) return ''
      const raw = img.currentSrc || img.getAttribute('src') || ''
      if (!raw) return ''
      let absolute
      try { absolute = new URL(raw, window.location.href) } catch { return '' }
      absolute.search = ''
      const photo = raw.match(/photo-[A-Za-z0-9_-]+/)
      if (photo) {
        const id = photo[0]
        const known = this.covers.find((item) => item.indexOf(id) !== -1)
        if (known) return known
        if (absolute.hostname.indexOf('unsplash.com') !== -1) return 'https://images.unsplash.com/' + id
      }
      const path = absolute.pathname.replace(/\/size\/w\d+\//, '/').replace(/\/format\/webp\//, '/')
      return absolute.origin + path
    },

    readBrand() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--ghost-accent-color').trim()
      if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw
      const match = raw.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
      if (!match) return '#1a1a1a'
      return '#' + [match[1], match[2], match[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
    },

    setBrand(hex) {
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return
      const contrast = contrastColor(hex)
      document.documentElement.style.setProperty('--ghost-accent-color', hex)
      document.documentElement.style.setProperty('--color-brand-contrast', 'color-mix(in srgb, var(--color-brand) 5%, ' + contrast + ' 100%)')
    },

    setSelect(control, value) {
      this.values[control.attr] = value
      targetFor(control).setAttribute('data-' + control.attr, value)
      if (control.attr === 'site-background') {
        const figure = document.querySelector('[data-background-figure]')
        if (figure) figure.hidden = value !== 'cover-image'
      }
    },

    setFont(which, value) {
      if (which === 'heading') this.heading = value
      else this.body = value
      const prop = which === 'heading' ? '--font-heading' : '--font-body'
      if (!value) document.body.style.removeProperty(prop)
      else document.body.style.setProperty(prop, value)
    },

    fillSelect(el, options, value) {
      el.replaceChildren()
      for (const option of options) {
        const node = document.createElement('option')
        node.value = option.value
        node.textContent = option.label
        el.appendChild(node)
      }
      if (value) el.value = value
    },

    thumb(src) {
      return this.sized(src, false)
    },

    sized(src, large) {
      if (src.indexOf('images.unsplash.com') !== -1) {
        return src + (large ? '?auto=format&fit=crop&w=2000&q=75' : '?auto=format&fit=crop&w=160&q=60')
      }
      if (src.indexOf('/content/images/') !== -1 && src.indexOf('/size/w') === -1) {
        return src.replace('/content/images/', '/content/images/size/w' + (large ? '2000' : '100') + '/')
      }
      return src
    },

    setImage(control, src) {
      this.image = src
      const background = this.controls.find((item) => item.attr === 'site-background')
      if (background) this.setSelect(background, 'cover-image')
      const container = document.querySelector(control.container || '[data-background-container]')
      if (!container) return
      let figure = container.querySelector('[data-background-figure]')
      if (!figure) {
        figure = document.createElement('figure')
        figure.className = 'absolute inset-0 size-full'
        figure.dataset.backgroundFigure = ''
        const created = document.createElement('img')
        created.alt = ''
        created.dataset.backgroundImage = ''
        created.className = 'absolute inset-0 size-full object-cover object-center'
        figure.appendChild(created)
        const pattern = container.querySelector('[data-background-pattern]')
        container.insertBefore(figure, pattern)
      }
      figure.hidden = false
      figure.querySelectorAll('source').forEach((source) => source.removeAttribute('srcset'))
      const img = figure.querySelector(control.image || '[data-background-image]') || figure.querySelector('img')
      img.removeAttribute('srcset')
      img.classList.remove('is-loaded')
      img.onload = () => img.classList.add('is-loaded')
      const full = this.sized(src, true)
      const small = this.sized(src, false)
      img.src = full
      figure.querySelectorAll('img').forEach((other) => {
        if (other !== img) other.src = small
      })
    },
  }
}
