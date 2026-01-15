import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AIPromptInput } from '../ai-prompt-input'

// Mock useScrollVisibility hook
vi.mock('@/hooks', () => ({
  useScrollVisibility: () => true, // 默认可见
}))

describe('AIPromptInput', () => {
  it('renders input with placeholder', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const input = screen.getByLabelText('AI 搜索输入框')
    expect(input).toBeDefined()
    expect(input.getAttribute('placeholder')).toBe('输入你想要的设计资源，AI 帮你找...')
  })

  it('renders with custom placeholder', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} placeholder="自定义占位符" />)

    const input = screen.getByLabelText('AI 搜索输入框')
    expect(input.getAttribute('placeholder')).toBe('自定义占位符')
  })

  it('updates input value on change', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const input = screen.getByLabelText('AI 搜索输入框') as HTMLInputElement
    fireEvent.change(input, { target: { value: '配色工具' } })

    expect(input.value).toBe('配色工具')
  })

  it('calls onSubmit with trimmed value when form is submitted', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const input = screen.getByLabelText('AI 搜索输入框')
    const form = input.closest('form')!

    fireEvent.change(input, { target: { value: '  配色工具  ' } })
    fireEvent.submit(form)

    expect(onSubmit).toHaveBeenCalledWith('配色工具')
  })

  it('clears input after submission', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const input = screen.getByLabelText('AI 搜索输入框') as HTMLInputElement
    const form = input.closest('form')!

    fireEvent.change(input, { target: { value: '配色工具' } })
    fireEvent.submit(form)

    expect(input.value).toBe('')
  })

  it('does not submit when input is empty', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const form = screen.getByLabelText('AI 搜索输入框').closest('form')!
    fireEvent.submit(form)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit when input contains only whitespace', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const input = screen.getByLabelText('AI 搜索输入框')
    const form = input.closest('form')!

    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(form)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('disables input and button when isLoading is true', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} isLoading={true} />)

    const input = screen.getByLabelText('AI 搜索输入框') as HTMLInputElement
    const button = screen.getByLabelText('发送') as HTMLButtonElement

    expect(input.disabled).toBe(true)
    expect(button.disabled).toBe(true)
  })

  it('shows loading message when isLoading is true', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} isLoading={true} />)

    expect(screen.getByText('AI 正在思考...')).toBeDefined()
  })

  it('does not submit when isLoading is true', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} isLoading={true} />)

    const input = screen.getByLabelText('AI 搜索输入框')
    const form = input.closest('form')!

    fireEvent.change(input, { target: { value: '配色工具' } })
    fireEvent.submit(form)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders MessageSquare and ArrowUp icons', () => {
    const onSubmit = vi.fn()
    const { container } = render(<AIPromptInput onSubmit={onSubmit} />)

    // 检查图标是否存在
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(2) // MessageSquare + ArrowUp
  })

  it('disables submit button when input is empty', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const button = screen.getByLabelText('发送') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('enables submit button when input has value', () => {
    const onSubmit = vi.fn()
    render(<AIPromptInput onSubmit={onSubmit} />)

    const input = screen.getByLabelText('AI 搜索输入框')
    const button = screen.getByLabelText('发送') as HTMLButtonElement

    fireEvent.change(input, { target: { value: '配色工具' } })
    expect(button.disabled).toBe(false)
  })

  it('applies custom className', () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <AIPromptInput onSubmit={onSubmit} className="custom-class" />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-class')
  })
})
