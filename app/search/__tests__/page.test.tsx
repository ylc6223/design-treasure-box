import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SearchResultsPage from '../page';

// Mock next/navigation
const mockSearchParams = new Map<string, string>();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) || null,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock data
vi.mock('@/data/categories.json', () => ({
  default: [
    { id: 'color', name: '配色工具', icon: 'Palette', description: '调色板', color: '#E94560' },
    { id: 'css', name: 'CSS模板', icon: 'Code', description: 'CSS框架', color: '#00D9FF' },
  ],
}));

vi.mock('@/data/resources.json', () => ({
  default: [
    {
      id: 'res1',
      name: 'Coolors',
      url: 'https://coolors.co',
      description: '配色方案生成器',
      screenshot: 'https://example.com/coolors.png',
      categoryId: 'color',
      tags: ['配色', '工具', '免费'],
      rating: { overall: 4.5, usability: 4.5, aesthetics: 5, updateFrequency: 4, freeLevel: 5 },
      curatorNote: '非常好用的配色工具',
      isFeatured: true,
      createdAt: '2024-01-01T00:00:00Z',
      viewCount: 1000,
      favoriteCount: 500,
    },
    {
      id: 'res2',
      name: 'Tailwind CSS',
      url: 'https://tailwindcss.com',
      description: 'CSS框架',
      screenshot: 'https://example.com/tailwind.png',
      categoryId: 'css',
      tags: ['CSS', '框架', '免费'],
      rating: { overall: 5, usability: 5, aesthetics: 4.5, updateFrequency: 5, freeLevel: 5 },
      curatorNote: '最流行的CSS框架',
      isFeatured: true,
      createdAt: '2024-01-02T00:00:00Z',
      viewCount: 2000,
      favoriteCount: 1000,
    },
  ],
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SearchResultsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockSearchParams.clear();
    localStorageMock.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  it('displays search results when query matches resources', async () => {
    mockSearchParams.set('q', '配色');

    renderWithProviders(<SearchResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('搜索结果')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/找到.*1.*个相关资源/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Coolors')).toBeInTheDocument();
    });
  });

  it('displays no results message when query does not match', async () => {
    mockSearchParams.set('q', '不存在的资源');

    renderWithProviders(<SearchResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('未找到相关资源')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('热门推荐')).toBeInTheDocument();
    });
  });

  it('displays search query in the search info section', async () => {
    mockSearchParams.set('q', '测试查询');

    renderWithProviders(<SearchResultsPage />);

    await waitFor(() => {
      // 查找搜索信息区域中的查询文本
      const searchInfo = screen.getByText('测试查询');
      expect(searchInfo).toBeInTheDocument();
    });
  });

  it('shows popular resources when no results found', async () => {
    mockSearchParams.set('q', '不存在');

    renderWithProviders(<SearchResultsPage />);

    await waitFor(() => {
      expect(screen.getByText('热门推荐')).toBeInTheDocument();
    });

    // Should show resources sorted by favoriteCount
    await waitFor(() => {
      expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    });
  });
});
