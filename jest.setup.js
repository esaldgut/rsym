// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
// Use CommonJS require so Jest (non-ESM) can load this setup file.
require('@testing-library/jest-dom');

// Provide a lightweight mock for IntersectionObserver used by components
// that rely on it (ProductDetailModal uses IntersectionObserver).
class MockIntersectionObserver {
	constructor(callback, options) {
		this.callback = callback;
		this.options = options;
		this.observed = new Set();
	}
	observe(target) {
		this.observed.add(target);
	}
	unobserve(target) {
		this.observed.delete(target);
	}
	disconnect() {
		this.observed.clear();
	}
	// helper to simulate intersection for tests
	trigger(entries) {
		if (typeof this.callback === 'function') this.callback(entries, this);
	}
}

if (typeof global.IntersectionObserver === 'undefined') {
	global.IntersectionObserver = MockIntersectionObserver;
}
