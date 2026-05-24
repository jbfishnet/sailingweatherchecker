import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/api/spots') return Promise.resolve({ data: [] });
      if (url === '/api/settings') return Promise.resolve({ data: { minBeaufort: 2 } });
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }
}))
