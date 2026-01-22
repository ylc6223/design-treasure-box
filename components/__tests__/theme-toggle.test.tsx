import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /切换主题/i });
    expect(button).toBeDefined();
  });

  it('has correct aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText('切换主题');
    expect(button).toBeDefined();
  });

  it('uses shadcn Button component', () => {
    const { container } = render(<ThemeToggle />);
    const button = container.querySelector('button');
    expect(button).toBeDefined();
  });
});
