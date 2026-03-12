/**
 * Sidebar 组件 - 侧边栏导航
 */

import store from '../core/Store.js';
import { formatDate } from '../utils/date.js';

class Sidebar {
  constructor(container) {
    this.container = container;
    this.unsubscribe = null;
    this.draftCount = 0;
    this.trashCount = 0;
  }

  render() {
    const state = store.getState();
    const { category } = state;
    
    this.container.innerHTML = `
      <div class="sidebar-content">
        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-title">OpenClaw</span>
            <span class="logo-subtitle">Research Hub</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <div class="nav-label">Navigation</div>
          <button class="nav-btn ${category === 'all' ? 'active' : ''}" data-category="all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            全部资源
          </button>
          <button class="nav-btn ${category === 'robot' ? 'active' : ''}" data-category="robot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4a2 2 0 114 0v1a2 2 0 11-4 0V4zM11 14a2 2 0 114 0v1a2 2 0 11-4 0v-1z"></path>
            </svg>
            机器人与仿真
          </button>
          <button class="nav-btn ${category === 'algo' ? 'active' : ''}" data-category="algo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
            算法与架构
          </button>
          <button class="nav-btn ${category === 'vla' ? 'active' : ''}" data-category="vla">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            具身智能 VLA
          </button>
          <button class="nav-btn ${category === 'travel' ? 'active' : ''}" data-category="travel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.065M15 20a8 8 0 10-8.914-13.483"></path>
            </svg>
            探索与生活
          </button>
          
          <div class="nav-divider"></div>
          
          <button class="nav-btn" id="btnDrafts">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            草稿箱
            <span class="nav-badge" id="draftCount">${this.draftCount}</span>
          </button>
          <button class="nav-btn" id="btnTrash">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            回收站
            <span class="nav-badge" id="trashCount">${this.trashCount}</span>
          </button>
        </nav>

        <!-- Live Signal Feed -->
        <div class="sidebar-live">
          <div class="live-header">
            <span class="live-dot"></span>
            <span class="live-label">Live Signal Feed</span>
          </div>
          <div class="live-log" id="liveLog">
            <div class="log-item">
              <span class="log-tag">[SYS]</span>
              <span>Neural-Link Up</span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="sidebar-stats">
          <div class="stats-card">
            <div class="stats-header">
              <span class="stats-label">Platform Status</span>
              <span class="stats-indicator"></span>
            </div>
            <div class="stats-content">
              <div class="stat-item">
                <span class="stat-label">总研报数</span>
                <span class="stat-value" id="totalPosts">--</span>
              </div>
            </div>
          </div>
          <button class="btn-publish">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M12 4v16m8-8H4"></path>
            </svg>
            发布研究任务
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startLiveLog();
  }

  bindEvents() {
    // Category buttons
    this.container.querySelectorAll('.nav-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        store.setCategory(category);
      });
    });

    // Drafts button
    const draftsBtn = this.container.querySelector('#btnDrafts');
    if (draftsBtn) {
      draftsBtn.addEventListener('click', () => {
        this.container.dispatchEvent(new CustomEvent('open-drafts'));
      });
    }

    // Trash button
    const trashBtn = this.container.querySelector('#btnTrash');
    if (trashBtn) {
      trashBtn.addEventListener('click', () => {
        this.container.dispatchEvent(new CustomEvent('open-trash'));
      });
    }
  }

  updateBadge(type, count) {
    const el = this.container.querySelector(`#${type}Count`);
    if (el) {
      el.textContent = count;
    }
  }

  updateTotalPosts(count) {
    const el = this.container.querySelector('#totalPosts');
    if (el) {
      el.textContent = count;
    }
  }

  startLiveLog() {
    const logs = [
      "Agent-04 scanning MuJoCo sensors...",
      "Syncing v2.4 VLA weights...",
      "Decoding collision manifold data",
      "Optimizing PPO actor-critic network",
      "New post indexed from Guilin node",
      "Trajectory replay buffer hydrated",
      "Neutral verify pass: 99.8%",
      "Robot hand grasping goal reached"
    ];

    const logContainer = this.container.querySelector('#liveLog');
    if (!logContainer) return;

    setInterval(() => {
      const msg = logs[Math.floor(Math.random() * logs.length)];
      const div = document.createElement('div');
      div.className = 'log-item animate-fadeIn';
      div.innerHTML = `<span class="log-tag">[TRM]</span><span>${msg}</span>`;
      logContainer.prepend(div);
      if (logContainer.children.length > 5) {
        logContainer.lastElementChild.remove();
      }
    }, 3000);
  }

  mount() {
    this.render();
    
    // Subscribe to state changes
    this.unsubscribe = store.subscribe((state, prevState) => {
      if (state.category !== prevState.category) {
        this.updateActiveButton(state.category);
      }
      if (state.posts !== prevState.posts) {
        this.updateTotalPosts(state.posts.length);
      }
    });

    // Load initial data
    store.loadDrafts();
    store.loadTrash();
    this.draftCount = store.getState().drafts.length;
    this.trashCount = store.getState().trash.length;
    this.updateBadge('draft', this.draftCount);
    this.updateBadge('trash', this.trashCount);
  }

  updateActiveButton(category) {
    this.container.querySelectorAll('.nav-btn[data-category]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
  }

  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default Sidebar;
