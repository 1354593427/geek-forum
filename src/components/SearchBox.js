/**
 * SearchBox 组件 - 搜索框
 */

import store from '../core/Store.js';
// Fuse.js is loaded as global from CDN

class SearchBox {
  constructor(inputElement) {
    this.input = inputElement;
    this.fuse = null;
    this.debounceTimer = null;
  }

  initialize(posts) {
    // Initialize Fuse.js
    this.fuse = new window.Fuse(posts, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'excerpt', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'author', weight: 0.1 }
      ],
      threshold: 0.35,
      ignoreLocation: true,
      useExtendedSearch: true,
      includeScore: true,
      includeMatches: true
    });
  }

  search(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    if (!this.fuse) {
      console.warn('SearchBox not initialized');
      return [];
    }

    const results = this.fuse.search(query);
    return results.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }));
  }

  bindEvents() {
    // Debounced search
    this.input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      // Clear previous timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      // Debounce
      this.debounceTimer = setTimeout(() => {
        store.setSearchQuery(query);
        
        // Emit search event
        this.input.dispatchEvent(new CustomEvent('search', {
          detail: { query, results: this.search(query) }
        }));
      }, 150);
    });

    // Clear search
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clear();
      }
    });
  }

  clear() {
    this.input.value = '';
    store.setSearchQuery('');
  }

  focus() {
    this.input.focus();
  }

  getValue() {
    return this.input.value;
  }

  setValue(value) {
    this.input.value = value;
  }
}

export default SearchBox;
