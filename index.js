// dsh-git-sidebar — Host half.
//
// Serves the small JSON API behind the right-sidebar Git panel:
//   GET  /git-sidebar/api?op=info&sid=<sessionId>[&root=<repoPath>]
//   GET  /git-sidebar/api?op=diff&sid=...&path=...&staged=0|1[&root=...]
//   GET  /git-sidebar/api?op=workspaces&sid=...      -> pickable workspaces
//   POST /git-sidebar/api  {"op":"stage","sid":"...","root":"...","path":"src/a.ts"}
//
// The repository comes from the session's working directory (live session
// first, persisted header second). A `root` override is accepted only inside
// the session directory or one of the registered workspaces, so the panel can
// never be pointed at an arbitrary path. Every git call uses execFile with a
// fixed argv (no shell), validated pathspecs and bounded output.
import { execFile } from 'node:child_process'
import { basename, join, resolve, sep } from 'node:path'
import { readFile, readdir, realpath, stat } from 'node:fs/promises'

export const name = 'git-sidebar'
export const inject = ['webServer', 'sessions', 'workingDirectory', 'sessionQuery', 'workspaceRegistry']

const MAX_BUFFER = 16 * 1024 * 1024
const READ_TIMEOUT = 20000
const NET_TIMEOUT = 120000
const MAX_BODY = 64 * 1024
const MAX_MESSAGE = 5000
const MAX_DIFF_CHARS = 300000
const MAX_SYNTH_BYTES = 200000

const READ_OPS = new Set(['info', 'diff', 'workspaces', 'client-events', 'client-asset', 'repos', 'graph', 'gitlog', 'remotes', 'stashes', 'tags', 'worktrees'])
const DIAG_OPS = new Set(['client-event'])
const WRITE_OPS = new Set([
  'stage', 'unstage', 'stageAll', 'unstageAll',
  'discard', 'discardAll', 'commit',
  'checkout', 'createBranch', 'branchDelete', 'fetch', 'pull', 'push', 'sync',
  'commitAll', 'stashPush', 'stashPop', 'stashDrop',
  'tagCreate', 'tagDelete', 'worktreeAdd', 'clone',
])

/** Browser-side diagnostics reported by the panel, newest last (bounded). */
const clientEvents = []

function pushClientEvent(entry) {
  clientEvents.push(entry)
  if (clientEvents.length > 80) clientEvents.shift()
}

/** A handled API failure carrying a stable code and a human message. */
class ApiError extends Error {
  constructor(code, message) {
    super(message || code)
    this.code = code
  }
}

const fail = (code, message) => new ApiError(code, message)

function gitEnv() {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_OPTIONAL_LOCKS: '0',
    LC_ALL: 'C',
  }
}

/** Ring buffer of recent git commands and their output, for the "GIT 输出" viewer. */
const GIT_LOG = []
const GIT_LOG_LIMIT = 60

function recordGit(cwd, args, ok, text, startedAt) {
  const entry = {
    at: Date.now(),
    root: cwd,
    command: 'git ' + args.join(' '),
    ok: ok === true,
    ms: Date.now() - startedAt,
    output: String(text || '').slice(0, 4000),
  }
  GIT_LOG.push(entry)
  if (GIT_LOG.length > GIT_LOG_LIMIT) GIT_LOG.shift()
}

/** Run one git command in `cwd`; rejects with the stderr text as message. */
function git(cwd, args, timeoutMs = READ_TIMEOUT) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', cwd, ...args], {
      maxBuffer: MAX_BUFFER,
      timeout: timeoutMs,
      windowsHide: true,
      env: gitEnv(),
    }, (error, stdout, stderr) => {
      if (error) {
        const text = String(stderr || '').trim() || String(error.message || 'git failed')
        recordGit(cwd, args, false, text, startedAt)
        reject(fail('git-failed', text))
        return
      }
      recordGit(cwd, args, true, String(stdout), startedAt)
      resolve(String(stdout))
    })
  })
}

/** Run one git command, mapping failure to a fallback value. */
async function gitOr(cwd, args, fallback = '', timeoutMs = READ_TIMEOUT) {
  try {
    return await git(cwd, args, timeoutMs)
  } catch {
    return fallback
  }
}

async function canonicalPath(path) {
  try {
    return await realpath(path)
  } catch {
    return path
  }
}

async function gitRootOf(directory) {
  try {
    return (await git(directory, ['rev-parse', '--show-toplevel'], 10000)).trim()
  } catch {
    return ''
  }
}

const REPO_SCAN_SKIP = new Set([
  'node_modules', 'dist', 'build', 'out', 'target', 'vendor', 'Pods', 'coverage',
  '__pycache__', '.venv', 'venv', '.next', '.cache', '.turbo', '.build', '.gradle',
])
const repoScanCache = new Map()

/**
 * Discover Git repositories nested under a non-repository directory.
 *
 * Sessions often point at a workspace folder that holds several projects, each
 * its own repository (for example `PathFinder_Source/PathFinder_Single`). The
 * scan is bounded in depth, directory count and result count, skips generated
 * trees, and caches its result per directory for a minute.
 */
