/**
 * Modal 组件 - 模态框
 */

class Modal {
  constructor(modalId, options = {}) {
    this.modal = document.getElementById(modalId);
    this.options = {
      closeOnOverlay: true,
      closeOnEscape: true,
      onOpen: null,
      onClose: null,
      ...options
    };
    
    this.isOpen = false;
    this.bindEvents();
  }

  bindEvents() {
    // Close on overlay click
    if (this.options.closeOnOverlay) {
      this.modal?.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }

    // Close on Escape
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
  }

  open() {
    if (!this.modal) return;
    
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Trigger open callback
    if (this.options.onOpen) {
      this.options.onOpen(this);
    }
  }

  close() {
    if (!this.modal) return;
    
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    this.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Trigger close callback
    if (this.options.onClose) {
      this.options.onClose(this);
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  setContent(html) {
    const contentEl = this.modal?.querySelector('.modal-body');
    if (contentEl) {
      contentEl.innerHTML = html;
    }
  }

  setTitle(title) {
    const titleEl = this.modal?.querySelector('.modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  getState() {
    return this.isOpen;
  }
}

/**
 * Modal Manager - 管理多个模态框
 */
class ModalManager {
  constructor() {
    this.modals = new Map();
  }

  register(id, options) {
    const modal = new Modal(id, options);
    this.modals.set(id, modal);
    return modal;
  }

  get(id) {
    return this.modals.get(id);
  }

  open(id) {
    const modal = this.modals.get(id);
    if (modal) {
      modal.open();
    }
  }

  close(id) {
    const modal = this.modals.get(id);
    if (modal) {
      modal.close();
    }
  }

  closeAll() {
    this.modals.forEach(modal => {
      if (modal.isOpen) {
        modal.close();
      }
    });
  }
}

// Export
export default Modal;
export { ModalManager };
