#!/usr/bin/env python3
"""
将 posts/ 目录同步到后端 API。
依赖 sync_posts 的提取逻辑，并读取完整 HTML 推送到 API。

用法:
  python3 scripts/sync_to_api.py [--api URL] [--token JWT]
  --api 默认 http://localhost:3080/api
  --token 登录后获得的 JWT，鉴权启用时必填
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error

# 复用 sync_posts 逻辑
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sync_posts import POSTS_DIR, extract_metadata

def collect_posts_with_html():
    all_posts = []
    posts_root = os.path.join(os.getcwd(), POSTS_DIR)
    if not os.path.isdir(posts_root):
        print(f"ERROR: {POSTS_DIR}/ not found")
        return []
    categories = sorted(d for d in os.listdir(posts_root) if os.path.isdir(os.path.join(posts_root, d)))
    for category in categories:
        cat_path = os.path.join(posts_root, category)
        for fname in sorted(os.listdir(cat_path)):
            if not fname.endswith(".html"):
                continue
            fpath = os.path.join(cat_path, fname)
            try:
                meta = extract_metadata(fpath, category)
                with open(fpath, "r", encoding="utf-8") as f:
                    meta["html"] = f.read()
                all_posts.append(meta)
            except Exception as e:
                print(f"  ERROR  {category}/{fname}: {e}")
    all_posts.sort(key=lambda x: x["date"], reverse=True)
    return all_posts


def sync_to_api(api_base: str, posts: list, token=None):
    url = f"{api_base.rstrip('/')}/posts/sync"
    data = json.dumps({"posts": posts}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            print(f"✅ Synced {result.get('count', len(posts))} posts to {api_base}")
    except urllib.error.HTTPError as e:
        print(f"ERROR: API returned {e.code}: {e.read().decode()}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"ERROR: Cannot reach API: {e.reason}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Sync posts to backend API")
    parser.add_argument("--api", default="http://localhost:3080/api", help="API base URL")
    parser.add_argument("--token", help="JWT token (required when auth enabled)")
    args = parser.parse_args()

    posts = collect_posts_with_html()
    if not posts:
        print("No posts to sync.")
        return
    sync_to_api(args.api, posts, args.token)


if __name__ == "__main__":
    main()
