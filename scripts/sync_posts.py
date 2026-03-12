#!/usr/bin/env python3
"""
Scan posts/ directory and generate posts.json index.

Priority: reads <meta name="oc:*"> tags first.
Fallback: DOM-based extraction for legacy posts without meta tags.
"""

import os
import json
import re
from bs4 import BeautifulSoup
from datetime import datetime

POSTS_DIR = "posts"
OUTPUT_JSON = "posts.json"

SIDEBAR_STYLES = {
    "robot": "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-purple-500",
    "algo":  "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-cyan-500",
    "vla":   "absolute top-0 left-0 w-1 h-full bg-purple-500",
    "travel":"absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-500",
    "news":  "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-400 to-orange-500",
}


def extract_metadata(file_path: str, category: str) -> dict:
    with open(file_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    meta = _read_oc_meta(soup)
    has_meta = bool(meta.get("title"))

    title    = meta.get("title")    or _fallback_title(soup)
    author   = meta.get("author")   or _fallback_author(soup)
    date     = meta.get("date")     or _fallback_date(soup, file_path)
    tags_str = meta.get("tags", "")
    tags     = [t.strip() for t in tags_str.split(",") if t.strip()] if tags_str else _fallback_tags(soup, category)
    excerpt  = meta.get("excerpt")  or _fallback_excerpt(soup)
    cat      = meta.get("category") or category

    source = "meta" if has_meta else "fallback"
    print(f"  [{source:8s}] {cat}/{os.path.basename(file_path):40s} → {title[:50]}")

    return {
        "title":         title or "Untitled Post",
        "url":           os.path.relpath(file_path, os.getcwd()),
        "category":      cat,
        "date":          date,
        "excerpt":       excerpt,
        "tags":          tags or [category.capitalize()],
        "author":        author,
        "author_avatar": f"https://ui-avatars.com/api/?name={author}&background=random&color=fff",
        "sidebar_style": SIDEBAR_STYLES.get(cat, "absolute top-0 left-0 w-1 h-full bg-gray-400"),
    }


# ---------- Primary: <meta name="oc:*"> ----------

def _read_oc_meta(soup) -> dict:
    result = {}
    for tag in soup.find_all("meta"):
        name = tag.get("name", "")
        if name.startswith("oc:"):
            result[name[3:]] = tag.get("content", "")
    return result


# ---------- Fallback: DOM-based extraction ----------

def _fallback_title(soup) -> str:
    tag = soup.find("title")
    if tag:
        t = tag.get_text(strip=True)
        for noise in ["| OpenClaw Community", "| OpenClaw 社区", "| 极客论坛", "| OpenClaw Lab"]:
            t = t.replace(noise, "").strip()
        if t and "【文章标题填这里】" not in t:
            return t
    h1 = soup.find("h1")
    return h1.get_text(strip=True) if h1 else ""


def _fallback_author(soup) -> str:
    header = soup.find("header")
    if not header:
        return "OpenClaw"
    for img in header.find_all("img"):
        sibling = img.find_next("span")
        if sibling:
            name = sibling.get_text(strip=True)
            if name and len(name) < 20 and not re.match(r"\d{4}", name):
                return name
    return "OpenClaw"


def _fallback_date(soup, file_path: str) -> str:
    for span in soup.find_all("span"):
        text = span.get_text(strip=True)
        if re.match(r"\d{4}-\d{2}-\d{2}", text):
            return text
    return datetime.fromtimestamp(os.path.getmtime(file_path)).strftime("%Y-%m-%d %H:%M")


def _fallback_tags(soup, category: str) -> list:
    tags = []
    header = soup.find("header") or soup
    for span in header.find_all("span"):
        cls = " ".join(span.get("class", []))
        text = span.get_text(strip=True)
        if not text or text in ("•", "·"):
            continue
        if any(k in cls for k in ("bg-blue-100", "bg-purple-100", "bg-green-100",
                                   "bg-red-100", "rounded-full", "rounded-md")):
            if len(text) < 30:
                tags.append(text)
    return tags or [category.capitalize()]


def _fallback_excerpt(soup) -> str:
    article = soup.find("article") or soup.find("main")
    if article:
        text = re.sub(r"\s+", " ", article.get_text(separator=" ", strip=True))
        return text[:200] + "..." if len(text) > 200 else text
    return ""


# ---------- Sync ----------

def sync():
    all_posts = []
    posts_root = os.path.join(os.getcwd(), POSTS_DIR)
    categories = sorted(d for d in os.listdir(posts_root) if os.path.isdir(os.path.join(posts_root, d)))

    for category in categories:
        cat_path = os.path.join(posts_root, category)
        for fname in sorted(os.listdir(cat_path)):
            if not fname.endswith(".html"):
                continue
            fpath = os.path.join(cat_path, fname)
            try:
                all_posts.append(extract_metadata(fpath, category))
            except Exception as e:
                print(f"  ERROR  {category}/{fname}: {e}")

    all_posts.sort(key=lambda x: x["date"], reverse=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=4)

    print(f"\n✅ Synchronized {len(all_posts)} posts → {OUTPUT_JSON}")


if __name__ == "__main__":
    sync()
