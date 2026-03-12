# OpenClaw 社区项目重构方案

## 一、现状诊断

| 维度 | 现状问题 | 严重程度 |
|------|---------|---------|
| 架构 | `index.html` 1550+ 行 / `editor.html` 630+ 行，HTML+CSS+JS 全部内联 | 严重 |
| 构建 | 无构建工具，无打包/压缩/Tree-shaking，全部依赖 CDN 运行时加载 | 严重 |
| 代码复用 | 两个页面间大量重复代码（Tailwind config、草稿管理、通知函数） | 中等 |
| 类型安全 | 纯 JS 无类型，全局变量满天飞 | 中等 |
| 元数据提取 | `sync_posts.py` 靠 HTML DOM 结构硬匹配 class 名提取标签/作者，极脆弱 | 严重 |
| 响应式 | 三栏 SPA 布局仅适配桌面端，移动端不可用 | 中等 |
| 国际化 | UI 中英文混杂 | 轻微 |
| 可访问性 | 无 ARIA 属性、无键盘导航 | 中等 |
| 测试 | 零测试覆盖 | 严重 |

## 二、目标架构

```
geek-forum/
├── src/
│   ├── styles/
│   │   ├── main.css            # 首页样式（含 Tailwind 指令）
│   │   └── editor.css          # 编辑器页样式
│   ├── scripts/
│   │   ├── core/
│   │   │   ├── store.ts        # 全局状态管理
│   │   │   ├── router.ts       # 轻量 hash 路由
│   │   │   └── events.ts       # 自定义事件总线
│   │   ├── features/
│   │   │   ├── postList.ts     # 文章列表 + 搜索
│   │   │   ├── reader.ts       # 阅读器面板
│   │   │   ├── editor.ts       # 集成编辑器
│   │   │   ├── drafts.ts       # 草稿箱
│   │   │   ├── trash.ts        # 回收站
│   │   │   ├── resizer.ts      # 列宽拖拽
│   │   │   └── liveLog.ts      # Live Signal Feed
│   │   └── utils/
│   │       ├── dom.ts          # DOM 工具函数
│   │       ├── storage.ts      # localStorage 封装
│   │       └── notification.ts # Toast 通知
│   ├── templates/
│   │   ├── postCard.ts         # 文章卡片模板
│   │   ├── draftItem.ts        # 草稿项模板
│   │   └── trashItem.ts        # 回收站项模板
│   ├── types/
│   │   └── index.ts            # Post, Draft, Config 类型
│   ├── main.ts                 # 首页入口
│   └── editor-main.ts          # 编辑器页入口
├── posts/                      # 文章归档（不变）
├── posting_rules/              # 发帖规范（不变）
├── scripts/
│   └── sync_posts.py           # 同步脚本（阶段三重写）
├── .github/workflows/
│   └── sync_posts.yml
├── index.html                  # 精简后的 HTML 壳
├── editor.html                 # 精简后的编辑器 HTML 壳
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── Makefile
```

## 三、分阶段实施计划

### 阶段一：基建搭建（构建工具 + 类型系统）⬅ 当前

**目标**：在不改变任何功能的前提下，引入 Vite + TypeScript + Tailwind PostCSS 构建管线。

- [x] 引入 Vite 作为开发服务器和构建工具
- [x] 引入 TypeScript（`strict: false`，先求通过）
- [x] Tailwind CSS 从 CDN 迁移到本地 PostCSS 编译
- [x] Fuse.js 从 CDN 迁移到 npm 模块导入
- [x] 内联 `<style>` 提取为独立 CSS 文件
- [x] 内联 `<script>` 提取为独立 TS 入口文件
- [x] CodeMirror 5 / Quill / Lucide 暂保留 CDN（Phase 2 升级）
- [x] `npm run dev` 本地验证功能完整

### 阶段二：代码拆分与模块化 ⬅ 已完成

**目标**：消除全局变量，将单体脚本拆分为功能模块。

- [x] 创建 Store（发布-订阅模式）替代全局变量
- [x] localStorage 封装（命名空间 + 异常处理）
- [x] 功能模块拆分（postList / reader / integratedEditor / drafts / trash / contextMenu / resizer / liveLog）
- [x] HTML 模板函数化（postCard / draftItem / trashItem）
- [x] `onclick` 内联属性改为 `addEventListener`（两个 HTML 文件均 0 个 onclick 残留）
- [x] CodeMirror 5 → 6 升级（ESM + Tree-shaking，独立 chunk 按需加载）

### 阶段三：元数据系统重构 ⬅ 已完成

**目标**：用结构化 `<meta name="oc:*">` 替代脆弱的 DOM 解析。

- [x] 编写一次性迁移脚本 `scripts/migrate_meta.py`（dry-run + --apply 模式）
- [x] 16 篇帖子全部注入 `<meta name="oc:title|author|date|tags|category|excerpt">` 标签
- [x] 重写 `sync_posts.py`（优先 meta 通道 → fallback 旧逻辑，日志标注数据来源）
- [x] 作者字段从错误值（"深度解析"/"MuJoCo"/"穷游"）修正为 "OpenClaw"
- [x] 标签从单一分类名改为内容级多标签（如 "金融风控, Transformer, 可解释AI"）

### 阶段四：UI/UX 增强 ⬅ 已完成

