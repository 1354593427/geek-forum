/**
 * Geek-Forum App 入口
 * 主应用初始化和管理
 */

import store from './core/Store.js';
import Router from './core/Router.js';
import postsAPI from './core/PostsAPI.js';
import syncManager from './core/SyncManager.js';
import Sidebar from './components/Sidebar.js';
import PostList from './components/PostList.js';
import Reader from './components/Reader.js';
import SearchBox from './components/SearchBox.js';

class App {
  constructor() {
    this.sidebar = null;
    this.postList = null;
    this.reader = null;
    this.searchBox = null;
    this.router = null;
  }

  async init() {
    console.log('[App] Initializing...');
    
    // Initialize router
    this.initRouter();
    
    // Load posts data
    await this.loadPosts();
    
    // Initialize components
    this.initComponents();
    
    // Bind resizer events
    this.initResizers();
    
    // Bind search events
    this.initSearch();
    
    // Bind modals
    this.initModals();
    
    // Start auto-sync (every 5 minutes)
    syncManager.startAutoSync(5 * 60 * 1000);
    
    console.log('[App] Ready');
  }

  initRouter() {
    this.router = new Router();
    
    this.router.register('/', () => {
      store.setCurrentUrl('');
    });
    
    this.router.register('/post/:path', (params) => {
      const url = params.path;
      store.setCurrentUrl(url);
    });
    
    this.router.register('/404', ({ url }) => {
      console.warn(`Page not found: ${url}`);
    });
    
    this.router.beforeEach((url) => {
      // Close edit mode on navigation
      if (store.getState().isEditMode) {
        store.setEditMode(false);
      }
    });
    
    this.router.init();
  }

  async loadPosts() {
    try {
      store.setLoading(true);
      const posts = await postsAPI.fetchPosts();
      store.setPosts(posts);
      console.log(`[App] Loaded ${posts.length} posts`);
    } catch (error) {
      console.error('[App] Failed to load posts:', error);
    } finally {
      store.setLoading(false);
    }
  }

  initComponents() {
    // Sidebar
    const sidebarEl = document.getElementById('sidebarColumn');
    if (sidebarEl) {
      this.sidebar = new Sidebar(sidebarEl);
      this.sidebar.mount();
    }

    // Post List
    const postListEl = document.getElementById('postList');
    if (postListEl) {
      this.postList = new PostList(postListEl);
      this.postList.mount();
    }

    // Reader
    const readerEl = document.getElementById('readerColumn');
    if (readerEl) {
      this.reader = new Reader(readerEl);
      this.reader.mount();
    }
  }

  initResizers() {
    const resizer1 = document.getElementById('resizer1');
    const resizer2 = document.getElementById('resizer2');
    const root = document.documentElement;
    
    const initResizer = (resizer, variableName) => {
      if (!resizer) return;
      
      let startX, startWidth;
      
      resizer.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(root).getPropertyValue(variableName));
        resizer.classList.add('resizing');
        document.body.classList.add('resizing-active');
        
        const onMouseMove = (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const min = variableName === '--sidebar-width' ? 180 : 300;
          const max = variableName === '--sidebar-width' ? 400 : 800;
          const newWidth = Math.max(min, Math.min(max, startWidth + delta));
          root.style.setProperty(variableName, `${newWidth}px`);
        };
        
        const onMouseUp = () => {
          resizer.classList.remove('resizing');
          document.body.classList.remove('resizing-active');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    };
    
    initResizer(resizer1, '--sidebar-width');
    initResizer(resizer2, '--explorer-width');
  }

  initSearch() {
    const searchInput = document.getElementById('postSearch');
    const sortSelect = document.getElementById('sortOrder');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        store.setSearchQuery(e.target.value.trim());
      });
    }
    
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        store.setSortOrder(e.target.value);
      });
    }
  }

  initModals() {
    // Listen for modal events from Sidebar
    document.addEventListener('open-drafts', () => this.openDraftsModal());
    document.addEventListener('open-trash', () => this.openTrashModal());
    document.addEventListener('post-contextmenu', (e) => this.showContextMenu(e.detail));
    
    // Hide context menu on click elsewhere
    document.addEventListener('click', () => this.hideContextMenu());
  }

  showContextMenu({ url, x, y }) {
    const menu = document.getElementById('contextMenu');
    if (!menu) return;
    
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.dataset.url = url;
  }

  hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  handleEditFromMenu() {
    const menu = document.getElementById('contextMenu');
    const url = menu?.dataset.url;
    if (url) {
      // TODO: Implement edit mode
      console.log('Edit:', url);
    }
    this.hideContextMenu();
  }

  handleDeleteFromMenu() {
    const menu = document.getElementById('contextMenu');
    const url = menu?.dataset.url;
    if (url) {
      const post = store.getState().posts.find(p => p.url === url);
      if (post) {
        store.moveToTrash(post);
        if (store.getState().currentUrl === url) {
          window.location.hash = '';
        }
      }
    }
    this.hideContextMenu();
  }

  openDraftsModal() {
    const modal = document.getElementById('draftsModal');
    const list = document.getElementById('draftsList');
    if (!modal || !list) return;

    const drafts = store.getState().drafts;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (drafts.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No saved drafts</p></div>';
      return;
    }
    
    list.innerHTML = drafts.map((draft, idx) => `
      <div class="draft-item">
        <div class="draft-info">
          <span class="draft-title">${draft.title || 'Untitled Draft'}</span>
          <span class="draft-date">${new Date(draft.savedAt).toLocaleString()}</span>
        </div>
        <div class="draft-actions">
          <button class="btn-draft-open">Open</button>
          <button class="btn-draft-delete" data-idx="${idx}">Delete</button>
        </div>
      </div>
    `).join('');

    // Bind delete events
    list.querySelectorAll('.btn-draft-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        store.deleteDraft(parseInt(btn.dataset.idx));
        this.openDraftsModal();
      });
    });
  }

  openTrashModal() {
    const modal = document.getElementById('trashModal');
    const list = document.getElementById('trashList');
    if (!modal || !list) return;

    const trash = store.getState().trash;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (trash.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>Trash is empty</p></div>';
      return;
    }
    
    list.innerHTML = trash.map((post, idx) => `
      <div class="trash-item">
        <span class="trash-title">${post.title}</span>
        <button class="btn-restore" data-idx="${idx}">Restore</button>
      </div>
    `).join('');

    // Bind restore events
    list.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', () => {
        store.restorePost(parseInt(btn.dataset.idx));
        this.openTrashModal();
      });
    });
  }

  destroy() {
    if (this.sidebar) this.sidebar.unmount();
    if (this.postList) this.postList.unmount();
    if (this.reader) this.reader.unmount();
    if (this.router) this.router.destroy();
  }
}

// Export
export default App;
export { App };

// Global handlers for inline onclick
window.handleEditFromMenu = function() {
  const app = window.geekForum;
  if (app) app.handleEditFromMenu();
};

window.handleDeleteFromMenu = function() {
  const app = window.geekForum;
  if (app) app.handleDeleteFromMenu();
};

window.closeDraftsModal = function() {
  document.getElementById('draftsModal')?.classList.add('hidden');
  document.getElementById('draftsModal')?.classList.remove('flex');
};

window.closeTrashModal = function() {
  document.getElementById('trashModal')?.classList.add('hidden');
  document.getElementById('trashModal')?.classList.remove('flex');
};
