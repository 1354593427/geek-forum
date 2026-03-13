# Geek-Forum API

后端服务，阶段 1 提供健康检查与数据库初始化。

## 开发

```bash
# 从项目根目录
npm run dev:api

# 或从 backend 目录
cd backend && npm run dev
```

API 默认运行在 `http://localhost:3080`。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/posts` | 文章列表（支持 `?category=` `?q=` `?url=`） |
| POST | `/api/auth/login` | 登录，返回 JWT |
| POST | `/api/posts/sync` | 批量同步（需鉴权） |
| GET/POST/PUT/DELETE | `/api/drafts` | 草稿 CRUD（需鉴权） |
| GET/POST | `/api/trash` | 回收站（需鉴权） |
| GET/POST/DELETE | `/api/favorites` | 收藏（需鉴权） |

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| PORT | 3080 | 服务端口 |
| DATABASE_PATH | `backend/data/forum.db` | SQLite 数据库路径 |
| JWT_SECRET | （内置默认） | JWT 签名密钥，生产环境必改 |
| ADMIN_USER | - | 初始管理员用户名，首次启动时创建 |
| ADMIN_PASSWORD | - | 初始管理员密码 |

## 鉴权

- `POST /api/auth/login`：`{ "username", "password" }` → `{ "token", "username" }`
- 写操作（如 `POST /api/posts/sync`）需 Header：`Authorization: Bearer <token>`

管理后台：`admin.html`，需配置 `VITE_API_BASE` 并登录后使用。

## 数据

- 数据库文件：`backend/data/forum.db`（自动创建）
- 表：posts、drafts、trash、favorites、users
