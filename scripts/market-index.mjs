#!/usr/bin/env node
// Build a plugin-market index (format 1) for this repository (served from docs/ by GitHub Pages).
//
// Rules implemented here follow DSH's official plugin-market index format:
//   - format 1, UTF-8 JSON
//   - every listed version declares dsh.bundle and a non-blank engines.dsh
//     (copied verbatim from that version's package.json)
//   - publishTimestamp is the tag commit's committer time in seconds
//   - git source: canonical https repository URL + 40 lowercase hex commit
//   - title/description are LocalizedText containing "en"
//   - icon is a path relative to the index URL (served over https)
//
// Usage:  node scripts/market-index.mjs
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const outDir = join(repoRoot, 'docs', 'market')
const iconsDir = join(outDir, 'icons')

const git = (args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()
const gitBuf = (args) => execFileSync('git', args, { cwd: repoRoot })

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
const COMMIT = /^[0-9a-f]{40}$/
const LANG = /^[a-z]{2,8}(-[a-z0-9]{1,8})*$/

function fail(message) {
  throw new Error('market index: ' + message)
}

function show(commit, path) {
  try {
    return git(['show', commit + ':' + path])
  } catch {
    return null
  }
}

function jsonAt(commit, path) {
  const text = show(commit, path)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function compareVersions(a, b) {
  const core = (v) => v.split('-')[0].split('+')[0].split('.').map(Number)
  const pa = core(a)
  const pb = core(b)
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  const ra = a.includes('-') ? a.split('-').slice(1).join('-').split('+')[0] : ''
  const rb = b.includes('-') ? b.split('-').slice(1).join('-').split('+')[0] : ''
  if (ra === rb) return 0
  if (ra === '') return 1
  if (rb === '') return -1
  return ra.localeCompare(rb)
}

function webRepositoryUrl(manifest) {
  const repo = manifest && manifest.repository
  let url = typeof repo === 'string' ? repo : (repo && repo.url) || ''
  if (url === '') return 'https://github.com/hennychen/dsh-git-sidebar'
  url = url.replace(/^git\+/, '').replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '')
  if (!/^https?:\/\//.test(url)) url = 'https://' + url
  return url
}

function isLocalizedText(value) {
  if (typeof value === 'string') return value.trim() !== ''
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  if (typeof value.en !== 'string' || value.en.trim() === '') return false
  return Object.entries(value).every(([key, text]) => LANG.test(key) && typeof text === 'string' && text.trim() !== '')
}

function isCanonicalHttpsRepoUrl(value) {
  if (typeof value !== 'string') return false
  let url
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') return false
  if (value !== url.toString().replace(/\/$/, '')) return false
  if (/\.(tgz|tar\.gz)$/.test(url.pathname)) return false
  const segments = url.pathname.split('/').filter(Boolean)
  return segments.length >= 2 && !url.pathname.endsWith('/')
}

// ---------- collect eligible versions ----------
const tags = git(['tag', '--list']).split('\n').map((line) => line.trim()).filter(Boolean)
const versions = new Map()

for (const tag of tags) {
  let version = null
  let match = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag)
  if (match) version = match[1]
  if (version === null) {
    match = /^dsh-git-sidebar@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag)
    if (match) version = match[1]
  }
  if (version === null || !SEMVER.test(version)) continue

  let commit
  try {
    commit = git(['rev-list', '-n', '1', tag])
  } catch {
    continue
  }
  if (!COMMIT.test(commit)) continue

  const manifest = jsonAt(commit, 'package.json')
  if (manifest === null) continue
  if (!manifest.dsh || !manifest.dsh.bundle) {
    console.warn('skip ' + version + ': package.json does not declare dsh.bundle')
    continue
  }
  const engines = manifest.engines && manifest.engines.dsh
  if (typeof engines !== 'string' || engines.trim() === '') {
    console.warn('skip ' + version + ': package.json does not declare engines.dsh')
    continue
  }
  if (manifest.version !== version) {
    console.warn('skip ' + version + ': tag version differs from package.json version ' + manifest.version)
    continue
  }
  if (versions.has(version)) continue
  const timestamp = Number(git(['log', '-1', '--format=%ct', commit]))
  if (!Number.isInteger(timestamp)) fail('bad commit timestamp for ' + version)
  versions.set(version, { version, commit, timestamp, engines, manifest })
}

if (versions.size === 0) fail('no tag declares dsh.bundle together with engines.dsh')

const ordered = [...versions.values()].sort((left, right) => compareVersions(right.version, left.version))
const top = ordered[0]
const name = top.manifest.name
if (typeof name !== 'string' || name.trim() === '' || /\s/.test(name) || name.length > 214) fail('invalid package name')

for (const entry of ordered) {
  if (entry.manifest.name !== name) fail('inconsistent package name across versions: ' + entry.manifest.name)
}

