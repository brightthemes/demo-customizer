import Alpine from 'alpinejs'
import css from './main.css?inline'
import template from './widget.html?raw'
import { createCustomize } from './state.js'
import { isPreviewFrame } from './preview.js'

const script = document.currentScript
const themeId = script?.getAttribute('data-theme') || 'glass'

// The preview iframe renders the same page, code injection included: the customizer runs only on the page itself.
if (!isPreviewFrame()) {
  const host = document.createElement('bt-customize')
  host.style.cssText = 'position:relative;z-index:2147483001'
  Alpine.data('customize', () => createCustomize(themeId, host))

  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = css
  const wrap = document.createElement('div')
  wrap.innerHTML = template.trim()
  const panel = wrap.firstElementChild
  root.append(style, panel)

  const mount = () => {
    if (!document.body || host.isConnected) return
    document.body.append(host)
    Alpine.initTree(panel)
  }

  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount)
}
