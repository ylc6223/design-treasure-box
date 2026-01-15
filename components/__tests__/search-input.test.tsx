import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchInput } from '../search-input'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('SearchInput', () => {
  it('renders search input with placeholder', () => {
    render(<SearchInput placeholder="搜索测试..." />)
    
    const input = screen.getByPlaceholderText('搜索测试...')
    expect(input).toBeInTheDocument()
  })

  it('updates input value when typing', () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('搜索设计资源...') as HTMLInputElement
    fireEvent.change(input, { target: { value: '配色工具' } })
    
    expect(input.value).toBe('配色工具')
  })

  it('disables search button when input is empty', () => {
    render(<SearchInput />)
    
    const button = screen.getByRole('button', { name: '搜索' })
    expect(button).toBeDisabled()
  })

  it('enables search button when input has value', () => {
    render(<SearchInput />)
    
    const input = screen.getByPlaceholderText('搜索设计资源...')
    const button = screen.getByRole('button', { name: '搜索' })
    
    fireEvent.change(input, { target: { value: '配色' } })
    
    expect(button).not.toBeDisabled()
  })

  it('calls onSearch callback when form is submitted', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    
    const input = screen.getByPlaceholderText('搜索设计资源...')
    const form = input.closest('form')!
    
    fireEvent.change(input, { target: { value: '配色工具' } })
    fireEvent.submit(form)
    
    expect(onSearch).toHaveBeenCalledWith('配色工具')
  })

  it('trims whitespace from search query', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    
    const input = screen.getByPlaceholderText('搜索设计资源...')
    const form = input.closest('form')!
    
    fireEvent.change(input, { target: { value: '  配色工具  ' } })
    fireEvent.submit(form)
    
    expect(onSearch).toHaveBeenCalledWith('配色工具')
  })

  it('does not submit when input is empty or only whitespace', () => {
    const onSearch = vi.fn()
    render(<SearchInput onSearch={onSearch} />)
    
    const input = screen.getByPlaceholderText('搜索设计资源...')
    const form = input.closest('form')!
    
    // Empty input
    fireEvent.submit(form)
    expect(onSearch).not.toHaveBeenCalled()
    
    // Only whitespace
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(form)
    expect(onSearch).not.toHaveBeenCalled()
  })
})
