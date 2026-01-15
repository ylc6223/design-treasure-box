# Design Document

## Overview

This design document outlines the implementation approach for improving the featured resource cards in the ExpandableCards component. The improvements focus on three key areas: repositioning the favorite button to the image overlay, enhancing text readability with improved gradient effects, and cleaning up unnecessary border styling. All changes will leverage existing shadcn/ui components and maintain the current animation behavior.

## Architecture

### Component Structure

The ExpandableCards component (`components/smoothui/expandable-cards/index.tsx`) will be modified to implement the improvements. The component architecture remains unchanged:

```
ExpandableCards (Container)
├── Scrollable Container (horizontal scroll)
└── Motion Card (for each resource)
    ├── Left Panel (240px, always visible)
    │   ├── Image
    │   ├── Enhanced Gradient Overlay
    │   ├── Featured Badge (conditional)
    │   ├── Favorite Button (NEW POSITION)
    │   └── Content Area (name, rating, tags)
    └── Right Panel (180px, expandable)
        ├── Description
        └── Action Buttons (favorite, visit)
```

### Key Changes

1. **Favorite Button Migration**: Move from Right Panel to Left Panel (image overlay)
2. **Gradient Enhancement**: Strengthen the bottom gradient for better text contrast
3. **Border Cleanup**: Remove border-r from Right Panel
4. **Button Consolidation**: Remove duplicate favorite button from Right Panel

## Components and Interfaces

### Modified Component: ExpandableCards

**File**: `components/smoothui/expandable-cards/index.tsx`

**Props Interface** (unchanged):
```typescript
export type ExpandableCardsProps = {
  resources: Resource[];
  selectedCard?: string | null;
  onSelect?: (id: string | null) => void;
  isFavorited: (id: string) => boolean;
  onFavorite: (id: string) => void;
  onVisit: (url: string) => void;
  className?: string;
  cardClassName?: string;
};
```

**Internal Structure Changes**:

1. **Left Panel Structure** (new layout):
```tsx
<div className="relative h-full w-[240px]">
  {/* Image */}
  <img src={resource.screenshot} alt={resource.name} />
  
  {/* Enhanced Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
  
  {/* Featured Badge - top-left */}
  {resource.isFeatured && (
    <div className="absolute top-2 left-2">...</div>
  )}
  
  {/* Favorite Button - top-right (NEW) */}
  <div className="absolute top-2 right-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation()
        onFavorite(resource.id)
      }}
      className={cn(
        "h-8 w-8 bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors",
        isFavorited(resource.id) && "text-red-500 hover:text-red-600"
      )}
    >
      <Heart className={cn("h-4 w-4", isFavorited(resource.id) && "fill-current")} />
    </Button>
  </div>
  
  {/* Content Area - bottom */}
  <div className="absolute bottom-0 left-0 right-0 p-3">...</div>
</div>
```

2. **Right Panel Structure** (simplified):
```tsx
<motion.div
  className="absolute top-0 right-0 h-full bg-background border-l"
  // Remove border-r, keep only border-l
>
  <motion.div className="flex h-full flex-col justify-between p-3">
    {/* Description */}
    <div>
      <h4>简介</h4>
      <p>{resource.description}</p>
    </div>
    
    {/* Action Buttons - Remove favorite button, keep only visit */}
    <div className="flex flex-col gap-1.5">
      <Button
        variant="default"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onVisit(resource.url)
        }}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        访问
      </Button>
    </div>
  </motion.div>
</motion.div>
```

### Styling Constants

**Gradient Overlay Enhancement**:
- Previous: `from-black/80 via-black/20 to-transparent`
- New: `from-black/90 via-black/40 to-transparent`
- Rationale: Increased opacity provides better contrast for white text

**Favorite Button Styling**:
```typescript
const favoriteButtonClasses = cn(
  "h-8 w-8",                              // Size
  "bg-black/40 backdrop-blur-sm",         // Semi-transparent background
  "hover:bg-black/60",                    // Hover state
  "transition-colors",                    // Smooth transitions
  isFavorited && "text-red-500 hover:text-red-600"  // Favorited state
)
```

## Data Models

No changes to data models. The component continues to use the existing `Resource` type from `@/types`:

