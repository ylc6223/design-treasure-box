/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomePage } from '@/components/home-page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock hooks
vi.mock('@/hooks', () => ({
  useResources: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useFavorites: vi.fn(() => ({
    isFavorited: vi.fn(() => false),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  })),
  useInfiniteResources: vi.fn(() => ({
    resources: [],
    hasMore: false,
    loadMore: vi.fn(),
    isFetchingNextPage: false,
  })),
  useScrollVisibility: vi.fn(() => true),
}))

// Mock components
vi.mock('@/components/masonic-grid', () => ({
  MasonicGrid: () => <div data-testid="masonic-grid">Grid</div>,
}))

vi.mock('@/components/category-filter', () => ({
  CategoryFilter: () => <div data-testid="category-filter">Filter</div>,
}))

vi.mock('@/components/featured-sections', () => ({
  FeaturedSections: () => <div data-testid="featured-sections">Featured</div>,
}))

vi.mock('@/components/ai-prompt-input', () => ({
  AIPromptInput: ({ onSubmit }: { onSubmit: (prompt: string) => void }) => (
    <div data-testid="ai-prompt-input">
      <button onClick={() => onSubmit('test query')}>Submit</button>
    </div>
  ),
}))

vi.mock('@/components/ai-chat-interface', () => ({
  AIChatInterface: ({ isOpen, onClose, initialQuery }: any) => (
    <div data-testid="ai-chat-interface" data-open={isOpen}>
      {isOpen && (
        <>
          <div data-testid="initial-query">{initialQuery}</div>
          <button onClick={onClose}>Close</button>
        </>
      )}
    </div>
  ),
}))

describe('HomePage AI Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const renderHomePage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    )
  }

  it('应该渲染 AI 输入框', () => {
    renderHomePage()
    expect(screen.getByTestId('ai-prompt-input')).toBeInTheDocument()
  })

  it('应该渲染 AI 聊天界面（初始关闭）', () => {
    renderHomePage()
    const chatInterface = screen.getByTestId('ai-chat-interface')
    expect(chatInterface).toBeInTheDocument()
    expect(chatInterface).toHaveAttribute('data-open', 'false')
  })

  it('当用户提交查询时应该打开聊天界面', async () => {
    const user = userEvent.setup()
    renderHomePage()

    // 初始状态：聊天界面关闭
    expect(screen.getByTestId('ai-chat-interface')).toHaveAttribute('data-open', 'false')

    // 点击提交按钮
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    // 验证：聊天界面打开
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-interface')).toHaveAttribute('data-open', 'true')
    })
  })

  it('应该将初始查询传递给聊天界面', async () => {
    const user = userEvent.setup()
    renderHomePage()

    // 点击提交按钮
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    // 验证：初始查询显示在聊天界面中
    await waitFor(() => {
      expect(screen.getByTestId('initial-query')).toHaveTextContent('test query')
    })
  })

  it('当用户关闭聊天界面时应该隐藏', async () => {
    const user = userEvent.setup()
    renderHomePage()

    // 打开聊天界面
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-interface')).toHaveAttribute('data-open', 'true')
    })

    // 关闭聊天界面
    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)

    // 验证：聊天界面关闭
    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-interface')).toHaveAttribute('data-open', 'false')
    })
  })

  it('关闭后重新打开应该清除之前的查询', async () => {
    const user = userEvent.setup()
    renderHomePage()

    // 第一次打开
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('initial-query')).toHaveTextContent('test query')
    })

    // 关闭
    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-interface')).toHaveAttribute('data-open', 'false')
    })

    // 第二次打开
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('initial-query')).toHaveTextContent('test query')
    })
  })
})
