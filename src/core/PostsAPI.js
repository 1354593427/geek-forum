/**
 * PostsAPI - 帖子数据层
 */

class PostsAPI {
  constructor() {
    this.baseUrl = ''; // Relative path
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * 获取所有帖子
   */
  async fetchPosts() {
    // Check cache first
    const cached = this.cache.get('posts');
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();
      
      // Update cache
      this.cache.set('posts', { data: posts, timestamp: Date.now() });
      
      return posts;
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      throw error;
    }
  }

  /**
   * 获取单个帖子
   */
  async getPost(url) {
    const cacheKey = `post:${url}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      
      this.cache.set(cacheKey, { data: html, timestamp: Date.now() });
      
      return html;
    } catch (error) {
      console.error(`Failed to fetch post ${url}:`, error);
      throw error;
    }
  }

  /**
   * 搜索帖子
   */
  async searchPosts(query) {
    const posts = await this.fetchPosts();
    
    if (!query || query.trim() === '') {
      return posts;
    }

    const lowerQuery = query.toLowerCase();
    
    return posts.filter(post => {
      const title = post.title?.toLowerCase() || '';
      const excerpt = post.excerpt?.toLowerCase() || '';
      const tags = post.tags?.join(' ').toLowerCase() || '';
      const author = post.author?.toLowerCase() || '';
      
      return title.includes(lowerQuery) ||
             excerpt.includes(lowerQuery) ||
             tags.includes(lowerQuery) ||
             author.includes(lowerQuery);
    });
  }

  /**
   * 按分类获取帖子
   */
  async getPostsByCategory(category) {
    const posts = await this.fetchPosts();
    
    if (category === 'all') {
      return posts;
    }
    
    return posts.filter(post => post.category === category);
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 清理单个缓存
   */
  invalidateCache(key) {
    if (key === 'posts') {
      this.cache.delete('posts');
    } else {
      this.cache.delete(`post:${key}`);
    }
  }
}

// Export singleton
export const postsAPI = new PostsAPI();
export default postsAPI;