```typescript
type Resource = {
  id: string;
  name: string;
  description: string;
  screenshot: string;
  url: string;
  rating: {
    overall: number;
    // ... other rating fields
  };
  tags: string[];
  isFeatured: boolean;
  // ... other fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Favorite Button Visibility

*For any* featured resource card (collapsed or expanded), the favorite button should be visible in the top-right corner of the image area with appropriate styling (semi-transparent background, backdrop blur).

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Favorite Button Interaction Isolation

*For any* favorite button click event, the event should not propagate to the card container, preventing unintended card expansion/collapse.

**Validates: Requirements 1.3, 5.1**

### Property 3: Gradient Overlay Consistency

*For any* resource card with a screenshot, the gradient overlay should apply consistent opacity values (black/90 at bottom, black/40 in middle, transparent at top) regardless of theme mode.

**Validates: Requirements 2.1, 2.2, 2.5**

### Property 4: Content Area Contrast

*For any* resource card, the content area text (name, rating, tags) should be displayed in white color against the gradient overlay background.

**Validates: Requirements 2.3, 2.4**

### Property 5: Border Styling Correctness

*For any* expanded card, the right panel should display only a left border (border-l) and no right border (border-r).

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Component Library Usage

*For any* interactive UI element (buttons, badges), the implementation should use shadcn components (Button, Badge) with appropriate variants rather than custom implementations.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 7: Animation Preservation

*For any* card expansion/collapse interaction, the animation should maintain the existing smooth easing curve (0.4, 0.0, 0.2, 1.0) and duration (0.5s).

**Validates: Requirements 5.4**

### Property 8: Dimension Consistency

*For any* featured resource card, the dimensions should remain constant: 240px collapsed width, 420px expanded width, 280px height.

**Validates: Requirements 6.2, 6.3, 6.4**

## Error Handling

### Image Loading Failures

The component already handles image loading errors gracefully. No changes needed to error handling logic.

### Event Propagation

**Issue**: Clicking the favorite button might trigger card expansion.

**Solution**: Use `e.stopPropagation()` on the favorite button's onClick handler to prevent event bubbling to the card container.

```typescript
onClick={(e) => {
  e.stopPropagation()
  onFavorite(resource.id)
}}
```

### Missing Resources

The component receives resources as props from the parent. Input validation is handled at the parent level (FeaturedSections component). No additional error handling needed.

## Testing Strategy

### Unit Tests

**Test File**: `components/smoothui/expandable-cards/__tests__/expandable-cards.test.tsx`

1. **Favorite Button Rendering**
   - Test: Favorite button renders in the correct position (top-right of image area)
   - Test: Favorite button has correct styling classes (bg-black/40, backdrop-blur-sm)
   - Test: Favorite button shows filled heart when resource is favorited

2. **Gradient Overlay**
   - Test: Gradient overlay applies correct opacity values
   - Test: Content area text is white colored

3. **Border Styling**
   - Test: Right panel has border-l class
   - Test: Right panel does not have border-r class

4. **Event Handling**
   - Test: Clicking favorite button calls onFavorite with correct resource ID
   - Test: Clicking favorite button does not trigger card expansion
   - Test: Clicking card background triggers expansion/collapse

5. **Component Integration**
   - Test: shadcn Button component is used for favorite button
   - Test: shadcn Badge components are used for tags

### Property-Based Tests

**Configuration**: Minimum 100 iterations per test using fast-check library.

**Test File**: `components/smoothui/expandable-cards/__tests__/expandable-cards.properties.test.tsx`

1. **Property Test: Favorite Button Visibility**
   - **Feature: featured-cards-ui-improvement, Property 1: Favorite button visibility**
   - Generate: Random resource data with varying isFeatured and isFavorited states
   - Assert: Favorite button is always rendered in the DOM with correct positioning classes
   - Assert: Button has semi-transparent background and backdrop blur classes

2. **Property Test: Event Isolation**
   - **Feature: featured-cards-ui-improvement, Property 2: Favorite button interaction isolation**
   - Generate: Random resource data
   - Action: Simulate click on favorite button
   - Assert: onFavorite callback is called
   - Assert: Card expansion state does not change

3. **Property Test: Gradient Consistency**
   - **Feature: featured-cards-ui-improvement, Property 3: Gradient overlay consistency**
   - Generate: Random resource data
   - Assert: Gradient overlay div has class "bg-gradient-to-t from-black/90 via-black/40 to-transparent"
   - Assert: Gradient is present regardless of resource properties

4. **Property Test: Content Contrast**
   - **Feature: featured-cards-ui-improvement, Property 4: Content area contrast**
   - Generate: Random resource data
   - Assert: Resource name has "text-white" class
   - Assert: Rating value has "text-white/90" class
   - Assert: Tags have white text color

5. **Property Test: Border Correctness**
   - **Feature: featured-cards-ui-improvement, Property 5: Border styling correctness**
   - Generate: Random resource data
   - Action: Expand card
   - Assert: Right panel has "border-l" class
   - Assert: Right panel does not have "border-r" class

6. **Property Test: Component Library Usage**
   - **Feature: featured-cards-ui-improvement, Property 6: Component library usage**
   - Generate: Random resource data
   - Assert: Favorite button is a shadcn Button component
   - Assert: Tags are shadcn Badge components
   - Assert: Visit button is a shadcn Button component

7. **Property Test: Animation Preservation**
   - **Feature: featured-cards-ui-improvement, Property 7: Animation preservation**
   - Generate: Random resource data
   - Action: Trigger card expansion
   - Assert: Motion component has transition duration of 0.5
   - Assert: Motion component has easing array [0.4, 0.0, 0.2, 1.0]

8. **Property Test: Dimension Consistency**
   - **Feature: featured-cards-ui-improvement, Property 8: Dimension consistency**
   - Generate: Random resource data
   - Assert: Collapsed card animates to width "240px"
   - Assert: Expanded card animates to width "420px"
   - Assert: Card height is "280px"

### Integration Tests

1. **FeaturedSections Integration**
   - Test: ExpandableCards receives correct props from FeaturedSections
   - Test: Favorite toggle updates parent state correctly
   - Test: Visit action opens URL in new tab

2. **Theme Integration**
   - Test: Cards render correctly in light theme
   - Test: Cards render correctly in dark theme
   - Test: Gradient overlay maintains opacity in both themes

### Visual Regression Tests

1. **Screenshot Comparison**
   - Capture: Collapsed card state
   - Capture: Expanded card state
   - Capture: Favorited vs non-favorited states
   - Compare: Before and after implementation

## Implementation Notes

### CSS Class Changes

**Remove**:
- `border-r` from right panel

**Add**:
- `from-black/90 via-black/40` to gradient overlay (replacing `from-black/80 via-black/20`)
- `absolute top-2 right-2` for favorite button positioning
- `h-8 w-8 bg-black/40 backdrop-blur-sm hover:bg-black/60` for favorite button styling

### Component Simplification

The right panel will be simplified by removing the favorite button, as it's now in the left panel. This reduces duplication and improves maintainability.

**Before** (Right Panel):
```tsx
<div className="flex flex-col gap-1.5">
  <Button>收藏</Button>  {/* Remove this */}
  <Button>访问</Button>
</div>
```

**After** (Right Panel):
```tsx
<div className="flex flex-col gap-1.5">
  <Button>访问</Button>  {/* Only visit button */}
</div>
```

### Accessibility Considerations

1. **Favorite Button**: Maintain `aria-label` for screen readers
2. **Color Contrast**: White text on dark gradient meets WCAG AA standards
3. **Focus States**: Ensure keyboard navigation works for favorite button
4. **Touch Targets**: 32px (h-8 w-8) button size meets minimum touch target size

### Performance Considerations

1. **Backdrop Blur**: Uses CSS `backdrop-blur-sm` which is GPU-accelerated
2. **Gradient**: CSS gradient is more performant than image overlays
3. **Event Handlers**: `stopPropagation()` prevents unnecessary re-renders
4. **Animation**: Existing motion/react animations are already optimized

## Migration Path

This is a non-breaking change. The component API remains unchanged, so no updates are needed in parent components (FeaturedSections, HomePage).

### Deployment Steps

1. Update `components/smoothui/expandable-cards/index.tsx`
2. Run unit tests and property tests
3. Verify visual appearance in Storybook/dev environment
4. Deploy to production

### Rollback Plan

If issues arise, the changes are isolated to a single component file. Rollback involves reverting the single file change.
