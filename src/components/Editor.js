/**
 * Editor 组件 - 内置编辑器
 */

import store from '../core/Store.js';
import postsAPI from '../core/PostsAPI.js';

class Editor {
  constructor(container) {
    this.container = container;
    this.cmEditor = null;
    this.editingUrl = null;
    this.userHasEdited = false;
  }

  async enterEditMode(url) {
    const state = store.getState();
    const post = state.posts.find(p => p.url === url);
    
    if (!post) {
      console.error('Post not found:', url);
      return;
    }

    this.editingUrl = url;
    store.setEditMode(true, post);
    document.body.classList.add('edit-mode');

    // Show editor panel
    const editorPanel = document.getElementById('integratedEditor');
    if (editorPanel) {
      editorPanel.classList.add('active');
    }

    // Load source
    await this.loadSource(url);
    this.loadMetadata(post);
  }

  async loadSource(url) {
    try {
      const source = await postsAPI.getPost(url);
      if (this.cmEditor) {
        this.cmEditor.setValue(source);
        this.cmEditor.clearHistory();
      }
    } catch (e) {
      console.error('Failed to load source:', e);
    }
  }

  loadMetadata(post) {
    const titleEl = document.getElementById('editTitle');
    const categoryEl = document.getElementById('editCategory');
    const tagsEl = document.getElementById('editTags');

    if (titleEl) titleEl.value = post.title || '';
    if (categoryEl) categoryEl.value = post.category || 'robot';
    if (tagsEl) tagsEl.value = (post.tags || []).join(', ');
  }

  exitEditMode() {
    this.editingUrl = null;
    this.userHasEdited = false;
    store.setEditMode(false, null);
    document.body.classList.remove('edit-mode');

    const editorPanel = document.getElementById('integratedEditor');
    if (editorPanel) {
      editorPanel.classList.remove('active');
    }
  }

  async saveAndExit() {
    if (!this.editingUrl) return;

    const title = document.getElementById('editTitle')?.value;
    const category = document.getElementById('editCategory')?.value;
    const tags = document.getElementById('editTags')?.value.split(',').map(t => t.trim()).filter(t => t);
    const source = this.cmEditor?.getValue() || '';

    // Update local state
    const state = store.getState();
    const postIndex = state.posts.findIndex(p => p.url === this.editingUrl);
    
    if (postIndex !== -1) {
      const posts = [...state.posts];
      posts[postIndex] = { ...posts[postIndex], title, category, tags };
      store.setPosts(posts);
    }

    // TODO: Save to file (requires backend or file system API)
    console.log('Saving:', { url: this.editingUrl, title, category, tags, sourceLength: source.length });

    this.exitEditMode();
  }

  syncToPreview() {
    if (!this.userHasEdited || !this.cmEditor) return;

    const source = this.cmEditor.getValue();
    const iframe = document.getElementById('postIframe');
    
    if (iframe && iframe.srcdoc !== undefined) {
      iframe.srcdoc = source;
    }
  }

  locateInSource(searchText) {
    if (!this.cmEditor || !searchText) return;

    const query = searchText.trim().slice(0, 80);
    const cursor = this.cmEditor.getSearchCursor(query);
    
    if (cursor.findNext()) {
      this.cmEditor.scrollIntoView({ line: cursor.from().line, ch: 0 }, 150);
      this.cmEditor.setCursor({ line: cursor.from().line, ch: 0 });
    }
  }
}

export default Editor;