async function scanNestedRepos(root, maxDepth = 3) {
  const cached = repoScanCache.get(root)
  if (cached && Date.now() - cached.at < 15000) return cached.repos

  const found = []
  let visited = 0
  const limit = 20
  const visitedLimit = 600

  const isRepoDir = async (dir) => {
    try {
      const info = await stat(join(dir, '.git'))
      return info.isDirectory() || info.isFile()
    } catch {
      return false
    }
  }

  const walk = async (dir, depth) => {
    if (found.length >= limit || visited >= visitedLimit || depth > maxDepth) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (found.length >= limit || visited >= visitedLimit) return
      if (!entry.isDirectory()) continue
      const name = entry.name
      if (name === '.git' || name.startsWith('.')) continue
      const child = join(dir, name)
      visited += 1
      if (await isRepoDir(child)) {
        let at = 0
        let branch = ''
        try {
          at = Number(String(await gitOr(child, ['log', '-1', '--format=%ct'], '')).trim() || 0) * 1000
        } catch {
          at = 0
        }
        try {
          const symbolic = String(await gitOr(child, ['symbolic-ref', 'HEAD'])).trim()
          branch = symbolic.startsWith('refs/heads/') ? symbolic.slice('refs/heads/'.length) : symbolic
        } catch {
          branch = ''
        }
        found.push({ path: child, name, branch, at })
        continue
      }
      if (REPO_SCAN_SKIP.has(name)) continue
      await walk(child, depth + 1)
    }
  }

  await walk(root, 1)
  found.sort((left, right) => right.at - left.at)
  repoScanCache.set(root, { at: Date.now(), repos: found })
  return found
}

/** Resolve a session's directory: live session first, persisted header second. */
async function sessionDirectory(ctx, sid) {
  if (typeof sid !== 'string' || sid === '') throw fail('missing-session', 'missing session id')

  let session
  try {
    session = ctx.sessions.get(sid)
  } catch {
    session = undefined
  }
  if (session) {
    try {
      const live = ctx.workingDirectory.get(session)
      if (live) return { directory: live, live: true }
    } catch {
      /* fall through to the persisted header */
    }
  }

  try {
    const records = await ctx.sessionQuery.filterSessions([{ kind: 'id', values: [sid] }])
    const cwd = records && records[0] && records[0].header && records[0].header.cwd
    if (cwd) return { directory: cwd, live: false }
  } catch {
    /* header lookup unavailable */
  }

  if (session) throw fail('no-directory', 'the session has no working directory')
  throw fail('unknown-session', 'session not found in the live store or the session log')
}

/** The session directory plus every registered workspace, canonicalized. */
async function allowedRoots(ctx, sid) {
  const { directory, live } = await sessionDirectory(ctx, sid)
  const roots = []
  const add = async (path) => {
    if (typeof path !== 'string' || path === '') return
    const canon = await canonicalPath(path)
    if (!roots.includes(canon)) roots.push(canon)
  }
  await add(directory)
  try {
    for (const workspace of ctx.workspaceRegistry.list()) {
      if (workspace && typeof workspace.path === 'string') await add(workspace.path)
    }
  } catch {
    /* workspace registry unavailable: session directory only */
  }
  return { directory, live, roots }
}

function isInsideAny(roots, candidate) {
  return roots.some((root) => candidate === root || candidate.startsWith(root + sep))
}

/** Resolve the repository: session directory by default, `root` override if allowed. */
async function resolveRepo(ctx, sid, rootParam) {
  const { directory, live, roots } = await allowedRoots(ctx, sid)

  if (typeof rootParam === 'string' && rootParam !== '') {
    const candidate = await canonicalPath(rootParam)
    if (!isInsideAny(roots, candidate)) {
      throw fail('repo-not-allowed', 'repository is outside the session directory and registered workspaces')
    }
    const root = await gitRootOf(candidate)
    if (!root) return { directory: candidate, root: '', isGit: false, live, pinned: true, derived: 'pinned' }
    const canonRoot = await canonicalPath(root)
    if (!isInsideAny(roots, canonRoot)) {
      throw fail('repo-not-allowed', 'repository is outside the session directory and registered workspaces')
    }
    return { directory: candidate, root: canonRoot, isGit: true, live, pinned: true, derived: 'pinned' }
  }

  const root = await gitRootOf(directory)
  if (root) return { directory, root: await canonicalPath(root), isGit: true, live, pinned: false, derived: 'session' }

  // The session may point at a folder that merely contains repositories.
  const canonDirectory = await canonicalPath(directory)
  const nested = await scanNestedRepos(canonDirectory)
  if (nested.length > 0) {
    return {
      directory,
      root: await canonicalPath(nested[0].path),
      isGit: true,
      live,
      pinned: false,
      derived: 'subdir',
      nestedCount: nested.length,
    }
  }

  // Last resort: the first registered workspace that is a Git repository, so a
  // session outside any repository still opens a useful panel.
  try {
    for (const workspace of ctx.workspaceRegistry.list()) {
      if (!workspace || typeof workspace.path !== 'string') continue
      const workspaceRoot = await gitRootOf(await canonicalPath(workspace.path))
      if (workspaceRoot) {
        return {
          directory,
          root: await canonicalPath(workspaceRoot),
          isGit: true,
          live,
          pinned: false,
          derived: 'workspace',
        }
      }
    }
  } catch {
    /* no workspace fallback */
  }
  return { directory, root: '', isGit: false, live, pinned: false, derived: '', nestedCount: 0 }
}

