/**
 * Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Import after mock
import Store from '../src/core/Store.js';

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = new Store();
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      
      expect(state.posts).toEqual([]);
      expect(state.currentPost).toBeNull();
      expect(state.currentUrl).toBe('');
      expect(state.category).toBe('all');
      expect(state.searchQuery).toBe('');
      expect(state.sortOrder).toBe('newest');
      expect(state.isLoading).toBe(false);
      expect(state.isEditMode).toBe(false);
    });
  });

  describe('setState', () => {
    it('should update state correctly', () => {
      store.setState({ category: 'robot' });
      
      expect(store.getState().category).toBe('robot');
    });

    it('should notify subscribers on state change', () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      
      store.setState({ category: 'vla' });
      
      expect(subscriber).toHaveBeenCalled();
    });
  });

  describe('Posts', () => {
    it('should set posts', () => {
      const posts = [{ url: 'post1.html', title: 'Post 1' }];
      store.setPosts(posts);
      
      expect(store.getState().posts).toEqual(posts);
    });

    it('should filter posts by category', () => {
      const posts = [
        { url: 'post1.html', category: 'robot' },
        { url: 'post2.html', category: 'vla' },
        { url: 'post3.html', category: 'robot' }
      ];
      
      store.setPosts(posts);
      store.setCategory('robot');
      
      const filtered = store.getPosts();
      
      expect(filtered.length).toBe(2);
    });

    it('should sort posts by date', () => {
      const posts = [
        { url: 'post1.html', date: '2026-01-01' },
        { url: 'post2.html', date: '2026-03-01' },
        { url: 'post3.html', date: '2026-02-01' }
      ];
      
      store.setPosts(posts);
      store.setSortOrder('newest');
      
      const sorted = store.getPosts();
      
      expect(sorted[0].url).toBe('post2.html');
    });
  });

  describe('Drafts', () => {
    it('should save and load drafts', () => {
      const draft = { title: 'My Draft', content: 'Content' };
      
      store.saveDraft(draft);
      store.loadDrafts();
      
      expect(store.getState().drafts.length).toBe(1);
      expect(store.getState().drafts[0].title).toBe('My Draft');
    });

    it('should delete draft by index', () => {
      store.saveDraft({ title: 'Draft 1' });
      store.saveDraft({ title: 'Draft 2' });
      
      store.deleteDraft(0);
      
      expect(store.getState().drafts.length).toBe(1);
      expect(store.getState().drafts[0].title).toBe('Draft 2');
    });
  });

  describe('Trash', () => {
    it('should move post to trash', () => {
      store.setPosts([{ url: 'post1.html', title: 'Post 1' }]);
      
      store.moveToTrash({ url: 'post1.html', title: 'Post 1' });
      
      expect(store.getState().trash.length).toBe(1);
      expect(store.getState().posts.length).toBe(0);
    });

    it('should restore post from trash', () => {
      store.moveToTrash({ url: 'post1.html', title: 'Post 1' });
      
      store.restorePost(0);
      
      expect(store.getState().trash.length).toBe(0);
      expect(store.getState().posts.length).toBe(1);
    });
  });
});
