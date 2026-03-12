/**
 * localStorage 封装工具
 */

const STORAGE_PREFIX = 'geek_forum_';

/**
 * 存储操作类
 */
class Storage {
  constructor(prefix = STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  /**
   * 获取键名
   */
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 设置值
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error(`Storage set error:`, error);
      return false;
    }
  }

  /**
   * 获取值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage get error:`, error);
      return defaultValue;
    }
  }

  /**
   * 删除值
   */
  remove(key) {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`Storage remove error:`, error);
      return false;
    }
  }

  /**
   * 清空所有存储
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error(`Storage clear error:`, error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  has(key) {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  /**
   * 获取所有键
   */
  keys() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.slice(this.prefix.length));
  }
}

// Export singleton instance
export const storage = new Storage();
export default storage;
