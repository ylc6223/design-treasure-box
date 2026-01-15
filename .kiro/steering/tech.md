# Tech Stack

## Core Framework

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Strict mode enabled with comprehensive compiler options

## Styling & UI

- **Tailwind CSS 4** - Utility-first CSS with custom design tokens
- **shadcn/ui** - Radix UI-based component library
- **Lucide React** - Icon library (emoji usage prohibited)
- **next-themes** - Theme switching (dark/light mode)
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Utility class merging via `cn()` helper

## State & Data Management

- **TanStack Query (React Query)** - Server state management, caching, and data fetching
- **React Hook Form** - Form handling
- **Zod** - Runtime schema validation and type inference
- **localStorage** - Client-side favorites persistence

## Layout & Animation

- **masonic** - Masonry grid layout library
- CSS Grid - Responsive column layouts (2-5 columns based on viewport)
- CSS transitions - Smooth animations and hover effects

## Testing

- **Vitest** - Unit testing framework
- **@testing-library/react** - Component testing utilities
- **@testing-library/jest-dom** - DOM matchers
- **@testing-library/user-event** - User interaction simulation
- **fast-check** - Property-based testing
- **jsdom** - DOM environment for tests

## Development Tools

- **ESLint** - Linting (next/core-web-vitals config)
- **PostCSS** - CSS processing
- **Turbopack** - Fast bundler for development

## Common Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Testing
pnpm test             # Run tests in watch mode
pnpm test:ui          # Open Vitest UI
pnpm test:coverage    # Generate coverage report
```

## TypeScript Configuration

- Strict mode enabled with all strict flags
- Path alias: `@/*` maps to project root
- Target: ES2020
- Module resolution: bundler
- JSX: react-jsx (React 19 automatic runtime)
- Unused locals/parameters detection enabled
- No implicit returns or fallthrough cases

## Build Configuration

- React strict mode enabled
- Remote image patterns: all HTTPS domains allowed
- Static JSON imports for data files
