// dsh-git-sidebar — Client half (v0.6).
//
// A VS Code Source Control style panel for the right sidebar with multiple
// repositories: the "Repositories" list (branch, ahead/behind, sync, per-repo
// menu), "Changes" for the selected repository (or every selected repository in
// multi mode), and a "Graph" section backed by `git log --graph`.
window.__ModuleLoader__.load({
  id: 'dsh-git-sidebar',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const NS = 'gitSidebar'
    const ID = 'dsh-git-sidebar'
    const KIND = 'git'

    let beaconCount = 0
    function beacon(event, data) {
      if (beaconCount > 300) return
      beaconCount += 1
      try {
        fetch('/git-sidebar/api', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ op: 'client-event', event, data: data === undefined ? null : data }),
        }).catch(() => {})
      } catch {
        /* diagnostics are best effort */
      }
    }

    //#region copy
    const zh = {
      'tab.title': '源代码管理',
      'guide.title': '源代码管理',
      'guide.desc': 'VS Code 式多存储库 Git 管理：存储库列表、分支/同步、更改暂存与提交、提交图形。',
      'head.title': '源代码管理',
      'action.refresh': '刷新',
      'action.menu': '更多操作',
      'action.sync': '同步更改',
      'action.fetch': '获取',
      'action.pull': '拉取',
      'action.push': '推送',
      'action.stage': '暂存更改',
      'action.unstage': '取消暂存',
      'action.discard': '放弃更改',
      'action.stageAll': '暂存全部更改',
      'action.unstageAll': '全部取消暂存',
      'action.discardAll': '放弃全部更改',
      'action.commit': '提交',
      'action.branches': '切换分支',
      'action.newBranch': '新建分支',
      'action.create': '创建',
      'action.setActive': '设为当前存储库',
      'action.refreshAll': '刷新全部',
      'action.retry': '重试',
      'section.repos': '存储库',
      'section.changes': '更改',
      'section.stagedChanges': '暂存的更改',
      'section.graph': '图形',
      'label.sortBy': '排序方式',
      'label.mode': '存储库选择',
      'label.sections': '显示分区',
      'mode.single': '单个存储库',
      'mode.multiple': '多个存储库',
      'sort.discovered': '按发现时间排序',
      'sort.path': '按路径排序',
      'sort.name': '按名称排序',
      'sections.repos': '存储库',
      'sections.changes': '更改',
      'sections.graph': '图形',
      'commit.placeholder': '消息（按 ⌘Enter 提交到 {branch}）',
      'commit.noStaged': '没有已暂存的更改',
      'empty.noRepos': '没有可管理的 Git 存储库',
      'empty.loading': '正在读取存储库…',
      'empty.clean': '没有更改',
      'empty.graph': '暂无提交',
      'table.ahead': '领先',
      'table.behind': '落后',
      'detached': '分离头指针',
      'time.now': '刚刚',
      'time.minute': ' 分钟前',
      'time.hour': ' 小时前',
      'time.day': ' 天前',
      'msg.stage': '已暂存',
      'msg.unstage': '已取消暂存',
      'msg.stageAll': '已暂存全部更改',
      'msg.unstageAll': '已全部取消暂存',
      'msg.discard': '已放弃更改',
      'msg.discardAll': '已放弃全部更改',
      'msg.commit': '提交成功',
      'msg.checkout': '已切换分支',
      'msg.createBranch': '已创建分支',
      'msg.fetch': '已获取远端更新',
      'msg.pull': '已拉取',
      'msg.push': '已推送',
      'msg.sync': '已同步',
      'confirm.discard': '放弃这个文件的所有未暂存改动？此操作不可撤销。',
      'confirm.discardAll': '放弃未暂存改动（包括删除未跟踪文件）？此操作不可撤销。',
      'confirm.checkout': '切换到这个分支？未提交的改动会跟随过去。',
      'confirm.push': '推送当前分支到远端？',
      'diff.loading': '正在加载 diff…',
      'diff.empty': '没有可显示的差异。',
      'diff.truncated': '差异过长，已截断。',
      'diff.untracked': '未跟踪文件（新增）',
      'diff.failed': '无法加载 diff',
      'error.title': 'Git 面板渲染失败',
    }
    const en = {
      'tab.title': 'Source Control',
      'guide.title': 'Source Control',
      'guide.desc': 'VS Code style multi-repository Git management: repositories, branches and sync, changes with staging and commit, and the commit graph.',
      'head.title': 'Source Control',
      'action.refresh': 'Refresh',
      'action.menu': 'More Actions',
      'action.sync': 'Sync Changes',
      'action.fetch': 'Fetch',
      'action.pull': 'Pull',
      'action.push': 'Push',
      'action.stage': 'Stage Changes',
      'action.unstage': 'Unstage Changes',
      'action.discard': 'Discard Changes',
      'action.stageAll': 'Stage All Changes',
      'action.unstageAll': 'Unstage All Changes',
      'action.discardAll': 'Discard All Changes',
      'action.commit': 'Commit',
      'action.branches': 'Checkout to…',
      'action.newBranch': 'Create Branch…',
      'action.create': 'Create',
      'action.setActive': 'Set as Active Repository',
      'action.refreshAll': 'Refresh All',
      'action.retry': 'Retry',
      'section.repos': 'Repositories',
      'section.changes': 'Changes',
      'section.stagedChanges': 'Staged Changes',
      'section.graph': 'Graph',
      'label.sortBy': 'Sort By',
      'label.mode': 'Repository Selection',
      'label.sections': 'Sections',
      'mode.single': 'Select Single Repository',
      'mode.multiple': 'Select Multiple Repositories',
      'sort.discovered': 'Sort by Discovery Time',
      'sort.path': 'Sort by Path',
      'sort.name': 'Sort by Name',
      'sections.repos': 'Repositories',
      'sections.changes': 'Changes',
      'sections.graph': 'Graph',
      'commit.placeholder': 'Message (press ⌘Enter to commit on "{branch}")',
      'commit.noStaged': 'No staged changes',
      'empty.noRepos': 'No Git repository to manage',
      'empty.loading': 'Reading repositories…',
      'empty.clean': 'No changes',
      'empty.graph': 'No commits yet',
      'table.ahead': 'ahead',
      'table.behind': 'behind',
      'detached': 'detached HEAD',
      'time.now': 'just now',
      'time.minute': 'm ago',
      'time.hour': 'h ago',
      'time.day': 'd ago',
      'msg.stage': 'Staged',
      'msg.unstage': 'Unstaged',
      'msg.stageAll': 'All changes staged',
      'msg.unstageAll': 'All changes unstaged',
      'msg.discard': 'Changes discarded',
      'msg.discardAll': 'All changes discarded',
      'msg.commit': 'Committed',
      'msg.checkout': 'Branch switched',
      'msg.createBranch': 'Branch created',
      'msg.fetch': 'Fetched',
      'msg.pull': 'Pulled',
      'msg.push': 'Pushed',
      'msg.sync': 'Synced',
      'confirm.discard': 'Discard all unstaged changes in this file? This cannot be undone.',
      'confirm.discardAll': 'Discard unstaged changes, including deleting untracked files? This cannot be undone.',
      'confirm.checkout': 'Switch to this branch? Uncommitted changes will come along.',
      'confirm.push': 'Push the current branch to its remote?',
      'diff.loading': 'Loading diff…',
      'diff.empty': 'No diff to show.',
      'diff.truncated': 'Diff truncated.',
      'diff.untracked': 'Untracked file (new)',
      'diff.failed': 'Could not load diff',
      'error.title': 'The Git panel failed to render',
    }
    //#endregion

    //#region styles
    const css = `
.gs-root{display:flex;flex-direction:column;height:100%;min-height:240px;font-size:12px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base)}
.gs-head{display:flex;align-items:center;gap:2px;padding:4px 6px 4px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto;position:relative}
.gs-head-title{flex:1 1 auto;min-width:0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-ibtn{flex:0 0 auto;width:22px;height:22px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);line-height:1;cursor:pointer}
.gs-ibtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.gs-ibtn:disabled{opacity:.4;cursor:default}
.gs-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:2px 0 8px;display:flex;flex-direction:column}
.gs-group{flex:0 0 auto;margin-top:2px}
.gs-group-head{display:flex;align-items:center;gap:2px;height:22px;padding:0 6px 0 8px;font-size:11px;font-weight:700}
.gs-group-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:15px;margin-left:6px;padding:0 4px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:10px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.gs-group-actions{display:flex;align-items:center;gap:0;opacity:0;transition:opacity .08s}
.gs-group-head:hover .gs-group-actions{opacity:1}
.gs-repo-wrap{position:relative;display:flex;flex-direction:column}
.gs-repo-row{display:flex;align-items:center;gap:5px;height:24px;padding:0 4px 0 8px;cursor:pointer;min-width:0}
.gs-repo-row:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-repo-row-on{background:var(--dsw-alias-bg-layer-2)}
.gs-cb{width:13px;height:13px;flex:0 0 auto;border:1px solid var(--dsw-alias-border-l2);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;line-height:1;color:#fff}
.gs-cb-on{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.gs-repo-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
.gs-repo-row-on .gs-repo-name{font-weight:600}
.gs-branch-pill{display:inline-flex;align-items:center;gap:3px;flex:0 1 auto;max-width:52%;padding:0 5px;height:16px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.gs-branch-pill:hover{color:var(--dsw-alias-label-primary)}
.gs-ab{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.gs-row-actions{flex:0 0 auto;display:flex;align-items:center;gap:0;opacity:.5}
.gs-repo-row:hover .gs-row-actions{opacity:1}
.gs-row-menu{position:absolute;top:23px;right:4px;z-index:40;min-width:150px;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.gs-menu{position:absolute;top:27px;right:6px;z-index:40;min-width:190px;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.gs-menu-label{padding:4px 8px 2px;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}
.gs-menu-item{display:flex;width:100%;align-items:center;gap:8px;padding:4px 8px;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;text-align:left;cursor:pointer}
.gs-menu-item:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-menu-check{width:12px;flex:0 0 auto;color:var(--dsw-alias-brand-primary);font-size:10px}
.gs-menu-sep{height:1px;margin:3px 4px;background:var(--dsw-alias-border-l1)}
.gs-sub{display:flex;flex-direction:column;margin-top:2px}
.gs-sub-head{display:flex;align-items:center;gap:5px;padding:4px 8px 2px;font-size:11px;color:var(--dsw-alias-label-secondary);min-width:0}
.gs-sub-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--dsw-alias-label-primary)}
.gs-sub-branch{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-commit{flex:0 0 auto;margin:6px 8px 2px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;overflow:hidden}
.gs-commit:focus-within{border-color:var(--dsw-alias-brand-primary)}
.gs-commit-input{width:100%;box-sizing:border-box;resize:vertical;min-height:40px;max-height:140px;padding:5px 7px;border:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;outline:none}
.gs-commit-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.8}
.gs-commit-bar{display:flex;align-items:center;gap:6px;justify-content:flex-end;padding:3px 5px;border-top:1px solid var(--dsw-alias-border-l1)}
.gs-primary{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border:1px solid transparent;border-radius:4px;background:var(--dsw-alias-brand-primary);color:#fff;font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
.gs-primary:hover{filter:brightness(1.07)}
.gs-primary:disabled{opacity:.45;cursor:default;filter:none}
.gs-file{display:flex;flex-direction:column;min-width:0}
.gs-file-row{display:flex;align-items:center;gap:4px;height:22px;padding:0 6px 0 12px;cursor:pointer;min-width:0}
.gs-file-row:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-glyph{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;color:var(--dsw-alias-label-secondary)}
.gs-file-main{flex:1 1 auto;min-width:0;display:flex;align-items:baseline;gap:6px;overflow:hidden;padding-left:2px}
.gs-file-name{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px}
.gs-file-dir{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:var(--dsw-alias-label-secondary);direction:rtl;text-align:left}
.gs-status{flex:0 0 auto;width:13px;text-align:center;font-weight:700;font-size:10.5px}
.gs-file-actions{flex:0 0 auto;display:flex;align-items:center;gap:0;opacity:0;transition:opacity .08s}
.gs-file-row:hover .gs-file-actions{opacity:1}
.gs-st-A{color:var(--dsw-alias-state-success-primary)}
.gs-st-M{color:var(--dsw-alias-state-warn-primary)}
.gs-st-D{color:var(--dsw-alias-state-error-primary)}
.gs-st-R{color:var(--dsw-alias-brand-primary)}
.gs-st-U{color:var(--dsw-alias-state-success-primary)}
.gs-diff{border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);max-height:260px;overflow:auto;padding:2px 0}
.gs-diff-line{padding:0 10px 0 20px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;line-height:1.5;white-space:pre;color:var(--dsw-alias-label-secondary)}
.gs-diff-add{color:var(--dsw-alias-state-success-primary)}
.gs-diff-del{color:var(--dsw-alias-state-error-primary)}
.gs-diff-hunk{color:var(--dsw-alias-brand-primary);opacity:.95}
.gs-diff-meta{color:var(--dsw-alias-label-secondary);opacity:.75}
.gs-diff-note{padding:4px 10px 4px 20px;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.gs-clean{display:flex;align-items:center;justify-content:center;gap:6px;margin:8px;padding:10px;border:1px dashed var(--dsw-alias-border-l1);border-radius:4px;color:var(--dsw-alias-label-secondary);font-size:11px}
.gs-gline{display:flex;align-items:center;gap:6px;height:20px;padding:0 8px;min-width:0;font-size:11px}
.gs-gline:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-grow{display:flex;align-items:center;gap:6px;height:22px;padding:0 8px;min-width:0;font-size:11px}
.gs-grow:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-gsvg{flex:0 0 auto;display:block;overflow:visible}
.gs-gart{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;white-space:pre;color:var(--dsw-alias-label-secondary);opacity:.95}
.gs-ghash{flex:0 0 auto;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-brand-primary)}
.gs-gsub{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
.gs-gref{flex:0 0 auto;padding:0 4px;border-radius:6px;font-size:9.5px;color:var(--dsw-alias-brand-primary);border:1px solid var(--dsw-alias-border-l1);max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-empty{padding:14px 12px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:1.7}
.gs-banner{margin:6px 8px 0;padding:6px 8px;border-radius:4px;font-size:10.5px;line-height:1.45;border:1px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);word-break:break-word}
.gs-banner-ok{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.gs-foot{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:5px 8px;border-top:1px solid var(--dsw-alias-border-l1)}
.gs-btn{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
.gs-btn:hover{border-color:var(--dsw-alias-border-l2)}
.gs-btn:disabled{opacity:.45;cursor:default}
.gs-spacer{flex:1 1 auto}
.gs-input-line{flex:1 1 auto;min-width:0;height:22px;padding:0 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px}
.gs-branch-form{display:flex;align-items:center;gap:4px;padding:3px 8px 6px}
.gs-crash{margin:10px;padding:10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:6px;font-size:11.5px;line-height:1.6;word-break:break-word}
.gs-crash-code{margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;max-height:160px;overflow:auto}
.gs-tab{display:inline-flex;align-items:center;gap:5px;font-size:12px}
`
    //#endregion

    //#region glyphs
    function Glyph({ d, size = 14 }) {
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true,
        style: { display: 'block', flex: '0 0 auto' }, fill: 'none', stroke: 'currentColor',
        strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round',
      }, Array.isArray(d) ? d.map((path, at) => h('path', { d: path, key: at })) : h('path', { d }))
    }

    const ICON = {
      repo: ['M3 2.5h6.5L12 5v8.5H3z', 'M9 2.5V5h3'],
      branch: ['M4 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z', 'M11 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z', 'M4 6.5v2a3 3 0 0 0 3 3h1.5', 'M11 6.5v1'],
      refresh: ['M13 8a5 5 0 1 1-1.6-3.7', 'M13.5 2.5v3h-3'],
      more: ['M4 8h.01', 'M8 8h.01', 'M12 8h.01'],
      sync: ['M12.5 8a4.5 4.5 0 1 1-2-3.7', 'M13.5 3v3.5H10'],
      cloud: ['M5 12h6.5a2.5 2.5 0 0 0 .2-5A3.5 3.5 0 0 0 5.2 6.6 2.8 2.8 0 0 0 5 12z'],
      plus: ['M8 3.5v9', 'M3.5 8h9'],
      minus: ['M3.5 8h9'],
      undo: ['M4 6.5h5.5a3 3 0 0 1 0 6H7', 'M6.5 4L4 6.5 6.5 9'],
      check: ['M3.5 8.5l3 3 6-7'],
      chevronDown: ['M4.5 6.5L8 10l3.5-3.5'],
      chevronRight: ['M6.5 4.5L10 8l-3.5 3.5'],
    }

    function FileGlyph() {
      return h('svg', {
        viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': true,
        style: { display: 'block' }, fill: 'none', stroke: 'currentColor',
        strokeWidth: 1.1, strokeLinejoin: 'round',
      }, h('path', { d: 'M4 1.8h5l3 3v9.4H4z' }), h('path', { d: 'M9 1.8v3h3' }))
    }
    //#endregion

    //#region helpers
    function statusLetter(file) {
      if (file.conflicted) return '!'
      if (file.untracked) return 'U'
      return file.status || 'M'
    }

    function splitPath(path) {
      const value = String(path || '')
      const at = value.lastIndexOf('/')
      if (at < 0) return { name: value, dir: '' }
      return { name: value.slice(at + 1), dir: value.slice(0, at) }
    }

    function relativeTime(t, at) {
      if (!at) return ''
      const diff = Date.now() - at
      if (diff < 60000) return t('time.now')
      const minutes = Math.floor(diff / 60000)
      if (minutes < 60) return minutes + t('time.minute')
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return hours + t('time.hour')
      const days = Math.floor(hours / 24)
      return days + t('time.day')
    }

    const FILE_COLORS = {
      ts: '#519aba', tsx: '#519aba', js: '#cbcb41', jsx: '#cbcb41', mjs: '#cbcb41', cjs: '#cbcb41',
      json: '#cbcb41', md: '#519aba', mdx: '#519aba', css: '#519aba', scss: '#519aba', less: '#519aba',
      html: '#e37933', vue: '#41b883', svelte: '#ff3e00', py: '#3572a5', go: '#00add8',
      rs: '#dea584', sh: '#89e051', bash: '#89e051', zsh: '#89e051', yml: '#cb171e', yaml: '#cb171e',
      toml: '#9c4221', png: '#a074c4', jpg: '#a074c4', jpeg: '#a074c4', gif: '#a074c4', webp: '#a074c4',
      svg: '#ffb13b', pdf: '#e37933', lock: '#6d7a88',
    }

    function fileColor(path) {
      const name = String(path || '')
      const at = name.lastIndexOf('.')
      if (at < 0) return ''
      return FILE_COLORS[name.slice(at + 1).toLowerCase()] || ''
    }

    async function requestJson(url, init) {
      const response = await fetch(url, init)
      const text = await response.text()
      let body
      try { body = JSON.parse(text) } catch { body = { ok: false, error: 'bad-response', message: text.slice(0, 200) } }
      if (!response.ok && body && body.ok !== false) {
        body = { ok: false, error: 'http-' + response.status, message: text.slice(0, 200) }
      }
      return body
    }

    const q = encodeURIComponent
    const apiInfo = (sid, root) => requestJson('/git-sidebar/api?op=info&sid=' + q(sid) + (root ? '&root=' + q(root) : ''), { method: 'GET' })
    const apiRepos = (sid) => requestJson('/git-sidebar/api?op=repos&sid=' + q(sid), { method: 'GET' })
    const apiGraph = (sid, root) => requestJson('/git-sidebar/api?op=graph&sid=' + q(sid) + (root ? '&root=' + q(root) : ''), { method: 'GET' })
    const apiDiff = (sid, path, staged, root) => requestJson('/git-sidebar/api?op=diff&sid=' + q(sid) +
      '&path=' + q(path) + '&staged=' + (staged ? '1' : '0') + (root ? '&root=' + q(root) : ''), { method: 'GET' })
    const apiWrite = (payload) => requestJson('/git-sidebar/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const GRAPH_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#39c5cf', '#ff7b72', '#a5d6ff']
    const graphColor = (lane) => GRAPH_COLORS[lane % GRAPH_COLORS.length]

    /** Lane layout plus parent/child edges for a `git log --topo-order` stream. */
    function buildGraphRows(lines) {
      const lanes = []
      const rows = []
      for (const line of lines) {
        if (line.hash === '') continue
        let lane = lanes.indexOf(line.hash)
        if (lane < 0) {
          lane = lanes.indexOf(null)
          if (lane < 0) { lane = lanes.length; lanes.push(null) }
        }
        const parents = line.parents || []
        lanes[lane] = parents[0] || null
        let insertAt = lane + 1
        for (let index = 1; index < parents.length; index += 1) {
          let slot = lanes.indexOf(null, insertAt)
          if (slot < 0) { lanes.push(null); slot = lanes.length - 1 }
          lanes[slot] = parents[index]
          insertAt = slot + 1
        }
        for (let index = 0; index < lanes.length; index += 1) {
          if (lanes[index] !== null && lanes.indexOf(lanes[index]) !== index) lanes[index] = null
        }
        rows.push({ commit: line, lane })
      }
      const rowOf = new Map()
      rows.forEach((row, index) => rowOf.set(row.commit.hash, index))
      const edges = []
      rows.forEach((row, index) => {
        const parents = row.commit.parents || []
        parents.forEach((parent, at) => {
          const target = rowOf.get(parent)
          if (target !== undefined && target > index) {
            edges.push({ from: index, to: target, fromLane: row.lane, toLane: rows[target].lane })
          } else if (at === 0) {
            // The parent is older than the fetched window: draw a stub.
            edges.push({ from: index, to: index + 1, fromLane: row.lane, toLane: row.lane, stub: true })
          }
        })
      })
      let laneCount = 1
      for (const row of rows) laneCount = Math.max(laneCount, row.lane + 1)
      for (const edge of edges) laneCount = Math.max(laneCount, edge.fromLane + 1, edge.toLane + 1)
      return { rows, edges, laneCount }
    }

    const GRAPH_ROW = 22

    /** One graph row: the vertical rails crossing it, the connectors leaving its commit, and the node. */
    function graphSvg(data, index) {
      const row = data.rows[index]
      const laneX = (lane) => lane * 12 + 6
      const cy = GRAPH_ROW / 2
      const parts = []
      const rails = new Set()
      for (const edge of data.edges) {
        if (edge.from < index && index <= edge.to) {
          const key = 'v' + edge.toLane
          if (rails.has(key)) continue
          rails.add(key)
          parts.push(h('line', {
            key, x1: laneX(edge.toLane), y1: 0, x2: laneX(edge.toLane), y2: GRAPH_ROW,
            stroke: graphColor(edge.toLane), strokeWidth: 1.5,
          }))
        }
      }
      for (const edge of data.edges) {
        if (edge.from !== index) continue
        if (edge.stub === true) {
          parts.push(h('line', {
            key: 's' + edge.fromLane, x1: laneX(edge.fromLane), y1: cy, x2: laneX(edge.fromLane), y2: GRAPH_ROW,
            stroke: graphColor(edge.fromLane), strokeWidth: 1.5,
          }))
          continue
        }
        if (edge.toLane !== edge.fromLane) {
          const x0 = laneX(edge.fromLane)
          const x1 = laneX(edge.toLane)
          parts.push(h('path', {
            key: 'c' + index + ':' + edge.fromLane + ':' + edge.toLane + ':' + edge.to,
            d: 'M' + x0 + ' ' + cy + ' L' + x0 + ' ' + (cy + 4) + ' L' + x1 + ' ' + GRAPH_ROW,
            fill: 'none', stroke: graphColor(edge.toLane), strokeWidth: 1.5, strokeLinejoin: 'round',
          }))
        } else {
          parts.push(h('line', {
            key: 'c' + index + ':' + edge.to,
            x1: laneX(edge.fromLane), y1: cy, x2: laneX(edge.fromLane), y2: GRAPH_ROW,
            stroke: graphColor(edge.fromLane), strokeWidth: 1.5,
          }))
        }
      }
      parts.push(h('circle', {
        key: 'node', cx: laneX(row.lane), cy, r: 3.4,
        fill: graphColor(row.lane), stroke: 'var(--dsw-alias-bg-base)', strokeWidth: 1,
      }))
      const width = data.laneCount * 12 + 4
      return h('svg', {
        className: 'gs-gsvg', width, height: GRAPH_ROW, viewBox: '0 0 ' + width + ' ' + GRAPH_ROW, 'aria-hidden': true,
      }, parts)
    }

    function injectStyles() {
      if (typeof document === 'undefined') return () => {}
      const selector = 'style[data-plugin-css="dsh-git-sidebar/panel.css"]'
      if (document.querySelector(selector) !== null) return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-git-sidebar'
      tag.dataset.pluginCss = 'dsh-git-sidebar/panel.css'
      tag.textContent = css
      document.head.appendChild(tag)
      return () => { tag.remove() }
    }

    function diffLines(diffText) {
      const text = String(diffText || '')
      if (text === '') return []
      return text.split('\n').map((line, at) => {
        let cls = 'gs-diff-line'
        if (line.startsWith('@@')) cls += ' gs-diff-hunk'
        else if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ') ||
          line.startsWith('index ') || line.startsWith('new file') || line.startsWith('deleted file') ||
          line.startsWith('old mode') || line.startsWith('new mode')) cls += ' gs-diff-meta'
        else if (line.startsWith('+')) cls += ' gs-diff-add'
        else if (line.startsWith('-')) cls += ' gs-diff-del'
        return h('div', { className: cls, key: at }, line === '' ? ' ' : line)
      })
    }
    //#endregion

    //#region error boundary
    function CrashCard({ error, onRetry }) {
      const text = error ? String((error && error.stack) || (error && error.message) || error) : ''
      return h('div', { className: 'gs-root' },
        h('div', { className: 'gs-crash' },
          h('div', null, 'Git 面板渲染失败 / Panel render failed'),
          text !== '' ? h('div', { className: 'gs-crash-code' }, text.slice(0, 2000)) : null,
          h('div', { style: { marginTop: '8px' } },
            h('button', { type: 'button', className: 'gs-btn', onClick: onRetry }, '重试 / Retry'))))
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
        this.reset = this.reset.bind(this)
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error) {
        beacon('render-error', {
          message: String((error && error.message) || error),
          stack: String((error && error.stack) || '').slice(0, 3000),
        })
      }

      reset() {
        this.setState({ error: null })
      }

      render() {
        if (this.state.error !== null) return h(CrashCard, { error: this.state.error, onRetry: this.reset })
        return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } }, this.props.children)
      }
    }
    //#endregion

    //#region panel
    function createPanel(t) {
      const iconButton = (icon, title, onClick, disabled) => h('button', {
        type: 'button', className: 'gs-ibtn', title, 'aria-label': title, disabled: disabled === true,
        onClick: (event) => { event.stopPropagation(); onClick() },
      }, h(Glyph, { d: ICON[icon] || ICON.more, size: 13 }))

      function GitPanel(props) {
        const sid = props && typeof props.sessionId === 'string' ? props.sessionId : ''
        const tr = props && typeof props.t === 'function' ? props.t : t

        const [repos, setRepos] = useState(null)
        const [reposError, setReposError] = useState('')
        const [activeRoot, setActiveRoot] = useState('')
        const [mode, setMode] = useState('single')
        const [sort, setSort] = useState('discovered')
        const [sections, setSections] = useState({ repos: true, changes: true, graph: true })
        const [included, setIncluded] = useState([])
        const [info, setInfo] = useState(null)
        const [multi, setMulti] = useState({})
        const [graph, setGraph] = useState(null)
        const [loading, setLoading] = useState(true)
        const [busy, setBusy] = useState(false)
        const [error, setError] = useState('')
        const [notice, setNotice] = useState('')
        const [message, setMessage] = useState('')
        const [messages, setMessages] = useState({})
        const [expanded, setExpanded] = useState('')
        const [diffs, setDiffs] = useState({})
        const [menuOpen, setMenuOpen] = useState(false)
        const [rowMenu, setRowMenu] = useState('')
        const [branchMenu, setBranchMenu] = useState('')
        const [branchForm, setBranchForm] = useState(false)
        const [branchDraft, setBranchDraft] = useState('')
        const [graphOpen, setGraphOpen] = useState(true)
        const [graphTick, setGraphTick] = useState(0)
        const rootRef = useRef(null)
        const menuRef = useRef(null)
        const persistKey = 'dsh-git-sidebar:v6:' + sid

        // ---------- persistence ----------
        useEffect(() => {
          let saved = null
          try { saved = JSON.parse(window.localStorage.getItem(persistKey) || 'null') } catch { saved = null }
          if (saved && typeof saved === 'object') {
            if (typeof saved.activeRoot === 'string') setActiveRoot(saved.activeRoot)
            if (saved.mode === 'single' || saved.mode === 'multiple') setMode(saved.mode)
            if (typeof saved.sort === 'string') setSort(saved.sort)
            if (saved.sections && typeof saved.sections === 'object') {
              setSections({
                repos: saved.sections.repos !== false,
                changes: saved.sections.changes !== false,
                graph: saved.sections.graph !== false,
              })
            }
            if (Array.isArray(saved.included)) setIncluded(saved.included)
          }
        }, [persistKey])

        const persist = useCallback((patch) => {
          try {
            const current = JSON.parse(window.localStorage.getItem(persistKey) || '{}') || {}
            window.localStorage.setItem(persistKey, JSON.stringify(Object.assign({}, current, patch)))
          } catch { /* ignore */ }
        }, [persistKey])

        // ---------- data loading ----------
        const refreshRepos = useCallback(async () => {
          if (sid === '') { setLoading(false); return }
          try {
            const result = await apiRepos(sid)
            if (result && result.ok && Array.isArray(result.repos)) {
              setRepos(result.repos)
              setReposError('')
              setIncluded((current) => current.length === 0 ? result.repos.map((repo) => repo.path) : current)
            } else if (result) {
              setReposError(result.message || result.error || 'failed')
            }
          } catch (err) {
            setReposError(String((err && err.message) || err))
          } finally {
            setLoading(false)
          }
        }, [sid])

        const refreshInfo = useCallback(async (root) => {
          if (sid === '') return null
          try {
            const result = await apiInfo(sid, root || '')
            if (result && result.ok) {
              if (!root || result.pinned) setInfo(result)
              else setInfo(result)
              return result
            }
          } catch { /* ignore */ }
          return null
        }, [sid])

        const sortedRepos = useMemo(() => {
          const list = (repos || []).slice()
          if (sort === 'path') list.sort((a, b) => a.path.localeCompare(b.path))
          else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
          else list.sort((a, b) => (b.at || 0) - (a.at || 0))
          return list
        }, [repos, sort])

        const activeRepo = useMemo(() => {
          if (activeRoot !== '') return (repos || []).find((repo) => repo.path === activeRoot) || null
          if (repos && repos.length > 0) return sortedRepos[0] || null
          return null
        }, [repos, sortedRepos, activeRoot])

        const refreshMulti = useCallback(async () => {
          const list = (repos || []).filter((repo) => included.includes(repo.path)).slice(0, 6)
          const pairs = await Promise.all(list.map(async (repo) => {
            const result = await apiInfo(sid, repo.path)
            return [repo.path, result && result.ok ? result : null]
          }))
          const next = {}
          for (const [root, value] of pairs) if (value) next[root] = value
          setMulti(next)
        }, [repos, included, sid])

        useEffect(() => {
          refreshRepos()
        }, [refreshRepos])

        useEffect(() => {
          if (activeRepo && activeRoot !== activeRepo.path) {
            setActiveRoot(activeRepo.path)
            persist({ activeRoot: activeRepo.path })
          }
        }, [activeRepo, activeRoot, persist])

        useEffect(() => {
          if (repos === null) return
          if (activeRoot !== '' && !repos.some((repo) => repo.path === activeRoot)) {
            setActiveRoot('')
            persist({ activeRoot: '' })
          }
        }, [repos, activeRoot, persist])

        useEffect(() => {
          const root = activeRepo ? activeRepo.path : ''
          setLoading(true)
          refreshInfo(root).finally(() => setLoading(false))
        }, [activeRepo, refreshInfo])

        useEffect(() => {
          let tick = 0
          const handle = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
            tick += 1
            const root = activeRepo ? activeRepo.path : ''
            refreshInfo(root)
            if (tick % 4 === 0) refreshRepos()
          }, 15000)
          return () => clearInterval(handle)
        }, [activeRepo, refreshInfo, refreshRepos])

        useEffect(() => {
          if (mode !== 'multiple') return
          const handle = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
            refreshMulti()
          }, 30000)
          return () => clearInterval(handle)
        }, [mode, refreshMulti])

        useEffect(() => {
          if (mode !== 'multiple') return
          refreshMulti()
        }, [mode, refreshMulti])

        useEffect(() => {
          if (!sections.graph) return
          if (!activeRepo) { setGraph(null); return }
          let cancelled = false
          apiGraph(sid, activeRepo.path).then((result) => {
            if (cancelled) return
            setGraph(result && result.ok ? { root: activeRepo.path, lines: result.lines || [] } : { root: activeRepo.path, lines: [] })
          }).catch(() => {
            if (!cancelled) setGraph({ root: activeRepo.path, lines: [] })
          })
          return () => { cancelled = true }
        }, [sid, activeRepo, sections.graph, graphTick])

        const graphData = useMemo(() => buildGraphRows(graph && Array.isArray(graph.lines) ? graph.lines : []), [graph])

        useEffect(() => {
          beacon('mount', { sid })
        }, [sid])

        useEffect(() => {
          const handle = setTimeout(() => {
            const node = rootRef.current
            if (node === null) { beacon('paint', { sid, missing: true }); return }
            const rect = node.getBoundingClientRect()
            const body = node.querySelector('.gs-body')
            beacon('paint', {
              sid,
              w: Math.round(rect.width),
              h: Math.round(rect.height),
              text: String(node.innerText || '').slice(0, 200),
              bodyH: body === null ? null : Math.round(body.getBoundingClientRect().height),
            })
          }, 300)
          return () => clearTimeout(handle)
        }, [loading, repos, info, sid])

        useEffect(() => {
          if (!menuOpen) return
          const close = (event) => {
            if (menuRef.current !== null && event.target instanceof Node && menuRef.current.contains(event.target)) return
            setMenuOpen(false)
          }
          document.addEventListener('mousedown', close)
          return () => document.removeEventListener('mousedown', close)
        }, [menuOpen])

        // ---------- actions ----------
        const act = useCallback(async (root, op, extra) => {
          setBusy(true)
          setError('')
          setNotice('')
          try {
            const result = await apiWrite(Object.assign({ op, sid }, root ? { root } : {}, extra || {}))
            if (result && result.ok) {
              if (op === 'commit') {
                if (root === activeRoot) setMessage('')
                setMessages((current) => Object.assign({}, current, { [root]: '' }))
              }
              if (op === 'checkout' || op === 'createBranch') { setBranchDraft(''); setBranchForm(false); setBranchMenu('') }
              setNotice(tr('msg.' + op) || '')
              setExpanded('')
              setDiffs({})
              setGraphTick((value) => value + 1)
              await refreshRepos()
              await refreshInfo(root === activeRoot ? root : activeRoot)
              if (mode === 'multiple') await refreshMulti()
            } else if (result) {
              setError(result.message || result.error || 'failed')
            }
          } catch (err) {
            setError(String((err && err.message) || err))
          } finally {
            setBusy(false)
          }
        }, [sid, activeRoot, mode, refreshRepos, refreshInfo, refreshMulti, tr])

        const loadDiff = useCallback(async (root, file) => {
          const key = root + '|' + (file.staged ? 's:' : 'w:') + file.path
          setDiffs((prev) => Object.assign({}, prev, { [key]: { loading: true, lines: [], error: '' } }))
          try {
            const result = await apiDiff(sid, file.path, file.staged, root)
            if (result && result.ok) {
              setDiffs((prev) => Object.assign({}, prev, {
                [key]: { loading: false, lines: diffLines(result.diff), error: '', truncated: result.truncated },
              }))
            } else {
              setDiffs((prev) => Object.assign({}, prev, {
                [key]: { loading: false, lines: [], error: (result && (result.message || result.error)) || tr('diff.failed') },
              }))
            }
          } catch (err) {
            setDiffs((prev) => Object.assign({}, prev, {
              [key]: { loading: false, lines: [], error: String((err && err.message) || err) },
            }))
          }
        }, [sid, tr])

        const toggleDiff = useCallback((root, file) => {
          const key = root + '|' + (file.staged ? 's:' : 'w:') + file.path
          if (expanded === key) { setExpanded(''); return }
          setExpanded(key)
          const cached = diffs[key]
          if (cached === undefined || cached.loading || cached.error) loadDiff(root, file)
        }, [expanded, diffs, loadDiff])

        const selectRepo = (repo) => {
          if (busy) return
          setActiveRoot(repo.path)
          persist({ activeRoot: repo.path })
          setInfo(null)
          setGraph(null)
        }

        const toggleIncluded = (repo) => {
          setIncluded((current) => {
            const next = current.includes(repo.path)
              ? current.filter((path) => path !== repo.path)
              : current.concat([repo.path])
            persist({ included: next })
            return next
          })
        }

        const setModeAndPersist = (next) => {
          setMode(next)
          persist({ mode: next })
        }

        const setSortAndPersist = (next) => {
          setSort(next)
          persist({ sort: next })
        }

        const toggleSection = (key) => {
          const next = Object.assign({}, sections, { [key]: !sections[key] })
          setSections(next)
          persist({ sections: next })
        }

        // ---------- render pieces ----------
        const sectionHead = (key, title, count, actions) => h('div', { className: 'gs-group-head' },
          h('button', {
            type: 'button', className: 'gs-ibtn', style: { width: '16px', height: '16px' },
            title: title, onClick: () => toggleSection(key),
          }, h(Glyph, { d: sections[key] ? ICON.chevronDown : ICON.chevronRight, size: 12 })),
          h('span', { className: 'gs-group-title', onClick: () => toggleSection(key) }, title,
            h('span', { className: 'gs-count' }, String(count))),
          h('span', { className: 'gs-group-actions' }, actions || null))

        const repoRow = (repo) => {
          const on = activeRepo && activeRepo.path === repo.path
          const isChecked = included.includes(repo.path)
          const ab = (repo.ahead ? '↑' + repo.ahead : '') + (repo.behind ? '↓' + repo.behind : '')
          const total = repo.counts ? repo.counts.total : 0
          return h('div', { className: 'gs-repo-wrap', key: repo.path },
            h('div', {
              className: 'gs-repo-row' + (on ? ' gs-repo-row-on' : ''),
              role: 'button', tabIndex: 0, title: repo.path,
              onClick: () => { if (mode === 'multiple') { toggleIncluded(repo); selectRepo(repo) } else selectRepo(repo) },
            },
              mode === 'multiple'
                ? h('span', {
                  className: 'gs-cb' + (isChecked ? ' gs-cb-on' : ''),
                  onClick: (event) => { event.stopPropagation(); toggleIncluded(repo) },
                }, isChecked ? h(Glyph, { d: ICON.check, size: 9 }) : null)
                : null,
              h('span', { className: 'gs-glyph', style: fileColor(repo.name) ? { color: fileColor(repo.name) } : undefined }, h(Glyph, { d: ICON.repo, size: 14 })),
              h('span', { className: 'gs-repo-name' }, repo.name + (total > 0 ? ' · ' + total : '')),
              h('span', {
                className: 'gs-branch-pill', title: tr('action.branches'),
                onClick: (event) => {
                  event.stopPropagation()
                  selectRepo(repo)
                  setBranchMenu(branchMenu === repo.path ? '' : repo.path)
                },
              }, h('span', { className: 'gs-glyph', style: { width: '11px', height: '11px' } }, h(Glyph, { d: ICON.branch, size: 11 })),
              repo.detached ? tr('detached') : (repo.branch || 'HEAD')),
              ab !== '' ? h('span', { className: 'gs-ab' }, ab) : null,
              h('span', { className: 'gs-row-actions' },
                iconButton('sync', tr('action.sync'), () => act(repo.path, 'sync'), busy),
                iconButton('more', tr('action.menu'), () => setRowMenu(rowMenu === repo.path ? '' : repo.path))),
            ),
            branchMenu === repo.path && on && info && info.isGit && info.repo && info.repo.root === repo.path
              ? h('div', { className: 'gs-row-menu' },
                h('div', { className: 'gs-menu-label' }, tr('action.branches')),
                (info.branches || []).slice(0, 12).map((branch) => h('button', {
                  key: branch.name, type: 'button', className: 'gs-menu-item',
                  onClick: () => {
                    setBranchMenu('')
                    if (branch.current) return
                    if (typeof window !== 'undefined' && !window.confirm(tr('confirm.checkout') + '\n' + branch.name)) return
                    act(repo.path, 'checkout', { branch: branch.name })
                  },
                }, h('span', { className: 'gs-menu-check' }, branch.current ? '✓' : ''), branch.name)),
                h('div', { className: 'gs-menu-sep' }),
                branchForm
                  ? h('div', { className: 'gs-branch-form' },
                    h('input', {
                      className: 'gs-input-line', placeholder: tr('action.newBranch'),
                      value: branchDraft, disabled: busy,
                      onChange: (event) => setBranchDraft(event.target.value),
                      onKeyDown: (event) => {
                        if (event.key === 'Enter' && branchDraft.trim() !== '') act(repo.path, 'createBranch', { branch: branchDraft.trim() })
                      },
                    }),
                    h('button', {
                      type: 'button', className: 'gs-btn', disabled: busy || branchDraft.trim() === '',
                      onClick: () => act(repo.path, 'createBranch', { branch: branchDraft.trim() }),
                    }, tr('action.create')))
                  : h('button', { type: 'button', className: 'gs-menu-item', onClick: () => setBranchForm(true) }, tr('action.newBranch')))
              : null,
            rowMenu === repo.path
              ? h('div', { className: 'gs-row-menu' },
                h('button', { type: 'button', className: 'gs-menu-item', onClick: () => { setRowMenu(''); act(repo.path, 'fetch') } }, tr('action.fetch')),
                h('button', { type: 'button', className: 'gs-menu-item', onClick: () => { setRowMenu(''); act(repo.path, 'pull') } }, tr('action.pull')),
                h('button', { type: 'button', className: 'gs-menu-item', onClick: () => { setRowMenu(''); act(repo.path, 'push') } }, tr('action.push')),
                h('div', { className: 'gs-menu-sep' }),
                h('button', {
                  type: 'button', className: 'gs-menu-item',
                  onClick: () => { setRowMenu(''); setActiveRoot(repo.path); persist({ activeRoot: repo.path }) },
                }, tr('action.setActive')))
              : null)
        }

        const fileRow = (root, file, staged) => {
          const key = root + '|' + (staged ? 's:' : 'w:') + file.path
          const split = splitPath(file.path)
          const letter = statusLetter(file)
          const entry = diffs[key]
          const isOpen = expanded === key
          return h('div', { className: 'gs-file', key },
            h('div', { className: 'gs-file-row', role: 'button', tabIndex: 0, title: file.path, onClick: () => toggleDiff(root, file) },
              h('span', { className: 'gs-glyph', style: fileColor(file.path) ? { color: fileColor(file.path) } : undefined }, h(FileGlyph, null)),
              h('span', { className: 'gs-file-main' },
                h('span', { className: 'gs-file-name' }, file.old ? file.old + ' → ' + split.name : split.name),
                split.dir !== '' && !file.old ? h('span', { className: 'gs-file-dir' }, split.dir) : null),
              h('span', { className: 'gs-status gs-st-' + letter }, letter),
              h('span', { className: 'gs-file-actions' },
                staged
                  ? iconButton('minus', tr('action.unstage'), () => act(root, 'unstage', { path: file.path }), busy)
                  : iconButton('plus', tr('action.stage'), () => act(root, 'stage', { path: file.path }), busy),
                iconButton('undo', tr('action.discard'), () => {
                  if (typeof window !== 'undefined' && !window.confirm(tr('confirm.discard'))) return
                  act(root, 'discard', { path: file.path })
                }, busy))),
            isOpen ? h('div', { className: 'gs-diff', key: 'diff' },
              entry === undefined || entry.loading
                ? h('div', { className: 'gs-diff-note' }, tr('diff.loading'))
                : entry.error
                  ? h('div', { className: 'gs-diff-note' }, entry.error)
                  : entry.lines.length === 0
                    ? h('div', { className: 'gs-diff-note' }, tr('diff.empty'))
                    : h(React.Fragment, null,
                      file.untracked ? h('div', { className: 'gs-diff-note' }, tr('diff.untracked')) : null,
                      entry.lines,
                      entry.truncated ? h('div', { className: 'gs-diff-note' }, tr('diff.truncated')) : null)) : null)
        }

        const commitBox = (root, value, onChange, stagedCount, branch) => h('div', { className: 'gs-commit' },
          h('textarea', {
            className: 'gs-commit-input', rows: 3,
            placeholder: String(tr('commit.placeholder')).replace('{branch}', branch || 'HEAD'),
            value, disabled: busy,
            onChange: (event) => onChange(event.target.value),
            onKeyDown: (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                if (value.trim() !== '' && stagedCount > 0) act(root, 'commit', { message: value })
              }
            },
          }),
          h('div', { className: 'gs-commit-bar' },
            h('button', {
              type: 'button', className: 'gs-primary',
              disabled: busy || value.trim() === '' || stagedCount === 0,
              title: stagedCount === 0 ? tr('commit.noStaged') : tr('action.commit'),
              onClick: () => act(root, 'commit', { message: value }),
            }, h(Glyph, { d: ICON.check, size: 12 }), tr('action.commit'))))

        const changesBlock = (root, target, messageValue, setMessageValue) => {
          const files = target.files || []
          const stagedFiles = files.filter((file) => file.staged)
          const workingFiles = files.filter((file) => !file.staged)
          const counts = target.counts || { staged: 0, changed: 0, untracked: 0, total: 0 }
          const branch = target.detached ? tr('detached') : (target.branch || '')
          return h('div', { className: 'gs-sub', key: 'changes:' + root },
            commitBox(root, messageValue || '', setMessageValue, counts.staged, branch),
            workingFiles.length > 0
              ? h('div', { className: 'gs-group' },
                h('div', { className: 'gs-group-head' },
                  h('span', { className: 'gs-group-title' }, tr('section.changes'), h('span', { className: 'gs-count' }, String(workingFiles.length))),
                  h('span', { className: 'gs-group-actions' },
                    iconButton('plus', tr('action.stageAll'), () => act(root, 'stageAll'), busy),
                    iconButton('undo', tr('action.discardAll'), () => {
                      if (typeof window !== 'undefined' && !window.confirm(tr('confirm.discardAll'))) return
                      act(root, 'discardAll')
                    }, busy))),
                workingFiles.map((file) => fileRow(root, file, false)))
              : null,
            stagedFiles.length > 0
              ? h('div', { className: 'gs-group' },
                h('div', { className: 'gs-group-head' },
                  h('span', { className: 'gs-group-title' }, tr('section.stagedChanges'), h('span', { className: 'gs-count' }, String(stagedFiles.length))),
                  h('span', { className: 'gs-group-actions' },
                    iconButton('minus', tr('action.unstageAll'), () => act(root, 'unstageAll'), busy))),
                stagedFiles.map((file) => fileRow(root, file, true)))
              : null,
            counts.total === 0
              ? h('div', { className: 'gs-clean' }, h(Glyph, { d: ICON.check, size: 12 }), tr('empty.clean'))
              : null)
        }

        const shell = (...children) => h('div', { className: 'gs-root', ref: rootRef }, ...children)

        const head = () => h('div', { className: 'gs-head' },
          h('span', { className: 'gs-head-title' }, tr('head.title')),
          iconButton('refresh', tr('action.refresh'), () => { refreshRepos(); if (activeRepo) refreshInfo(activeRepo.path) }, busy),
          h('span', { ref: menuRef, style: { display: 'inline-flex' } },
            iconButton('more', tr('action.menu'), () => setMenuOpen((open) => !open)),
            menuOpen ? h('div', { className: 'gs-menu' },
              h('div', { className: 'gs-menu-label' }, tr('label.mode')),
              h('button', { type: 'button', className: 'gs-menu-item', onClick: () => setModeAndPersist('single') },
                h('span', { className: 'gs-menu-check' }, mode === 'single' ? '✓' : ''), tr('mode.single')),
              h('button', { type: 'button', className: 'gs-menu-item', onClick: () => setModeAndPersist('multiple') },
                h('span', { className: 'gs-menu-check' }, mode === 'multiple' ? '✓' : ''), tr('mode.multiple')),
              h('div', { className: 'gs-menu-sep' }),
              h('div', { className: 'gs-menu-label' }, tr('label.sortBy')),
              ['discovered', 'path', 'name'].map((key) => h('button', {
                key, type: 'button', className: 'gs-menu-item', onClick: () => setSortAndPersist(key),
              }, h('span', { className: 'gs-menu-check' }, sort === key ? '✓' : ''), tr('sort.' + key))),
              h('div', { className: 'gs-menu-sep' }),
              h('div', { className: 'gs-menu-label' }, tr('label.sections')),
              ['repos', 'changes', 'graph'].map((key) => h('button', {
                key, type: 'button', className: 'gs-menu-item', onClick: () => toggleSection(key),
              }, h('span', { className: 'gs-menu-check' }, sections[key] ? '✓' : ''), tr('sections.' + key))),
              h('div', { className: 'gs-menu-sep' }),
              h('button', { type: 'button', className: 'gs-menu-item', onClick: () => { setMenuOpen(false); refreshRepos(); if (activeRepo) refreshInfo(activeRepo.path) } }, tr('action.refreshAll')),
            ) : null))

        if (sid === '') {
          return shell(head(), h('div', { className: 'gs-empty' }, tr('empty.noRepos')))
        }

        const banner = error
          ? h('div', { className: 'gs-banner' }, error)
          : notice ? h('div', { className: 'gs-banner gs-banner-ok' }, notice) : null

        const reposSection = sections.repos
          ? h('div', { className: 'gs-group', key: 'repos' },
            sectionHead('repos', tr('section.repos'), (repos || []).length,
              iconButton('refresh', tr('action.refresh'), refreshRepos, busy)),
            loading && repos === null
              ? h('div', { className: 'gs-empty' }, tr('empty.loading'))
              : (repos || []).length === 0
                ? h('div', { className: 'gs-empty' }, reposError || tr('empty.noRepos'))
                : sortedRepos.map(repoRow))
          : null

        let changesBody = null
        if (mode === 'multiple') {
          changesBody = (repos || []).filter((repo) => included.includes(repo.path)).slice(0, 6).map((repo) => {
            const target = multi[repo.path]
            return h('div', { className: 'gs-sub', key: 'multi:' + repo.path },
              h('div', { className: 'gs-sub-head' },
                h('span', { className: 'gs-glyph' }, h(Glyph, { d: ICON.repo, size: 12 })),
                h('span', { className: 'gs-sub-name' }, repo.name),
                h('span', { className: 'gs-sub-branch' }, repo.detached ? tr('detached') : (repo.branch || '')),
                h('span', { className: 'gs-spacer' }),
                target ? h('span', { className: 'gs-ab' }, String(target.counts ? target.counts.total : 0)) : null),
              target
                ? changesBlock(repo.path, target,
                  messages[repo.path] || '',
                  (value) => setMessages((current) => Object.assign({}, current, { [repo.path]: value })))
                : h('div', { className: 'gs-empty' }, tr('empty.loading')))
          })
        } else if (activeRepo === null) {
          changesBody = h('div', { className: 'gs-empty' }, tr('empty.noRepos'))
        } else if (info !== null && info.isGit && info.repo && info.repo.root === activeRepo.path) {
          changesBody = h('div', { className: 'gs-sub', key: 'active' }, changesBlock(activeRepo.path, info, message, setMessage))
        } else {
          changesBody = h('div', { className: 'gs-empty' }, tr('empty.loading'))
        }

        const changesSection = sections.changes
          ? h('div', { className: 'gs-group', key: 'changes' },
            sectionHead('changes', tr('section.changes'),
              mode === 'multiple'
                ? Object.keys(multi).reduce((sum, root) => sum + ((multi[root] && multi[root].counts) ? multi[root].counts.total : 0), 0)
                : (info && info.counts ? info.counts.total : 0)),
            changesBody)
          : null

        const graphSection = sections.graph
          ? h('div', { className: 'gs-group', key: 'graph' },
            h('div', { className: 'gs-group-head' },
              h('button', {
                type: 'button', className: 'gs-ibtn', style: { width: '16px', height: '16px' }, title: tr('section.graph'),
                onClick: () => setGraphOpen((open) => !open),
              }, h(Glyph, { d: graphOpen ? ICON.chevronDown : ICON.chevronRight, size: 12 })),
              h('span', { className: 'gs-group-title', onClick: () => setGraphOpen((open) => !open) }, tr('section.graph')),
              h('span', { className: 'gs-spacer' }),
              h('span', { className: 'gs-group-actions' },
                h('span', { className: 'gs-ab' }, String(graph && graph.lines ? graph.lines.filter((line) => line.hash).length : 0)))),
            graphOpen
              ? (graph === null || graph.root !== (activeRepo ? activeRepo.path : '')
                ? h('div', { className: 'gs-empty' }, tr('empty.loading'))
                : (graphData.rows.length === 0
                  ? h('div', { className: 'gs-empty' }, tr('empty.graph'))
                  : graphData.rows.map((row, at) => h('div', { className: 'gs-grow', key: at, title: row.commit.subject + ' — ' + (row.commit.author || '') },
                    graphSvg(graphData, at),
                    h('span', { className: 'gs-ghash' }, row.commit.short),
                    h('span', { className: 'gs-gsub' }, row.commit.subject),
                    (row.commit.refs || []).slice(0, 2).map((ref) => h('span', { className: 'gs-gref', key: ref }, ref))))))
              : null)
          : null

        return shell(
          head(),
          banner,
          h('div', { className: 'gs-body' }, reposSection, changesSection, graphSection),
          h('div', { className: 'gs-foot' },
            h('button', { type: 'button', className: 'gs-btn', disabled: busy || !activeRepo, onClick: () => activeRepo && act(activeRepo.path, 'fetch') }, tr('action.fetch')),
            h('button', { type: 'button', className: 'gs-btn', disabled: busy || !activeRepo, onClick: () => activeRepo && act(activeRepo.path, 'pull') }, tr('action.pull')),
            h('span', { className: 'gs-spacer' }),
            h('button', {
              type: 'button', className: 'gs-btn', disabled: busy || !activeRepo,
              onClick: () => {
                if (!activeRepo) return
                if (typeof window !== 'undefined' && !window.confirm(tr('confirm.push'))) return
                act(activeRepo.path, 'push')
              },
            }, tr('action.push'))))
      }

      function Wrapped(props) {
        return h(ErrorBoundary, null, h(GitPanel, props))
      }
      Wrapped.displayName = 'GitSidebarPanel'
      return Wrapped
    }

    function GitTitle() {
      return h('span', { className: 'gs-tab' }, h(Glyph, { d: ICON.branch, size: 13 }), h('span', null, 'Git'))
    }
    //#endregion

    //#region plugin
    function registerAll(ctx) {
      const t = ctx.locale.bind(NS)
      const Panel = createPanel(t)

      try {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'git-sidebar: dictionaries')
      } catch (error) {
        // A hot-reloaded older instance may still hold this namespace; keep the
        // panel usable with its already-registered copy instead of failing.
        beacon('locale-conflict', { message: String((error && error.message) || error) })
      }
      ctx.effect(() => injectStyles(), 'git-sidebar: styles')

      ctx.effect(() => {
        const handle = ctx.inject(['sidebarRightTabs'], (inner) => {
          inner.effect(() => inner.sidebarRightTabs.register({
            id: ID,
            kind: KIND,
            title: () => t('tab.title'),
            guide: [{
              order: 40,
              title: () => t('guide.title'),
              description: () => t('guide.desc'),
              icon: () => h(Glyph, { d: ICON.branch, size: 22 }),
            }],
          }), 'git-sidebar: tab type')

          inner.effect(() => inner.slots.inject('sidebar.right.pane.tab', () => inner.slots.register({
            name: 'sidebar.right.pane.tab',
            key: ID,
            locale: NS,
          }, Panel)), 'git-sidebar: tab body')

          inner.effect(() => inner.slots.inject('sidebar.right.pane.tab.title', () => inner.slots.register({
            name: 'sidebar.right.pane.tab.title',
            key: ID,
          }, GitTitle)), 'git-sidebar: tab title')
        })
        return () => {
          try { if (handle && typeof handle.dispose === 'function') handle.dispose() } catch { /* ignore */ }
        }
      }, 'git-sidebar: sidebar-right registrations')
    }

    function apply(ctx) {
      try {
        registerAll(ctx)
        beacon('apply-ok', null)
      } catch (error) {
        beacon('apply-error', {
          message: String((error && error.message) || error),
          stack: String((error && error.stack) || '').slice(0, 3000),
        })
        try {
          const message = String((error && error.stack) || (error && error.message) || error)
          const Fallback = () => h(CrashCard, { error: new Error(message), onRetry: () => { if (typeof location !== 'undefined') location.reload() } })
          ctx.effect(() => ctx.locale.register(NS, { zh: { 'tab.title': '源代码管理' }, en: { 'tab.title': 'Source Control' } }), 'git-sidebar: fallback dicts')
          const handle = ctx.inject(['sidebarRightTabs'], (inner) => {
            inner.effect(() => inner.sidebarRightTabs.register({
              id: ID, kind: KIND, title: () => 'Git',
              guide: [{ order: 40, title: () => 'Git', description: () => message.slice(0, 120) }],
            }), 'git-sidebar: fallback type')
            inner.effect(() => inner.slots.inject('sidebar.right.pane.tab', () => inner.slots.register({
              name: 'sidebar.right.pane.tab', key: ID,
            }, Fallback)), 'git-sidebar: fallback body')
          })
          beacon('apply-fallback-ok', null)
          void handle
        } catch (fallbackError) {
          beacon('apply-fallback-error', { message: String((fallbackError && fallbackError.message) || fallbackError) })
        }
      }
    }

    const plugin = { inject: ['slots', 'locale'], apply }
    return plugin
    //#endregion
  },
})
