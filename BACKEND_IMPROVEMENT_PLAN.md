# Geek-Forum 分阶段改进计划：增加后端管理

> 基于当前纯静态架构，规划引入后端与内容管理系统的渐进式改造路线。

---

## 一、现状概览

| 维度 | 现状 |
|------|------|
| **前端** | Vite + TypeScript + Tailwind，SPA 单页应用 |
| **数据** | `posts.json` 静态索引 + `posts/` 下 HTML/MD 文件 |
| **存储** | 无后端，草稿/回收站/收藏均存 localStorage |
| **构建** | CI：`md_to_html` → `sync_posts` → `inject_og_meta` → `gen_feed` → `vite build` |
| **部署** | GitHub Pages，纯静态 |

---

## 二、改造目标

1. **内容管理**：通过后台发布、编辑、删除文章，无需手动改仓库
2. **持久化**：草稿、回收站、收藏迁移至服务端，多端同步
3. **可扩展**：为评论、用户、统计等功能预留接口
4. **渐进式**：每阶段可独立上线，不破坏现有静态体验

---

## 三、分阶段实施计划

---

### 阶段 0：前置准备（1–2 天）

**目标**：统一数据模型、抽离数据访问层，为后续 API 切换做准备。

| 任务 | 说明 | 产出 |
|------|------|------|
| 定义 `Post` API 接口 | 抽离 `fetch('posts.json')` 为可切换的 `getDataSource().getPosts()` | `src/api/types.ts`, `src/api/dataSource.ts` |
| 抽象 storage 层 | 将 drafts/trash/favorites 读写封装为 `getStorageAdapter()`，支持 `localStorage` 或远程 API | `src/core/storageAdapter.ts` |
| 环境变量 | 增加 `VITE_API_BASE`，为空时使用静态模式 | `.env.example` 更新 |

**依赖**：无  
**风险**：低，纯重构不改变行为

#### 阶段 0 已完成（2025-03-13）

- [x] `src/api/types.ts`：`PostsDataSource` 接口
- [x] `src/api/dataSource.ts`：`getDataSource()` 返回 staticSource，预留 API 切换
- [x] `src/core/storageAdapter.ts`：`StorageAdapter` 接口 + localStorage 实现，`getStorageAdapter()`
- [x] `main.ts` 使用 `dataSource.getPosts()`，`getStorageAdapter().getTrash()`
- [x] `drafts.ts`、`trash.ts`、`favorites.ts`、`editor-main.ts` 统一通过 `getStorageAdapter()` 读写

---

### 阶段 1：后端基础设施（约 1 周）

**目标**：搭建最小可运行的后端服务，提供健康检查与基础 API 骨架。

#### 1.1 技术选型建议

| 方案 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **Node + Hono** | 轻量、与前端同栈 | 快、TS 原生、部署简单 | 生态较小 |
| **Node + Express** | 传统稳定 | 成熟、资料多 | 较冗余 |
| **Python + FastAPI** | 与 sync_posts 同栈 | 与现有 Python 脚本一致 | 需维护两套语言 |
| **边缘函数 (Cloudflare Workers / Vercel)** | 无服务器 | 零运维、按需计费 | 存储需外接 |

**推荐**：**Node + Hono + SQLite**，便于快速迭代；后期可升级为 PostgreSQL。

#### 1.2 后端项目结构

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Hono app 入口
│   ├── db/
│   │   ├── schema.ts      # Drizzle schema
│   │   └── index.ts       # DB 连接
│   ├── routes/
│   │   ├── health.ts      # GET /health
│   │   ├── posts.ts       # CRUD posts
│   │   ├── drafts.ts
│   │   ├── trash.ts
│   │   └── favorites.ts
│   ├── middleware/
│   │   └── auth.ts        # 预留鉴权
│   └── services/
│       └── postSync.ts    # 与 posts/ 文件同步逻辑
└── drizzle.config.ts
```

#### 1.3 交付物

- [x] `GET /api/health` 返回 `{ ok: true }`
- [x] SQLite 数据库初始化（posts、drafts、trash、favorites 表）
- [x] 本地 `npm run dev:api` 启动后端
- [x] CORS 配置允许前端开发域

**依赖**：无  
**产出**：可独立运行的后端服务

#### 阶段 1 已完成（2025-03-13）

- [x] `backend/` 项目：Hono + @libsql/client + Drizzle ORM
- [x] `backend/src/db/schema.ts`：posts、drafts、trash、favorites 表定义
- [x] `backend/src/db/index.ts`：libsql 连接 + 自动建表
- [x] `backend/src/routes/health.ts`：`GET /api/health`
- [x] CORS：允许 localhost:5173、localhost:3000
- [x] 根目录 `npm run dev:api` 启动后端（端口 3080）

---

### 阶段 2：Posts API 与数据同步（约 1–2 周）

**目标**：后端提供 posts 的 CRUD，并支持与现有 `posts/` 目录双向同步。

#### 2.1 API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts` | 列表，支持 `?category=` `?q=` 查询 |
| GET | `/api/posts/:url` | 单篇详情（含 HTML 内容） |
| POST | `/api/posts` | 创建（需鉴权） |
| PUT | `/api/posts/:url` | 更新（需鉴权） |
| DELETE | `/api/posts/:url` | 软删除（移入回收站） |

