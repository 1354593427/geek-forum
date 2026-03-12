/**
 * SyncManager - 帖子同步管理
 */

import store from './Store.js';
import postsAPI from './PostsAPI.js';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  /**
   * 同步所有帖子
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping...');
      return;
    }

    try {
      this.isSyncing = true;
      console.log('[Sync] Starting sync...');
      
      // Fetch latest posts
      const posts = await postsAPI.fetchPosts();
      
      // Update store
      store.setPosts(posts);
      
      this.lastSyncTime = Date.now();
      console.log(`[Sync] Completed: ${posts.length} posts`);
      
      return posts;
    } catch (error) {
      console.error('[Sync] Failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步单个帖子
   */
  async syncPost(url) {
    try {
      const html = await postsAPI.getPost(url);
      postsAPI.invalidateCache(url);
      return html;
    } catch (error) {
      console.error(`[Sync] Failed to sync post: ${url}`, error);
      throw error;
    }
  }

  /**
   * 定时自动同步
   */
  startAutoSync(intervalMs = 5 * 60 * 1000) {
    if (this.syncInterval) {
      this.stopAutoSync();
    }
    
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);
    
    console.log(`[Sync] Auto-sync started (interval: ${intervalMs}ms)`);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[Sync] Auto-sync stopped');
    }
  }

  /**
   * 获取同步状态
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastSyncTimeFormatted: this.lastSyncTime 
        ? new Date(this.lastSyncTime).toLocaleString()
        : 'Never'
    };
  }
}

// Export singleton
export const syncManager = new SyncManager();
export default syncManager;