// ---------- display metadata from the highest listed version ----------
function localeText(lang, key) {
  const doc = jsonAt(top.commit, 'locale/' + lang + '.json')
  const meta = doc && doc.meta ? doc.meta : {}
  return typeof meta[key] === 'string' && meta[key].trim() !== '' ? meta[key] : null
}

const title = { en: localeText('en', 'title') || name }
const titleZh = localeText('zh', 'title')
if (titleZh) title.zh = titleZh
const descriptionEn = localeText('en', 'description') || top.manifest.description || name
const descriptionZh = localeText('zh', 'description')
const description = { en: descriptionEn }
if (descriptionZh) description.zh = descriptionZh

const repositoryUrl = webRepositoryUrl(top.manifest)
if (!isCanonicalHttpsRepoUrl(repositoryUrl)) fail('repository url is not a canonical https url: ' + repositoryUrl)

// Copy the package icon next to the index; relative icon URL resolves against
// the (https) index URL, which the format permits.
const iconSource = typeof top.manifest.icon === 'string' && top.manifest.icon.trim() !== '' ? top.manifest.icon : 'icon.svg'
let iconRel = null
try {
  const bytes = gitBuf(['show', top.commit + ':' + iconSource])
  const fileName = name.replace(/^@/, '').replace(/[\\/]/g, '-') + '.svg'
  mkdirSync(iconsDir, { recursive: true })
  writeFileSync(join(iconsDir, fileName), bytes)
  iconRel = 'icons/' + fileName
} catch {
  console.warn('warn: icon ' + iconSource + ' not found at ' + top.commit + ', index has no icon')
}

const index = {
  format: 1,
  title: { en: 'Git Sidebar Market', zh: 'Git Sidebar 插件市场' },
  description: {
    en: 'Plugin index for dsh-git-sidebar: a VS Code style multi-repository Source Control panel for the DeepSeek Harness right sidebar.',
    zh: 'dsh-git-sidebar 的插件索引：DeepSeek Harness 右侧边栏的 VS Code 式多存储库源代码管理面板。',
  },
  metadata: {
    categories: { development: { title: { en: 'Development', zh: '开发' } } },
  },
  plugins: [
    {
      name,
      title,
      description,
      ...(iconRel === null ? {} : { icon: iconRel }),
      author: typeof top.manifest.author === 'string' ? top.manifest.author : 'hennychen',
      homepage: top.manifest.homepage || repositoryUrl + '#readme',
      repository: { url: repositoryUrl },
      metadata: {
        category: 'development',
        keywords: Array.isArray(top.manifest.keywords) ? top.manifest.keywords : [],
      },
      versions: ordered.map((entry) => ({
        version: entry.version,
        publishTimestamp: entry.timestamp,
        source: { type: 'git', url: repositoryUrl, commit: entry.commit },
        engines: { dsh: entry.engines },
      })),
    },
  ],
}

// ---------- validate what we are about to publish ----------
if (index.format !== 1) fail('format must be 1')
if (!isLocalizedText(index.title)) fail('market title is not LocalizedText')
if (index.description !== undefined && !isLocalizedText(index.description)) fail('market description is not LocalizedText')
const declaredCategories = new Set(Object.keys((index.metadata && index.metadata.categories) || {}))
const plugin = index.plugins[0]
if (!isLocalizedText(plugin.title)) fail('plugin title is not LocalizedText')
if (plugin.description !== undefined && !isLocalizedText(plugin.description)) fail('plugin description is not LocalizedText')
if (plugin.metadata.category !== undefined && !declaredCategories.has(plugin.metadata.category)) fail('undeclared category ' + plugin.metadata.category)
const seen = new Set()
for (const version of plugin.versions) {
  if (!SEMVER.test(version.version) || seen.has(version.version)) fail('invalid or duplicate version ' + version.version)
  seen.add(version.version)
  if (!Number.isInteger(version.publishTimestamp) || version.publishTimestamp < 0 || version.publishTimestamp >= 1e11) {
    fail('bad publishTimestamp for ' + version.version)
  }
  const source = version.source
  if (source.type !== 'git') fail('unsupported source type ' + source.type)
  if (!isCanonicalHttpsRepoUrl(source.url)) fail('bad source url ' + source.url)
  if (!COMMIT.test(source.commit)) fail('bad source commit for ' + version.version)
  if (typeof version.engines.dsh !== 'string' || version.engines.dsh.trim() === '') fail('missing engines.dsh for ' + version.version)
}
if (plugin.metadata.keywords.some((keyword) => typeof keyword !== 'string')) fail('keywords must be strings')

mkdirSync(outDir, { recursive: true })
const output = join(outDir, 'index.json')
writeFileSync(output, JSON.stringify(index, null, 2) + '\n')

console.log('wrote ' + output)
console.log('plugins: ' + plugin.name + ' (' + plugin.versions.length + ' version' + (plugin.versions.length === 1 ? '' : 's') + ')')
for (const version of plugin.versions) {
  console.log('  ' + version.version + ' -> ' + version.source.commit + '  engines.dsh=' + version.engines.dsh)
}
