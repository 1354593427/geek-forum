# Geek-Forum 重构方案

## 一、项目现状

### 1.1 当前结构
```
geek-forum/
├── index.html          # 主页面 (1552行，SpA三栏布局)
├── editor.html         # 编辑器页面 (632行)
├── posts.json          # 帖子索引数据
├── README.md           # 项目说明
├── Makefile            # 构建脚本
├── posting_rules/      # 发帖规则
│   ├── 00_GLOBAL_RULES.md
│   ├── 01_ROBOT_RULES.md
│   ├── 02_ALGO_RULES.md
│   └── 03_VLA_RULES.md
├── posts/              # 帖子内容
│   ├── algo/          # 算法类 (1篇)
│   ├── news/          # 新闻类 (3篇)
│   ├── robot/         # 机器人 (4篇)
│   ├── travel/        # 旅游类 (5篇)
│   └── vla/           # VLA类 (14篇 + 子目录)
├── scripts/           # 自动化脚本
│   └── sync_posts.py
└── .github/workflows/ # CI/CD
    └── sync_posts.yml
```

### 1.2 当前技术栈
- **前端**: 纯 HTML + Tailwind CSS (CDN) + 原生 JS
- **编辑器**: CodeMirror 5 (CDN)
- **搜索**: Fuse.js (CDN)
- **部署**: GitHub Pages + GitHub Actions

### 1.3 存在的问题

| 问题 | 描述 |
|------|------|
| 单文件过大 | index.html 1552行，包含所有 CSS/JS |
| 状态管理混乱 | localStorage + 全局变量混用 |
| 编辑器冗余 | editor.html 与内置编辑器功能重叠 |
| 无数据层抽象 | posts.json 手动维护 |
| 无测试 | 没有任何测试用例 |
| 部署依赖外部 | 完全依赖 GitHub Pages |

---

## 二、重构目标

1. **模块化** - 拆分大文件，按功能模块化
2. **可维护** - 清晰的目录结构和命名规范
3. **可扩展** - 支持插件、主题、多语言
4. **可测试** - 引入单元测试和 E2E 测试
5. **本地化** - 支持本地部署，不依赖外部 CDN

---

## 三、重构方案

### 3.1 目录结构重构

```
geek-forum/
├── src/                        # 源代码
│   ├── components/             # UI 组件
│   │   ├── Sidebar.js         # 侧边栏组件
│   │   ├── PostList.js        # 帖子列表组件
│   │   ├── Reader.js          # 阅读器组件
│   │   ├── Editor.js          # 内置编辑器
│   │   ├── SearchBox.js       # 搜索框
│   │   └── Modal.js           # 模态框组件
│   ├── core/                  # 核心逻辑
│   │   ├── Router.js          # 路由管理
│   │   ├── Store.js           # 状态管理
│   │   ├── PostsAPI.js        # 帖子数据层
│   │   └── SyncManager.js     # 同步管理
│   ├── utils/                 # 工具函数
│   │   ├── date.js            # 日期格式化
│   │   ├── storage.js         # localStorage 封装
│   │   └── fetch.js           # 网络请求
│   ├── styles/                # 样式文件
│   │   ├── main.css           # 主样式
│   │   ├── variables.css      # CSS 变量
│   │   └── components.css     # 组件样式
│   └── app.js                 # 应用入口
├── posts/                     # 帖子内容 (保持不变)
├── public/                    # 静态资源
│   ├── index.html             # HTML 模板
│   ├── editor.html            # 编辑器页面
│   └── assets/                # 图片等资源
├── scripts/                   # 构建脚本
│   ├── build.js               # 构建脚本
│   ├── minify.js              # 压缩脚本
│   └── sync-posts.js          # 帖子同步
├── tests/                     # 测试用例
│   ├── unit/                  # 单元测试
│   └── e2e/                   # E2E 测试
├── dist/                      # 构建输出
├── posting_rules/             # 发帖规则
├── package.json               # 项目配置
├── vite.config.js             # Vite 配置
└── README.md
```

### 3.2 技术栈升级

| 层级 | 当前 | 重构后 |
|------|------|--------|
| 构建工具 | 无 | Vite |
| CSS | Tailwind CDN | 原生 CSS + CSS Variables |
| JS | 原生 ES6+ | ES Modules |
| 编辑器 | CodeMirror 5 | CodeMirror 6 |
| 模板 | 无 | HTM / Lit |

### 3.3 核心模块设计

#### 3.3.1 状态管理 (Store.js)
```javascript
// 轻量级响应式状态管理
class Store {
  constructor() {
    this.state = reactive({
      posts: [],
      currentPost: null,
      category: 'all',
      searchQuery: '',
      drafts: [],
      trash: []
    });
  }
  
  getPosts() { ... }
  setCategory(cat) { ... }
  addDraft(draft) { ... }
  moveToTrash(postId) { ... }
}
```

#### 3.3.2 路由管理 (Router.js)
```javascript
// 基于 Hash 的路由
class Router {
  routes = {
    '/': 'home',
    '/post/:id': 'post',
    '/editor': 'editor',
    '/settings': 'settings'
  };
  
  navigate(path) { ... }
  handleHashChange() { ... }
}
```

#### 3.3.3 数据层 (PostsAPI.js)
```javascript
// 帖子数据抽象
class PostsAPI {
  async fetchPosts() { ... }
  async getPost(id) { ... }
  async savePost(post) { ... }
  async deletePost(id) { ... }
  
  // 本地缓存
  cache.get(key) { ... }
  cache.set(key, value) { ... }
}
```

### 3.4 构建流程

```javascript
// vite.config.js
export default {
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'public/index.html',
        editor: 'public/editor.html'
      }
    }
  },
  css: {
    modules: false
  }
}
```

---

## 四、分阶段实施计划

### 阶段一：基础设施 (1-2天)
- [ ] 创建目录结构
- [ ] 配置 Vite 构建
- [ ] 迁移 CSS 到原生 + Variables
- [ ] 建立 ES Modules 基础

### 阶段二：核心模块 (2-3天)
- [ ] 实现 Store 状态管理
- [ ] 实现 Router 路由
- [ ] 实现 PostsAPI 数据层
- [ ] 迁移组件代码

### 阶段三：UI 组件 (2-3天)
- [ ] 重构 Sidebar 组件
- [ ] 重构 PostList 组件
- [ ] 重构 Reader 组件
- [ ] 重构 Editor 组件

### 阶段四：优化 (1-2天)
- [ ] 添加单元测试
- [ ] 性能优化 (代码分割、懒加载)
- [ ] 本地化资源 (图片、字体)
- [ ] 文档完善

---

## 五、向后兼容方案

在重构期间保持双版本并行：

1. **短期**: `index.html` 作为入口，构建后生成 `dist/index.html`
2. **中期**: 支持 `?mode=legacy` 切换到旧版
3. **长期**: 旧版移至 `legacy/` 目录

---

## 六、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| CDN 依赖 | 离线不可用 | 本地化资源 |
| 浏览器兼容 | 旧浏览器 | 保留 ES5 构建 |
| 迁移成本 | 工作量大 | 分阶段进行 |
| 功能丢失 | 用户体验下降 | 完整测试覆盖 |

---

## 七、预期收益

| 指标 | 当前 | 重构后 |
|------|------|--------|
| 首屏加载 | ~500KB | ~100KB (gzip) |
| 代码复用 | 0% | 70%+ |
| 可维护性 | 差 | 好 |
| 可测试性 | 无 | 完整覆盖 |
| 离线支持 | 无 | 有 |

---

需要我开始实施某个阶段吗？
