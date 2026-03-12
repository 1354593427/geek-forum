
import os
import json
import re
from bs4 import BeautifulSoup
from datetime import datetime

# Configuration
POSTS_DIR = "posts"
OUTPUT_JSON = "posts.json"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_sidebar_style(category):
    styles = {
        "robot": "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-400 to-purple-500",
        "algo": "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-cyan-500",
        "vla": "absolute top-0 left-0 w-1 h-full bg-purple-500",
        "travel": "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-500",
        "news": "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-400 to-orange-500"
    }
    return styles.get(category, "absolute top-0 left-0 w-1 h-full bg-gray-400")

def extract_metadata(file_path, category):
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # Title
    title = ""
    title_tag = soup.find('title')
    if title_tag:
        title = title_tag.get_text(strip=True).replace("【文章标题填这里】", "").strip()
    if not title:
        h1_tag = soup.find('h1')
        if h1_tag:
            title = h1_tag.get_text(strip=True)

    # Date, Author, Tags
    date = ""
    author = "OpenClaw"
    tags = []
    
    # Try to find metadata in header
    header = soup.find('header')
    if header:
        meta_div = header.find('div', class_='flex')
        if meta_div:
            spans = meta_div.find_all('span')
            for span in spans:
                text = span.get_text(strip=True)
                # Date check
                if re.match(r'\d{4}-\d{2}-\d{2}', text):
                    date = text
                # Tag check
                elif 'bg-blue-100' in span.get('class', []) or 'rounded' in span.get('class', []):
                    if text and text != "【填入技术标签】":
                        tags.append(text)
                # Author (usually the first span if not a date/divider)
                elif text and text != "•" and not date and not tags:
                    author = text

    # Excerpt (first 150 chars of article)
    excerpt = ""
    article = soup.find('article')
    if article:
        excerpt = article.get_text(strip=True)[:150] + "..."
    
    # Avatar based on author/category
    avatar = f"https://ui-avatars.com/api/?name={author}&background=random&color=fff"

    # URL (relative to root)
    rel_path = os.path.relpath(file_path, os.getcwd())

    return {
        "title": title or "Untitled Post",
        "url": rel_path,
        "category": category,
        "date": date or datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M'),
        "excerpt": excerpt,
        "tags": tags or [category.capitalize()],
        "author": author,
        "author_avatar": avatar,
        "sidebar_style": get_sidebar_style(category)
    }

def sync():
    all_posts = []
    posts_root = os.path.join(os.getcwd(), POSTS_DIR)
    
    # Get immediate subdirectories as categories (robot, algo, vla, news, travel, etc.)
    categories = [d for d in os.listdir(posts_root) if os.path.isdir(os.path.join(posts_root, d))]
    
    for category in categories:
        category_path = os.path.join(posts_root, category)
        # ONLY look at immediate HTML files in this category folder
        # Files in deeper subdirectories are considered "secondary pages" and excluded from the main index
        for file in os.listdir(category_path):
            if file.endswith(".html"):
                file_path = os.path.join(category_path, file)
                print(f"Processing Root Post: {file_path}")
                try:
                    all_posts.append(extract_metadata(file_path, category))
                except Exception as e:
                    print(f"Error processing {file}: {e}")

    # Sort by date descending
    all_posts.sort(key=lambda x: x['date'], reverse=True)

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=4)
    
    print(f"\n✅ Success! Synchronized {len(all_posts)} ROOT posts to {OUTPUT_JSON}")
    print("ℹ️  Note: Nested pages in subdirectories were skipped as secondary content.")

if __name__ == "__main__":
    sync()
