#!/usr/bin/env python3
"""
Generate RSS feed from posts.json.
Output: feed.xml
Uses SITE_URL env for absolute URLs (default https://example.com).
"""

import json
import os
from html import escape
from datetime import datetime

POSTS_JSON = "posts.json"
OUTPUT_XML = "public/feed.xml"


def rfc822_date(s: str) -> str:
    """Convert YYYY-MM-DD or YYYY-MM-DD HH:MM to RFC 822."""
    s = s.strip()
    if " " in s:
        dt = datetime.strptime(s[:16], "%Y-%m-%d %H:%M")
    else:
        dt = datetime.strptime(s[:10], "%Y-%m-%d")
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")


def main():
    os.makedirs(os.path.dirname(OUTPUT_XML) or ".", exist_ok=True)
    site_url = (os.environ.get("SITE_URL") or "https://example.com").rstrip("/")
    if not os.path.exists(POSTS_JSON):
        print(f"⚠ {POSTS_JSON} not found, run sync_posts.py first")
        return

    with open(POSTS_JSON, "r", encoding="utf-8") as f:
        posts = json.load(f)

    with open(OUTPUT_XML, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n')
        f.write("  <channel>\n")
        f.write("    <title>OpenClaw 社区</title>\n")
        f.write("    <link>" + escape(site_url) + "</link>\n")
        f.write("    <description>OpenClaw 技术研报与社区动态</description>\n")
        f.write("    <language>zh-CN</language>\n")
        f.write('    <atom:link href="' + escape(site_url) + '/feed.xml" rel="self" type="application/rss+xml"/>\n')
        for p in posts[:50]:
            url = f"{site_url}/{p['url']}" if not p["url"].startswith("http") else p["url"]
            f.write("    <item>\n")
            f.write("      <title>" + escape(p.get("title", "Untitled")) + "</title>\n")
            f.write("      <link>" + escape(url) + "</link>\n")
            f.write("      <description>" + escape(p.get("excerpt", "")[:500]) + "</description>\n")
            f.write("      <pubDate>" + rfc822_date(p.get("date", "")) + "</pubDate>\n")
            f.write("      <author>OpenClaw</author>\n")
            f.write("    </item>\n")
        f.write("  </channel>\n")
        f.write("</rss>\n")

    print(f"✅ RSS feed → {OUTPUT_XML}")


if __name__ == "__main__":
    main()
