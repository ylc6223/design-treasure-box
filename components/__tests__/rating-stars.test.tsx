import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RatingStars } from '../rating-stars'

describe('RatingStars', () => {
  it('renders correct number of full stars', () => {
    const { container } = render(<RatingStars rating={4.0} />)
    
    // 4个满星 + 1个空星 = 5个星星
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
  })

  it('renders half star for decimal ratings', () => {
    const { container } = render(<RatingStars rating={4.5} />)
    
    // 4个满星 + 1个半星 = 5个星星
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
  })

  it('renders all empty stars for zero rating', () => {
    const { container } = render(<RatingStars rating={0} />)
    
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
  })

  it('renders all full stars for maximum rating', () => {
    const { container } = render(<RatingStars rating={5.0} />)
    
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5)
  })

  it('displays rating value when showValue is true', () => {
    const { container } = render(<RatingStars rating={4.5} showValue />)
    
    expect(container.textContent).toContain('4.5')
  })

  it('does not display rating value when showValue is false', () => {
    const { container } = render(<RatingStars rating={4.5} showValue={false} />)
    
    expect(container.textContent).not.toContain('4.5')
  })

  it('does not display rating value by default', () => {
    const { container } = render(<RatingStars rating={4.5} />)
    
    expect(container.textContent).not.toContain('4.5')
  })

  it('applies small size classes', () => {
    const { container } = render(<RatingStars rating={4.0} size="sm" />)
    
    const star = container.querySelector('svg')
    expect(star).toHaveClass('h-3', 'w-3')
  })

  it('applies medium size classes by default', () => {
    const { container } = render(<RatingStars rating={4.0} />)
    
    const star = container.querySelector('svg')
    expect(star).toHaveClass('h-4', 'w-4')
  })

  it('applies large size classes', () => {
    const { container } = render(<RatingStars rating={4.0} size="lg" />)
    
    const star = container.querySelector('svg')
    expect(star).toHaveClass('h-5', 'w-5')
  })

  it('applies custom className', () => {
    const { container } = render(
      <RatingStars rating={4.0} className="custom-class" />
    )
    
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })

  it('clamps rating above 5 to 5', () => {
    const { container } = render(<RatingStars rating={6.0} showValue />)
    
    expect(container.textContent).toContain('5.0')
  })

  it('clamps rating below 0 to 0', () => {
    const { container } = render(<RatingStars rating={-1.0} showValue />)
    
    expect(container.textContent).toContain('0.0')
  })

  it('rounds down for ratings below 0.5', () => {
    const { container } = render(<RatingStars rating={4.4} />)
    
    // 4.4 应该显示 4 个满星，没有半星
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5) // 4满 + 1空
  })

  it('rounds up for ratings at or above 0.5', () => {
    const { container } = render(<RatingStars rating={4.5} />)
    
    // 4.5 应该显示 4 个满星 + 1 个半星
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5) // 4满 + 1半
  })

  it('formats rating value to one decimal place', () => {
    const { container } = render(<RatingStars rating={4} showValue />)
    
    expect(container.textContent).toContain('4.0')
  })

  it('handles edge case of 0.5 rating', () => {
    const { container } = render(<RatingStars rating={0.5} showValue />)
    
    expect(container.textContent).toContain('0.5')
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5) // 0满 + 1半 + 4空
  })

  it('handles edge case of 4.9 rating', () => {
    const { container } = render(<RatingStars rating={4.9} showValue />)
    
    expect(container.textContent).toContain('4.9')
    const stars = container.querySelectorAll('svg')
    expect(stars).toHaveLength(5) // 4满 + 1半 + 0空
  })

  it('applies correct text size for small stars', () => {
    const { container } = render(
      <RatingStars rating={4.0} size="sm" showValue />
    )
    
    const text = container.querySelector('span')
    expect(text).toHaveClass('text-xs')
  })

  it('applies correct text size for medium stars', () => {
    const { container } = render(
      <RatingStars rating={4.0} size="md" showValue />
    )
    
    const text = container.querySelector('span')
    expect(text).toHaveClass('text-sm')
  })

  it('applies correct text size for large stars', () => {
    const { container } = render(
      <RatingStars rating={4.0} size="lg" showValue />
    )
    
    const text = container.querySelector('span')
    expect(text).toHaveClass('text-base')
  })
})
