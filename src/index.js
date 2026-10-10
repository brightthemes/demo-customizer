import Alpine from 'alpinejs'
import css from './main.css?inline'
import template from './widget.html?raw'
import { createCustomize } from './state.js'

const script = document.currentScript
const themeId = script?.getAttribute('data-theme') || 'glass'

Alpine.data('customize', () => createCustomize(themeId))

const host = document.createElement('bt-customize')
const root = host.attachShadow({ mode: 'open' })
const style = document.createElement('style')
style.textContent = css
const wrap = document.createElement('div')
wrap.innerHTML = template.trim()
const panel = wrap.firstElementChild
root.append(style, panel)

function mount() {
  if (!document.body || host.isConnected) return
  document.body.append(host)
  Alpine.initTree(panel)
}

if (document.body) mount()
else document.addEventListener('DOMContentLoaded', mount)
