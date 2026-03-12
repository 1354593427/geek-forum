/**
 * Reader 组件 - 内容阅读器
 */

import store from '../core/Store.js';
import postsAPI from '../core/PostsAPI.js';

class Reader {
  constructor(container) {
    this.container = container;
    this.iframe = null;
    this.unsubscribe = null;
  }

  render() {
    const state = store.getState();
    const { currentPost, currentUrl, isLoading } = state;
    
    // Placeholder when no post selected
    if (!currentUrl) {
      this.renderPlaceholder();
      return;
    }

    this.container.innerHTML = `
      <!-- Reader Toolbar -->
      <div class="reader-toolbar">
        <div class="toolbar-breadcrumb">
          <span class="breadcrumb-category">Research / ${currentPost?.category?.toUpperCase() || 'INFO'}</span>
          <span class="breadcrumb-title">${currentPost?.title || '--'}</span>
        </div>
        <div class="toolbar-actions">
          <button class="toolbar-btn" id="btnOpenExt" title="在新标签页打开">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </button>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" id="btnFullscreen" title="全屏阅读模式">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
          </button>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" id="btnClose" title="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="reader-content">
        <div class="reader-loading ${isLoading ? '' : 'hidden'}">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading...</span>
        </div>
        <div class="reader-iframe-wrapper">
          <iframe id="postIframe" class="reader-iframe" src="${currentUrl}"></iframe>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderPlaceholder() {
    this.container.innerHTML = `
      <div class="reader-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-badge">
            <span class="placeholder-dot"></span>
            Core Node Alpha-01 Online
          </div>
          <h1 class="placeholder-title">
            OpenClaw <span class="text-brand">Workstation</span>
          </h1>
          <p class="placeholder-desc">
            欢迎回到科研控制台。当前所有神经链路运行正常，已就绪处理新的具身智能实验记录与算法研报。
          </p>
          <div class="placeholder-clock" id="readerClock">--:--:--</div>
          
          <!-- Dashboard Cards -->
          <div class="placeholder-dashboard">
            <div class="dashboard-card pulse-card">
              <h3>Topic Pulse (7D)</h3>
              <div class="pulse-chart">
                <svg viewBox="0 0 400 100" preserveAspectRatio="none">
                  <path d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,40" 
                        fill="none" stroke="var(--color-brand-500)" stroke-width="4" stroke-linecap="round"></path>
                </svg>
              </div>
              <div class="pulse-stats">
                <div>
                  <span class="stats-label">Growth</span>
                  <span class="stats-value">+12%</span>
                </div>
                <span class="stats-badge">Robot Simulation Peak</span>
              </div>
            </div>
            
            <div class="dashboard-card density-card">
              <h3>Archive Density</h3>
              <div class="density-value">98.2<span>%</span></div>
              <p>链路完整性已达到峰值</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.startClock();
  }

  startClock() {
    const clock = this.container.querySelector('#readerClock');
    if (!clock) return;
    
    const update = () => {
      const now = new Date();
      clock.textContent = now.toTimeString().split(' ')[0];
    };
    
    update();
    setInterval(update, 1000);
  }

  bindEvents() {
    // Close button
    const closeBtn = this.container.querySelector('#btnClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.location.hash = '';
      });
    }

    // Open external
    const extBtn = this.container.querySelector('#btnOpenExt');
    if (extBtn) {
      extBtn.addEventListener('click', () => {
        const url = store.getState().currentUrl;
        if (url) window.open(url, '_blank');
      });
    }

    // Fullscreen
    const fsBtn = this.container.querySelector('#btnFullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        document.body.classList.toggle('fullscreen-reader');
      });
    }

    // Iframe load event
    const iframe = this.container.querySelector('#postIframe');
    if (iframe) {
      iframe.addEventListener('load', () => {
        this.injectContentScript(iframe);
        store.setLoading(false);
      });
    }
  }

  injectContentScript(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Make all links open in new tab
      doc.querySelectorAll('a').forEach(link => {
        link.setAttribute('target', '_blank');
      });

      // Hide nav and footer
      doc.querySelectorAll('nav, footer').forEach(el => {
        el.style.display = 'none';
      });

      // Optimize main content
      const main = doc.querySelector('main');
      if (main) {
        main.style.maxWidth = '1000px';
        main.style.padding = '3rem 2rem';
      }
    } catch (e) {
      console.log('Cross-origin or script injection blocked');
    }
  }

  async loadPost(url) {
    store.setLoading(true);
    
    try {
      await postsAPI.getPost(url);
      // Iframe will handle the display
    } catch (error) {
      console.error('Failed to load post:', error);
    }
    
    store.setLoading(false);
  }

  mount() {
    this.render();
    
    // Subscribe to state changes
    this.unsubscribe = store.subscribe((state, prevState) => {
      if (state.currentUrl !== prevState.currentUrl) {
        if (state.currentUrl) {
          this.loadPost(state.currentUrl);
        }
        this.render();
      }
    });
  }

  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default Reader;