#### 2.2 同步策略

| 模式 | 说明 | 适用 |
|------|------|------|
| **文件优先** | 构建时 `sync_posts.py` 扫 `posts/`，写入 DB | 开发/静态为主 |
| **DB 优先** | 后端管理为主，可导出到 `posts/` 做静态部署 | 完全 CMS 化 |
| **混合** | CI 拉取 DB 最新，生成 `posts.json` 与 HTML 到 dist | 过渡方案 |

**建议**：阶段 2 采用**混合**——后端存 master，CI 从 API 拉取生成静态产物，保持 GitHub Pages 部署。

#### 2.3 交付物

- [x] `GET /api/posts` 返回与 `posts.json` 同结构数据（支持 `?category=` `?q=`）
- [x] `GET /api/posts?url=...` 返回单篇（含 html 字段）
- [x] `POST /api/posts/sync` 批量 upsert（供 sync_to_api.py 调用）
- [x] 新增 `scripts/sync_to_api.py`，`npm run sync:api` 同步到 API
- [x] 前端 `dataSource` 支持 `VITE_API_BASE` 时请求 `/api/posts`，`getPostHtml` 获取 HTML
- [x] 前端 reader、integratedEditor 在 API 模式下从接口拉取 HTML

**依赖**：阶段 1  
**产出**：posts 可从前端或 API 获取，CI 可 `sync:api` 同步到后端

---

### 阶段 3：用户认证与权限（约 1 周）

**目标**：管理员登录，保护写操作（创建、更新、删除）。

#### 3.1 方案选择

| 方案 | 复杂度 | 说明 |
|------|--------|------|
| **简单 API Key** | 低 | Header `X-API-Key`，单管理员 |
| **JWT** | 中 | 登录后发 token，可扩展多用户 |
| **OAuth / 第三方** | 高 | GitHub、Google 等，适合协作 |

**建议**：阶段 3 用 **JWT**，`/api/auth/login` 校验密码，返回 token；写操作校验 `Authorization: Bearer <token>`。

#### 3.2 表结构

```sql
-- users 表（可后续扩展）
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at TEXT
);
```

#### 3.3 交付物

- [x] `POST /api/auth/login`（username + password → JWT）
- [ ] `POST /api/auth/refresh`（可选，暂未实现）
- [x] 写接口（POST /api/posts/sync）需 `Authorization: Bearer <token>`，否则 401
- [ ] 前端增加登录页 `/#/admin/login`（阶段 5 管理后台时实现）

**依赖**：阶段 2  
**产出**：写操作受保护，可安全开放管理入口

#### 阶段 3.1 已完成（JWT 认证）

- [x] `users` 表，`ADMIN_USER` / `ADMIN_PASSWORD` 种子管理员
- [x] `POST /api/auth/login` 返回 JWT
- [x] `requireAuth` 中间件，`POST /api/posts/sync` 需 Bearer token
- [x] `scripts/sync_to_api.py --token JWT` 支持鉴权

---

### 阶段 4：Drafts / Trash / Favorites API（约 1 周）

**目标**：将 localStorage 数据迁移到服务端，实现多端同步。

#### 4.1 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/drafts` | 当前用户草稿列表 |
| POST | `/api/drafts` | 保存草稿 |
| PUT | `/api/drafts/:id` | 更新草稿 |
| DELETE | `/api/drafts/:id` | 删除草稿 |
| GET | `/api/trash` | 回收站列表 |
| POST | `/api/trash/restore/:url` | 恢复 |
| DELETE | `/api/trash` | 清空 |
| GET | `/api/favorites` | 收藏列表 |
| POST | `/api/favorites` | 添加收藏 |
| DELETE | `/api/favorites/:url` | 取消收藏 |

#### 4.2 认证策略

- **已登录**：读写服务端，替换 localStorage
- **未登录**：沿用 localStorage，与现状一致（渐进增强）

#### 4.3 数据迁移

- 首次登录时，可选择「上传本地草稿/收藏」到服务端
- 服务端数据优先，冲突时以服务端为准

#### 4.4 交付物

- [x] 上述 API 全部实现（drafts, trash, favorites + /sync 批量）
- [x] 前端 `storageAdapter` 支持 API 模式（VITE_API_BASE + token 时）
- [x] 登录后（token 存 localStorage）自动切换为 API，未登录保持 localStorage
- [ ] 收藏功能接入主 UI（模块已有，待挂载）

**依赖**：阶段 3  
**产出**：草稿、回收站、收藏云端化，多设备一致

---

### 阶段 5：管理后台 UI 与编辑器集成（约 2 周）

**目标**：实现在线编辑、一键发布，彻底脱离手动操作。

#### 5.1 管理后台功能增强
- [ ] **仪表盘回顾**：显示文章总数、草稿数、最近更新。
- [ ] **精细化文章管理**：
    - 直接在列表中修改标题、分类（Inline Edit）。
    - 批量删除、批量分类转换。
