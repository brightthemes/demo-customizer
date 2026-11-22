// Copies each theme's custom settings (config.custom in its package.json) into src/themes.json.
// Run from a folder where the theme repos sit next to this one, or set THEMES_DIR.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { themes } from '../src/catalog.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = process.env.THEMES_DIR || join(root, '..')
const out = join(root, 'src/themes.json')
const previous = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {}
const result = {}
const missing = []

for (const { slug } of themes) {
  const file = join(dir, slug, 'package.json')
  if (!existsSync(file)) {
    missing.push(slug)
    if (previous[slug]) result[slug] = previous[slug]
    continue
  }
  const custom = JSON.parse(readFileSync(file, 'utf8')).config?.custom || {}
  result[slug] = Object.fromEntries(Object.entries(custom).map(([key, setting]) => [key, {
    type: setting.type,
    ...(setting.options && { options: setting.options }),
    ...(setting.default !== undefined && { default: setting.default }),
    ...(setting.group && { group: setting.group }),
  }]))
}

writeFileSync(out, JSON.stringify(result, null, 2) + '\n')
console.log(`Wrote ${Object.keys(result).length} themes to src/themes.json`)
if (missing.length) console.warn(`Not found in ${dir} (kept the previous settings): ${missing.join(', ')}`)
