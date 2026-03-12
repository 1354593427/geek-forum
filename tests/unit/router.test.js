/**
 * Router Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window and location
const mockHash = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    hash: { get: mockHash, set: (v) => mockHash.mockReturnValue(v) }
  },
  writable: true
});

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
});

import Router from '../src/core/Router.js';

describe('Router', () => {
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHash.mockReturnValue('');
    router = new Router();
  });

  describe('Registration', () => {
    it('should register routes', () => {
      const handler = vi.fn();
      
      router.register('/', handler);
      
      expect(router.routes.has('/')).toBe(true);
    });

    it('should support chaining', () => {
      const handler = vi.fn();
      
      const result = router.on('/test', handler);
      
      expect(result).toBe(router);
    });
  });

  describe('Navigation', () => {
    it('should navigate to URL', () => {
      router.register('/test', vi.fn());
      
      router.navigate('/test');
      
      expect(window.location.hash).toBe('#/test');
    });

    it('should get current URL', () => {
      mockHash.mockReturnValue('#/test');
      
      expect(router.getCurrentUrl()).toBe('/test');
    });
  });

  describe('Route Matching', () => {
    it('should match exact routes', () => {
      const handler = vi.fn();
      router.register('/home', handler);
      
      const match = router.matchRoute('/home');
      
      expect(match).not.toBeNull();
      expect(match.handler).toBe(handler);
    });

    it('should match parameterized routes', () => {
      const handler = vi.fn();
      router.register('/post/:id', handler);
      
      const match = router.matchRoute('/post/123');
      
      expect(match).not.toBeNull();
      expect(match.params.id).toBe('123');
    });

    it('should return null for unmatched routes', () => {
      router.register('/home', vi.fn());
      
      const match = router.matchRoute('/about');
      
      expect(match).toBeNull();
    });
  });

  describe('Guards', () => {
    it('should execute beforeEach guard', () => {
      const guard = vi.fn(() => false);
      router.beforeEach(guard);
      router.register('/', vi.fn());
      
      router.handleHashChange();
      
      expect(guard).toHaveBeenCalled();
    });

    it('should prevent navigation when guard returns false', () => {
      router.beforeEach(() => false);
      const handler = vi.fn();
      router.register('/', handler);
      
      router.handleHashChange();
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should initialize and handle current hash', () => {
      mockHash.mockReturnValue('#/test');
      const handler = vi.fn();
      router.register('/test', handler);
      
      router.init();
      
      expect(handler).toHaveBeenCalled();
    });

    it('should destroy and remove listeners', () => {
      router.init();
      router.destroy();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('hashchange', router.handleHashChange);
    });
  });
});