/** Workspaces (and the session directory) this session may open as a repository. */
async function listWorkspaces(ctx, sid) {
  const { directory, live, roots } = await allowedRoots(ctx, sid)
  const candidates = []
  const seen = new Set()
  const add = async (path, source, extra) => {
    const canon = await canonicalPath(path)
    if (canon === '' || seen.has(canon)) return
    seen.add(canon)
    const root = await gitRootOf(canon)
    candidates.push(Object.assign({
      path: canon,
      name: basename(canon) || canon,
      isGit: root !== '',
      root: root ? await canonicalPath(root) : '',
      source,
    }, extra || {}))
    return root
  }
  const addWithNested = async (path, source) => {
    const root = await add(path, source)
    if (root) return
    const canon = await canonicalPath(path)
    const nested = await scanNestedRepos(canon)
    for (const repo of nested) {
      await add(repo.path, 'subdir', { branch: repo.branch, parent: canon, at: repo.at })
    }
  }

  await addWithNested(directory, 'session')
  try {
    for (const workspace of ctx.workspaceRegistry.list()) {
      if (workspace && typeof workspace.path === 'string') await addWithNested(workspace.path, 'workspace')
    }
  } catch {
    /* session directory only */
  }
  void roots
  return { ok: true, session: { directory, live }, workspaces: candidates }
}

/** Validate one repository-relative pathspec and return it unchanged. */
function safeRelPath(value) {
  if (typeof value !== 'string' || value === '') throw fail('bad-path', 'empty path')
  if (value.length > 4096) throw fail('bad-path', 'path too long')
  if (value.includes('\0')) throw fail('bad-path', 'invalid path')
  if (value.startsWith('-')) throw fail('bad-path', 'path may not start with "-"')
  if (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) throw fail('bad-path', 'absolute path rejected')
  const parts = value.split(/[\\/]+/)
  if (parts.some((part) => part === '..')) throw fail('bad-path', 'path escapes the repository')
  const cleaned = parts.filter((part) => part !== '' && part !== '.').join('/')
  if (cleaned === '') throw fail('bad-path', 'empty path')
  return cleaned
}

const BRANCH_NAME = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,80}$/

function safeBranchName(value) {
  if (typeof value !== 'string' || !BRANCH_NAME.test(value) || value.includes('..') || value.endsWith('/') || value.endsWith('.lock')) {
    throw fail('bad-branch', 'invalid branch name')
  }
  return value
}

/** Parse `git status --porcelain=v1 -z` into display rows. */
function parseStatus(raw) {
  const parts = String(raw).split('\0')
  const files = []
  let index = 0
  while (index < parts.length) {
    const record = parts[index]
    index += 1
    if (!record || record.length < 4) continue
    const x = record[0]
    const y = record[1]
    const path = record.slice(3)
    let old = ''
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
      old = parts[index] || ''
      index += 1
    }
    const untracked = x === '?' && y === '?'
    const conflicted = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'].includes(x + y)
    const staged = !untracked && !conflicted && x !== ' ' && x !== '?'
    const unstaged = !untracked && !conflicted && y !== ' ' && y !== '?'
    files.push({
      path,
      old,
      status: untracked ? 'U' : conflicted ? '!' : (x !== ' ' && x !== '?' ? x : y),
      staged,
      unstaged,
      untracked,
      conflicted,
    })
  }
  return files
}

function parseCommits(raw) {
  const rows = []
  for (const line of String(raw).split('\n')) {
    if (!line) continue
    const [hash, short, author, at, refs, subject] = line.split('\x1f')
    if (!hash) continue
    rows.push({
      hash,
      short: short || hash.slice(0, 7),
      author: author || '',
      at: Number(at) * 1000 || 0,
      refs: refs ? refs.split(',').map((item) => item.trim()).filter(Boolean) : [],
      subject: subject || '',
    })
  }
  return rows
}

function parseBranches(raw) {
  const rows = []
  for (const line of String(raw).split('\n')) {
    if (!line) continue
    const [name, headMark, upstream, at] = line.split('\t')
    if (!name) continue
    rows.push({
      name,
      current: headMark === '*',
      upstream: upstream || '',
      at: Number(at) * 1000 || 0,
    })
  }
  return rows
}

