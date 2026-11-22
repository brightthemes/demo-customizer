// Ghost renders the page with other settings when a POST carries the x-ghost-preview header (what Ghost Admin's
// design preview uses): c = accent color, hf / bf = heading and body font, cover = site cover, custom = JSON of the
// theme's settings. Only the values sent change. The page is shown in an iframe over the real one, so nothing is
// stored: a reload or a link click shows the demo as it is.

let frame = null
let request = 0
let controller = null

export function header({ accent, heading, body, cover, custom }) {
  const parts = []
  if (accent) parts.push('c=' + encodeURIComponent(accent))
  if (heading) parts.push('hf=' + encodeURIComponent(heading))
  if (body) parts.push('bf=' + encodeURIComponent(body))
  if (cover) parts.push('cover=' + encodeURIComponent(cover))
  if (custom && Object.keys(custom).length) parts.push('custom=' + encodeURIComponent(JSON.stringify(custom)))
  return parts.join('&')
}

export function isPreviewFrame() {
  try {
    return Boolean(window.frameElement && window.frameElement.hasAttribute('data-bt-preview'))
  } catch {
    return false
  }
}

// The document visitors currently see: the preview if there is one, otherwise the page itself.
export function currentDocument() {
  return frame?.contentDocument || document
}

// `prepare(doc)` runs on the new page before it's shown, to bring it up to changes made while Ghost was rendering.
export async function render(params, host, prepare) {
  const id = ++request
  controller?.abort()
  controller = new AbortController()
  let html
  try {
    const response = await fetch(window.location.href, {
      method: 'POST',
      headers: { 'x-ghost-preview': header(params) },
      credentials: 'same-origin',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Preview failed: ' + response.status)
    html = await response.text()
  } catch (error) {
    if (id !== request) return
    throw error
  }
  if (id !== request) return

  const scroll = frame ? frame.contentWindow.scrollY : window.scrollY
  const next = document.createElement('iframe')
  next.setAttribute('data-bt-preview', '')
  next.title = document.title
  next.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483000;background:#fff;visibility:hidden'
  next.srcdoc = html
  document.body.append(next)

  await ready(next)
  if (id !== request) {
    next.remove()
    return
  }
  next.contentWindow.scrollTo(0, scroll)
  wire(next.contentWindow)
  try { prepare?.(next.contentDocument) } catch {}
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  next.style.visibility = 'visible'
  frame?.remove()
  frame = next
  cover(host)
}

// Shown once the preview's DOM and deferred scripts have run, without waiting for every image.
function ready(iframe) {
  return new Promise((resolve) => {
    const started = Date.now()
    const check = () => {
      const doc = iframe.contentDocument
      if (doc && doc.URL === 'about:srcdoc' && doc.readyState !== 'loading') {
        if (doc.readyState === 'complete') resolve()
        else iframe.contentWindow.addEventListener('DOMContentLoaded', () => setTimeout(resolve, 50), { once: true })
        return
      }
      if (Date.now() - started > 8000) resolve()
      else setTimeout(check, 30)
    }
    check()
  })
}

// The page underneath is hidden from scrolling, focus and screen readers while the preview covers it.
function cover(host) {
  document.documentElement.style.overflow = 'hidden'
  for (const el of document.body.children) {
    if (el !== host && !el.hasAttribute('data-bt-preview')) el.inert = true
  }
}

// Links inside the preview: anchors and Portal links (#/portal/…) stay in the preview, other pages open for real
// (and reset the preview). Escape reaches the customizer, which listens on the top window.
function wire(win) {
  const doc = win.document
  doc.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target.closest?.('a[href]')
    if (!link || (link.target && link.target !== '_self')) return
    let url
    try { url = new URL(link.getAttribute('href'), window.location.href) } catch { return }
    if (!/^https?:$/.test(url.protocol)) return
    event.preventDefault()
    const here = new URL(window.location.href)
    if (url.origin === here.origin && url.pathname === here.pathname && url.search === here.search) {
      if (url.hash) win.location.hash = url.hash
      return
    }
    window.location.href = url.href
  })
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })
}
