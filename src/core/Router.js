/**
 * Router - 基于 Hash 的路由管理
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.beforeEach = null;
    
    // Bind methods
    this.handleHashChange = this.handleHashChange.bind(this);
    
    // Initialize
    window.addEventListener('hashchange', this.handleHashChange);
  }

  /**
   * 注册路由
   * @param {string} path - 路由路径，支持参数如 /post/:id
   * @param {function} handler - 路由处理函数
   */
  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  /**
   * 注册路由（别名）
   */
  on(path, handler) {
    return this.register(path, handler);
  }

  /**
   * 全局前置守卫
   */
  beforeEach(fn) {
    this.beforeEach = fn;
    return this;
  }

  /**
   * 解析路由参数
   */
  parseParams(routePath, url) {
    const params = {};
    const routeParts = routePath.split('/');
    const urlParts = url.split('/');
    
    routeParts.forEach((part, i) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = urlParts[i];
      }
    });
    
    return params;
  }

  /**
   * 匹配路由
   */
  matchRoute(url) {
    // Exact match first
    if (this.routes.has(url)) {
      return { handler: this.routes.get(url), params: {} };
    }
    
    // Pattern match
    for (const [routePath, handler] of this.routes) {
      const routeParts = routePath.split('/');
      const urlParts = url.split('?')[0].split('/'); // Ignore query string
      
      if (routeParts.length !== urlParts.length) continue;
      
      let matched = true;
      const params = {};
      
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = urlParts[i];
        } else if (routeParts[i] !== urlParts[i]) {
          matched = false;
          break;
        }
      }
      
      if (matched) {
        return { handler, params };
      }
    }
    
    return null;
  }

  /**
   * 处理路由变化
   */
  handleHashChange() {
    const url = window.location.hash.slice(1) || '/';
    
    // Execute beforeEach guard
    if (this.beforeEach) {
      const result = this.beforeEach(url);
      if (result === false) return;
    }
    
    const matched = this.matchRoute(url);
    
    if (matched) {
      matched.handler(matched.params, url);
    } else {
      // 404 handler
      const notFound = this.routes.get('/404');
      if (notFound) {
        notFound({ url });
      } else {
        console.warn(`Route not found: ${url}`);
      }
    }
  }

  /**
   * 导航到指定路径
   */
  navigate(url) {
    window.location.hash = url;
  }

  /**
   * 获取当前路径
   */
  getCurrentUrl() {
    return window.location.hash.slice(1) || '/';
  }

  /**
   * 初始化路由
   */
  init() {
    this.handleHashChange();
    return this;
  }

  /**
   * 销毁路由
   */
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }
}

// Export
export default Router;
export { Router };
