import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// O ResponsiveContainer do Recharts mede o container; o jsdom nao tem ResizeObserver nem layout.
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverFalso;
