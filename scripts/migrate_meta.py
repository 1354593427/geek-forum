#!/usr/bin/env python3
"""
One-time migration: inject <meta name="oc:*"> metadata tags into existing post HTML files.

Extracts best-effort metadata from the current DOM structure, then writes
standardized <meta> tags so sync_posts.py can reliably read them.

Usage:
    python3 scripts/migrate_meta.py          # dry-run (preview only)
    python3 scripts/migrate_meta.py --apply  # actually write changes
"""

import os
import re
import sys
from datetime import datetime
from bs4 import BeautifulSoup

POSTS_DIR = "posts"


def extract_title(soup):
    tag = soup.find("title")
    if tag:
        t = tag.get_text(strip=True)
        for noise in ["| OpenClaw Community", "| OpenClaw 社区", "| 极客论坛", "| OpenClaw Lab"]:
            t = t.replace(noise, "").strip()
        if t and t != "【文章标题填这里】":
            return t
    h1 = soup.find("h1")
    return h1.get_text(strip=True) if h1 else ""


def extract_date(soup, file_path):
    for span in soup.find_all("span"):
        text = span.get_text(strip=True)
        if re.match(r"\d{4}-\d{2}-\d{2}", text):
            return text
    for text_node in soup.stripped_strings:
        m = re.search(r"(\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2})", text_node)
        if m:
            return m.group(1)
        m = re.search(r"(\d{4}-\d{2}-\d{2})", text_node)
        if m:
            return m.group(1)
    return datetime.fromtimestamp(os.path.getmtime(file_path)).strftime("%Y-%m-%d %H:%M")


def extract_tags(soup, category):
    tags = []
    header = soup.find("header")
    search_area = header or soup

    for span in search_area.find_all("span"):
        cls = " ".join(span.get("class", []))
        text = span.get_text(strip=True)
        if not text or text in ("•", "·", "【填入技术标签】"):
            continue
        is_tag = any(
            k in cls
            for k in ("bg-blue-100", "bg-purple-100", "bg-green-100", "bg-red-100",
                       "bg-brand-100", "rounded-full", "rounded-md", "tag")
        )
        if is_tag and len(text) < 30:
            tags.append(text)

    if not tags:
        for el in soup.select(".tag, [class*='tag-']"):
            t = el.get_text(strip=True)
            if t and len(t) < 30:
                tags.append(t)

    return tags or [category.capitalize()]


def extract_author(soup):
    header = soup.find("header")
    if not header:
        return "OpenClaw"

    for img in header.find_all("img"):
        alt = img.get("alt", "")
        if alt and alt.lower() != "avatar":
            return alt
        next_el = img.find_next("span")
        if next_el:
            name = next_el.get_text(strip=True)
            if name and len(name) < 20 and not re.match(r"\d{4}-\d{2}", name):
                return name

    for candidate in header.find_all("span", class_=lambda c: c and "font-black" in c):
        text = candidate.get_text(strip=True)
        if (text and len(text) < 20
                and not re.match(r"\d{4}", text)
                and text not in ("•", "·")):
            parent_cls = " ".join(candidate.parent.get("class", []))
            if "tracking-tighter" not in parent_cls:
                return text

    return "OpenClaw"


def extract_excerpt(soup):
    article = soup.find("article") or soup.find("main")
    if article:
        text = article.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        return text[:200]
    return ""


def already_migrated(soup):
    return soup.find("meta", attrs={"name": "oc:title"}) is not None


def inject_meta(html_str, meta_dict):
    """Insert <meta name='oc:*'> tags right after <meta name='viewport'> or at end of <head>."""
    meta_lines = []
    for key, val in meta_dict.items():
        safe = val.replace('"', "&quot;")
        meta_lines.append(f'    <meta name="oc:{key}" content="{safe}">')
    block = "\n".join(meta_lines)

    vp = re.search(r'(<meta\s+name=["\']viewport["\'][^>]*>)', html_str)
    if vp:
        insert_pos = vp.end()
        return html_str[:insert_pos] + "\n" + block + html_str[insert_pos:]

    head_close = html_str.find("</head>")
    if head_close != -1:
        return html_str[:head_close] + block + "\n" + html_str[head_close:]

    return html_str


def process_file(file_path, category, apply=False):
    with open(file_path, "r", encoding="utf-8") as f:
        raw = f.read()

    soup = BeautifulSoup(raw, "html.parser")

    if already_migrated(soup):
        return None

    title = extract_title(soup)
    date = extract_date(soup, file_path)
    author = extract_author(soup)
    tags = extract_tags(soup, category)
    excerpt = extract_excerpt(soup)

    meta = {
        "title": title or "Untitled",
        "author": author,
        "date": date,
        "tags": ", ".join(tags),
        "category": category,
        "excerpt": excerpt[:200] if excerpt else "",
    }

    if apply:
        new_html = inject_meta(raw, meta)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_html)

    return meta


def main():
    apply = "--apply" in sys.argv
    posts_root = os.path.join(os.getcwd(), POSTS_DIR)
    categories = [d for d in os.listdir(posts_root) if os.path.isdir(os.path.join(posts_root, d))]

    total, migrated, skipped = 0, 0, 0

    for cat in sorted(categories):
        cat_path = os.path.join(posts_root, cat)
        for fname in sorted(os.listdir(cat_path)):
            if not fname.endswith(".html"):
                continue
            total += 1
            fpath = os.path.join(cat_path, fname)
            result = process_file(fpath, cat, apply=apply)
            if result is None:
                skipped += 1
                print(f"  SKIP {cat}/{fname} (already migrated)")
            else:
                migrated += 1
                mode = "WRITE" if apply else "PREVIEW"
                print(f"  {mode} {cat}/{fname}")
                print(f"         title  = {result['title'][:50]}")
                print(f"         author = {result['author']}")
                print(f"         date   = {result['date']}")
                print(f"         tags   = {result['tags']}")

    print(f"\nTotal: {total} | Migrated: {migrated} | Skipped: {skipped}")
    if not apply and migrated > 0:
        print("Run with --apply to write changes.")


if __name__ == "__main__":
    main()
