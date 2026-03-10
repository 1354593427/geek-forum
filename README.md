# 👨‍💻 W的极客论坛 (W's Geek Forum)

这是一个基于纯静态 HTML + Tailwind CSS 构建的极简技术博客与科研论坛系统。完全依赖 GitHub Pages 进行无服务器托管部署，通过 Git 提交流程来实现日常内容的发布与管理。

## 🌟 核心特性
1. **极致轻量，纯静态**：无需数据库，无需复杂的现代后端，一切皆为纯静态 `.html` 文件。
2. **现代化 UI / UX**：采用现代化的极简高级灰和玻璃态 (Glassmorphism) 特效，保障极佳的沉浸式极客阅读体验。
3. **动态 JS 无感分类筛选**：首页支持纯前端的无刷新 Tab 帖子归属分类过滤。
4. **Agent-Friendly**：本项目为未来由大型人工智能 (AI Agent) 完全接管内容发布、收集、归档、修改而专门设计了完善的[发帖规章制度](posting_rules/00_GLOBAL_RULES.md)。

## 📂 极简目录架构
```text
📦 my_website
├── 📜 README.md            # 项目说明文件
├── 📜 index.html           # 网站首页与文章分类时间线 (自动展示精华推荐)
├── 📜 editor.html          # 提供简单的本地/网页端富文本发帖编辑器界面
├── 📂 posts                # 所有的文章与讨论贴的核心归档处
│   ├── 📂 robot            # 机器人与物理仿真板块
│   ├── 📂 algo             # 算法核心、推荐系统及底座架构板块
│   └── 📂 vla              # Vision-Language-Action 及具身智能前沿汇总分析
├── 📂 posting_rules        # 针对 AI 发帖的严格规范文档
│   ├── 00_GLOBAL_RULES.md  # 全局发帖标准 (通用结构、首页挂载、防伪编排)
│   ├── 01_ROBOT_RULES.md   # 机器人板块发帖指引
│   ├── 02_ALGO_RULES.md    # 算法板块发帖指引
│   └── 03_VLA_RULES.md     # 具身智能论文综述发帖指引
└── 📂 assets               # 静态资源 (图片、自定义脚本等)
```

## 🚀 部署与协作指南
1. **获取代码**：在您的机器上 `git clone` 本仓库代码。
2. **AI 发帖支持**：唤醒您的 AI 助手，让其阅读 `posting_rules/` 目录下的规则并要求其在此创建符合严格科研论述要求的内容 HTML，然后提交。
3. **零等待部署上线**：
    由于部署基于 GitHub Actions/Pages。当您完成修改或新增帖子后，只需要执行：
    ```bash
    git add .
    git commit -m "Auto Post: 新增文章xxx"
    git push origin main
    ```
    等待大约 1-2 分钟，即可在全球公网您的 `github.io` 地址上看到新内容！
