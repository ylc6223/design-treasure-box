import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResourceCard } from '../resource-card'
import type { Resource } from '@/types'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError }: any) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      data-testid="resource-image"
    />
  ),
}))

const mockResource: Resource = {
  id: 'test-1',
  name: 'Test Resource',
  url: 'https://example.com',
  description: 'This is a test resource description that should be displayed in the card',
  screenshotUrl: 'https://example.com/screenshot.jpg',
  categoryId: 'color',
  tags: ['配色', '工具', '免费', '在线'],
  rating: {
    overall: 4.5,
    usability: 5.0,
    aesthetics: 4.5,
    updateFrequency: 4.0,
    freeLevel: 5.0,
  },
  curatorNote: 'Test curator note',
  isFeatured: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  viewCount: 100,
  favoriteCount: 50,
}

describe('ResourceCard', () => {
  it('renders resource information correctly', () => {
    const onFavorite = vi.fn()

    render(
      <ResourceCard
        resource={mockResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    // 检查资源名称
    expect(screen.getByText('Test Resource')).toBeInTheDocument()

    // 检查描述
    expect(
      screen.getByText(/This is a test resource description/)
    ).toBeInTheDocument()

    // 检查评分
    expect(screen.getByText('4.5')).toBeInTheDocument()

    // 检查标签（前3个）
    expect(screen.getByText('配色')).toBeInTheDocument()
    expect(screen.getByText('工具')).toBeInTheDocument()
    expect(screen.getByText('免费')).toBeInTheDocument()

    // 检查第4个标签显示为 +1
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('displays featured badge when resource is featured', () => {
    const onFavorite = vi.fn()

    render(
      <ResourceCard
        resource={mockResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    expect(screen.getByText('精选')).toBeInTheDocument()
  })

  it('does not display featured badge when resource is not featured', () => {
    const onFavorite = vi.fn()
    const nonFeaturedResource = { ...mockResource, isFeatured: false }

    render(
      <ResourceCard
        resource={nonFeaturedResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    expect(screen.queryByText('精选')).not.toBeInTheDocument()
  })

  it('calls onFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup()
    const onFavorite = vi.fn()

    render(
      <ResourceCard
        resource={mockResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    const favoriteButton = screen.getByLabelText('收藏')
    await user.click(favoriteButton)

    expect(onFavorite).toHaveBeenCalledTimes(1)
  })

  it('displays filled heart icon when resource is favorited', () => {
    const onFavorite = vi.fn()

    const { container } = render(
      <ResourceCard
        resource={mockResource}
        isFavorited={true}
        onFavorite={onFavorite}
      />
    )

    const favoriteButton = screen.getByLabelText('取消收藏')
    expect(favoriteButton).toBeInTheDocument()
    expect(favoriteButton).toHaveClass('text-red-500')
  })

  it('displays correct number of stars for rating', () => {
    const onFavorite = vi.fn()

    const { container } = render(
      <ResourceCard
        resource={mockResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    // 4.5 评分应该显示 4 个满星 + 1 个半星
    // 通过检查 SVG 元素的数量来验证
    const stars = container.querySelectorAll('svg')
    // 应该有多个 SVG: 精选的 Sparkles, 星星们, Heart
    expect(stars.length).toBeGreaterThan(5)
  })

  it('handles image loading error gracefully', async () => {
    const onFavorite = vi.fn()

    render(
      <ResourceCard
        resource={mockResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    const image = screen.getByTestId('resource-image')
    
    // 触发图片加载错误
    const errorEvent = new Event('error')
    image.dispatchEvent(errorEvent)

    // 等待状态更新
    await screen.findByText('图片加载失败')
    expect(screen.getByText('图片加载失败')).toBeInTheDocument()
  })

  it('displays only first 3 tags when resource has more than 3 tags', () => {
    const onFavorite = vi.fn()

    render(
      <ResourceCard
        resource={mockResource}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    // 应该显示前3个标签
    expect(screen.getByText('配色')).toBeInTheDocument()
    expect(screen.getByText('工具')).toBeInTheDocument()
    expect(screen.getByText('免费')).toBeInTheDocument()

    // 第4个标签不应该直接显示
    expect(screen.queryByText('在线')).not.toBeInTheDocument()

    // 应该显示 +1 表示还有1个标签
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('displays all tags when resource has 3 or fewer tags', () => {
    const onFavorite = vi.fn()
    const resourceWithFewTags = {
      ...mockResource,
      tags: ['配色', '工具'],
    }

    render(
      <ResourceCard
        resource={resourceWithFewTags}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    expect(screen.getByText('配色')).toBeInTheDocument()
    expect(screen.getByText('工具')).toBeInTheDocument()
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('renders correct rating for whole number', () => {
    const onFavorite = vi.fn()
    const resourceWithWholeRating = {
      ...mockResource,
      rating: {
        ...mockResource.rating,
        overall: 4.0,
      },
    }

    render(
      <ResourceCard
        resource={resourceWithWholeRating}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    expect(screen.getByText('4.0')).toBeInTheDocument()
  })

  it('truncates long descriptions to 2 lines', () => {
    const onFavorite = vi.fn()
    const resourceWithLongDescription = {
      ...mockResource,
      description:
        'This is a very long description that should be truncated to two lines. It contains a lot of text that would normally overflow the card layout. We need to make sure it is properly truncated with ellipsis.',
    }

    const { container } = render(
      <ResourceCard
        resource={resourceWithLongDescription}
        isFavorited={false}
        onFavorite={onFavorite}
      />
    )

    const description = container.querySelector('.line-clamp-2')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('line-clamp-2')
  })
})