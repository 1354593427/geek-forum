# 🤖 AI 静态论坛运维与发帖指南 (AI Posting Guide)

本指南专为 AI Agent（智能助手）提供。由于本极客论坛 (`geek-forum`) 是一个**纯静态部署于 GitHub Pages 的 HTML 网站**，没有后端数据库，所有发帖、删帖、修帖的操作，都等同于对本地 HTML 代码文件的直接读写，并通过 Git 推送到远程仓库。

作为协助管理此论坛的 AI，在接收到用户的发帖或修改指令后，请严格遵循以下操作流程。

---

## 🎓 科研发帖质量规范 (Research Quality Guidelines)
当用户要求你“发布科研、算法相关内容”时，你必须严格遵循以下内容质量标准：
1. **数据与逻辑的严谨性**：绝不捏造任何参数、模型结果或实验数据。在进行对比或原理解读时，语言需维持学术级的客观中立。
2. **极高的可溯源性**：
   - 必须提供可查证的来源！如果是论文，必须附带论文名称及跳转链接（如 `[arXiv论文链接](https://arxiv.org/abs/xxxx)`）。
   - 如果使用了开源库或特定的数据集，提供 GitHub `[Repository](...)` 或数据官网链接。
3. **内容充实度 (Depth & Detail)**：
   - 不要生成仅有几句话的干瘪内容。
   - 必须包含清晰的章节结构，如：“研究背景”、“核心方法 (Methodology)”、“实验结果解析”及“局限性与讨论”。
   - 遇到数学公式或伪代码时，应使用合理的 `<code>` 块进行高亮和结构化展示。

---

## 🚀 核心工作流：如何发布一篇新帖子

要在论坛中“发布”新帖，你需要完成以下三个步骤：

### 步骤 1：生成独立的帖子详情页 (HTML)
所有的单篇帖子详情页应放置在站点根目录（或 `posts/` 等子目录）。
1. 根据用户的输入，生成完整标准的 HTML5 代码。
2. 页面需引入 Tailwind CSS，并保持与主站一致的审美（比如使用 `Inter` 字体）。
3. 使用 `write_to_file` 工具创建一个新的 HTML 文件，文件命名规范：`英文缩写-日期.html` (例：`robot-sim-v2.html`)。

**帖子内容页的基础 HTML 模板参考：**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>这里填入文章标题</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f5f7fa; color: #334155; }
        .post-content h1 { font-size: 2.25rem; font-weight: bold; margin-bottom: 2rem; color: #1e293b; }
        .post-content h2 { font-size: 1.5rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #1e293b; }
        .post-content p { margin-bottom: 1.5rem; line-height: 1.8; color: #475569; }
        .post-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1.5rem; }
        /* 更多的 Markdown 转 HTML 样式... */
    </style>
</head>
<body class="antialiased">
    <!-- 顶部导航条 -->
    <nav class="bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-100 z-50">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
            <!-- 关键：提供返回首页的链接 -->
            <a href="index.html" class="text-gray-500 hover:text-blue-600 transition font-medium">← 返回讨论区</a>
        </div>
    </nav>
    
    <!-- 帖子标题头 -->
    <header class="bg-white border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900">这里填入文章标题</h1>
            <div class="mt-6 text-gray-500 flex items-center justify-center gap-4 text-sm">
                <span>作者名</span><span>•</span><span>发表日期</span>
            </div>
        </div>
    </header>

    <!-- 帖子正文 -->
    <main class="max-w-4xl mx-auto px-4 py-16 bg-white shadow-xl -mt-8 rounded-xl relative z-10 border border-gray-100 mb-20">
        <article class="post-content px-4 md:px-12">
            <!-- 将用户的正文内容转为对应的 HTML 标签(p, h2, ul 等)插入此处 -->
        </article>
    </main>
</body>
</html>
```

### 步骤 2：在主页 (`index.html`) 中插入帖子索引卡片
帖子独立页创建后，用户在首页是看不到的。你需要修改 `index.html`，把新帖子插到帖子信息流的最顶部。

1. 使用 `view_file` 或 `grep_search` 获取 `index.html` 的结构。定位到 `<div class="space-y-5">` （这是包裹所有帖子的父级容器）。
2. 在 `<div class="space-y-5">` 内部的最前面，通过正则替换或区块替换工具 (`replace_file_content`) 插入下面的 HTML 片段。

**首页帖子卡片 HTML 模板：**
```html
            <!-- 新帖卡片开始 -->
            <a href="YOUR_NEW_POST_FILENAME.html" class="block group">
                <article class="post-card p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                    <!-- 左侧装饰线 -->
                    <div class="absolute top-0 left-0 w-1 h-full bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold tracking-wide border border-gray-200">文章标签 (如: 技术分享)</span>
                            <span class="text-xs text-gray-400 font-medium">主题分类 (如: 算法与架构)</span>
                        </div>
                        
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors break-words">
                            这里填入文章标题
                        </h2>
                        
                        <p class="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                            这里填入对文章内容的简短摘要信息，大概在50到100字左右...
                        </p>
                        
                        <div class="flex items-center gap-4 text-sm">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-gray-900">作者名</span>
                            </div>
                            <span class="text-gray-300">•</span>
                            <span class="text-gray-500">刚刚发布 (或具体日期)</span>
                        </div>
                    </div>
                </article>
            </a>
            <!-- 新帖卡片结束 -->
```

### 步骤 3：提交 Git 并推送到远程 (触发自动部署)
静态网站的更新依赖 Git 推送。在对上述文件完成读写修改后，你**必须**执行终端命令将变更推送上线。
由于该仓库强制走 443 端口的 SSH 智连通道部署，请严格执行以下命令：

```bash
cd /Users/w/代码/antigravity/my_website
git add .
git commit -m "Auto-post: 新增文章《文章标题》"
git remote set-url origin ssh://git@ssh.github.com:443/1354593427/geek-forum.git
GIT_SSH_COMMAND="ssh -i ~/.ssh/geek_forum_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" git push origin main
```
执行完毕后，GitHub Pages 会自动构建并在 1-2 分钟内生效。

---

## 📝 修改与删除帖子指南

### 修改已发帖子
1. 根据用户提供的帖子标题或链接，使用文件工具找出对应的 `.html` 详情页文件。
2. 使用修改文件内容的工具 (`replace_file_content` 或 `multi_replace_file_content`) 对其中的文本、排版进行精准修改。
3. （如果标题或摘要有变）需要同步修改 `index.html` 里对应那张卡片内的字段。
4. 执行 **步骤 3** 中的 Git 推送流程。

### 删除已有帖子
1. 找出对应的详情页 `.html` 文件，使用 `rm file.html` 命令将其彻底删除。
2. 打开 `index.html`，定位包裹该帖子的 `<a href="...html" class="block group">...</a>` DOM 结构片段。
3. 将这整个卡片片段用工具将其完全替换为空（即可视作删除）。
4. 执行 **步骤 3** 中的 Git 推送流程。

---

> **核心法则**：本站点以 `index.html` 为信息总流。AI 一切的操作应当保证 HTML 闭合正确、无语法错误，并随时使用 Git 提交保存。每一次 `git push` 后，不要忘记告知用户大概等待 1~2 分钟即可前往 GitHub Pages 链接刷新查看最新效果。
