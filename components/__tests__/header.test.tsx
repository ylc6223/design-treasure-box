import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock ThemeToggle
vi.mock('../theme-toggle', () => ({
  ThemeToggle: () => <button>Theme Toggle</button>,
}));

// Mock LoginDialog
vi.mock('../auth/login-dialog', () => ({
  LoginDialog: () => <div>Login Dialog</div>,
}));

// Mock UserMenu
vi.mock('../auth/user-menu', () => ({
  UserMenu: ({ profile }: any) => <div>User Menu: {profile.email}</div>,
}));

// Mock useAuthStore
vi.mock('@/hooks/use-auth-store', () => ({
  useAuthStore: (selector: any) => selector({ profile: null }),
}));

describe('Header', () => {
  it('renders logo', () => {
    render(<Header />);

    expect(screen.getByText('设')).toBeInTheDocument();
    expect(screen.getByText('设计百宝箱')).toBeInTheDocument();
  });

  it('renders logo link to home', () => {
    render(<Header />);

    const logoLink = screen.getByRole('link', { name: /设计百宝箱/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders favorites link', () => {
    render(<Header />);

    const favoritesLink = screen.getByRole('link', { name: /我的收藏/i });
    expect(favoritesLink).toHaveAttribute('href', '/favorites');
  });

  it('renders theme toggle', () => {
    render(<Header />);

    expect(screen.getByText('Theme Toggle')).toBeInTheDocument();
  });

  it('renders login button when no profile', () => {
    render(<Header />);

    const loginButton = screen.getByRole('button', { name: '登录' });
    expect(loginButton).toBeInTheDocument();
  });

  it('renders user menu when profile is provided', () => {
    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      role: 'user',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    render(<Header profile={mockProfile} />);

    expect(screen.getByText(`User Menu: ${mockProfile.email}`)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Header className="custom-class" />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('custom-class');
  });

  it('renders login dialog', () => {
    render(<Header />);

    expect(screen.getByText('Login Dialog')).toBeInTheDocument();
  });
});
