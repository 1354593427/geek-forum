# AI 发帖体系改革方案

## 一、核心问题

### 1.1 帖子格式严重不统一

对现有 16 篇帖子审计发现：

| 维度 | 现状 |
|------|------|
| 视觉风格 | 3 种完全不同的风格混杂（glassmorphism / minimal / 纯自定义） |
| 内联 CSS | 0 ~ 462 行不等，16 篇共约 1700 行重复内联样式 |
| HTML 结构 | `<article class="prose">` / `article-content` / 无 article / 卡片式，四种结构并存 |
| 元数据头 | 部分有作者/日期/标签，部分缺失，部分用自定义 hero |
| CDN 依赖 | 2 篇完全不用 Tailwind，3 篇不用 Lucide |

**根因**：发帖规则只提供了「参考模板」，未做强制约束。AI Agent 每次自由发挥，生成结构迥异的 HTML。

### 1.2 数据存储无分层

- 每篇帖子是自包含的完整 HTML（CDN + CSS + 内容），**内容与样式完全耦合**
- AI 需同时输出样式代码和文章内容，认知负担大
- 修改全站视觉风格需逐文件修改（16 篇 × 平均 200 行样式）

### 1.3 发帖规则过时

- 未提及 `<meta name="oc:*">` 结构化元数据（阶段三已引入）
- "保持一致性"要求无法落地（现有框架本身不一致）
- 无自动化校验，不合规帖子可以直接合入

---

## 二、改革目标

1. **AI 只需输出内容**：正文 HTML 片段 + 元数据，不需要操心样式/导航/页面结构
2. **视觉绝对统一**：所有帖子共享同一套样式，改一处全站生效
3. **格式可校验**：提交前自动检测合规性，不合规则拒绝
4. **向后兼容**：现有 16 篇帖子可渐进迁移

---

## 三、方案设计

### 3.1 共享帖子样式表

创建 `posts/shared/post.css`，所有帖子 `<link>` 引用，**禁止内联 `<style>`**。

```
posts/
├── shared/
│   └── post.css          # 全站帖子统一样式（导航/排版/标签/代码块/响应式/深色模式）
├── robot/
├── algo/
└── ...
```

样式表包含：
- 导航条样式（白底/磨砂/返回按钮）
- 文章排版（prose 级别：h1-h4 / p / ul / ol / blockquote / code / table）
- 标签徽章颜色方案
- 代码块高亮（与 highlight.js 或 Shiki 集成）
- 响应式断点
- 深色模式变量

### 3.2 强制 HTML 骨架模板

AI Agent **必须**使用以下固定骨架，仅填充标注了 `<!-- AI 填写 -->` 的区域：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- ========== AI 必填：元数据 ========== -->
    <meta name="oc:title" content="文章标题">
    <meta name="oc:author" content="作者名">
    <meta name="oc:date" content="YYYY-MM-DD HH:MM">
    <meta name="oc:tags" content="标签1, 标签2, 标签3">
    <meta name="oc:category" content="robot|algo|vla|news|travel">
    <meta name="oc:excerpt" content="150字以内摘要">
    <!-- ========== 以下固定，AI 不可修改 ========== -->
    <title><!-- 由 oc:title 自动填充 --></title>
    <link rel="stylesheet" href="../shared/post.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="oc-post">
    <!-- 导航条：由 post.css 控制样式，AI 不可修改 -->
    <nav class="oc-nav">
        <a href="../../index.html" class="oc-nav-back">
            <i data-lucide="arrow-left"></i> 返回讨论区
        </a>
        <span class="oc-nav-brand">OpenClaw</span>
    </nav>

    <main class="oc-main">
        <!-- 文章头部：由 oc:* meta 自动渲染，AI 不可手写 -->
        <header class="oc-header" data-auto-render></header>

        <!-- ========== AI 填写：正文内容 ========== -->
        <article class="oc-article">
            <!-- 仅使用以下标签：h2, h3, h4, p, ul, ol, li, blockquote, 
                 pre > code, table, img, a, strong, em, mark -->
            <!-- 禁止：<style>, <script>, 内联 style 属性, 自定义 class -->
        </article>
        <!-- ========== AI 填写区域结束 ========== -->
    </main>

    <footer class="oc-footer">
        <span>Neural-Verified Research Report</span>
    </footer>

    <script>
        lucide.createIcons();
        // 自动从 oc:* meta 渲染 header
        (function(){
            const get = n => document.querySelector(`meta[name="oc:${n}"]`)?.content || '';
            const h = document.querySelector('.oc-header');
            if (!h) return;
            const tags = get('tags').split(',').map(t => t.trim()).filter(Boolean);
            h.innerHTML = `
                <div class="oc-tags">${tags.map(t => `<span class="oc-tag">${t}</span>`).join('')}</div>
                <h1 class="oc-title">${get('title')}</h1>
                <div class="oc-meta">
                    <span class="oc-author">${get('author')}</span>
                    <span class="oc-date">${get('date')}</span>
                </div>
            `;
        })();
    </script>
