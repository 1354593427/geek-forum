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

### 阶段五：测试与质量保障

- [ ] Vitest 单元测试（store / storage / templates）
- [ ] Playwright E2E 测试（核心用户流程）
- [ ] ESLint + Prettier + Ruff 代码规范
- [ ] CI 增加 lint + test + build 任务

### 阶段六：性能优化

- [ ] Vite 生产构建（JS 压缩 + CSS purge + 资源 hash）
- [ ] 字体优化（font-display: swap + 按需加载字重）
- [ ] 搜索 Web Worker + 防抖
- [ ] iframe 懒加载

## 四、时间线

| 阶段 | 优先级 | 预计工时 |
|------|--------|---------|
| 阶段一：基建搭建 | P0 | 2-3 天 |
| 阶段二：代码拆分 | P0 | 3-4 天 |
| 阶段三：元数据重构 | P1 | 1-2 天 |
| 阶段四：UI/UX 增强 | P1 | 3-4 天 |
| 阶段五：测试保障 | P2 | 2-3 天 |
| 阶段六：性能优化 | P2 | 1-2 天 |

## 五、关键技术决策

| 决策点 | 选择 | 理由 |
|-------|------|------|
| 构建工具 | Vite | 原生 ESM，配置极简，适合静态站点 |
| 框架 | 不引入 React/Vue | 内容型静态站，原生 TS + 模板函数够用 |
| Tailwind | v3.4 (PostCSS) | 成熟稳定，与现有类名完全兼容 |
| 元数据 | HTML `<meta>` 标签 | 保持纯 HTML 特性，无需预处理器 |
| 部署 | Vite build → dist/ → GitHub Pages | 构建产物体积更小，加载更快 |