- [x] 移动端响应式（抽屉侧栏 + 滑入阅读器 + 移动头部 + 底部 4 Tab 导航栏）
- [x] UI 语言统一为中文（30+ 处英文标签替换）+ `src/i18n/zh.ts` 文案集中管理
- [x] 可访问性（15 个 ARIA 属性 + Escape 键关闭 + Modal focus trap）
- [x] 深色模式（CSS 变量覆盖 + 三态切换「浅色/深色/跟随系统」+ localStorage 持久化）

### 阶段五：测试与质量保障 ⬅ 已完成

- [x] Vitest 单元测试 37 cases（store 13 + storage 10 + templates 14），100% 通过
- [x] ESLint (flat config + typescript-eslint) + Prettier（semi:false / singleQuote / tabWidth:4）
- [x] Ruff 配置（Python scripts lint + format）
- [x] CI workflow `ci.yml`：lint → format:check → test → build（Node 20）+ Python Ruff

### 阶段六：性能优化 ⬅ 已完成

- [x] Vite 生产构建（JS 压缩 + CSS purge + 资源 hash + 动态分块）
- [x] 字体优化（font-display:swap + 裁剪至 5 个字重：400/500/600/700/900）
- [x] 搜索防抖 300ms（减少渲染频率）
- [x] CodeMirror 6 动态导入（首屏初始 JS 从 644KB → 42KB，减少 93.5%）
- [x] iframe loading="lazy"

## 四、下一阶段：从「工程重构」转向「产品增长」

> 阶段 1-6（工程重构）已全部完成。以下为产品功能迭代路线图。

### 阶段七：部署与 SEO（P0，预计 1-2 天）

- [ ] GitHub Pages 自动部署（CI 构建 → deploy `dist/` → `gh-pages` 分支）
- [ ] Open Graph / Twitter Card（每篇帖子 `<meta property="og:*">` + 社交分享预览）
- [ ] Sitemap 自动生成（`sync_posts.py` 同步生成 `sitemap.xml`）
- [ ] RSS Feed 生成（`scripts/` 输出 `feed.xml`）
- [ ] 自定义域名支持（`CNAME` 文件 + Vite `base` 配置）

### 阶段八：内容体验增强（P1，预计 2-3 天）

- [ ] 阅读时间估算（根据字数自动计算，显示在卡片和文章头部）
- [ ] 文章目录 TOC（阅读器侧边提取 `h2/h3` 生成锚点导航）
- [ ] 标签筛选页（按标签维度筛选 + 标签云可视化）
- [ ] 相关推荐（基于标签交集推荐相关文章）
- [ ] 阅读进度条（阅读器顶部显示当前滚动进度）

### 阶段九：编辑器升级（P1，预计 2-3 天）

- [ ] Quill → TipTap/ProseMirror（现代富文本编辑器 + Markdown 快捷键）
- [ ] Markdown 帖子支持（`.md` 文件作为帖子源，构建时渲染为 HTML）
- [ ] 图片拖拽上传（拖拽/粘贴图片，Base64 内联或上传 GitHub Issues）
- [ ] 帖子模板库（技术文章/论文综述/旅游攻略等预设模板）

### 阶段十：社区互动（P2，预计 3-4 天）

- [ ] Giscus 评论系统（基于 GitHub Discussions 的无后端评论）
- [ ] 文章点赞/收藏（localStorage 本地收藏夹 + UI）
- [ ] 键盘快捷键面板（`?` 打开指南：j/k 翻页、o 打开、Esc 返回）
- [ ] PWA 支持（Service Worker + manifest.json，可安装为桌面应用）

### 阶段十一：工程深化（P2，预计 2-3 天）

- [ ] TypeScript strict 模式（启用 `strict: true`，消除全部隐式 `any`）
- [ ] Playwright E2E 测试（加载 → 搜索 → 阅读 → 编辑 → 草稿）
- [ ] 错误监控（Sentry 集成或 `window.onerror` 上报）
- [ ] 包体积分析（`rollup-plugin-visualizer`）
- [ ] Lighthouse CI（每次 PR 自动跑性能/可访问性评分）

### 推荐执行路径

```
阶段七（部署 + SEO）→ 阶段八（内容体验）→ 阶段十（社区互动）
         ↓
    上线对外可访问后再推进后续阶段
```

## 五、已完成阶段时间线

| 阶段 | 优先级 | 状态 |
|------|--------|------|
| 阶段一：基建搭建 | P0 | ✅ 已完成 |
| 阶段二：代码拆分 | P0 | ✅ 已完成 |
| 阶段三：元数据重构 | P1 | ✅ 已完成 |
| 阶段四：UI/UX 增强 | P1 | ✅ 已完成 |
| 阶段五：测试保障 | P2 | ✅ 已完成 |
| 阶段六：性能优化 | P2 | ✅ 已完成 |

## 六、关键技术决策

| 决策点 | 选择 | 理由 |
|-------|------|------|
| 构建工具 | Vite | 原生 ESM，配置极简，适合静态站点 |
| 框架 | 不引入 React/Vue | 内容型静态站，原生 TS + 模板函数够用 |
| Tailwind | v3.4 (PostCSS) | 成熟稳定，与现有类名完全兼容 |
| 元数据 | HTML `<meta>` 标签 | 保持纯 HTML 特性，无需预处理器 |
| 部署 | Vite build → dist/ → GitHub Pages | 构建产物体积更小，加载更快 |
