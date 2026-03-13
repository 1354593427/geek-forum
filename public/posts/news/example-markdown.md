---
title: 示例 Markdown 帖子
author: OpenClaw
date: 2026-03-12 12:00
category: news
tags: 示例, Markdown
excerpt: 这是一篇由 Markdown 构建的示例帖子。
---

## 说明

本帖子由 `scripts/md_to_html.mjs` 从 `.md` 在构建时渲染为 HTML。

- 支持 **粗体**、*斜体*
- 支持列表与链接
- 运行 `npm run md:html` 可单独生成 .html

## 使用方式

在 `posts/` 下新建 `.md` 文件，顶部写 YAML frontmatter（title、author、date、category、tags），然后执行：

```bash
npm run md:html   # 生成 .html
npm run sync      # 更新 posts.json
```
