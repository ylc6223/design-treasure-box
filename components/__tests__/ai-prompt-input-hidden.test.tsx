import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIPromptInput } from '../ai-prompt-input'

// Mock useScrollVisibility hook
vi.mock('@/hooks', () => ({
  useScrollVisibility: vi.fn(() => true), // 默认返回 true（可见）
}))

describe('AIPromptInput - isHidden prop', () => {
  it('应该在 isHidden=false 时显示输入框', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <AIPromptInput onSubmit={onSubmit} isHidden={false} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('opacity-100')
    expect(wrapper).toHaveClass('pointer-events-auto')
  })

  it('应该在 isHidden=true 时隐藏输入框', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <AIPromptInput onSubmit={onSubmit} isHidden={true} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('opacity-0')
    expect(wrapper).toHaveClass('pointer-events-none')
  })

  it('应该在 isHidden=true 时优先于滚动状态', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <AIPromptInput onSubmit={onSubmit} isHidden={true} />
    )

    // 即使 useScrollVisibility 返回 true，isHidden 也应该强制隐藏
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('opacity-0')
    expect(wrapper).toHaveClass('pointer-events-none')
  })

  it('应该在未传递 isHidden 时使用默认值 false', () => {
    const onSubmit = vi.fn()
    const { container } = render(<AIPromptInput onSubmit={onSubmit} />)

    const wrapper = container.firstChild as HTMLElement
    // 默认应该根据滚动状态显示（mock 返回 true）
    expect(wrapper).toHaveClass('opacity-100')
    expect(wrapper).toHaveClass('pointer-events-auto')
  })
})
