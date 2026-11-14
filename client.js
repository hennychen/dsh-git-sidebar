// dsh-git-sidebar — Client half (v0.7).
//
// A VS Code Source Control style panel for the right sidebar with multiple
// repositories: the "Repositories" list (branch, ahead/behind, sync, per-repo
// menu), "Changes" for the selected repository (or every selected repository in
// multi mode), and a "Graph" section backed by `git log --graph` with its own
// repository picker, branch multi-select and branch-labelled lanes.
window.__ModuleLoader__.load({
  id: '@hennychen/dsh-git-sidebar',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const NS = 'gitSidebar'
    const ID = '@hennychen/dsh-git-sidebar'
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
      'graph.selectRepo': '选择存储库',
      'graph.selectBranches': '选择分支',
      'graph.allBranches': '全部分支',
      'graph.currentOnly': '仅当前分支',
      'graph.localOnly': '仅本地',
      'graph.remoteOnly': '仅远程',
      'graph.localBranches': '本地分支',
      'graph.remoteBranches': '远程分支',
      'graph.noBranches': '没有可显示的分支',
      'graph.noneSelected': '未选中分支：点上方「分支」勾选要在图形里显示的分支',
      'git.pull': '拉取', 'git.push': '推送', 'git.clone': '克隆…', 'git.checkout': '签出到…',
      'git.fetch': '抓取', 'git.sync': '同步', 'git.output': '显示 GIT 输出',
      'git.commitGroup': '提交', 'git.commitStaged': '提交已暂存', 'git.commitAll': '提交全部更改',
      'git.changesGroup': '更改', 'git.stageAll': '暂存全部更改', 'git.unstageAll': '取消暂存全部更改', 'git.discardAll': '放弃全部更改',
      'git.pullPushGroup': '拉取、推送',
      'git.branchGroup': '分支', 'git.newBranch': '新建分支…', 'git.deleteBranch': '删除分支',
      'git.remoteGroup': '远程', 'git.noRemotes': '无远程',
      'git.stashGroup': '存储', 'git.stashPush': '储藏当前改动', 'git.stashPop': '弹出最近储藏', 'git.stashDrop': '删除此储藏', 'git.noStashes': '无储藏',
      'git.tagGroup': '标记', 'git.tagCreate': '创建标记…', 'git.tagDelete': '删除此标记', 'git.noTags': '无标记',
      'git.worktreeGroup': '工作树', 'git.worktreeAdd': '新建工作树…', 'git.noWorktrees': '无工作树',
      'view.tree': '树结构查看', 'view.list': '列表查看', 'view.sortGroup': '查看和排序',
      'view.sortPath': '按路径排序', 'view.sortName': '按名称排序', 'view.sortStatus': '按状态排序',
      'dialog.tagName': '标记名', 'dialog.branchName': '分支名', 'dialog.worktreePath': '工作树路径（相对仓库）',
      'dialog.cloneUrl': '仓库 URL', 'dialog.cloneDir': '目标目录（绝对路径）',
      'dialog.commitMsg': '提交信息', 'dialog.cancel': '取消', 'dialog.ok': '确定',
      'output.title': 'GIT 输出', 'output.empty': '暂无输出记录',
      'confirm.deleteBranch': '删除此分支？此操作不可撤销。', 'confirm.tagDelete': '删除此标记？', 'confirm.stashDrop': '删除此储藏？',
      'graph.branchPicker': '分支',
      'graph.branchAll': '全部',
      'graph.focus': '只看此分支',
      'graph.branchTip': 'tip',
      'commit.placeholder': '消息（按 ⌘Enter 提交到 {branch}）',
      'commit.noStaged': '没有已暂存的更改',
      'commit.menuTitle': '更多提交操作',
      'commit.commitPush': '提交并推送',
      'commit.amend': '修正上次提交（Amend）',
      'commit.undo': '撤销上次提交（保留更改）',
      'commit.history': '提交信息历史',
      'commit.noHistory': '暂无历史记录',
      'commit.detailLoading': '正在加载提交详情…',
      'commit.detailFiles': '变更文件',
      'commit.detailNoFiles': '此提交没有文件变更',
      'commit.detailCheckout': '签出此提交（分离 HEAD）',
      'commit.detailBranch': '从此提交新建分支…',
      'commit.detailTag': '在此提交打标记…',
      'confirm.checkoutCommit': '签出提交将进入分离 HEAD 状态，是否继续？',
      'search.changes': '筛选更改文件…',
      'search.graph': '筛选提交（信息/作者/哈希）…',
      'search.clear': '清除筛选',
      'search.noMatch': '没有匹配的更改',
      'msg.commitAll': '已提交全部更改',
      'msg.undoCommit': '已撤销上次提交',
      'msg.checkoutCommit': '已签出提交（分离 HEAD）',
      'msg.branchDelete': '已删除分支',
      'msg.stashPush': '已储藏更改',
      'msg.stashPop': '已弹出储藏',
      'msg.stashDrop': '已删除储藏',
      'msg.tagCreate': '已创建标记',
      'msg.tagDelete': '已删除标记',
      'msg.worktreeAdd': '已创建工作树',
      'msg.clone': '已克隆仓库',
      'empty.noRepos': '没有可管理的 Git 存储库',
      'repos.manage': '管理显示',
      'repos.showAll': '全部显示',
      'repos.onlyChanged': '仅显示有更改',
      'repos.hiddenAll': '已隐藏全部存储库',
      'repos.visibleOf': '显示的存储库',
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
      'graph.selectRepo': 'Select Repository',
      'graph.selectBranches': 'Select Branches',
      'graph.allBranches': 'All branches',
      'graph.currentOnly': 'Current branch only',
      'graph.localOnly': 'Local only',
      'graph.remoteOnly': 'Remote only',
      'graph.localBranches': 'Local branches',
      'graph.remoteBranches': 'Remote branches',
      'graph.noBranches': 'No branches to show',
      'graph.noneSelected': 'No branch selected: use "Branches" above to pick which refs the graph shows',
      'git.pull': 'Pull', 'git.push': 'Push', 'git.clone': 'Clone…', 'git.checkout': 'Checkout to…',
      'git.fetch': 'Fetch', 'git.sync': 'Sync', 'git.output': 'Show GIT Output',
      'git.commitGroup': 'Commit', 'git.commitStaged': 'Commit Staged', 'git.commitAll': 'Commit All Changes',
      'git.changesGroup': 'Changes', 'git.stageAll': 'Stage All Changes', 'git.unstageAll': 'Unstage All Changes', 'git.discardAll': 'Discard All Changes',
      'git.pullPushGroup': 'Pull & Push',
      'git.branchGroup': 'Branch', 'git.newBranch': 'Create Branch…', 'git.deleteBranch': 'Delete Branch',
      'git.remoteGroup': 'Remote', 'git.noRemotes': 'No remotes',
      'git.stashGroup': 'Stash', 'git.stashPush': 'Stash Changes', 'git.stashPop': 'Pop Latest Stash', 'git.stashDrop': 'Drop This Stash', 'git.noStashes': 'No stashes',
      'git.tagGroup': 'Tag', 'git.tagCreate': 'Create Tag…', 'git.tagDelete': 'Delete This Tag', 'git.noTags': 'No tags',
      'git.worktreeGroup': 'Worktree', 'git.worktreeAdd': 'Create Worktree…', 'git.noWorktrees': 'No worktrees',
      'view.tree': 'Tree View', 'view.list': 'List View', 'view.sortGroup': 'View & Sort',
      'view.sortPath': 'Sort by Path', 'view.sortName': 'Sort by Name', 'view.sortStatus': 'Sort by Status',
      'dialog.tagName': 'Tag name', 'dialog.branchName': 'Branch name', 'dialog.worktreePath': 'Worktree path (relative to repo)',
      'dialog.cloneUrl': 'Repository URL', 'dialog.cloneDir': 'Target directory (absolute path)',
      'dialog.commitMsg': 'Commit message', 'dialog.cancel': 'Cancel', 'dialog.ok': 'OK',
      'output.title': 'GIT Output', 'output.empty': 'No output yet',
      'confirm.deleteBranch': 'Delete this branch? This cannot be undone.', 'confirm.tagDelete': 'Delete this tag?', 'confirm.stashDrop': 'Drop this stash?',
      'graph.branchPicker': 'Branches',
      'graph.branchAll': 'All',
      'graph.focus': 'Show only this branch',
      'graph.branchTip': 'tip',
      'commit.placeholder': 'Message (press ⌘Enter to commit on "{branch}")',
      'commit.noStaged': 'No staged changes',
      'commit.menuTitle': 'More commit actions',
      'commit.commitPush': 'Commit & Push',
      'commit.amend': 'Amend Last Commit',
      'commit.undo': 'Undo Last Commit (keep changes)',
      'commit.history': 'Commit message history',
      'commit.noHistory': 'No recent messages',
      'commit.detailLoading': 'Loading commit details…',
      'commit.detailFiles': 'Changed files',
      'commit.detailNoFiles': 'This commit has no file changes',
      'commit.detailCheckout': 'Checkout this commit (detached HEAD)',
      'commit.detailBranch': 'Create branch from this commit…',
      'commit.detailTag': 'Tag this commit…',
      'confirm.checkoutCommit': 'Checking out a commit leaves a detached HEAD. Continue?',
      'search.changes': 'Filter changed files…',
      'search.graph': 'Filter commits (message / author / hash)…',
      'search.clear': 'Clear filter',
      'search.noMatch': 'No matching changes',
      'msg.commitAll': 'Committed all changes',
      'msg.undoCommit': 'Last commit undone',
      'msg.checkoutCommit': 'Checked out commit (detached HEAD)',
      'msg.branchDelete': 'Branch deleted',
      'msg.stashPush': 'Changes stashed',
      'msg.stashPop': 'Stash popped',
      'msg.stashDrop': 'Stash dropped',
      'msg.tagCreate': 'Tag created',
      'msg.tagDelete': 'Tag deleted',
      'msg.worktreeAdd': 'Worktree created',
      'msg.clone': 'Repository cloned',
      'empty.noRepos': 'No Git repository to manage',
      'repos.manage': 'Manage visibility',
      'repos.showAll': 'Show all',
      'repos.onlyChanged': 'Only with changes',
      'repos.hiddenAll': 'All repositories are hidden',
      'repos.visibleOf': 'Visible repositories',
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
.gs-cb-on{background:#4d6bfe;border-color:#4d6bfe}
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
.gs-menu-scroll{max-height:min(260px,60vh);overflow-y:auto;scrollbar-width:thin;overscroll-behavior:contain}
.gs-menu-scroll::-webkit-scrollbar{width:6px}
.gs-menu-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:3px}
.gs-menu-scroll::-webkit-scrollbar-track{background:transparent}
.gs-menu-sep{height:1px;margin:3px 4px;background:var(--dsw-alias-border-l1)}
.gs-sub{display:flex;flex-direction:column;margin-top:2px}
.gs-sub-head{display:flex;align-items:center;gap:5px;padding:4px 8px 2px;font-size:11px;color:var(--dsw-alias-label-secondary);min-width:0}
.gs-sub-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--dsw-alias-label-primary)}
.gs-sub-branch{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-commit{flex:0 0 auto;margin:6px 8px 2px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;overflow:visible}
.gs-commit:focus-within{border-color:var(--dsw-alias-brand-primary)}
.gs-commit-input{width:100%;box-sizing:border-box;resize:vertical;min-height:40px;max-height:140px;padding:5px 7px;border:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;outline:none}
.gs-commit-input::placeholder{color:var(--dsw-alias-label-secondary);opacity:.8}
.gs-commit-bar{display:flex;align-items:center;gap:6px;justify-content:flex-end;padding:3px 5px;border-top:1px solid var(--dsw-alias-border-l1);position:relative}
.gs-commit-wrap{position:relative}
.gs-commit-hist{position:absolute;right:4px;bottom:4px;width:18px;height:18px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.gs-commit-hist:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.gs-commit-history{position:absolute;right:4px;bottom:24px;z-index:45;min-width:200px;max-width:280px;max-height:180px;overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.gs-commit-history .gs-menu-item{display:block;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
.gs-commit-split{display:flex;align-items:stretch}
.gs-commit-main{border-radius:4px 0 0 4px;padding-right:8px}
.gs-commit-caret{width:22px;border-radius:0 4px 4px 0;border-left:1px solid rgba(255,255,255,.28);padding:0;justify-content:center}
.gs-commit-menu{position:absolute;right:5px;bottom:32px;z-index:45;min-width:190px;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.gs-filter-wrap{display:flex;align-items:center;gap:2px;margin:2px 8px 4px}
.gs-filter{flex:1 1 auto;min-width:0;height:22px;padding:0 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:11px}
.gs-filter:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.gs-grow-click{cursor:pointer}
.gs-grow-sel{background:var(--dsw-alias-bg-layer-2)}
.gs-cdetail{margin:0 8px 6px 26px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1)}
.gs-cdetail-head{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.gs-cdetail-hash{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-brand-primary)}
.gs-cdetail-meta{font-size:10px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-cdetail-msg{white-space:pre-wrap;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-primary);max-height:120px;overflow-y:auto;margin-bottom:5px}
.gs-cdetail-files{display:flex;flex-direction:column;gap:1px;max-height:160px;overflow-y:auto;margin-bottom:2px}
.gs-cdetail-file{display:flex;align-items:center;gap:6px;padding:2px 4px;border:none;border-radius:3px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:10.5px;text-align:left;cursor:pointer}
.gs-cdetail-file:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-cdetail-path{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.gs-cdetail-add{flex:0 0 auto;color:var(--dsw-alias-state-success-primary);font-size:10px}
.gs-cdetail-del{flex:0 0 auto;color:var(--dsw-alias-state-error-primary);font-size:10px}
.gs-primary{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border:1px solid transparent;border-radius:4px;background:#4d6bfe;color:#fff;font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
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
.gs-gtoolbar{display:flex;align-items:center;gap:4px;padding:0 8px 5px}
.gs-gpick{display:inline-flex;align-items:center;gap:3px;flex:1 1 0;min-width:0;height:20px;padding:0 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:10.5px;cursor:pointer;overflow:hidden}
.gs-gpick:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.gs-gpick-on{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}
.gs-gpick-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-gpanel{margin:0 8px 6px;max-height:210px;overflow:auto;padding:3px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1)}
.gs-gpanel-quick{display:flex;gap:4px;padding:2px 2px 5px}
.gs-gpanel-quick .gs-btn{flex:1 1 auto;justify-content:center;font-size:10.5px;padding:2px 6px}
.gs-gbranch-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px}
.gs-gdot{width:7px;height:7px;flex:0 0 auto;border-radius:50%}
.gs-gbranch-head{flex:0 0 auto;font-size:9px;letter-spacing:.04em;color:var(--dsw-alias-brand-primary)}
.gs-gbranch-tip{flex:0 0 auto;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:9px}
.gs-glegend{display:flex;flex-wrap:wrap;gap:3px;padding:0 8px 5px}
.gs-gchip{display:inline-flex;align-items:center;gap:3px;max-width:48%;padding:0 5px;height:16px;border:1px solid;border-radius:8px;background:transparent;font:inherit;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:9.5px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-gbrow{display:flex;align-items:center;gap:2px}
.gs-gbtoggle{flex:1 1 auto;display:flex;align-items:center;gap:4px;min-width:0;height:22px;padding:0 4px;border:none;border-radius:4px;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left}
.gs-gbtoggle:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-gfocus{flex:0 0 auto;width:20px;height:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;line-height:1;font-size:11px;padding:0}
.gs-gfocus:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.gs-gdot{width:6px;height:6px;border-radius:50%;flex:0 0 auto}
.gs-sub-trigger{display:flex;width:100%;align-items:center;gap:6px;padding:4px 8px;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;text-align:left;cursor:pointer}
.gs-sub-trigger:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-sub-arrow{margin-left:auto;font-size:9px;color:var(--dsw-alias-label-secondary)}
.gs-sub-items{padding-left:12px;border-left:1px solid var(--dsw-alias-border-l1);margin:1px 0 2px 6px}
.gs-sub-items .gs-menu-item{font-size:11px;padding:3px 8px}
.gs-danger{color:var(--dsw-alias-state-error-primary)}
.gs-meta-line{display:flex;gap:6px;align-items:center;padding:2px 8px;font-size:10px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-gtools{display:flex;align-items:center;gap:2px;flex:0 0 auto}
.gs-gtool{width:20px;height:20px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-secondary);line-height:1;cursor:pointer}
.gs-gtool:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.gs-gtool:disabled{opacity:.4;cursor:default}
.gs-dialog-overlay{position:absolute;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.gs-dialog{width:min(340px,90%);padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-overlay);box-shadow:0 12px 40px rgba(0,0,0,.4)}
.gs-dialog-title{font-size:12px;font-weight:600;margin-bottom:10px;color:var(--dsw-alias-label-primary)}
.gs-dialog-field{margin-bottom:8px}
.gs-dialog-field label{display:block;font-size:10px;color:var(--dsw-alias-label-secondary);margin-bottom:3px}
.gs-dialog-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:12px}
.gs-output{position:absolute;inset:0;z-index:70;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base)}
.gs-output-head{display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto}
.gs-output-title{flex:1 1 auto;font-size:11px;font-weight:600;color:var(--dsw-alias-label-primary)}
.gs-output-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:6px 10px}
.gs-output-entry{margin-bottom:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:6px 8px;background:var(--dsw-alias-bg-layer-1)}
.gs-output-cmd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-brand-primary);margin-bottom:3px;word-break:break-all}
.gs-output-text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-all;max-height:120px;overflow-y:auto}
.gs-output-err{color:var(--dsw-alias-state-error-primary)}
.gs-tree-node{padding-left:0}
.gs-tree-dir{display:flex;align-items:center;gap:4px;height:20px;padding:0 6px 0 12px;cursor:pointer;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.gs-tree-dir:hover{background:var(--dsw-alias-bg-layer-2)}
.gs-tree-children{padding-left:10px}
.gs-gref-head{font-weight:600}
.gs-gref-remote{border-style:dashed}
.gs-gref-tag{color:var(--dsw-alias-label-secondary)!important;border-color:var(--dsw-alias-border-l1)!important;background:transparent!important}
.gs-gmore{color:var(--dsw-alias-label-secondary)!important;border-color:var(--dsw-alias-border-l1)!important}
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
      pull: ['M8 3.5v8', 'M5 8.5l3 3 3-3'],
      push: ['M8 12.5v-8', 'M5 7l3-3 3 3'],
      fetch: ['M12.5 8a4.5 4.5 0 1 1-2-3.7', 'M13.5 3v3.5H10'],
      chevronDown: ['M4.5 6.5L8 10l3.5-3.5'],
      chevronRight: ['M6.5 4.5L10 8l-3.5 3.5'],
      clock: ['M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z', 'M8 4.8V8l2.2 1.4'],
      eye: ['M1.8 8s2.2-4.2 6.2-4.2S14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8z', 'M8 10.1a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z'],
      eyeOff: ['M2 2l12 12', 'M6.4 4.1A6.6 6.6 0 0 1 8 3.8c4 0 6.2 4.2 6.2 4.2a12 12 0 0 1-2 2.4', 'M4.2 5.3A11 11 0 0 0 1.8 8S4 12.2 8 12.2c.7 0 1.4-.1 2-.4'],
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
    const apiGraph = (sid, root, refs) => requestJson('/git-sidebar/api?op=graph&sid=' + q(sid) + (root ? '&root=' + q(root) : '') +
      (Array.isArray(refs) && refs.length > 0 ? '&refs=' + q(refs.join(',')) : ''), { method: 'GET' })
    const apiRead = (sid, op, root) => requestJson('/git-sidebar/api?op=' + op + '&sid=' + q(sid) + (root ? '&root=' + q(root) : ''), { method: 'GET' })
    const apiCommitDetail = (sid, root, commit) => requestJson('/git-sidebar/api?op=commitDetail&sid=' + q(sid) +
      (root ? '&root=' + q(root) : '') + '&commit=' + q(commit), { method: 'GET' })
    const apiCommitDiff = (sid, root, commit, path) => requestJson('/git-sidebar/api?op=commitDiff&sid=' + q(sid) +
      (root ? '&root=' + q(root) : '') + '&commit=' + q(commit) + '&path=' + q(path), { method: 'GET' })
    const apiDiff = (sid, path, staged, root) => requestJson('/git-sidebar/api?op=diff&sid=' + q(sid) +
      '&path=' + q(path) + '&staged=' + (staged ? '1' : '0') + (root ? '&root=' + q(root) : ''), { method: 'GET' })
    const apiWrite = (payload) => requestJson('/git-sidebar/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const GRAPH_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#39c5cf', '#ff7b72', '#a5d6ff']
    const graphColor = (lane) => GRAPH_COLORS[lane % GRAPH_COLORS.length]

    /** Stable colour per branch name, so a graph chip and its selector row share one colour. */
    function branchColor(name) {
      const text = String(name || '')
      let hash = 0
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) >>> 0
      }
      return GRAPH_COLORS[hash % GRAPH_COLORS.length]
    }

    /** `%D` decoration -> display text, chip kind, and the branch record it names. */
    function decorateGraphRef(ref, branchByName) {
      let text = String(ref || '')
      let kind = 'ref'
      if (text.startsWith('HEAD -> ')) {
        text = text.slice('HEAD -> '.length)
        kind = 'head'
      } else if (text === 'HEAD') {
        kind = 'head'
      } else if (text.startsWith('tag: ')) {
        text = text.slice('tag: '.length)
        kind = 'tag'
      }
      const branch = (branchByName && branchByName.get(text)) || null
      if (branch) {
        if (branch.current) kind = 'head'
        else if (branch.remote) kind = 'remote'
        else kind = 'local'
      }
      return { text, kind, branch }
    }

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
      const isMerge = (row.commit.parents || []).length > 1
      parts.push(h('circle', {
        key: 'node', cx: laneX(row.lane), cy, r: isMerge ? 4.8 : 3.4,
        fill: isMerge ? 'var(--dsw-alias-bg-base)' : graphColor(row.lane),
        stroke: graphColor(row.lane), strokeWidth: isMerge ? 2 : 1,
      }))
      if (isMerge) {
        parts.push(h('circle', { key: 'node-core', cx: laneX(row.lane), cy, r: 1.7, fill: graphColor(row.lane) }))
      }
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
    /** Group changed files by directory for the tree view. */
    function TreeChanges({ root, files, fileRow, changesOpen, expandedDirs, setExpandedDirs }) {
        const groups = new Map()
        for (const file of files) {
            const dir = splitPath(file.path).dir || '.'
            if (!groups.has(dir)) groups.set(dir, [])
            groups.get(dir).push(file)
        }
        const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
        return h('div', { className: 'gs-group' }, sorted.map(([dir, dirFiles]) => {
            const open = expandedDirs[dir] !== false
            return h('div', { key: dir, className: 'gs-tree-node' },
                h('div', {
                    className: 'gs-tree-dir', onClick: () => setExpandedDirs(Object.assign({}, expandedDirs, { [dir]: !open })),
                },
                    h('span', null, open ? '▾' : '▸'),
                    h('span', null, dir),
                    h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, '(' + dirFiles.length + ')')),
                open ? dirFiles.map((file) => fileRow(root, file, false)) : null)
        }))
    }

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
        const [hiddenRepos, setHiddenRepos] = useState([])
        const [repoPickerOpen, setRepoPickerOpen] = useState(false)
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
        const [reposOpen, setReposOpen] = useState(true)
        const [changesOpen, setChangesOpen] = useState(true)
        const [graphTick, setGraphTick] = useState(0)
        const [dialog, setDialog] = useState(null)
        const [gitOutput, setGitOutput] = useState(null)
        const [submenuOpen, setSubmenuOpen] = useState('')
        const [changesView, setChangesView] = useState('flat')
        const [changesSort, setChangesSort] = useState('path')
        const [expandedDirs, setExpandedDirs] = useState({})
        const [menuData, setMenuData] = useState({})
        const [commitMenu, setCommitMenu] = useState('')
        const [historyOpen, setHistoryOpen] = useState('')
        const [msgHistory, setMsgHistory] = useState({})
        const [commitDetail, setCommitDetail] = useState(null)
        const [changesFilter, setChangesFilter] = useState('')
        const [graphFilter, setGraphFilter] = useState('')
        /** root -> selected full ref names (`[]` = none, missing = all branches) */
        const [graphRefs, setGraphRefs] = useState({})
        /** root -> branch list from the last graph response, so the picker survives repo switches */
        const [branchCache, setBranchCache] = useState({})
        /** '' | 'repo' | 'branch' — which inline picker below the graph header is open */
        const [graphMenu, setGraphMenu] = useState('')
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
              // Older builds wrote `sections.* = false` when a section header was
              // collapsed, which hid the section for good. Until a build with the
              // fixed semantics re-saves these flags, treat them as visible.
              const migrated = saved.sectionsV2 === true
              setSections({
                repos: migrated ? saved.sections.repos !== false : true,
                changes: migrated ? saved.sections.changes !== false : true,
                graph: migrated ? saved.sections.graph !== false : true,
              })
            }
            if (Array.isArray(saved.included)) setIncluded(saved.included)
            if (Array.isArray(saved.hiddenRepos)) setHiddenRepos(saved.hiddenRepos)
            if (saved.graphRefs && typeof saved.graphRefs === 'object' && !Array.isArray(saved.graphRefs)) {
              setGraphRefs(saved.graphRefs)
            }
          }
        }, [persistKey])

        const persist = useCallback((patch) => {
          try {
            const current = JSON.parse(window.localStorage.getItem(persistKey) || '{}') || {}
            window.localStorage.setItem(persistKey, JSON.stringify(Object.assign({}, current, patch)))
          } catch { /* ignore */ }
        }, [persistKey])

        // ---------- commit message history (per session, per repository) ----------
        useEffect(() => {
          if (sid === '') return
          try {
            const raw = JSON.parse(window.localStorage.getItem('dsh-git-sidebar:msg-history:' + sid) || '{}')
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) setMsgHistory(raw)
          } catch { /* ignore */ }
        }, [sid])

        useEffect(() => {
          if (commitMenu === '' && historyOpen === '') return undefined
          const close = (event) => {
            const target = event.target
            if (target instanceof Element && typeof target.closest === 'function' &&
              (target.closest('.gs-commit-menu') || target.closest('.gs-commit-history') ||
               target.closest('.gs-commit-caret') || target.closest('.gs-commit-hist'))) return
            setCommitMenu('')
            setHistoryOpen('')
          }
          document.addEventListener('mousedown', close)
          return () => document.removeEventListener('mousedown', close)
        }, [commitMenu, historyOpen])

        const rememberMessage = useCallback((root, message) => {
          const text = String(message || '').trim()
          if (text === '' || !root) return
          setMsgHistory((current) => {
            const list = [text].concat((current[root] || []).filter((item) => item !== text)).slice(0, 20)
            const next = Object.assign({}, current, { [root]: list })
            try { window.localStorage.setItem('dsh-git-sidebar:msg-history:' + sid, JSON.stringify(next)) } catch { /* ignore */ }
            return next
          })
        }, [sid])

        /** Persist one repository's branch selection; `null` restores "all branches". */
        const applyGraphRefs = useCallback((root, refs) => {
          setGraphRefs((current) => {
            const next = Object.assign({}, current)
            if (refs === null) delete next[root]
            else next[root] = refs.slice()
            persist({ graphRefs: next })
            return next
          })
        }, [persist])

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

        const hiddenRepoSet = useMemo(() => new Set(hiddenRepos), [hiddenRepos])
        const visibleRepos = useMemo(() => sortedRepos.filter((repo) => !hiddenRepoSet.has(repo.path)), [sortedRepos, hiddenRepoSet])

        const activeRepo = useMemo(() => {
          if (activeRoot !== '') {
            const found = (repos || []).find((repo) => repo.path === activeRoot)
            // A hidden repository is not a valid active selection; fall through
            // to the first visible one so the list and changes stay in sync.
            if (found && !hiddenRepoSet.has(found.path)) return found
          }
          return visibleRepos[0] || sortedRepos[0] || null
        }, [repos, sortedRepos, visibleRepos, activeRoot, hiddenRepoSet])

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

        // Selected refs for the active repository: missing key = all branches,
        // [] = explicitly none, non-empty array = that exact subset.
        const graphEntry = activeRepo ? graphRefs[activeRepo.path] : undefined
        const graphEntryKey = !activeRepo ? '' : (Array.isArray(graphEntry) ? graphEntry.join(',') : '*all*')

        useEffect(() => {
          if (!sections.graph) return
          if (!activeRepo) { setGraph(null); return }
          const entry = graphRefs[activeRepo.path]
          const explicit = Array.isArray(entry)
          const refs = explicit && entry.length > 0 ? entry : undefined
          let cancelled = false
          apiGraph(sid, activeRepo.path, refs).then((result) => {
            if (cancelled) return
            if (result && result.ok) {
              const branches = Array.isArray(result.branches) ? result.branches : []
              if (branches.length > 0) {
                setBranchCache((current) => Object.assign({}, current, { [activeRepo.path]: branches }))
              }
              const valid = Array.isArray(result.refs) ? result.refs : []
              // 保存的分支可能已被删除：按服务端回执收敛，避免勾选状态与图形不一致
              if (explicit && entry.length > 0 && valid.join('\u0000') !== entry.join('\u0000')) {
                applyGraphRefs(activeRepo.path, valid.length > 0 ? valid : null)
              }
              setGraph({
                root: activeRepo.path,
                lines: explicit && entry.length === 0 ? [] : (result.lines || []),
                branches,
                head: result.head || '',
                refs: valid,
              })
            } else {
              setGraph({ root: activeRepo.path, lines: [], branches: [], head: '', refs: [] })
            }
          }).catch(() => {
            if (!cancelled) setGraph({ root: activeRepo.path, lines: [], branches: [], head: '', refs: [] })
          })
          return () => { cancelled = true }
        }, [sid, activeRepo, sections.graph, graphTick, graphEntryKey, applyGraphRefs])

        const graphData = useMemo(() => {
          const lines = graph && Array.isArray(graph.lines) ? graph.lines : []
          const needle = graphFilter.trim().toLowerCase()
          const visible = needle === '' ? lines : lines.filter((line) => {
            if (!line.hash) return true
            const hay = [line.subject, line.author, line.short, (line.refs || []).join(' ')].join(' ').toLowerCase()
            return hay.includes(needle)
          })
          return buildGraphRows(visible)
        }, [graph, graphFilter])

        /** Branch rows for the picker; falls back to the cached list while a repo's graph reloads. */
        const graphBranchList = useMemo(() => {
          const root = activeRepo ? activeRepo.path : ''
          const cached = root ? branchCache[root] : null
          if (Array.isArray(cached) && cached.length > 0) return cached
          return graph && graph.root === root && Array.isArray(graph.branches) ? graph.branches : []
        }, [activeRepo, branchCache, graph])

        const graphBranchByName = useMemo(() => {
          const map = new Map()
          for (const branch of graphBranchList) map.set(branch.name, branch)
          return map
        }, [graphBranchList])

        const graphExplicitRefs = Array.isArray(graphEntry) ? graphEntry : null
        const graphCurrentBranch = graphBranchList.find((branch) => branch.current) || null

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
              if (op === 'commit' || op === 'commitAll') {
                if (root === activeRoot) setMessage('')
                setMessages((current) => Object.assign({}, current, { [root]: '' }))
                rememberMessage(root, extra && extra.message)
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
        }, [sid, activeRoot, mode, refreshRepos, refreshInfo, refreshMulti, tr, rememberMessage])

        // Fetch lazy menu data (stashes/tags/worktrees/remotes) per root
        const loadMenuData = useCallback(async (root, kind) => {
          try {
            const result = await apiRead(sid, kind, root)
            if (result && result.ok) {
              setMenuData((current) => Object.assign({}, current, { [root + ':' + kind]: result }))
            }
          } catch { /* best effort */ }
        }, [sid])

        // Run a write op for a root then refresh panel state
        const runGitOp = useCallback(async (root, op, extra) => {
          setBusy(true)
          setError('')
          setNotice('')
          try {
            const result = await apiWrite(Object.assign({ op, sid }, root ? { root } : {}, extra || {}))
            if (result && result.ok) {
              setNotice(tr('msg.' + op) || result.message || 'ok')
              await refreshRepos()
              if (root === activeRoot || !root) await refreshInfo(activeRoot)
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

        // Open a simple input dialog
        const openDialog = useCallback((title, fields, submit) => {
          setDialog({ title, fields, submit, values: fields.map((field) => field.value || '') })
        }, [])

        const submitDialog = useCallback(() => {
          if (dialog === null) return
          const values = {}
          dialog.fields.forEach((field, index) => { values[field.key] = dialog.values[index] })
          setDialog(null)
          dialog.submit(values)
        }, [dialog])

        const showGitOutput = useCallback(async () => {
          setGitOutput({ open: true, entries: null })
          try {
            const result = await apiRead(sid, 'gitlog')
            setGitOutput({ open: true, entries: result && result.ok ? result.entries : [] })
          } catch {
            setGitOutput({ open: true, entries: [] })
          }
        }, [sid])

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
          setGraphMenu('')
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

        const applyHiddenRepos = useCallback((next) => {
          setHiddenRepos(next)
          persist({ hiddenRepos: next })
          if (next.includes(activeRoot)) {
            const fallback = sortedRepos.find((repo) => !next.includes(repo.path))
            const root = fallback ? fallback.path : ''
            setActiveRoot(root)
            persist({ activeRoot: root })
            setInfo(null)
            setGraph(null)
          }
        }, [activeRoot, sortedRepos, persist])

        const toggleRepoHidden = (repo) => {
          const next = hiddenRepos.includes(repo.path)
            ? hiddenRepos.filter((path) => path !== repo.path)
            : hiddenRepos.concat([repo.path])
          applyHiddenRepos(next)
        }

        const showAllRepos = () => {
          setHiddenRepos([])
          persist({ hiddenRepos: [] })
        }

        const hideCleanRepos = () => {
          const next = sortedRepos
            .filter((repo) => ((repo.counts && repo.counts.total) || 0) === 0)
            .map((repo) => repo.path)
          applyHiddenRepos(next)
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
          persist({ sections: next, sectionsV2: true })
          if (key === 'graph' && sections.graph) setGraphMenu('')
        }

        // ---------- graph branch selection ----------

        /** 勾选/取消一个分支；`all` 形态先物化成整份列表再取消，避免「全选却只收到一个」 */
        const toggleGraphBranch = (branch) => {
          if (!activeRepo) return
          const all = graphBranchList.map((item) => item.full)
          let next
          if (graphExplicitRefs === null) {
            next = all.filter((full) => full !== branch.full)
          } else {
            next = graphExplicitRefs.includes(branch.full)
              ? graphExplicitRefs.filter((full) => full !== branch.full)
              : graphExplicitRefs.concat([branch.full])
          }
          applyGraphRefs(activeRepo.path, next.length === all.length ? null : next)
        }

        const selectAllGraphBranches = () => {
          if (activeRepo) applyGraphRefs(activeRepo.path, null)
        }

        const selectCurrentGraphBranch = () => {
          if (activeRepo && graphCurrentBranch) applyGraphRefs(activeRepo.path, [graphCurrentBranch.full])
        }

        /** 只保留一个分支，用它把图形收窄到该分支的历史 */
        const focusGraphBranch = (branch) => {
          if (!activeRepo) return
          applyGraphRefs(activeRepo.path, [branch.full])
        }

        /** 只看本地或只看远程：一键把另一组的 ref 全部排除，省得逐条取消 20+ 个远端分支 */
        const selectGraphBranchKind = (remote) => {
          if (!activeRepo) return
          const refs = graphBranchList.filter((branch) => branch.remote === remote).map((branch) => branch.full)
          applyGraphRefs(activeRepo.path, refs.length === graphBranchList.length ? null : refs)
        }

        // ---------- render pieces ----------
        // `open` is the section's collapse state; the ⋯ menu still owns whether the
        // whole section is shown at all (`sections.*`), so collapsing must not hide the header.
        const sectionHead = (key, title, count, actions, open, onToggle) => h('div', { className: 'gs-group-head' },
          h('button', {
            type: 'button', className: 'gs-ibtn', style: { width: '16px', height: '16px' },
            title, onClick: onToggle,
          }, h(Glyph, { d: open ? ICON.chevronDown : ICON.chevronRight, size: 12 })),
          h('span', { className: 'gs-group-title', onClick: onToggle }, title,
            h('span', { className: 'gs-count' }, String(count))),
          h('span', { className: 'gs-group-actions' }, actions || null))

        // ---------- rich git action menu ----------
        const menuItem = (id, label, action, opts) => Object.assign({ id, label, action }, opts || {})
        const menuSep = () => ({ id: 'sep-' + Math.random().toString(36).slice(2, 6), separator: true })

        const buildRepoMenu = (root) => {
          const items = []
          items.push(menuItem('pull', tr('git.pull'), () => runGitOp(root, 'pull')))
          items.push(menuItem('push', tr('git.push'), () => runGitOp(root, 'push')))
          items.push(menuItem('checkout', tr('git.checkout'), () => { setRowMenu(''); setBranchMenu(root); setBranchForm(false) }))
          items.push(menuItem('fetch', tr('git.fetch'), () => runGitOp(root, 'fetch')))
          items.push(menuSep())

          items.push({
            id: 'commit-group', label: tr('git.commitGroup'), children: [
              menuItem('commit-staged', tr('git.commitStaged'), () => {
                setRowMenu('')
                openDialog(tr('git.commitStaged'), [{ key: 'message', label: tr('dialog.commitMsg') }], (values) => {
                  if (values.message && values.message.trim()) runGitOp(root, 'commit', { message: values.message })
                })
              }),
              menuItem('commit-all', tr('git.commitAll'), () => {
                setRowMenu('')
                openDialog(tr('git.commitAll'), [{ key: 'message', label: tr('dialog.commitMsg') }], (values) => {
                  if (values.message && values.message.trim()) runGitOp(root, 'commitAll', { message: values.message })
                })
              }),
            ],
          })

          items.push({
            id: 'changes-group', label: tr('git.changesGroup'), children: [
              menuItem('stage-all', tr('git.stageAll'), () => runGitOp(root, 'stageAll')),
              menuItem('unstage-all', tr('git.unstageAll'), () => runGitOp(root, 'unstageAll')),
              menuItem('discard-all', tr('git.discardAll'), () => {
                if (typeof window !== 'undefined' && !window.confirm(tr('confirm.discardAll'))) return
                runGitOp(root, 'discardAll')
              }, { danger: true }),
            ],
          })

          items.push({
            id: 'pullpush-group', label: tr('git.pullPushGroup'), children: [
              menuItem('pp-pull', tr('git.pull'), () => runGitOp(root, 'pull')),
              menuItem('pp-push', tr('git.push'), () => runGitOp(root, 'push')),
              menuItem('pp-sync', tr('git.sync'), () => runGitOp(root, 'sync')),
              menuItem('pp-fetch', tr('git.fetch'), () => runGitOp(root, 'fetch')),
            ],
          })

          items.push({
            id: 'branch-group', label: tr('git.branchGroup'), children: [
              menuItem('b-checkout', tr('git.checkout'), () => { setRowMenu(''); setBranchMenu(root); setBranchForm(false) }),
              menuItem('b-new', tr('git.newBranch'), () => { setRowMenu(''); setBranchMenu(root); setBranchForm(true) }),
            ],
          })

          items.push({
            id: 'remote-group', label: tr('git.remoteGroup'), children: [
              { id: 'remote-list', placeholder: tr('git.noRemotes'), load: 'remotes', render: (remotes) => remotes.remotes.map((remote) => ({
                id: 'remote-' + remote.name, label: remote.name, meta: true,
                action: () => { setRowMenu(''); setNotice(remote.name + ': ' + (remote.fetch || remote.push)) },
              })) },
            ],
          })

          items.push({
            id: 'stash-group', label: tr('git.stashGroup'), children: [
              menuItem('stash-push', tr('git.stashPush'), () => runGitOp(root, 'stashPush')),
              menuItem('stash-pop', tr('git.stashPop'), () => runGitOp(root, 'stashPop')),
              { id: 'stash-list', placeholder: tr('git.noStashes'), load: 'stashes', render: (data) => (data.stashes || []).map((stash) => ({
                id: 'stash-' + stash.index,
                label: stash.ref + ' ' + String(stash.subject || '').slice(0, 40),
                action: () => runGitOp(root, 'stashPop', { index: stash.index }),
                deleteAction: () => {
                  if (typeof window !== 'undefined' && !window.confirm(tr('confirm.stashDrop'))) return
                  runGitOp(root, 'stashDrop', { index: stash.index })
                },
              })) },
            ],
          })

          items.push({
            id: 'tag-group', label: tr('git.tagGroup'), children: [
              menuItem('tag-create', tr('git.tagCreate'), () => {
                setRowMenu('')
                openDialog(tr('git.tagCreate'), [{ key: 'name', label: tr('dialog.tagName') }], (values) => {
                  if (values.name && values.name.trim()) runGitOp(root, 'tagCreate', { name: values.name.trim() })
                })
              }),
              { id: 'tag-list', placeholder: tr('git.noTags'), load: 'tags', render: (data) => (data.tags || []).slice(0, 20).map((tag) => ({
                id: 'tag-' + tag.name,
                label: tag.name,
                meta: true,
                action: () => { setRowMenu(''); setNotice(tag.name + ' → ' + tag.short) },
                deleteAction: () => {
                  if (typeof window !== 'undefined' && !window.confirm(tr('confirm.tagDelete') + ' ' + tag.name)) return
                  runGitOp(root, 'tagDelete', { name: tag.name })
                },
              })) },
            ],
          })

          items.push({
            id: 'worktree-group', label: tr('git.worktreeGroup'), children: [
              { id: 'worktree-list', placeholder: tr('git.noWorktrees'), load: 'worktrees', render: (data) => (data.worktrees || []).map((worktree) => ({
                id: 'worktree-' + worktree.path, label: worktree.branch || worktree.path, meta: true,
                action: () => { setRowMenu(''); setNotice(worktree.path) },
              })) },
              menuItem('worktree-add', tr('git.worktreeAdd'), () => {
                setRowMenu('')
                openDialog(tr('git.worktreeAdd'), [{ key: 'path', label: tr('dialog.worktreePath') }, { key: 'branch', label: tr('dialog.branchName') }], (values) => {
                  if (values.path && values.path.trim()) runGitOp(root, 'worktreeAdd', { path: values.path.trim(), branch: (values.branch || '').trim() })
                })
              }),
            ],
          })

          items.push(menuSep())
          items.push(menuItem('clone', tr('git.clone'), () => {
            setRowMenu('')
            openDialog(tr('git.clone'), [{ key: 'url', label: tr('dialog.cloneUrl') }, { key: 'dir', label: tr('dialog.cloneDir') }], (values) => {
              if (values.url && values.dir) runGitOp(root, 'clone', { url: values.url.trim(), dir: values.dir.trim() })
            })
          }))
          items.push(menuItem('output', tr('git.output'), () => { setRowMenu(''); showGitOutput() }))
          return items
        }

        const renderMenuItems = (items, prefix) => items.map((item) => {
          if (item.separator === true) return h('div', { key: item.id, className: 'gs-menu-sep' })
          if (item.children !== undefined) {
            const open = submenuOpen === (prefix || '') + item.id
            return h('div', { key: item.id },
              h('button', {
                type: 'button', className: 'gs-sub-trigger',
                onClick: () => {
                  setSubmenuOpen(open ? '' : (prefix || '') + item.id)
                  const lazy = item.children.find((child) => child.load !== undefined)
                  if (lazy !== undefined && activeRepo) loadMenuData(activeRepo.path, lazy.load)
                },
              }, item.label, h('span', { className: 'gs-sub-arrow' }, open ? '▾' : '▸')),
              open ? h('div', { className: 'gs-sub-items' }, renderMenuItems(item.children, (prefix || '') + item.id + '/')) : null)
          }
          if (item.load !== undefined) {
            const data = activeRepo ? menuData[activeRepo.path + ':' + item.load] : null
            if (data === undefined || data === null) {
              return h('div', { key: item.id, className: 'gs-meta-line' }, '…')
            }
            const rendered = item.render(data)
            if (rendered.length === 0) return h('div', { key: item.id, className: 'gs-meta-line' }, item.placeholder)
            return h('div', { key: item.id }, rendered.map((child) => h('div', {
              key: child.id, style: { display: 'flex', alignItems: 'center', gap: 2 },
            },
              h('button', { type: 'button', className: 'gs-menu-item', style: { flex: '1 1 auto', minWidth: 0 }, onClick: () => { setRowMenu(''); setSubmenuOpen(''); child.action() } },
                h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, child.label)),
              child.deleteAction !== undefined ? h('button', {
                type: 'button', className: 'gs-gtool', style: { flex: '0 0 auto', color: 'var(--dsw-alias-state-error-primary)' }, title: tr('action.discard'),
                onClick: () => { setRowMenu(''); setSubmenuOpen(''); child.deleteAction() },
              }, '✕') : null)))
          }
          return h('button', {
            key: item.id, type: 'button',
            className: 'gs-menu-item' + (item.danger ? ' gs-danger' : ''),
            onClick: () => { setRowMenu(''); setSubmenuOpen(''); if (item.action) item.action() },
          }, item.label)
        })

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
                h('div', { className: 'gs-menu-label' }, tr('action.branches') + ((info.branches || []).length > 0 ? ' · ' + info.branches.length : '')),
                h('div', { className: 'gs-menu-scroll' },
                  (info.branches || []).map((branch) => h('button', {
                    key: branch.name, type: 'button', className: 'gs-menu-item',
                    onClick: () => {
                      setBranchMenu('')
                      if (branch.current) return
                      if (typeof window !== 'undefined' && !window.confirm(tr('confirm.checkout') + '\n' + branch.name)) return
                      act(repo.path, 'checkout', { branch: branch.name })
                    },
                  }, h('span', { className: 'gs-menu-check' }, branch.current ? '✓' : ''), branch.name))),
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
              ? h('div', { className: 'gs-row-menu', style: { maxHeight: 'min(400px, 70vh)', overflowY: 'auto' } },
                renderMenuItems(buildRepoMenu(repo.path), ''))
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

        const commitBox = (root, value, onChange, target, branch) => {
          const counts = (target && target.counts) || {}
          const stagedCount = counts.staged || 0
          const totalCount = counts.total || 0
          const history = msgHistory[root] || []
          const menuOpen = commitMenu === root
          const historyVisible = historyOpen === root
          const canCommit = value.trim() !== '' && stagedCount > 0
          const run = (op, extra) => { setCommitMenu(''); act(root, op, Object.assign({ message: value }, extra || {})) }
          const commitAndPush = async () => {
            setCommitMenu('')
            if (!canCommit) return
            setBusy(true)
            setError('')
            setNotice('')
            try {
              const committed = await apiWrite({ op: 'commit', sid, root, message: value })
              if (!committed || !committed.ok) {
                setError((committed && (committed.message || committed.error)) || 'commit failed')
                return
              }
              rememberMessage(root, value)
              if (root === activeRoot) setMessage('')
              setMessages((current) => Object.assign({}, current, { [root]: '' }))
              const pushed = await apiWrite({ op: 'push', sid, root })
              if (!pushed || !pushed.ok) setError((pushed && (pushed.message || pushed.error)) || 'push failed')
              else setNotice(tr('msg.commit') + ' · ' + tr('msg.push'))
              setGraphTick((tick) => tick + 1)
              await refreshRepos()
              await refreshInfo(root === activeRoot ? root : activeRoot)
              if (mode === 'multiple') await refreshMulti()
            } catch (err) {
              setError(String((err && err.message) || err))
            } finally {
              setBusy(false)
            }
          }
          return h('div', { className: 'gs-commit' },
            h('div', { className: 'gs-commit-wrap' },
              h('textarea', {
                className: 'gs-commit-input', rows: 3,
                placeholder: String(tr('commit.placeholder')).replace('{branch}', branch || 'HEAD'),
                value, disabled: busy,
                onChange: (event) => onChange(event.target.value),
                onKeyDown: (event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault()
                    if (canCommit) act(root, 'commit', { message: value })
                  }
                },
              }),
              h('button', {
                type: 'button', className: 'gs-commit-hist', title: tr('commit.history'),
                onClick: () => { setHistoryOpen(historyVisible ? '' : root); setCommitMenu('') },
              }, h(Glyph, { d: ICON.clock, size: 11 })),
              historyVisible
                ? h('div', { className: 'gs-commit-history' },
                  history.length === 0
                    ? h('div', { className: 'gs-meta-line' }, tr('commit.noHistory'))
                    : history.slice(0, 10).map((item, at) => h('button', {
                      key: at, type: 'button', className: 'gs-menu-item', title: item,
                      onClick: () => { onChange(item); setHistoryOpen('') },
                    }, item)))
                : null),
            h('div', { className: 'gs-commit-bar' },
              menuOpen
                ? h('div', { className: 'gs-commit-menu' },
                  h('button', { type: 'button', className: 'gs-menu-item', disabled: !canCommit, onClick: () => run('commit') }, tr('action.commit')),
                  h('button', { type: 'button', className: 'gs-menu-item', disabled: busy || value.trim() === '' || totalCount === 0, onClick: () => run('commitAll') }, tr('git.commitAll')),
                  h('button', { type: 'button', className: 'gs-menu-item', disabled: !canCommit, onClick: commitAndPush }, tr('commit.commitPush')),
                  h('div', { className: 'gs-menu-sep' }),
                  h('button', { type: 'button', className: 'gs-menu-item', disabled: busy, onClick: () => run('commit', { amend: true }) }, tr('commit.amend')),
                  h('button', { type: 'button', className: 'gs-menu-item', disabled: busy, onClick: () => { setCommitMenu(''); act(root, 'undoCommit') } }, tr('commit.undo')))
                : null,
              h('div', { className: 'gs-commit-split' },
                h('button', {
                  type: 'button', className: 'gs-primary gs-commit-main',
                  disabled: busy || !canCommit,
                  title: stagedCount === 0 ? tr('commit.noStaged') : tr('action.commit'),
                  onClick: () => act(root, 'commit', { message: value }),
                }, h(Glyph, { d: ICON.check, size: 12 }), tr('action.commit')),
                h('button', {
                  type: 'button', className: 'gs-primary gs-commit-caret',
                  disabled: busy, title: tr('commit.menuTitle'),
                  onClick: () => { setCommitMenu(menuOpen ? '' : root); setHistoryOpen('') },
                }, h(Glyph, { d: ICON.chevronDown, size: 10 })))))
        }

        const changesBlock = (root, target, messageValue, setMessageValue) => {
          const files = target.files || []
          const counts = target.counts || { staged: 0, changed: 0, untracked: 0, total: 0 }
          const branch = target.detached ? tr('detached') : (target.branch || '')
          const needle = changesFilter.trim().toLowerCase()
          const match = (file) => needle === '' || String(file.path || '').toLowerCase().includes(needle)
          const stagedFiles = files.filter((file) => file.staged && match(file))
          const workingFiles = files.filter((file) => !file.staged && match(file))
          return h('div', { className: 'gs-sub', key: 'changes:' + root },
            commitBox(root, messageValue || '', setMessageValue, target, branch),
            files.length > 0
              ? h('div', { className: 'gs-filter-wrap' },
                h('input', {
                  className: 'gs-filter', placeholder: tr('search.changes'), value: changesFilter,
                  onChange: (event) => setChangesFilter(event.target.value),
                }),
                changesFilter !== ''
                  ? h('button', { type: 'button', className: 'gs-gtool', title: tr('search.clear'), onClick: () => setChangesFilter('') }, '✕')
                  : null)
              : null,
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
            files.length === 0 && counts.total === 0
              ? h('div', { className: 'gs-clean' }, h(Glyph, { d: ICON.check, size: 12 }), tr('empty.clean'))
              : files.length > 0 && workingFiles.length === 0 && stagedFiles.length === 0
                ? h('div', { className: 'gs-empty' }, tr('search.noMatch'))
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

        const repoPickerPanel = sections.repos && repoPickerOpen && (repos || []).length > 0
          ? h('div', { className: 'gs-gpanel' },
            h('div', { className: 'gs-gpanel-quick' },
              h('button', { type: 'button', className: 'gs-btn', onClick: showAllRepos }, tr('repos.showAll')),
              h('button', { type: 'button', className: 'gs-btn', onClick: hideCleanRepos }, tr('repos.onlyChanged'))),
            sortedRepos.map((repo) => {
              const visible = !hiddenRepoSet.has(repo.path)
              return h('button', {
                key: repo.path, type: 'button', className: 'gs-menu-item', title: repo.path,
                onClick: () => toggleRepoHidden(repo),
              },
                h('span', { className: 'gs-cb' + (visible ? ' gs-cb-on' : '') },
                  visible ? h(Glyph, { d: ICON.check, size: 9 }) : null),
                h('span', { className: 'gs-gbranch-name' }, repo.name),
                h('span', { className: 'gs-ab' }, String((repo.counts && repo.counts.total) || 0)))
            }))
          : null

        const reposSection = sections.repos
          ? h('div', { className: 'gs-group', key: 'repos' },
            sectionHead('repos', tr('section.repos'),
              (repos || []).length > 0 && visibleRepos.length !== (repos || []).length
                ? visibleRepos.length + '/' + (repos || []).length
                : (repos || []).length,
              h('span', { className: 'gs-group-actions' },
                iconButton(repoPickerOpen ? 'eyeOff' : 'eye', tr('repos.manage'), () => setRepoPickerOpen((open) => !open)),
                iconButton('refresh', tr('action.refresh'), refreshRepos, busy)),
              reposOpen, () => setReposOpen((open) => !open)),
            reposOpen
              ? h(React.Fragment, null,
                repoPickerPanel,
                loading && repos === null
                  ? h('div', { className: 'gs-empty' }, tr('empty.loading'))
                  : (repos || []).length === 0
                    ? h('div', { className: 'gs-empty' }, reposError || tr('empty.noRepos'))
                    : visibleRepos.length === 0
                      ? h('div', { className: 'gs-empty' },
                        h('span', null, tr('repos.hiddenAll')),
                        h('button', {
                          type: 'button', className: 'gs-btn', style: { marginLeft: '6px' },
                          onClick: showAllRepos,
                        }, tr('repos.showAll')))
                      : visibleRepos.map(repoRow))
              : null)
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
          if (changesView === 'tree') {
            changesBody = h('div', { className: 'gs-sub', key: 'active-tree' },
              commitBox(activeRepo.path, message, setMessage, info, info.detached ? tr('detached') : info.branch),
              h(TreeChanges, {
                root: activeRepo.path,
                files: (info.files || []).filter((file) => changesFilter.trim() === '' || String(file.path || '').toLowerCase().includes(changesFilter.trim().toLowerCase())),
                fileRow, changesOpen, expandedDirs, setExpandedDirs,
              }))
          } else {
            changesBody = h('div', { className: 'gs-sub', key: 'active' }, changesBlock(activeRepo.path, info, message, setMessage))
          }
        } else {
          changesBody = h('div', { className: 'gs-empty' }, tr('empty.loading'))
        }

        const changesSection = sections.changes
          ? h('div', { className: 'gs-group', key: 'changes' },
            sectionHead('changes', tr('section.changes'),
              mode === 'multiple'
                ? Object.keys(multi).reduce((sum, root) => sum + ((multi[root] && multi[root].counts) ? multi[root].counts.total : 0), 0)
                : (info && info.counts ? info.counts.total : 0),
              h('span', { className: 'gs-group-actions' },
                iconButton(changesView === 'tree' ? 'branch' : 'more', changesView === 'tree' ? tr('view.tree') : tr('view.list'),
                  () => setChangesView((view) => view === 'tree' ? 'flat' : 'tree'), busy),
                iconButton('more', tr('action.menu'),
                  () => setRowMenu(activeRepo ? rowMenu === activeRepo.path ? '' : activeRepo.path : ''), busy)),
              changesOpen, () => setChangesOpen((open) => !open)),
            changesOpen ? changesBody : null)
          : null

        const toggleGraphOpen = () => {
          if (graphOpen) setGraphMenu('')
          setGraphOpen(!graphOpen)
        }

        const graphToolbar = graphOpen && activeRepo
          ? h('div', { className: 'gs-gtoolbar' },
            h('button', {
              type: 'button',
              className: 'gs-gpick' + (graphMenu === 'repo' ? ' gs-gpick-on' : ''),
              title: tr('graph.selectRepo') + ': ' + activeRepo.path,
              onClick: () => setGraphMenu(graphMenu === 'repo' ? '' : 'repo'),
            },
              h(Glyph, { d: ICON.repo, size: 11 }),
              h('span', { className: 'gs-gpick-label' }, activeRepo.name),
              h(Glyph, { d: ICON.chevronDown, size: 10 })),
            h('button', {
              type: 'button',
              className: 'gs-gpick' + (graphMenu === 'branch' ? ' gs-gpick-on' : ''),
              title: tr('graph.selectBranches') + (graphBranchList.length > 0 ? ' · ' + graphBranchList.length : ''),
              onClick: () => setGraphMenu(graphMenu === 'branch' ? '' : 'branch'),
            },
              h(Glyph, { d: ICON.branch, size: 11 }),
              h('span', { className: 'gs-gpick-label' },
                tr('graph.branchPicker') + ' · ' + (graphBranchList.length === 0
                  ? tr('graph.noBranches')
                  : graphExplicitRefs === null
                    ? tr('graph.branchAll')
                    : graphExplicitRefs.length + '/' + graphBranchList.length)),
              h(Glyph, { d: ICON.chevronDown, size: 10 })),
            h('span', { className: 'gs-gtools' },
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('git.checkout'),
                disabled: busy || !activeRepo, onClick: () => { setBranchMenu(activeRepo ? activeRepo.path : ''); setBranchForm(false) },
              }, h(Glyph, { d: ICON.branch, size: 13 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('git.fetch'),
                disabled: busy || !activeRepo, onClick: () => activeRepo && runGitOp(activeRepo.path, 'fetch'),
              }, h(Glyph, { d: ICON.fetch || ICON.sync, size: 13 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('git.pull'),
                disabled: busy || !activeRepo, onClick: () => activeRepo && runGitOp(activeRepo.path, 'pull'),
              }, h(Glyph, { d: ICON.pull || ICON.sync, size: 13 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('git.push'),
                disabled: busy || !activeRepo, onClick: () => {
                  if (!activeRepo) return
                  if (typeof window !== 'undefined' && !window.confirm(tr('confirm.push'))) return
                  runGitOp(activeRepo.path, 'push')
                },
              }, h(Glyph, { d: ICON.push || ICON.sync, size: 13 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('action.refresh'),
                disabled: busy, onClick: () => { setGraphTick((tick) => tick + 1); refreshRepos(); if (activeRepo) refreshInfo(activeRepo.path) },
              }, h(Glyph, { d: ICON.refresh, size: 13 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('action.menu'),
                disabled: !activeRepo, onClick: () => setRowMenu(activeRepo ? rowMenu === activeRepo.path ? '' : activeRepo.path : ''),
              }, h(Glyph, { d: ICON.more, size: 13 }))))
          : null

        // 存储库下拉：图形视图内直接切仓库，等价于点上方「存储库」列表
        const graphRepoPanel = graphOpen && graphMenu === 'repo'
          ? h('div', { className: 'gs-gpanel' },
            sortedRepos.map((repo) => h('button', {
              key: repo.path, type: 'button', className: 'gs-menu-item', title: repo.path,
              onClick: () => selectRepo(repo),
            },
              h('span', { className: 'gs-menu-check' }, activeRepo && activeRepo.path === repo.path ? '✓' : ''),
              h('span', { className: 'gs-gpick-label' }, repo.name),
              h('span', { className: 'gs-ab' }, repo.branch || ''))))
          : null

        const graphLocalBranches = graphBranchList.filter((branch) => !branch.remote)
        const graphRemoteBranches = graphBranchList.filter((branch) => branch.remote)

        const graphBranchRow = (branch) => {
          const checked = graphExplicitRefs === null || graphExplicitRefs.includes(branch.full)
          return h('div', { key: branch.full, className: 'gs-gbrow' },
            h('button', {
              type: 'button', className: 'gs-gbtoggle', title: branch.full,
              onClick: () => toggleGraphBranch(branch),
            },
              h('span', { className: 'gs-cb' + (checked ? ' gs-cb-on' : '') },
                checked ? h(Glyph, { d: ICON.check, size: 9 }) : null),
              h('span', { className: 'gs-gdot', style: { background: branchColor(branch.name) } }),
              h('span', { className: 'gs-gbranch-name' }, branch.name),
              branch.current ? h('span', { className: 'gs-gbranch-head' }, 'HEAD') : null,
              h('span', { className: 'gs-gbranch-tip' }, String(branch.tip || '').slice(0, 7))),
            h('button', {
              type: 'button', className: 'gs-gfocus', title: tr('graph.focus'),
              onClick: () => focusGraphBranch(branch),
            }, '⌖'))
        }

        // 分支多选：全部 / 仅当前分支 + 本地/远程两组逐条勾选（勾选行带颜色点，与图形里的 ref 胶囊同色）
        const graphBranchPanel = graphOpen && graphMenu === 'branch'
          ? h('div', { className: 'gs-gpanel' },
            h('div', { className: 'gs-gpanel-quick' },
              h('button', {
                type: 'button', className: 'gs-btn', disabled: graphExplicitRefs === null,
                onClick: selectAllGraphBranches,
              }, tr('graph.allBranches')),
              h('button', {
                type: 'button', className: 'gs-btn', disabled: graphCurrentBranch === null,
                onClick: selectCurrentGraphBranch,
              }, tr('graph.currentOnly')),
              h('button', {
                type: 'button', className: 'gs-btn', disabled: graphLocalBranches.length === 0,
                onClick: () => selectGraphBranchKind(false),
              }, tr('graph.localOnly')),
              h('button', {
                type: 'button', className: 'gs-btn', disabled: graphRemoteBranches.length === 0,
                onClick: () => selectGraphBranchKind(true),
              }, tr('graph.remoteOnly'))),
            graphLocalBranches.length > 0
              ? h('div', null,
                h('div', { className: 'gs-menu-label' }, tr('graph.localBranches') + ' · ' + graphLocalBranches.length),
                ...graphLocalBranches.map(graphBranchRow))
              : null,
            graphRemoteBranches.length > 0
              ? h('div', null,
                h('div', { className: 'gs-menu-label' }, tr('graph.remoteBranches') + ' · ' + graphRemoteBranches.length),
                ...graphRemoteBranches.map(graphBranchRow))
              : null)
          : null

        // 图例：当前参与绘图的每个分支一个彩色胶囊，点开可继续勾选
        const selectedGraphBranches = graphBranchList.filter((branch) => graphExplicitRefs === null || graphExplicitRefs.includes(branch.full))
        const graphLegend = graphOpen && activeRepo && selectedGraphBranches.length > 0
          ? h('div', { className: 'gs-glegend' },
            selectedGraphBranches.slice(0, 6).map((branch) => h('button', {
              key: branch.full, type: 'button', className: 'gs-gchip',
              style: { color: branchColor(branch.name), borderColor: branchColor(branch.name) },
              title: branch.full,
              onClick: () => setGraphMenu('branch'),
            },
              h('span', { className: 'gs-gdot', style: { background: branchColor(branch.name) } }),
              h('span', { className: 'gs-gpick-label' }, branch.name))),
            selectedGraphBranches.length > 6
              ? h('span', { className: 'gs-gmore', title: selectedGraphBranches.slice(6).map((b) => b.name).join(', ') }, '+' + (selectedGraphBranches.length - 6))
              : null)
          : null

        // ---------- commit details (VS Code-style: click a commit to inspect) ----------
        const toggleCommitDetail = async (root, hash) => {
          if (commitDetail !== null && commitDetail.hash === hash && !commitDetail.loading) {
            setCommitDetail(null)
            return
          }
          setCommitDetail({ hash, loading: true, data: null, files: [], diff: null })
          try {
            const result = await apiCommitDetail(sid, root, hash)
            if (result && result.ok) {
              setCommitDetail({ hash, loading: false, data: result.commit, files: result.files || [], diff: null })
            } else {
              setCommitDetail({ hash, loading: false, data: null, files: [], diff: null, error: (result && (result.message || result.error)) || 'failed' })
            }
          } catch (err) {
            setCommitDetail({ hash, loading: false, data: null, files: [], diff: null, error: String((err && err.message) || err) })
          }
        }

        const openCommitFile = async (root, hash, path) => {
          setCommitDetail((current) => (current !== null && current.hash === hash)
            ? Object.assign({}, current, { diff: { path, loading: true } })
            : current)
          try {
            const result = await apiCommitDiff(sid, root, hash, path)
            setCommitDetail((current) => (current !== null && current.hash === hash)
              ? Object.assign({}, current, { diff: { path, loading: false, text: (result && result.diff) || '', truncated: !!(result && result.truncated) } })
              : current)
          } catch (err) {
            setCommitDetail((current) => (current !== null && current.hash === hash)
              ? Object.assign({}, current, { diff: { path, loading: false, error: String((err && err.message) || err) } })
              : current)
          }
        }

        const renderCommitDetail = (root) => {
          const detail = commitDetail
          if (detail === null) return null
          if (detail.loading) return h('div', { className: 'gs-cdetail' }, h('div', { className: 'gs-diff-note' }, tr('commit.detailLoading')))
          if (detail.error) return h('div', { className: 'gs-cdetail' }, h('div', { className: 'gs-diff-note' }, detail.error))
          const data = detail.data || {}
          const when = data.at ? new Date(data.at).toLocaleString() : ''
          return h('div', { className: 'gs-cdetail' },
            h('div', { className: 'gs-cdetail-head' },
              h('span', { className: 'gs-cdetail-hash' }, data.short || ''),
              h('span', { className: 'gs-cdetail-meta' }, (data.author || '') + (when ? ' · ' + when : '')),
              h('span', { style: { flex: '1 1 auto' } }),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('commit.detailCheckout'),
                onClick: () => {
                  if (typeof window !== 'undefined' && !window.confirm(tr('confirm.checkoutCommit'))) return
                  act(root, 'checkoutCommit', { commit: data.hash })
                },
              }, h(Glyph, { d: ICON.branch, size: 12 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('commit.detailBranch'),
                onClick: () => openDialog(tr('commit.detailBranch'), [{ key: 'name', label: tr('dialog.branchName') }], (values) => {
                  if (values.name && values.name.trim()) act(root, 'createBranch', { branch: values.name.trim(), commit: data.hash })
                }),
              }, h(Glyph, { d: ICON.plus, size: 12 })),
              h('button', {
                type: 'button', className: 'gs-gtool', title: tr('commit.detailTag'),
                onClick: () => openDialog(tr('commit.detailTag'), [{ key: 'name', label: tr('dialog.tagName') }], (values) => {
                  if (values.name && values.name.trim()) act(root, 'tagCreate', { name: values.name.trim(), commit: data.hash })
                }),
              }, h(Glyph, { d: ICON.cloud, size: 12 }))),
            h('div', { className: 'gs-cdetail-msg' }, data.message || ''),
            h('div', { className: 'gs-cdetail-files' },
              detail.files.length === 0
                ? h('div', { className: 'gs-meta-line' }, tr('commit.detailNoFiles'))
                : detail.files.map((file) => h('button', {
                  key: file.path, type: 'button', className: 'gs-cdetail-file', title: file.path,
                  onClick: () => openCommitFile(root, data.hash, file.path),
                },
                  h('span', { className: 'gs-cdetail-path' }, file.path),
                  h('span', { className: 'gs-cdetail-add' }, file.binary ? 'bin' : '+' + file.add),
                  h('span', { className: 'gs-cdetail-del' }, file.binary ? '' : '-' + file.del)))),
            detail.diff !== null
              ? h('div', { className: 'gs-diff' },
                detail.diff.loading
                  ? h('div', { className: 'gs-diff-note' }, tr('diff.loading'))
                  : detail.diff.error
                    ? h('div', { className: 'gs-diff-note' }, detail.diff.error)
                    : String(detail.diff.text || '').trim() === ''
                      ? h('div', { className: 'gs-diff-note' }, tr('diff.empty'))
                      : h(React.Fragment, null,
                        diffLines(detail.diff.text),
                        detail.diff.truncated ? h('div', { className: 'gs-diff-note' }, tr('diff.truncated')) : null))
              : null)
        }

        const graphFilterBar = graphOpen && activeRepo
          ? h('div', { className: 'gs-filter-wrap' },
            h('input', {
              className: 'gs-filter', placeholder: tr('search.graph'), value: graphFilter,
              onChange: (event) => setGraphFilter(event.target.value),
            }),
            graphFilter !== ''
              ? h('button', { type: 'button', className: 'gs-gtool', title: tr('search.clear'), onClick: () => setGraphFilter('') }, '✕')
              : null)
          : null

        const graphBody = graph === null || graph.root !== (activeRepo ? activeRepo.path : '')
          ? h('div', { className: 'gs-empty' }, tr('empty.loading'))
          : graphExplicitRefs !== null && graphExplicitRefs.length === 0
            ? h('div', { className: 'gs-empty' }, tr('graph.noneSelected'))
            : graphData.rows.length === 0
              ? h('div', { className: 'gs-empty' }, graphFilter.trim() !== '' ? tr('search.noMatch') : tr('empty.graph'))
              : graphData.rows.map((row, at) => {
                const refs = row.commit.refs || []
                const shown = refs.slice(0, 3)
                const extra = refs.length - shown.length
                const when = row.commit.at ? relativeTime(tr, row.commit.at) : ''
                const isOpen = commitDetail !== null && commitDetail.hash === row.commit.hash
                return h(React.Fragment, { key: row.commit.hash || at },
                  h('div', {
                    className: 'gs-grow gs-grow-click' + (isOpen ? ' gs-grow-sel' : ''),
                    title: row.commit.subject + ' — ' + (row.commit.author || '') + (when ? ' · ' + when : ''),
                    onClick: () => toggleCommitDetail(graph.root, row.commit.hash),
                  },
                    graphSvg(graphData, at),
                    h('span', { className: 'gs-ghash' }, row.commit.short),
                    h('span', { className: 'gs-gsub' }, row.commit.subject),
                    shown.map((ref) => {
                      const info = decorateGraphRef(ref, graphBranchByName)
                      const color = info.branch ? branchColor(info.branch.name) : ''
                      const style = color
                        ? {
                          color: info.kind === 'head' ? '#0d1117' : color,
                          borderColor: color,
                          background: info.kind === 'head' ? color : 'transparent',
                        }
                        : undefined
                      return h('span', {
                        key: ref,
                        className: 'gs-gref gs-gref-' + info.kind,
                        style,
                        title: info.kind === 'head' ? 'HEAD → ' + info.text : ref,
                      }, info.text)
                    }),
                    extra > 0
                      ? h('span', { className: 'gs-gmore', title: refs.slice(3).join(', ') }, '+' + extra)
                      : null),
                  isOpen ? renderCommitDetail(graph.root) : null)
              })

        const graphSection = sections.graph
          ? h('div', { className: 'gs-group', key: 'graph' },
            h('div', { className: 'gs-group-head' },
              h('button', {
                type: 'button', className: 'gs-ibtn', style: { width: '16px', height: '16px' }, title: tr('section.graph'),
                onClick: toggleGraphOpen,
              }, h(Glyph, { d: graphOpen ? ICON.chevronDown : ICON.chevronRight, size: 12 })),
              h('span', { className: 'gs-group-title', onClick: toggleGraphOpen }, tr('section.graph')),
              h('span', { className: 'gs-spacer' }),
              h('span', { className: 'gs-group-actions' },
                h('span', { className: 'gs-ab' }, String(graph && graph.lines ? graph.lines.filter((line) => line.hash).length : 0)))),
            graphOpen
              ? h('div', { key: 'graph-body' },
                graphToolbar,
                graphRepoPanel,
                graphBranchPanel,
                graphFilterBar,
                graphLegend,
                graphBody)
              : null)
          : null

        const dialogOverlay = dialog !== null
          ? h('div', { className: 'gs-dialog-overlay', onClick: () => setDialog(null) },
            h('div', { className: 'gs-dialog', onClick: (event) => event.stopPropagation() },
              h('div', { className: 'gs-dialog-title' }, dialog.title),
              dialog.fields.map((field, index) => h('div', { key: field.key, className: 'gs-dialog-field' },
                h('label', null, field.label),
                h('input', {
                  className: 'gs-input-line', value: dialog.values[index] || '',
                  onChange: (event) => {
                    const values = dialog.values.slice()
                    values[index] = event.target.value
                    setDialog(Object.assign({}, dialog, { values }))
                  },
                  onKeyDown: (event) => { if (event.key === 'Enter') submitDialog() },
                  autoFocus: index === 0,
                }))),
              h('div', { className: 'gs-dialog-actions' },
                h('button', { type: 'button', className: 'gs-btn', onClick: () => setDialog(null) }, tr('dialog.cancel')),
                h('button', {
                  type: 'button', className: 'gs-btn gs-primary',
                  disabled: dialog.values.every((value) => !value || value.trim() === ''),
                  onClick: submitDialog,
                }, tr('dialog.ok')))))
          : null

        const gitOutputOverlay = gitOutput !== null && gitOutput.open
          ? h('div', { className: 'gs-output' },
            h('div', { className: 'gs-output-head' },
              h('span', { className: 'gs-output-title' }, tr('output.title')),
              h('button', { type: 'button', className: 'gs-btn', onClick: () => setGitOutput(null) }, '✕')),
            h('div', { className: 'gs-output-body' },
              gitOutput.entries === null
                ? h('div', { className: 'gs-empty' }, tr('empty.loading'))
                : gitOutput.entries.length === 0
                  ? h('div', { className: 'gs-empty' }, tr('output.empty'))
                  : gitOutput.entries.map((entry, at) => h('div', { className: 'gs-output-entry', key: at },
                    h('div', { className: 'gs-output-cmd' + (entry.ok ? '' : ' gs-output-err') }, entry.command + ' (' + entry.ms + 'ms)'),
                    h('div', { className: 'gs-output-text' }, entry.output || '(empty)')))))
          : null

        return shell(
          head(),
          banner,
          gitOutputOverlay,
          dialogOverlay,
          h('div', { className: 'gs-body' }, reposSection, changesSection, graphSection))
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
