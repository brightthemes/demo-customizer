// Copies each theme's custom settings (config.custom in its package.json) into src/themes.json, with a reader for
// each setting where the theme's templates show how its value reaches the page (see src/read.js).
// Run from a folder where the theme repos sit next to this one, or set THEMES_DIR.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { themes } from '../src/catalog.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = process.env.THEMES_DIR || join(root, '..')
const out = join(root, 'src/themes.json')
const previous = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {}
const result = {}
const missing = []

const templates = (folder) => readdirSync(folder).flatMap((name) => {
  const path = join(folder, name)
  if (/^(node_modules|assets|demo|prototypes|dist)$|^\./.test(name)) return []
  return statSync(path).isDirectory() ? templates(path) : path.endsWith('.hbs') ? [readFileSync(path, 'utf8')] : []
}).join('\n')

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// --x: var(--prefix-{{@custom.key}}), --x: {{@custom.key}}, data-x="{{@custom.key}}", {{#if @custom.key}}data-x{{/if}}
function reader(text, key) {
  const value = escape('{{@custom.' + key + '}}')
  let m
  if ((m = text.match(new RegExp('(--[\\w-]+):\\s*var\\(--([\\w-]+?)-' + value + '\\)')))) return { css: m[1], scale: '--' + m[2] + '-' }
  if ((m = text.match(new RegExp('(--[\\w-]+):\\s*' + value)))) return { css: m[1] }
  if ((m = text.match(new RegExp('(data-[\\w-]+)="' + value + '"')))) return { attr: m[1] }
  if ((m = text.match(new RegExp(escape('{{#if @custom.' + key + '}}') + '\\s*(?:\\{\\{#is "[^"]+"\\}\\}\\s*)?(data-[\\w-]+)(?:="([^"{]*)")?')))) {
    return { has: m[2] ? `[${m[1]}="${m[2]}"]` : `[${m[1]}]` }
  }
  return undefined
}

for (const { slug } of themes) {
  const file = join(dir, slug, 'package.json')
  if (!existsSync(file)) {
    missing.push(slug)
    if (previous[slug]) result[slug] = previous[slug]
    continue
  }
  const custom = JSON.parse(readFileSync(file, 'utf8')).config?.custom || {}
  const text = templates(join(dir, slug))
  result[slug] = Object.fromEntries(Object.entries(custom).map(([key, setting]) => [key, {
    type: setting.type,
    ...(setting.options && { options: setting.options }),
    ...(setting.default !== undefined && { default: setting.default }),
    ...(setting.group && { group: setting.group }),
    ...(setting.type !== 'text' && setting.type !== 'image' && { read: reader(text, key) }),
  }]))
}

writeFileSync(out, JSON.stringify(result, null, 2) + '\n')
console.log(`Wrote ${Object.keys(result).length} themes to src/themes.json`)
if (missing.length) console.warn(`Not found in ${dir} (kept the previous settings): ${missing.join(', ')}`)
