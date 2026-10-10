import { themes } from './catalog.js'

const brand = { id: 'brand', type: 'brand' }
const fonts = { id: 'fonts', type: 'fonts' }

const shared = [brand, fonts]

const glass = [
  brand,
  {
    id: 'background',
    type: 'select',
    label: 'Background',
    attr: 'site-background',
    target: 'body',
    options: [
      { value: 'cover-image', label: 'Cover image' },
      { value: 'brand-color', label: 'Brand color' },
      { value: 'graphite', label: 'Graphite' },
      { value: 'cream', label: 'Cream' },
    ],
  },
  {
    id: 'images',
    type: 'images',
    label: 'Image',
    when: { attr: 'site-background', value: 'cover-image' },
    image: '[data-background-image]',
    container: '[data-background-container]',
  },
  {
    id: 'pattern',
    type: 'select',
    label: 'Pattern',
    attr: 'site-background-overlay',
    target: 'body',
    options: [
      { value: 'none', label: 'None' },
      { value: 'light', label: 'Light' },
      { value: 'medium', label: 'Medium' },
      { value: 'heavy', label: 'Heavy' },
    ],
  },
  fonts,
]

export const themeControls = Object.fromEntries(themes.map((theme) => [theme.slug, shared]))
themeControls.glass = glass

export function controlsFor(themeId) {
  return themeControls[themeId] || shared
}
