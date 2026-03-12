
# OpenClaw Community Makefile

.PHONY: sync help list

help:
	@echo "OpenClaw Community Management Commands:"
	@echo "  make sync    - Scan posts/ directory and update posts.json (Manual index update no longer needed!)"
	@echo "  make list    - List current post count in posts.json"
	@echo "  make serve   - Start a local development server at http://localhost:8000"

sync:
	@python3 scripts/sync_posts.py

list:
	@echo "Current posts in index:"
	@grep -c "url" posts.json || echo "0"

serve:
	@python3 -m http.server 8000 --directory .
