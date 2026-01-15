# Project Structure

## Directory Organization

```
design-treasure-box/
├── app/                    # Next.js App Router (pages & layouts)
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles & CSS variables
│   ├── category/[id]/     # Category detail pages
│   ├── resource/[id]/     # Resource detail pages
│   ├── favorites/         # Favorites page
│   └── search/            # Search page
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   └── __tests__/        # Component tests
├── hooks/                 # Custom React hooks
│   └── __tests__/        # Hook tests
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Zod schemas & inferred types
│   └── __tests__/        # Type tests
├── data/                  # Static JSON data
│   ├── categories.json   # 8 resource categories
│   ├── resources.json    # 32 curated resources
│   └── __tests__/        # Data validation tests
├── lib/                   # Utility functions
│   └── utils.ts          # cn() and other helpers
├── tests/                 # Test configuration
│   └── setup.ts          # Vitest setup
└── public/               # Static assets
```

## Key Conventions

### File Naming

- Components: kebab-case (e.g., `resource-card.tsx`)
- Pages: Next.js conventions (`page.tsx`, `layout.tsx`)
- Tests: `*.test.ts` or `*.test.tsx` in `__tests__/` directories
- Types: `index.ts` for main exports
- Data: lowercase with extension (e.g., `categories.json`)

### Component Structure

- Functional components with TypeScript
- Props interfaces defined inline or exported
- Use `'use client'` directive when needed (interactivity, hooks, browser APIs)
- Server components by default in App Router

### Import Paths

- Use `@/*` alias for absolute imports from project root
- Example: `import { Resource } from '@/types'`
- Example: `import { cn } from '@/lib/utils'`

### Testing

- Co-locate tests in `__tests__/` directories within each module
- Test files mirror source file names with `.test.ts(x)` suffix
- Use Vitest globals (describe, it, expect)
- Mock browser APIs (localStorage, window) as needed

### Data Flow

- Static data imported from `@/data/*.json`
- Runtime validation with Zod schemas from `@/types`
- TanStack Query for async data fetching and caching
- Custom hooks in `@/hooks` for reusable logic

### Styling Patterns

- Tailwind utility classes for all styling
- CSS variables in `globals.css` for theme tokens
- Use `cn()` helper to merge conditional classes
- Responsive breakpoints: mobile (<768px), tablet (768-1199px), desktop (≥1200px), XL (≥1440px)

### State Management

- Server state: TanStack Query
- Client state: React hooks (useState, useReducer)
- Persistent state: localStorage with Zod validation
- Global state: React Context (theme, favorites)

## Component Categories

### Core Components (components/)

- `resource-card.tsx` - Resource display card
- `masonry-grid.tsx` - Responsive grid layout
- `dock-sidebar.tsx` - macOS-style navigation
- `header.tsx` - Top navigation bar
- `ai-prompt-input.tsx` - Bottom floating input
- `theme-toggle.tsx` - Dark/light mode switch
- `rating-stars.tsx` - Star rating display
- `category-filter.tsx` - Category selection

### UI Components (components/ui/)

- shadcn/ui components (Button, Card, Input, Badge, Dialog, etc.)
- Radix UI primitives with Tailwind styling
- Reusable across the application

### Custom Hooks (hooks/)

- `use-favorites.ts` - Favorites management
- `use-search.ts` - Search and filtering
- `use-resources.ts` - Resource data fetching
- `use-infinite-resources.ts` - Infinite scroll
- `use-intersection-observer.ts` - Viewport detection
- `use-scroll-visibility.ts` - Scroll-based visibility

## Architecture Patterns

### Page Structure

1. Server Component (default) - data fetching, static content
2. Client Component (`'use client'`) - interactivity, browser APIs
3. Layout wrapping with providers (QueryClientProvider, ThemeProvider)

### Data Validation

1. Define Zod schema in `types/index.ts`
2. Infer TypeScript type from schema
3. Validate at runtime when loading data
4. Use validated types throughout application

### Component Composition

- Small, focused components with single responsibility
- Compose complex UIs from simple components
- Pass callbacks for actions (onFavorite, onVisit)
- Use children prop for flexible composition

### Error Handling

- Zod validation for data integrity
- Try-catch for localStorage operations
- Error boundaries for component errors
- Fallback UI for loading and error states
