# Implementation Plan: Featured Cards UI Improvement

## Overview

This implementation plan breaks down the featured resource cards UI improvements into discrete coding tasks. The work focuses on repositioning the favorite button, enhancing the gradient overlay, and cleaning up border styling in the ExpandableCards component.

## Tasks

- [x] 1. Update gradient overlay for better text contrast
  - Modify the gradient overlay div in the left panel
  - Change from `from-black/80 via-black/20` to `from-black/90 via-black/40`
  - Ensure the gradient applies to the entire image area
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 2. Reposition favorite button to image overlay
  - [x] 2.1 Add favorite button to left panel (image area)
    - Create a new absolute positioned div for the favorite button
    - Position at `top-2 right-2` (top-right corner of image)
    - Use shadcn Button component with `variant="ghost"` and `size="icon"`
    - Apply styling: `h-8 w-8 bg-black/40 backdrop-blur-sm hover:bg-black/60`
    - Add conditional red color for favorited state
    - Include Heart icon from lucide-react with `h-4 w-4` size
    - Add `e.stopPropagation()` to onClick handler
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1_

  - [ ] 2.2 Write property test for favorite button visibility
    - **Property 1: Favorite Button Visibility**
    - **Validates: Requirements 1.1, 1.2, 1.4**
    - Generate random resource data with varying isFeatured and isFavorited states
    - Assert favorite button is rendered with correct positioning classes
    - Assert button has semi-transparent background and backdrop blur

  - [ ] 2.3 Write property test for event isolation
    - **Property 2: Favorite Button Interaction Isolation**
    - **Validates: Requirements 1.3, 5.1**
    - Generate random resource data
    - Simulate click on favorite button
    - Assert onFavorite callback is called
    - Assert card expansion state does not change

- [ ] 3. Remove duplicate favorite button from right panel
  - [x] 3.1 Simplify right panel action buttons
    - Remove the favorite button from the right panel's action buttons section
    - Keep only the visit button
    - Update flex layout to accommodate single button
    - _Requirements: 4.3_

  - [ ] 3.2 Write unit test for right panel buttons
    - Test that right panel only contains visit button
    - Test that favorite button is not present in right panel
    - Test visit button functionality
    - _Requirements: 4.3_

- [ ] 4. Remove unnecessary border styling
  - [x] 4.1 Clean up right panel border classes
    - Verify right panel has `border-l` class
    - Ensure no `border-r` class is present
    - Maintain existing border color `var(--border)`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.2 Write property test for border styling
    - **Property 5: Border Styling Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Generate random resource data
    - Expand card
    - Assert right panel has border-l class
    - Assert right panel does not have border-r class

- [ ] 5. Verify content area text contrast
  - [x] 5.1 Ensure white text color for content area
    - Verify resource name has `text-white` class
    - Verify rating value has `text-white/90` class
    - Verify tags have white text in their badge styling
    - _Requirements: 2.3, 2.4_

  - [ ] 5.2 Write property test for content contrast
    - **Property 4: Content Area Contrast**
    - **Validates: Requirements 2.3, 2.4**
    - Generate random resource data
    - Assert resource name has text-white class
    - Assert rating value has text-white/90 class
    - Assert tags have white text color

- [ ] 6. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify visual appearance in development environment
  - Test favorite button interaction (click, hover, favorited state)
  - Test card expansion/collapse behavior
  - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Write comprehensive property tests
  - [ ] 7.1 Write property test for gradient consistency
    - **Property 3: Gradient Overlay Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.5**
    - Generate random resource data
    - Assert gradient overlay has correct opacity classes
    - Assert gradient is present regardless of resource properties

  - [ ] 7.2 Write property test for component library usage
    - **Property 6: Component Library Usage**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
    - Generate random resource data
    - Assert favorite button is shadcn Button component
    - Assert tags are shadcn Badge components
    - Assert visit button is shadcn Button component

  - [ ] 7.3 Write property test for animation preservation
    - **Property 7: Animation Preservation**
    - **Validates: Requirements 5.4**
    - Generate random resource data
    - Trigger card expansion
    - Assert motion component has transition duration of 0.5
    - Assert motion component has easing array [0.4, 0.0, 0.2, 1.0]

  - [ ] 7.4 Write property test for dimension consistency
    - **Property 8: Dimension Consistency**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Generate random resource data
    - Assert collapsed card animates to width 240px
    - Assert expanded card animates to width 420px
    - Assert card height is 280px

- [ ] 8. Final checkpoint - Visual and functional verification
  - Test in both light and dark themes
  - Verify responsive behavior on different screen sizes
  - Test keyboard navigation and accessibility
  - Ensure smooth animations and transitions
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All changes are isolated to `components/smoothui/expandable-cards/index.tsx`
- No breaking changes to component API