async function collectInfo(root, directory, live, pinned, derived, nestedCount) {
  const [branchRaw, headRaw, statusRaw, branchesRaw, commitsRaw, remoteRaw, upstreamRaw] = await Promise.all([
    gitOr(root, ['symbolic-ref', 'HEAD']),
    gitOr(root, ['rev-parse', '--short', 'HEAD']),
    gitOr(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
    gitOr(root, ['for-each-ref', '--format=%(refname:lstrip=2)%09%(HEAD)%09%(upstream:lstrip=2)%09%(committerdate:unix)', 'refs/heads']),
    gitOr(root, ['log', '-n', '20', '--date=unix', '--format=%H%x1f%h%x1f%an%x1f%at%x1f%D%x1f%s']),
    gitOr(root, ['config', '--get', 'remote.origin.url']),
    gitOr(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']),
  ])

  const files = parseStatus(statusRaw)
  const branchRef = branchRaw.trim()
  const branch = branchRef.startsWith('refs/heads/') ? branchRef.slice('refs/heads/'.length) : branchRef
  const detached = branch === ''
  const upstream = upstreamRaw.trim()

  let ahead = 0
  let behind = 0
  if (upstream) {
    const counts = (await gitOr(root, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])).trim()
    const [a, b] = counts.split(/\s+/)
    ahead = Number(a) || 0
    behind = Number(b) || 0
  }

  const staged = files.filter((file) => file.staged).length
  const changed = files.filter((file) => file.unstaged).length
  const untracked = files.filter((file) => file.untracked).length
  const conflicted = files.filter((file) => file.conflicted).length

  return {
    ok: true,
    isGit: true,
    live: live === true,
    pinned: pinned === true,
    derived: derived || '',
    nestedCount: nestedCount || 0,
    repo: { name: basename(root), root, directory, remote: remoteRaw.trim() },
    branch: detached ? '' : branch,
    detached,
    head: headRaw.trim(),
    upstream,
    ahead,
    behind,
    counts: { staged, changed, untracked, conflicted, total: files.length },
    files,
    branches: parseBranches(branchesRaw),
    commits: parseCommits(commitsRaw),
  }
}

/** Unified diff for one file; untracked files are shown as synthesized additions. */
async function collectDiff(root, pathParam, staged) {
  const rel = safeRelPath(pathParam)
  const args = ['diff', '--no-color', '--unified=3']
  if (staged) args.push('--cached')
  args.push('--', rel)

  let diff = await gitOr(root, args)
  if (!diff.trim() && !staged) {
    const tracked = await gitOr(root, ['ls-files', '--error-unmatch', '--', rel])
    if (!tracked.trim()) {
      const full = join(root, ...rel.split('/'))
      let info
      try {
        info = await stat(full)
      } catch {
        info = undefined
      }
      if (info && info.isFile()) {
        if (info.size > MAX_SYNTH_BYTES) {
          diff = `--- /dev/null\n+++ b/${rel}\n@@ file too large to preview (${info.size} bytes) @@\n`
        } else {
          let buffer
          try {
            buffer = await readFile(full)
          } catch {
            buffer = Buffer.alloc(0)
          }
          if (buffer.includes(0)) {
            diff = `--- /dev/null\n+++ b/${rel}\n@@ binary file (${buffer.length} bytes) @@\n`
          } else {
            const lines = buffer.toString('utf8').split('\n')
            diff = `--- /dev/null\n+++ b/${rel}\n@@ new file: ${lines.length} lines @@\n` +
              lines.map((line, at) => (at === lines.length - 1 && line === '' ? '' : '+' + line)).join('\n')
          }
        }
      }
    }
  }

  const truncated = diff.length > MAX_DIFF_CHARS
  if (truncated) diff = diff.slice(0, MAX_DIFF_CHARS)
  return { ok: true, path: rel, staged: staged === true, diff, truncated }
}

/** One repository's compact summary for the Repositories list. */
async function summarizeRepo(root) {
  const [branchRefRaw, statusRaw, upstreamRaw] = await Promise.all([
    gitOr(root, ['symbolic-ref', 'HEAD']),
    gitOr(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all']),
    gitOr(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']),
  ])
  const files = parseStatus(statusRaw)
  const branchRef = branchRefRaw.trim()
  const branch = branchRef.startsWith('refs/heads/') ? branchRef.slice('refs/heads/'.length) : branchRef
  const upstream = upstreamRaw.trim()
  let ahead = 0
  let behind = 0
  if (upstream) {
    const counts = (await gitOr(root, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])).trim()
    const [a, b] = counts.split(/\s+/)
    ahead = Number(a) || 0
    behind = Number(b) || 0
  }
  const staged = files.filter((file) => file.staged).length
  const changed = files.filter((file) => file.unstaged).length
  const untracked = files.filter((file) => file.untracked).length
  const conflicted = files.filter((file) => file.conflicted).length
  return {
    branch,
    detached: branch === '',
    upstream,
    ahead,
    behind,
    counts: { staged, changed, untracked, conflicted, total: files.length },
  }
}

/** Every repository this session may manage: its own, nested ones, and workspaces. */
async function discoverRepos(ctx, sid) {
  const { directory, live } = await allowedRoots(ctx, sid)
  const found = new Map()
  const addRepo = async (path) => {
    const canon = await canonicalPath(path)
    const root = await gitRootOf(canon)
    if (!root) return
    const canonRoot = await canonicalPath(root)
    if (found.has(canonRoot)) return
    let at = 0
    try {
      at = Number(String(await gitOr(canonRoot, ['log', '-1', '--format=%ct'])).trim() || 0) * 1000
    } catch {
      at = 0
    }
    found.set(canonRoot, { path: canonRoot, at })
  }
  const addTree = async (dir) => {
    const canon = await canonicalPath(dir)
    if (await gitRootOf(canon)) {
      await addRepo(canon)
      return
    }
    for (const repo of await scanNestedRepos(canon)) await addRepo(repo.path)
  }

  await addTree(directory)
  try {
    for (const workspace of ctx.workspaceRegistry.list()) {
      if (workspace && typeof workspace.path === 'string') await addTree(workspace.path)
    }
  } catch {
    /* session tree only */
  }

  const repos = [...found.values()].slice(0, 12)
  const withSummary = await Promise.all(repos.map(async (repo) => {
    const summary = await summarizeRepo(repo.path)
    return Object.assign({ name: basename(repo.path), isGit: true }, repo, summary)
  }))
  return { ok: true, session: { directory, live }, repos: withSummary }
}

/** Branch refs (local + remote) for the graph's repository/branch selector. */
async function collectGraphBranches(root) {
  const raw = await gitOr(root, [
    'for-each-ref',
    '--format=%(refname)%09%(objectname)%09%(HEAD)%09%(committerdate:unix)',
    'refs/heads', 'refs/remotes',
  ])
  const local = []
  const remote = []
  for (const line of raw.split('\n')) {
    if (!line) continue
    const [full, tip, headMark, at] = line.split('\t')
    if (!full || !tip) continue
    const isRemote = full.startsWith('refs/remotes/')
    // `%(refname:short)` 在本地与远端同名时会退化成 `heads/x`，这里自己剥前缀，
    // 得到的名字与 `git log --format=%D` 的装饰名一致（main / origin/main）。
    const name = isRemote
      ? full.slice('refs/remotes/'.length)
      : full.slice('refs/heads/'.length)
    // refs/remotes/<remote>/HEAD 是符号引用，不是可勾选的分支
    if (!name || (isRemote && name.endsWith('/HEAD'))) continue
    const entry = {
      full,
      name,
      tip,
      current: headMark === '*',
      remote: isRemote,
      at: Number(at) * 1000 || 0,
    }
    if (isRemote) remote.push(entry)
    else local.push(entry)
  }
  const byName = (a, b) => a.name.localeCompare(b.name)
  // 当前分支置顶，其余按名字排序：窄面板里勾选列表的位置才稳定
  local.sort((a, b) => Number(b.current) - Number(a.current) || byName(a, b))
  remote.sort(byName)
  return local.concat(remote)
}

const GRAPH_COMMIT_LIMIT = 200

/**
 * Commit graph lines for one repository (`git log --graph` art plus fields).
 * `refsParam` is a comma-separated list of full ref names (`refs/heads/main`,
 * `refs/remotes/origin/main`). It is filtered against the real branch list so a
 * crafted value can never become an unexpected `git log` argument. Empty list =
 * all refs (`--all`), preserving the old default.
 */
async function collectGraph(root, refsParam = '') {
  const branches = await collectGraphBranches(root)
  const byFull = new Map(branches.map((branch) => [branch.full, branch]))
  const selected = []
  for (const item of String(refsParam || '').split(',')) {
    const ref = item.trim()
    if (!ref) continue
    const branch = byFull.get(ref)
    if (branch && !selected.includes(branch.full)) selected.push(branch.full)
  }
  const revs = selected.length > 0 ? selected : ['--all']
  const raw = await gitOr(root, [
    'log', '--graph', '--topo-order', '--date=unix', '-n', String(GRAPH_COMMIT_LIMIT),
    '--format=%x1f%H%x1f%P%x1f%h%x1f%an%x1f%at%x1f%D%x1f%s',
    ...revs,
  ])
  const lines = []
  for (const line of raw.split('\n')) {
    if (!line) continue
    const marker = line.indexOf('\x1f')
    if (marker < 0) {
      lines.push({ graph: line.replace(/\s+$/, ''), hash: '', short: '', author: '', at: 0, refs: [], subject: '' })
      continue
    }
    const graph = line.slice(0, marker).replace(/\s+$/, '')
    const [hash, parentsRaw, short, author, at, refs, subject] = line.slice(marker + 1).split('\x1f')
    lines.push({
      graph,
      hash: hash || '',
      parents: parentsRaw ? parentsRaw.split(' ').filter(Boolean) : [],
      short: short || '',
      author: author || '',
      at: Number(at) * 1000 || 0,
      refs: refs ? refs.split(',').map((item) => item.trim()).filter(Boolean) : [],
      subject: subject || '',
    })
  }
  return {
    ok: true,
    lines,
    branches,
    head: (branches.find((branch) => branch.current) || {}).name || '',
    refs: selected,
  }
}

/** Read and parse a bounded JSON request body. */
function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(fail('body-too-large', 'request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(fail('bad-json', 'invalid JSON body'))
      }
    })
    req.on('error', (error) => reject(fail('body-error', String(error && error.message || error))))
  })
}

