#!/usr/bin/env python3
"""
Inject Open Graph and Twitter Card meta tags into post HTML files.
Reads posts.json for metadata. Run after sync_posts.py.
Uses SITE_URL env for absolute URLs.
"""

import json
import os
from html import escape
from urllib.parse import urljoin

from bs4 import BeautifulSoup

POSTS_JSON = "posts.json"
POSTS_DIR = "posts"


def inject_meta(soup, prop: str, content: str):
    """Add or update meta tag. property= for og:, name= for twitter:."""
    attr = "property" if prop.startswith("og:") else "name"
    existing = soup.find("meta", {attr: prop})
    tag = soup.new_tag("meta", **{attr: prop, "content": content[:500] if content else ""})
    if existing:
        existing.replace_with(tag)
    else:
        soup.head.insert(1, tag)


def main():
    site_url = (os.environ.get("SITE_URL") or "https://example.com").rstrip("/")
    if not os.path.exists(POSTS_JSON):
        print(f"⚠ {POSTS_JSON} not found, run sync_posts.py first")
        return

    with open(POSTS_JSON, "r", encoding="utf-8") as f:
        posts = json.load(f)

    for p in posts:
        path = p["url"]
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")

        if not soup.head:
            continue

        abs_url = urljoin(site_url + "/", path)
        title = p.get("title", "Untitled") or "Untitled"
        desc = (p.get("excerpt") or "")[:300].strip()

        inject_meta(soup, "og:title", title)
        inject_meta(soup, "og:description", desc)
        inject_meta(soup, "og:url", abs_url)
        inject_meta(soup, "og:type", "article")
        inject_meta(soup, "og:site_name", "OpenClaw 社区")
        inject_meta(soup, "og:locale", "zh_CN")

        inject_meta(soup, "twitter:card", "summary")
        inject_meta(soup, "twitter:title", title)
        inject_meta(soup, "twitter:description", desc)

        with open(path, "w", encoding="utf-8") as f:
            f.write(str(soup))

        print(f"  [og] {path}")

    print(f"\n✅ Injected OG/Twitter meta into {len(posts)} posts")


if __name__ == "__main__":
    main()
