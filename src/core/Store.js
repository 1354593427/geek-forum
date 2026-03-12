/**
 * Store - 轻量级响应式状态管理
 */

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = {
      posts: [],
      currentPost: null,
      currentUrl: '',
      category: 'all',
      searchQuery: '',
      sortOrder: 'newest',
      drafts: [],
      trash: [],
      isLoading: false,
      isEditMode: false,
      editingPost: null
    };
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    const prevState = this.state;
    this.state = { ...this.state, ...partial };
    this.notify(prevState);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(prevState) {
    this.listeners.forEach(listener => listener(this.state, prevState));
  }

  // ============ Posts ============
  setPosts(posts) {
    this.setState({ posts });
  }

  getPosts() {
    let { posts, category, searchQuery, sortOrder } = this.state;
    
    // Filter by category
    if (category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }
    
    // Sort
    posts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return posts;
  }

  setCurrentPost(post) {
    this.setState({ currentPost: post, currentUrl: post?.url || '' });
  }

  setCurrentUrl(url) {
    this.setState({ currentUrl: url });
    const post = this.state.posts.find(p => p.url === url);
    this.setState({ currentPost: post || null });
  }

  // ============ UI State ============
  setCategory(category) {
    this.setState({ category });
  }

  setSearchQuery(query) {
    this.setState({ searchQuery: query });
  }

  setSortOrder(order) {
    this.setState({ sortOrder: order });
  }

  setLoading(loading) {
    this.setState({ isLoading: loading });
  }

  // ============ Edit Mode ============
  setEditMode(isEditMode, post = null) {
    this.setState({ isEditMode, editingPost: post });
  }

  // ============ Drafts ============
  loadDrafts() {
    try {
      const drafts = JSON.parse(localStorage.getItem('openclaw_drafts') || '[]');
      this.setState({ drafts });
    } catch (e) {
      console.error('Failed to load drafts:', e);
      this.setState({ drafts: [] });
    }
  }

  saveDraft(draft) {
    const drafts = [...this.state.drafts, { ...draft, savedAt: Date.now() }];
    localStorage.setItem('openclaw_drafts', JSON.stringify(drafts));
    this.setState({ drafts });
  }

  deleteDraft(index) {
    const drafts = this.state.drafts.filter((_, i) => i !== index);
    localStorage.setItem('openclaw_drafts', JSON.stringify(drafts));
    this.setState({ drafts });
  }

  clearDrafts() {
    localStorage.setItem('openclaw_drafts', '[]');
    this.setState({ drafts: [] });
  }

  // ============ Trash ============
  loadTrash() {
    try {
      const trash = JSON.parse(localStorage.getItem('openclaw_trash') || '[]');
      this.setState({ trash });
    } catch (e) {
      console.error('Failed to load trash:', e);
      this.setState({ trash: [] });
    }
  }

  moveToTrash(post) {
    const trash = [...this.state.trash, post];
    const posts = this.state.posts.filter(p => p.url !== post.url);
    localStorage.setItem('openclaw_trash', JSON.stringify(trash));
    this.setState({ trash, posts });
  }

  restorePost(index) {
    const post = this.state.trash[index];
    const trash = this.state.trash.filter((_, i) => i !== index);
    const posts = [...this.state.posts, post];
    localStorage.setItem('openclaw_trash', JSON.stringify(trash));
    this.setState({ trash, posts });
  }

  emptyTrash() {
    localStorage.setItem('openclaw_trash', '[]');
    this.setState({ trash: [] });
  }
}

// Export singleton
export const store = new Store();
export default store;