async function localBranches(root) {
  return (await git(root, ['for-each-ref', '--format=%(refname:lstrip=2)', 'refs/heads']))
    .split('\n').map((line) => line.trim()).filter(Boolean)
}

/** One write operation, always scoped to the resolved work tree. */
async function runWrite(ctx, op, payload) {
  const repo = await resolveRepo(ctx, payload.sid, payload.root)
  if (!repo.isGit) throw fail('not-a-repo', 'the session directory is not a git work tree')
  const root = repo.root

  switch (op) {
    case 'stage': {
      const path = safeRelPath(payload.path)
      await git(root, ['add', '--', path])
      return { ok: true, message: 'staged' }
    }
    case 'unstage': {
      const path = safeRelPath(payload.path)
      try {
        await git(root, ['reset', '-q', 'HEAD', '--', path])
      } catch {
        await git(root, ['rm', '--cached', '-r', '-q', '--', path])
      }
      return { ok: true, message: 'unstaged' }
    }
    case 'stageAll': {
      await git(root, ['add', '-A', '--', '.'])
      return { ok: true, message: 'staged' }
    }
    case 'unstageAll': {
      try {
        await git(root, ['reset', '-q', 'HEAD', '--', '.'])
      } catch {
        await git(root, ['rm', '--cached', '-r', '-q', '--', '.'])
      }
      return { ok: true, message: 'unstaged' }
    }
    case 'discard': {
      const path = safeRelPath(payload.path)
      try {
        await git(root, ['restore', '--worktree', '--', path])
      } catch {
        try {
          await git(root, ['checkout', '--', path])
        } catch {
          // An untracked path has nothing to restore: delete it instead.
          await git(root, ['clean', '-f', '--', path])
        }
      }
      return { ok: true, message: 'discarded' }
    }
    case 'discardAll': {
      await gitOr(root, ['restore', '--worktree', '--', '.'])
      await gitOr(root, ['clean', '-f', '-d', '--', '.'])
      return { ok: true, message: 'discarded' }
    }
    case 'commit': {
      const message = typeof payload.message === 'string' ? payload.message.trim() : ''
      if (message === '') throw fail('empty-message', 'a commit message is required')
      if (message.length > MAX_MESSAGE) throw fail('message-too-long', 'commit message too long')
      const output = await git(root, ['commit', '-m', message], 60000)
      const match = /\[[^\]]+ ([0-9a-f]{7,})\]/i.exec(output)
      return { ok: true, message: 'committed', head: match ? match[1] : '' }
    }
    case 'checkout': {
      const branch = safeBranchName(payload.branch)
      const list = await localBranches(root)
      if (!list.includes(branch)) throw fail('unknown-branch', 'no such local branch: ' + branch)
      await git(root, ['checkout', branch], 60000)
      return { ok: true, message: 'switched' }
    }
    case 'createBranch': {
      const branch = safeBranchName(payload.branch)
      const list = await localBranches(root)
      if (list.includes(branch)) throw fail('branch-exists', 'branch already exists: ' + branch)
      await git(root, ['checkout', '-b', branch], 60000)
      return { ok: true, message: 'created' }
    }
    case 'fetch': {
      await git(root, ['fetch', '--prune'], NET_TIMEOUT)
      return { ok: true, message: 'fetched' }
    }
    case 'pull': {
      await git(root, ['pull', '--ff-only'], NET_TIMEOUT)
      return { ok: true, message: 'pulled' }
    }
    case 'push': {
      await git(root, ['push'], NET_TIMEOUT)
      return { ok: true, message: 'pushed' }
    }
    case 'sync': {
      await git(root, ['pull', '--ff-only'], NET_TIMEOUT)
      await git(root, ['push'], NET_TIMEOUT)
      return { ok: true, message: 'synced' }
    }
    case 'commitAll': {
      const message = typeof payload.message === 'string' ? payload.message.trim() : ''
      if (message === '') throw fail('empty-message', 'a commit message is required')
      if (message.length > MAX_MESSAGE) throw fail('message-too-long', 'commit message too long')
      await git(root, ['add', '-A', '--', '.'])
      const output = await git(root, ['commit', '-m', message], 60000)
      const match = /\[[^\]]+ ([0-9a-f]{7,})\]/i.exec(output)
      return { ok: true, message: 'committed', head: match ? match[1] : '' }
    }
    case 'branchDelete': {
      const branch = safeBranchName(payload.branch)
      const current = (await gitOr(root, ['symbolic-ref', '--short', 'HEAD'])).trim()
      if (branch === current) throw fail('cannot-delete-current', 'cannot delete the current branch')
      await git(root, ['branch', '-D', branch], 30000)
      return { ok: true, message: 'branch-deleted' }
    }
    case 'stashPush': {
      const label = typeof payload.message === 'string' ? payload.message.trim() : ''
      await git(root, ['stash', 'push', '-u', '-m', label || 'dsh-git-sidebar'], 60000)
      return { ok: true, message: 'stashed' }
    }
    case 'stashPop': {
      const index = Number.isInteger(payload.index) ? payload.index : 0
      await git(root, ['stash', 'pop', `stash@{${index}}`], 60000)
      return { ok: true, message: 'stash-popped' }
    }
    case 'stashDrop': {
      const index = Number.isInteger(payload.index) ? payload.index : 0
      await git(root, ['stash', 'drop', `stash@{${index}}`], 30000)
      return { ok: true, message: 'stash-dropped' }
    }
    case 'tagCreate': {
      const name = safeBranchName(payload.name)
      const target = typeof payload.commit === 'string' && payload.commit.trim() !== '' ? payload.commit.trim() : 'HEAD'
      await git(root, ['tag', name, target], 30000)
      return { ok: true, message: 'tag-created' }
    }
    case 'tagDelete': {
      const name = safeBranchName(payload.name)
      await git(root, ['tag', '-d', name], 30000)
      return { ok: true, message: 'tag-deleted' }
    }
    case 'worktreeAdd': {
      const path = typeof payload.path === 'string' ? payload.path.trim() : ''
      if (path === '' || path.startsWith('-') || path.includes('..')) throw fail('bad-path', 'invalid worktree path')
      const absolute = resolve(root, path)
      if (!absolute.startsWith(root + sep) && absolute !== root) throw fail('bad-path', 'worktree must live under the repository')
      const branch = typeof payload.branch === 'string' && payload.branch !== '' ? safeBranchName(payload.branch) : ''
      if (branch !== '') {
        await git(root, ['worktree', 'add', '-b', branch, absolute], 60000)
      } else {
        await git(root, ['worktree', 'add', absolute], 60000)
      }
      return { ok: true, message: 'worktree-created', path: absolute }
    }
    case 'clone': {
      const url = typeof payload.url === 'string' ? payload.url.trim() : ''
      if (!/^https?:\/\/|^git@|^ssh:\/\//.test(url)) throw fail('bad-url', 'invalid clone URL')
      const directory = typeof payload.dir === 'string' ? payload.dir.trim() : ''
      if (directory === '' || directory.startsWith('-')) throw fail('bad-path', 'invalid target directory')
      const { roots } = await allowedRoots(ctx, payload.sid)
      const target = resolve(directory)
      if (!roots.some((r) => target === r || target.startsWith(r + sep))) {
        throw fail('path-outside', 'clone target must be inside a workspace')
      }
      await git(resolve(target, '..'), ['clone', url, target], NET_TIMEOUT * 2)
      return { ok: true, message: 'cloned', path: target }
    }
    default:
      throw fail('bad-op', 'unsupported operation: ' + op)
  }
}

