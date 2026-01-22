import { render, fireEvent, screen } from '@testing-library/react';
import { BackToTop } from '../back-to-top';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('BackToTop Component', () => {
  beforeEach(() => {
    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is initially invisible', () => {
    render(<BackToTop />);
    const button = screen.queryByRole('button', { name: /back to top/i });
    expect(button).not.toBeInTheDocument();
  });

  it('becomes visible after scrolling past threshold', async () => {
    render(<BackToTop threshold={100} />);

    // Simulate scroll
    fireEvent.scroll(window, { target: { scrollY: 150 } });

    // Check visibility (wait for animation or state update)
    // Since AnimatePresence is used, it might be in the DOM but needs waiting.
    // Usually fireEvent.scroll triggers the effect synchronously in React testing library but state update is async.

    // Note: window.scrollY is read-only in some environments, we need to mock the getter
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
    fireEvent.scroll(window);

    const button = await screen.findByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();
  });

  it('scrolls to top when clicked', async () => {
    render(<BackToTop threshold={100} />);

    // Make it visible
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
    fireEvent.scroll(window);

    const button = await screen.findByRole('button', { name: /back to top/i });

    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
