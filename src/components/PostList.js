/**
 * PostList 组件 - 帖子列表
 */

import store from '../core/Store.js';
// Fuse.js is loaded as global from CDN

class PostList {
  constructor(container) {
    this.container = container;
    this.fuse = null;
    this.unsubscribe = null;
  }

  render(posts = []) {
    const state = store.getState();
    const { searchQuery, currentUrl } = state;
    
    let displayPosts = posts;
    
    // Search filter
    if (searchQuery && this.fuse) {
      const results = this.fuse.search(searchQuery);
      displayPosts = results.map(r => r.item);
    }
    
    // Category filter
    if (state.category !== 'all') {
      displayPosts = displayPosts.filter(p => p.category === state.category);
    }
    
    // Sort
    displayPosts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return state.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    if (displayPosts.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p class="text-xs font-black uppercase">End of stream</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = displayPosts.map(post => {
      const isActive = currentUrl === post.url;
      const tags = post.tags || [];
      const dateStr = post.date ? post.date.split(' ')[0] : '--';
      
      return `
        <div class="post-item ${isActive ? 'post-card-active' : ''}" 
             data-url="${post.url}"
             data-category="${post.category}">
          <div class="post-meta">
            <span class="post-tag">${tags[0] || post.category?.toUpperCase() || 'GEN'}</span>
            <span class="post-date">${dateStr}</span>
          </div>
          <h3 class="post-title ${isActive ? 'active' : ''}">${post.title || 'Untitled'}</h3>
          <p class="post-excerpt">${post.excerpt || 'Fetching summary from neural net...'}</p>
          <div class="post-footer">
            <div class="post-author">
              <img src="${post.author_avatar || `https://ui-avatars.com/api/?name=U&background=random&color=fff`}" 
                   class="author-avatar">
              <span class="author-name">${post.author || 'Anonymous'}</span>
            </div>
            <div class="post-arrow">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
              </svg>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelectorAll('.post-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        window.location.hash = url;
      });

      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.container.dispatchEvent(new CustomEvent('post-contextmenu', {
          detail: { url: item.dataset.url, x: e.clientX, y: e.clientY }
        }));
      });
    });
  }

  mount() {
    this.render([]);
    
    // Subscribe to state changes
    this.unsubscribe = store.subscribe((state, prevState) => {
      // Update on posts, category, search, or URL change
      if (state.posts !== prevState.posts ||
          state.category !== prevState.category ||
          state.searchQuery !== prevState.searchQuery ||
          state.sortOrder !== prevState.sortOrder ||
          state.currentUrl !== prevState.currentUrl) {
        
        // Initialize Fuse.js if needed
        if (!this.fuse && state.posts.length > 0) {
          this.fuse = new Fuse(state.posts, {
            keys: ['title', 'excerpt', 'tags', 'author'],
            threshold: 0.35,
            ignoreLocation: true
          });
        }
        
        this.render(state.posts);
      }
    });
  }

  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default PostList;
