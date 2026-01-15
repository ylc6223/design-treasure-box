import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../header'
import type { Category } from '@/types'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock ThemeToggle
vi.mock('../theme-toggle', () => ({
  ThemeToggle: () => <button>Theme Toggle</button>,
}))

const mockCategories: Category[] = [
  {
    id: 'color',
    name: '配色工具',
    icon: 'Palette',
    description: '调色板、配色方案生成器',
    color: '#E94560',
  },
  {
    id: 'css',
    name: 'CSS模板',
    icon: 'Code',
    description: 'CSS框架、样式库、动画效果',
    color: '#00D9FF',
  },
  {
    id: 'font',
    name: '字体资源',
    icon: 'Type',
    description: '免费字体、字体配对工具',
    color: '#F8B500',
  },
]

describe('Header', () => {
  it('renders logo', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    expect(screen.getByText('设')).toBeInTheDocument()
    expect(screen.getByText('设计百宝箱')).toBeInTheDocument()
  })

  it('renders all category buttons', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '配色工具' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CSS模板' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '字体资源' })).toBeInTheDocument()
  })

  it('calls onCategoryChange when "全部" is clicked', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    const allButton = screen.getByRole('button', { name: '全部' })
    await user.click(allButton)

    expect(onCategoryChange).toHaveBeenCalledWith('')
  })

  it('calls onCategoryChange when category button is clicked', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    const colorButton = screen.getByRole('button', { name: '配色工具' })
    await user.click(colorButton)

    expect(onCategoryChange).toHaveBeenCalledWith('color')
  })

  it('highlights active category', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        activeCategory="color"
        onCategoryChange={onCategoryChange}
      />
    )

    const colorButton = screen.getByRole('button', { name: '配色工具' })
    // 激活的按钮应该没有 ghost variant
    expect(colorButton).not.toHaveClass('ghost')
  })

  it('highlights "全部" when no active category', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    const allButton = screen.getByRole('button', { name: '全部' })
    // 激活的按钮应该没有 ghost variant
    expect(allButton).not.toHaveClass('ghost')
  })

  it('renders favorites link', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    const favoritesLink = screen.getByRole('link', { name: /我的收藏/i })
    expect(favoritesLink).toHaveAttribute('href', '/favorites')
  })

  it('renders theme toggle', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    expect(screen.getByText('Theme Toggle')).toBeInTheDocument()
  })

  it('renders logo link to home', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    const logoLink = screen.getByRole('link', { name: /设计百宝箱/i })
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('applies custom className', () => {
    const onCategoryChange = vi.fn()

    const { container } = render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
        className="custom-class"
      />
    )

    const header = container.querySelector('header')
    expect(header).toHaveClass('custom-class')
  })

  it('handles empty categories array', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header categories={[]} onCategoryChange={onCategoryChange} />
    )

    // 应该至少显示"全部"按钮
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument()
  })

  it('works without onCategoryChange callback', () => {
    render(<Header categories={mockCategories} />)

    // 当没有 onCategoryChange 时，应该渲染为链接而不是按钮
    const allLink = screen.getByRole('link', { name: '全部' })
    expect(allLink).toBeInTheDocument()
    expect(allLink).toHaveAttribute('href', '/')
    
    // 分类也应该是链接
    const colorLink = screen.getByRole('link', { name: '配色工具' })
    expect(colorLink).toBeInTheDocument()
    expect(colorLink).toHaveAttribute('href', '/category/color')
  })

  it('renders correct number of category buttons', () => {
    const onCategoryChange = vi.fn()

    render(
      <Header
        categories={mockCategories}
        onCategoryChange={onCategoryChange}
      />
    )

    // 全部 + 3个分类 = 4个按钮
    const categoryButtons = screen.getAllByRole('button').filter((button) =>
      ['全部', '配色工具', 'CSS模板', '字体资源'].includes(
        button.textContent || ''
      )
    )
    expect(categoryButtons).toHaveLength(4)
  })
})