async function handleApi(ctx, req, url) {
  const method = String(req.method || 'GET').toUpperCase()

  if (method === 'GET') {
    const op = url.searchParams.get('op') || 'info'
    if (!READ_OPS.has(op)) throw fail('bad-method', 'this operation requires POST')
    const sid = url.searchParams.get('sid') || ''
    const rootParam = url.searchParams.get('root') || ''

    if (op === 'workspaces') return listWorkspaces(ctx, sid)
    if (op === 'repos') return discoverRepos(ctx, sid)
    if (op === 'client-events') return { ok: true, events: clientEvents }
    if (op === 'client-asset') {
      const out = { ok: true, id: 'dsh-git-sidebar', path: null, inGraph: null, graphKeys: [], bytes: 0 }
      try {
        const clientModules = typeof ctx.get === 'function' ? ctx.get('clientModules') : undefined
        if (clientModules) {
          out.path = clientModules.clientPath('dsh-git-sidebar') || null
          const graph = clientModules.graph()
          if (graph && typeof graph === 'object') {
            out.graphKeys = Object.keys(graph)
            const text = JSON.stringify(graph)
            out.inGraph = text.includes('dsh-git-sidebar')
            out.graphBytes = text.length
          }
        }
      } catch (error) {
        out.error = String(error && error.message || error)
      }
      return out
    }

    const repo = await resolveRepo(ctx, sid, rootParam)

    if (op === 'diff') {
      if (!repo.isGit) throw fail('not-a-repo', 'the selected directory is not a git work tree')
      return collectDiff(repo.root, url.searchParams.get('path') || '', url.searchParams.get('staged') === '1')
    }

    if (op === 'graph') {
      if (!repo.isGit) throw fail('not-a-repo', 'the selected directory is not a git work tree')
      return collectGraph(repo.root, url.searchParams.get('refs') || '')
    }

    if (op === 'gitlog') {
      return { ok: true, entries: GIT_LOG.slice().reverse() }
    }

    if (op === 'remotes') {
      if (!repo.isGit) throw fail('not-a-repo', 'the selected directory is not a git work tree')
      const raw = await gitOr(repo.root, ['remote', '-v'])
      const remotes = []
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        const parts = line.split(/\s+/)
        if (parts.length < 3) continue
        const name = parts[0]
        const existing = remotes.find((item) => item.name === name)
        if (existing) existing[parts[2] === '(push)' ? 'push' : 'fetch'] = parts[1]
        else remotes.push({ name, fetch: parts[2] === '(push)' ? '' : parts[1], push: parts[2] === '(push)' ? parts[1] : '' })
      }
      return { ok: true, remotes }
    }

    if (op === 'stashes') {
      if (!repo.isGit) throw fail('not-a-repo', 'the selected directory is not a git work tree')
      const raw = await gitOr(repo.root, ['stash', 'list', '--format=%gd%x09%ct%x09%gs'])
      const stashes = []
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        const [ref, at, subject] = line.split('\x09')
        const match = /stash@\{(\d+)\}/.exec(ref || '')
        stashes.push({ ref: ref || '', index: match ? Number(match[1]) : stashes.length, at: Number(at) * 1000 || 0, subject: subject || '' })
      }
      return { ok: true, stashes }
    }

    if (op === 'tags') {
      if (!repo.isGit) throw fail('not-a-repo', 'the selected directory is not a git work tree')
      const raw = await gitOr(repo.root, ['for-each-ref', '--format=%(refname:lstrip=2)%09%(objectname:short)%09%(creatordate:unix)', 'refs/tags'])
      const tags = []
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        const [name, short, at] = line.split('\t')
        tags.push({ name, short: short || '', at: Number(at) * 1000 || 0 })
      }
      tags.sort((a, b) => b.at - a.at)
      return { ok: true, tags }
    }

    if (op === 'worktrees') {
      if (!repo.isGit) throw fail('not-a-repo', 'the selected directory is not a git work tree')
      const raw = await gitOr(repo.root, ['worktree', 'list', '--porcelain'])
      const worktrees = []
      let current = null
      for (const line of raw.split('\n')) {
        if (line.startsWith('worktree ')) {
          current = { path: line.slice('worktree '.length), branch: '', head: '', bare: false, detached: false }
          worktrees.push(current)
        } else if (current === null) {
          continue
        } else if (line.startsWith('branch ')) {
          current.branch = line.slice('branch '.length).replace('refs/heads/', '')
        } else if (line.startsWith('HEAD ')) {
          current.head = line.slice('HEAD '.length)
        } else if (line.startsWith('bare')) {
          current.bare = true
        } else if (line.startsWith('detached')) {
          current.detached = true
        }
      }
      return { ok: true, worktrees }
    }

    if (!repo.isGit) {
      return {
        ok: true,
        isGit: false,
        live: repo.live,
        pinned: repo.pinned === true,
        directory: repo.directory,
        files: [],
        commits: [],
        branches: [],
        counts: { staged: 0, changed: 0, untracked: 0, conflicted: 0, total: 0 },
      }
    }
    return collectInfo(repo.root, repo.directory, repo.live, repo.pinned, repo.derived, repo.nestedCount)
  }

  if (method !== 'POST') throw fail('bad-method', 'method not allowed')
  const contentType = String(req.headers['content-type'] || '')
  if (!contentType.toLowerCase().includes('application/json')) {
    throw fail('bad-content-type', 'POST requires application/json')
  }
  const payload = await readJson(req)
  const op = typeof payload.op === 'string' ? payload.op : ''
  if (DIAG_OPS.has(op)) {
    if (op === 'client-event') {
      pushClientEvent({ at: Date.now(), event: String(payload.event || ''), data: payload.data ?? null })
    }
    return { ok: true }
  }
  if (!WRITE_OPS.has(op)) throw fail('bad-op', 'unsupported operation: ' + op)
  return runWrite(ctx, op, payload)
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/git-sidebar',
    handler: async (req, res) => {
      const send = (status, body) => {
        res.writeHead(status, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        })
        res.end(JSON.stringify(body))
      }
      try {
        const url = new URL(req.url, 'http://localhost')
        if (url.pathname !== '/git-sidebar/api') {
          send(404, { ok: false, error: 'not-found' })
          return
        }
        send(200, await handleApi(ctx, req, url))
      } catch (error) {
        if (error instanceof ApiError) {
          send(200, { ok: false, error: error.code, message: error.message })
          return
        }
        send(200, { ok: false, error: 'internal', message: String(error && error.message || error) })
      }
    },
  }), 'git-sidebar: web route')
}
