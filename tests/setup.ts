import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const chromeMock = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  storage: {
    sync: { get: vi.fn(), set: vi.fn() },
    local: { get: vi.fn(), set: vi.fn() },
  },
};

Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
});
