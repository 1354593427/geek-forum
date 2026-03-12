
# OpenClaw Community Makefile

.PHONY: sync help list dev build preview serve

help:
	@echo "OpenClaw Community Management Commands:"
	@echo "  make dev     - Start Vite dev server (recommended)"
	@echo "  make build   - Production build to dist/"
	@echo "  make preview - Preview production build"
	@echo "  make sync    - Scan posts/ directory and update posts.json"
	@echo "  make list    - List current post count in posts.json"
	@echo "  make serve   - Legacy: Start Python HTTP server at :8000"

dev:
	@npx vite

build:
	@npx vite build
	@cp -r posts dist/
	@cp posts.json dist/
	@cp -r posting_rules dist/

preview:
	@npx vite preview

sync:
	@python3 scripts/sync_posts.py

list:
	@echo "Current posts in index:"
	@grep -c "url" posts.json || echo "0"

serve:
	@python3 -m http.server 8000 --directory .