- [ ] **回收站恢复**：UI 增加「恢复」按钮，调用后端接口将文章从 trash 还原回 posts 或 drafts。

#### 5.2 编辑器 (Integrated Editor) 深度集成
- [ ] **双向同步**：编辑器打开时根据 `url` 参数直接从 API 获取最新的 HTML/MD 内容。
- [ ] **保存并发布流程**：
    - **「保存草稿」**：点击时立即同步到 `/api/drafts`。
    - **「正式发布」**：点击后将数据发送至 `/api/posts`，并自动将对应的草稿删除。
- [ ] **SEO/元数据编辑**：在侧边栏增加 Excerpt（摘要）、Tags（标签）、Author（作者）的编辑字段。

#### 5.3 交付物
- [ ] `admin.html` 具备完整的 CRUD 操作。
- [ ] `editor.html` 增加「发布」按钮，支持 API 写入。
- [ ] 侧边栏增加「配置项」管理（标题、Logo、社交链接等）。

---

### 阶段 6：静态与动态同步（约 1 周）

**目标**：后端修改后，同步更新本地文件系统/静态构建，确保 GitHub Pages 兼容性。

#### 6.1 反向同步 (DB to Files)
- [ ] **自动生成 HTML/MD**：当 API 收到发布请求时，后端自动在 `posts/` 目录下生成对应的 `.html` 文件。
- [ ] **自动化 Git 提交**：在服务器/本地运行时，后端可调用 `git` 命令自动 commit & push 变更（可选，适合个人使用场景）。

#### 6.2 混合部署验证
- [ ] 后端负责「写」和「动态读」。
- [ ] 构建流程负责「全站静态化」，保持网站在 API 挂掉时依然可用。

---

### 阶段 7：媒体管理与图片上传（约 2 周）

**目标**：解决编辑器只能引用外部图片或 Base64 的痛点。

- [ ] **上传接口**：`POST /api/media/upload`，支持图片压缩与重命名。
- [ ] **媒体库 UI**：管理已上传的图片，支持在编辑器中一键插入。
- [ ] **存储后端**：支持本地磁盘存储或集成云存储（如阿里云 OSS、Cloudflare R2）。

---

### 阶段 8：多用户与精细权限（后置）

- [ ] **用户角色**：SuperAdmin（全权）、Editor（只能编辑）、Viewer（只能看）。
- [ ] **操作审计**：记录谁在什么时间修改了哪篇文章。
- [ ] **评论审核**：如果在阶段 4 后自建了评论系统，需要在此阶段增加审核后台。


---

## 四、可选增强（阶段 7+）

| 功能 | 说明 | 预估 |
|------|------|------|
| 评论系统 | 集成 Giscus（已有实现）或自建评论 API | 1 周 |
| 图片/媒体管理 | 上传、存储、CDN | 1–2 周 |
| 访问统计 | 阅读量、来源分析 | 约 1 周 |
| 多用户/角色 | 作者、编辑、审核 | 2–3 周 |
| 全文搜索 | 后端 Elasticsearch/Meilisearch | 1–2 周 |
| API 版本控制 | `/api/v1/` 前缀 | 2–3 天 |

---

## 五、依赖与优先级总览

```
阶段0 (前置) ──► 阶段1 (后端基础) ──► 阶段2 (Posts API)
                                            │
                                            ▼
阶段6 (部署) ◄── 阶段5 (管理UI) ◄── 阶段4 (Drafts/Trash/Fav) ◄── 阶段3 (认证)
```

| 阶段 | 预估工期 | 可独立上线 |
|------|----------|------------|
| 0 | 1–2 天 | ✅ 重构无风险 |
| 1 | ~1 周 | ✅ 仅后端 |
| 2 | 1–2 周 | ✅ Posts 可走 API |
| 3 | ~1 周 | ⚠️ 需与写操作一起 |
| 4 | ~1 周 | ✅ 云草稿/收藏 |
| 5 | ~2 周 | ✅ 完整管理 |
| 6 | ~1 周 | ✅ 生产部署 |

---

## 六、风险与缓解

| 风险 | 缓解 |
|------|------|
| 破坏现有静态体验 | 保留 `VITE_API_BASE` 为空时的纯静态模式 |
| 数据丢失 | 阶段 4 前备份 localStorage；DB 定期备份 |
| 认证被绕过 | 写接口统一中间件校验；敏感路由不走静态 |
| 部署复杂度上升 | 优先选用托管平台，避免自建运维 |

---

## 七、快速启动建议

1. **先完成阶段 0**：抽离 dataSource 和 storageAdapter，为后续切换打基础。  
2. **并行推进阶段 1 和 0**：后端骨架与前端重构可同时进行。  
3. **阶段 2 完成后**：即可让 CI 从 API 生成静态，验证混合模式。  
4. **阶段 3–5**：按顺序推进，每个阶段都有可交付功能。

---

*文档版本：1.0 | 更新日期：2025-03-13*
