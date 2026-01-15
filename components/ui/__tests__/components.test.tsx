import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from '../button'
import { Card, CardHeader, CardTitle, CardContent } from '../card'
import { Input } from '../input'
import { Badge } from '../badge'
import { Skeleton } from '../skeleton'

describe('shadcn/ui Components', () => {
  it('renders Button component', () => {
    const { container } = render(<Button>Test Button</Button>)
    expect(container.querySelector('button')).toBeDefined()
  })

  it('renders Card component', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    )
    expect(container.querySelector('div')).toBeDefined()
  })

  it('renders Input component', () => {
    const { container } = render(<Input placeholder="test" />)
    expect(container.querySelector('input')).toBeDefined()
  })

  it('renders Badge component', () => {
    const { container } = render(<Badge>Test Badge</Badge>)
    expect(container.querySelector('div')).toBeDefined()
  })

  it('renders Skeleton component', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('div')).toBeDefined()
  })
})