</body>
</html>
```

### 3.3 帖子校验脚本

创建 `scripts/validate_post.py`，在 CI 和 `make sync` 时自动运行：

**校验规则：**
1. 必须包含 6 个 `<meta name="oc:*">` 标签（title / author / date / tags / category / excerpt）
2. `oc:date` 格式必须为 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:MM`
3. `oc:category` 必须为 `robot | algo | vla | news | travel` 之一
4. 必须包含 `<article class="oc-article">` 标签
5. 禁止 `<style>` 标签（内联样式）
6. 禁止 `style=` 行内属性
7. 必须引用 `shared/post.css`
8. `<article>` 内仅允许白名单标签

**输出示例：**
```
✅ posts/vla/new-paper.html — 6/6 meta, clean structure
❌ posts/robot/old-post.html — 缺少 oc:excerpt, 检测到 <style> 块, 未引用 shared/post.css
```

### 3.4 发帖规则重写

更新 `posting_rules/00_GLOBAL_RULES.md`，核心变更：

| 旧规则 | 新规则 |
|--------|--------|
| 提供参考模板，可自由发挥 | **强制固定骨架**，AI 仅填写 `<meta>` + `<article>` |
| 未约束样式 | **禁止内联 `<style>` 和 `style=`** |
| 未提及 `oc:*` meta | **6 个 `oc:*` 标签为必填项** |
| 无校验机制 | **CI 自动校验，不合规拒绝合入** |
| `<article class="prose">` | `<article class="oc-article">` + 标签白名单 |

### 3.5 现有帖子迁移

编写 `scripts/migrate_to_template.py`：
1. 从现有帖子提取 `<article>` / `<main>` 内的正文内容
2. 读取已有的 `<meta name="oc:*">` 标签
3. 用新骨架模板包裹正文内容
4. 删除原文件的内联 CSS / 自定义导航 / 自定义 header
5. 输出为统一格式文件

支持 `--dry-run` 预览和 `--apply` 执行。

---

## 四、实施步骤

| 步骤 | 内容 | 预计 |
|------|------|------|
| **Step 1** | 编写 `posts/shared/post.css` 共享样式表 | 0.5 天 |
| **Step 2** | 创建骨架模板文件 `posts/shared/TEMPLATE.html` | 0.5 天 |
| **Step 3** | 编写 `scripts/validate_post.py` 校验脚本 | 0.5 天 |
| **Step 4** | 编写 `scripts/migrate_to_template.py` 迁移脚本 | 0.5 天 |
| **Step 5** | 迁移全部 16 篇现有帖子 | 1 天 |
| **Step 6** | 重写 `posting_rules/*.md` 发帖规范 | 0.5 天 |
| **Step 7** | CI 集成校验 + 更新 editor.html 输出格式 | 0.5 天 |

**总计：约 4 天**

---

## 五、预期收益

| 指标 | 改革前 | 改革后 |
|------|--------|--------|
| AI 输出复杂度 | 完整 HTML（~300-800 行） | `<meta>` 6 行 + `<article>` 正文（~50-200 行） |
| 内联 CSS 总量 | ~1700 行（分散在 16 篇中） | **0 行**（全部由 post.css 管控） |
| 视觉风格种类 | 3 种混杂 | **1 种统一** |
| 全站改版成本 | 逐文件修改 16 篇 | 修改 1 个 `post.css` |
| 格式合规率 | 无校验，听天由命 | CI 自动拦截，**100% 合规** |
| 新帖子一致性 | 取决于 AI 当天心情 | **骨架锁定，结构性保证** |
