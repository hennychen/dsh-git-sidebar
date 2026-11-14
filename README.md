# dsh-git-sidebar

[中文](README.md) | [English](README.en.md)

> 🌐 项目主页：<https://hennychen.github.io/dsh-git-sidebar/> · 插件市场索引：<https://hennychen.github.io/dsh-git-sidebar/market/index.json>

[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/DSH-%E2%89%A50.2.0--rc.2%20%3C0.3.0-8a2be2)](package.json)
[![market](https://img.shields.io/badge/plugin%20market-index.json-2ea44f)](https://hennychen.github.io/dsh-git-sidebar/market/index.json)

![dsh-git-sidebar 封面](docs/cover.png)

VS Code **Source Control** 风格的 Git 面板，装在 DeepSeek Harness 桌面端 Web GUI 的**右侧边栏**里：多仓库发现、暂存与提交、分支与提交图形都在同一面板完成。

## 预览

![DeepSeek Harness 右侧边栏 · 多存储库源代码管理](docs/panel.png)

面板分三段，对齐 VS Code 的 Source Control 布局：

- **存储库**：会话目录、其下嵌套仓库与已注册工作区中的 Git 仓库；分支、领先/落后、同步与完整仓库菜单都在行内。
- **更改**：提交框 +「更改 / 暂存的更改」分组，逐文件暂存、放弃与内联 diff。
- **图形**：SVG 车道图、分支多选与提交详情。

## 功能

### 存储库

- 自动发现会话目录、向下 3 层嵌套仓库、已注册工作区（本机示例：PathFinder-Voice-Server、PathFinder_Single、OpenViking、product-page、MapToki）
- 每行显示分支胶囊、`↑ahead ↓behind`、`⇅` 同步、`⋯` 完整 Git 菜单；点分支胶囊可切换/新建分支
- 标题栏**眼睛按钮**管理显示：逐仓库勾选显示/隐藏、一键「全部显示」「仅显示有更改」；计数显示为 `可见/总数`，隐藏状态按会话记忆
- 排序（发现时间/路径/名称）与单仓库/多仓库模式，均按会话持久化

### 更改

- 提交框支持 ⌘/Ctrl+Enter；右侧**分裂按钮**下拉：提交 / 提交全部 / 提交并推送 / 修正上次提交（Amend）/ 撤销上次提交（保留改动在暂存区）
- **提交信息历史**：按仓库记忆最近 20 条，点击回填
- 「更改 / 暂存的更改」分组：逐文件暂存、取消暂存、放弃；行内统一 diff（+/- 着色、hunk 头、未跟踪文件合成新增 diff）
- 文件**筛选框**与**树结构 / 列表**两种视图
- 多仓库模式下按仓库分块，每块有独立提交框与改动列表

### 图形

- SVG 车道图：父提交连线、合并提交空心双环节点，默认渲染最近 200 条
- 分支多选：全部 / 仅当前 / 仅本地 / 仅远程 / 逐条勾选（含 tip 短哈希与「只看此分支」聚焦）；彩色**分支图例**
- **提交筛选**：按信息 / 作者 / 哈希过滤
- **点击提交展开详情**：完整信息、作者与时间、变更文件 +N/-N、单文件 diff；可签出该提交（分离 HEAD）、从此提交新建分支、打标记

### 仓库操作

获取 / 拉取 / 推送 / 同步、分支签出与新建/删除、储藏、标记、工作树、克隆、**GIT 输出**查看器（最近 60 条命令与输出）。v0.8.4 起移除了底部常驻的「获取/拉取/推送」按钮，动作集中在仓库行、`⋯` 菜单与图形工具栏。

## 与 VS Code Source Control 对照

| VS Code | 本插件 |
| --- | --- |
| SOURCE CONTROL 标题栏 + 刷新 / 更多 | 同左 |
| 仓库 + 分支 + ahead/behind | 同左（点仓库名切换仓库） |
| 提交信息框 + Commit（⌘Enter） | 同左；另有 提交全部 / 提交并推送 / Amend / 撤销上次提交 与提交信息历史 |
| Changes 分组（暂存全部 / 放弃全部） | 同左，含逐文件暂存/放弃、筛选、树/列表视图 |
| Staged Changes 分组（全部取消暂存） | 同左，含逐文件取消暂存 |
| 点击文件看 diff | 行内展开统一 diff |
| 分支切换 / 新建分支 | 分支列表 + 图形分支多选 |
| Commit 历史 | 图形 + 点击提交查看详情 |
| Pull / Push / Sync | 仓库行 `⇅`、仓库 `⋯` 菜单、图形工具栏 |
| Git 输出 | 「显示 GIT 输出」查看器 |

状态字母与配色沿用 VS Code 语义：`M` 修改、`A`/`U` 新增、`D` 删除、`R` 重命名、`!` 冲突；文件名按扩展名着色。

## 安装

本仓库是 DSH profile bundle（`dsh.bundle.patch` + `dsh.client`），右侧边栏的「源代码管理」标签由客户端半注册。

```bash
# 方式一：从 GitHub 安装到 profile（pnpm 拉取本仓库）
dsh plugin --profile desktop add github:hennychen/dsh-git-sidebar

# 方式二：本地开发挂载（改代码即时生效）
dsh plugin --profile desktop add link:/path/to/dsh-git-sidebar
```

安装后在 **设置 → 插件** 里确认该 bundle 已启用（也可由插件管理器的 `install_bundle` 完成注册），再重启一次 `dsh`。右侧边栏 `+` 里会出现「源代码管理」。

## 打开

右侧边栏 → `+` → **源代码管理**。

- 当前会话目录本身是 Git 仓库时直接显示它；
- 目录只是**包含多个项目仓库的父目录**时，向下扫描 3 层发现仓库，默认打开最近有提交的那个，并标记 `子目录仓库`；
- 目录下没有仓库时回退到第一个已注册且是 Git 仓库的工作区，显示 `工作区` 标记；
- 点仓库名 / 分支胶囊可随时切换仓库，选择按会话记在 `localStorage`。

## 插件市场（官方索引 format 1）

本仓库自带一份符合官方规范的插件市场索引，可直接作为「发现」的索引源：

```
https://hennychen.github.io/dsh-git-sidebar/market/index.json
```

添加：**设置 → 插件 → 实验性插件 → 更多 → 打开「自定义插件市场」**，然后在 **发现 → 添加索引源** 粘贴上面的 URL。安装确认框会显示 Git 来源（`hennychen/dsh-git-sidebar`）与固定提交。

索引规则对照（DSH 会拒绝违反任意规则的整个索引）：

| 规则 | 本仓库的实现 |
| --- | --- |
| `format: 1`，UTF-8 JSON，静态 https，2xx 无重定向 | `docs/market/index.json`，经 GitHub Pages 提供 |
| 每个版本声明 `dsh.bundle` | 每个列出 tag 的 `package.json` 都有 `dsh.bundle.patch` |
| 每个版本 `engines.dsh` 非空并从该版本 manifest 原样复制 | `>=0.2.0-rc.2 <0.3.0` |
| `publishTimestamp` 为该提交的 committer 时间（秒） | 生成器用 `git log -1 --format=%ct <commit>` |
| git source：规范 https URL + 40 位小写 commit | `https://github.com/hennychen/dsh-git-sidebar` + tag commit |
| `title` / `description` 为 LocalizedText（必须含 `en`） | 中英双语，取自 `locale/*.json` |
| `icon` 相对索引 URL 解析且为 https | `icons/dsh-git-sidebar.svg` |
| 引用的 category/label/sortKey 必须已声明 | 只声明并使用 `development` 分类 |

重新生成索引（新增版本后）：

```bash
git tag v0.8.6
node scripts/market-index.mjs
git add docs/market && git commit -m "chore: update market index"
```

> v0.8.1 起包名改为 `@hennychen/dsh-git-sidebar`。生成器以最新 tag 的包名为准，自动丢弃改名前的旧名版本（`v0.6.4`–`v0.8.0`），避免索引内出现同名冲突。`v0.6.1`–`v0.6.3` 因缺少 `engines.dsh` 也会被跳过。

## 封面变体

| 用途 | 文件 | 尺寸 |
| --- | --- | --- |
| README 横幅 / GitHub 社交预览 | [docs/cover.png](docs/cover.png) | 1280×640（16:9） |
| 3:2 卡片（文章头图、演示） | [docs/cover-3x2.png](docs/cover-3x2.png) | 1200×800 |
| 方形（社交头像、聊天预览） | [docs/cover-square.png](docs/cover-square.png) | 1080×1080 |

三张图由 `scripts/make-cover.py`（Pillow）统一生成：`python3 scripts/make-cover.py docs`。GitHub 社交预览需在仓库 Settings → Social preview 手动上传 `docs/cover.png`。

## 实现

- `index.js`：宿主半。注册 `/git-sidebar` 路由；仓库由会话目录推导（活动会话 → 工作目录服务；否则 → 会话日志 header 的 `cwd`），`root` 参数只接受会话目录或已注册工作区内的路径；`execFile` 固定 argv、校验 pathspec、限制输出大小。
- `client.js`：客户端半。用 `sidebarRightTabs.register` 注册 `git` 类型 + guide 卡片，在 `sidebar.right.pane.tab` / `.title` 注册面板；渲染包在 `ErrorBoundary` 里，失败时显示可见错误卡而不是空白。

### 自诊断

客户端会向自身宿主路由发 `op=client-event` 心跳（mount / paint / apply / info / render-error）。排查“面板空白”时：

```bash
curl -s 'http://127.0.0.1:<port>/git-sidebar/api?op=client-events&sid=<sessionId>'
curl -s 'http://127.0.0.1:<port>/git-sidebar/api?op=client-asset&sid=<sessionId>'   # 客户端模块是否在 boot graph
```

## 开发

目录以 `link:` 方式挂在 `desktop` profile 里：

- 改 `client.js` / `index.js` 后，用 `plugin_manager` 将 `@hennychen/dsh-git-sidebar` 的 bundle 关再开即可热重载（不必重启 App）；
- 客户端模块 id 必须等于包名：`@hennychen/dsh-git-sidebar`；
- 发布流程：改版本 → commit → `git tag vX.Y.Z` → `node scripts/market-index.mjs` → commit `docs/market` → push `main` 与 tag。

## 更新记录

- **v0.8.6** 仓库显示管理边界修复：选中隐藏仓库自动恢复、全部隐藏空态、多选改动跟随隐藏、迟到 info 响应守卫
- **v0.8.5** 存储库逐项显示/隐藏管理（眼睛按钮、全部显示、仅显示有更改）
- **v0.8.4** 移除底部冗余的 获取/拉取/推送 按钮条
- **v0.8.3** 修复深色主题下主按钮白底白字（主题 `brand-primary` 近白）
- **v0.8.2** 提交分裂按钮（提交全部/提交并推送/Amend/撤销）、提交信息历史、提交详情与单文件 diff、更改与图形筛选
- **v0.8.1** 包名改为 `@hennychen/dsh-git-sidebar`（原无 scope 名被占用）
- **v0.8.0** VS Code 式仓库菜单（提交/更改/拉取推送/分支/远程/存储/标记/工作树/克隆/GIT 输出）

## License

[Apache-2.0](LICENSE)
