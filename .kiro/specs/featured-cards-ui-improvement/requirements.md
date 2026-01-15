# Requirements Document

## Introduction

This specification defines improvements to the featured resource cards (热门资源 and 最新收录 sections) in the Design Treasure Box application. The improvements focus on enhancing visual clarity, improving button placement for better UX, and removing unnecessary styling elements.

## Glossary

- **Featured_Cards**: The expandable card components displayed in the "热门资源" (Hot Resources) and "最新收录" (Latest Resources) sections
- **Favorite_Button**: The heart icon button that allows users to add/remove resources from their favorites
- **Image_Overlay**: The semi-transparent gradient layer applied over the resource screenshot
- **Content_Area**: The bottom section of the card containing resource name, rating, and tags
- **Right_Panel**: The expandable panel that appears when a card is selected, showing description and action buttons
- **shadcn_Components**: The UI component library based on Radix UI primitives used throughout the application

## Requirements

### Requirement 1: Favorite Button Repositioning

**User Story:** As a user, I want the favorite button to be positioned on the image area, so that I can quickly favorite resources without the button interfering with the content area.

#### Acceptance Criteria

1. WHEN viewing featured resource cards, THE Favorite_Button SHALL be positioned in the top-right corner of the Image_Overlay
2. WHEN hovering over the Favorite_Button, THE System SHALL display a semi-transparent background with backdrop blur for better visibility
3. WHEN clicking the Favorite_Button, THE System SHALL toggle the favorite state without expanding the card
4. THE Favorite_Button SHALL remain visible and accessible in both collapsed and expanded card states
5. THE Favorite_Button SHALL use the existing Heart icon from lucide-react with appropriate sizing (h-4 w-4)

### Requirement 2: Content Area Visibility Enhancement

**User Story:** As a user, I want the text content at the bottom of the card to be clearly readable, so that I can easily identify resource information without straining my eyes.

#### Acceptance Criteria

1. WHEN a resource screenshot is displayed, THE Image_Overlay SHALL apply a semi-transparent gradient from bottom to top
2. THE Image_Overlay gradient SHALL start with black/80 opacity at the bottom and fade to transparent at the top
3. THE Content_Area text (resource name, rating, tags) SHALL be displayed in white color for maximum contrast
4. THE Content_Area SHALL have sufficient padding (p-3) to prevent text from touching card edges
5. WHEN viewing cards in both light and dark themes, THE Image_Overlay SHALL maintain consistent opacity values

### Requirement 3: Border Styling Cleanup

**User Story:** As a developer, I want to remove unnecessary border styling, so that the card design is cleaner and follows the intended visual hierarchy.

#### Acceptance Criteria

1. THE Right_Panel SHALL NOT display a border-r (right border) style
2. WHEN the Right_Panel expands, THE System SHALL display only a border-l (left border) to separate it from the image area
3. THE border-l SHALL use the theme's border color variable (var(--border))
4. THE card container SHALL maintain its existing rounded corners and shadow styling

### Requirement 4: Component Library Compliance

**User Story:** As a developer, I want to use shadcn components wherever possible, so that the UI remains consistent with the design system and is maintainable.

#### Acceptance Criteria

1. THE Favorite_Button SHALL use the shadcn Button component with variant="ghost" and size="icon"
2. THE Badge components for tags SHALL continue using shadcn Badge with variant="secondary"
3. THE action buttons in the Right_Panel SHALL use shadcn Button components
4. WHERE custom styling is required, THE System SHALL extend shadcn components using the cn() utility function
5. THE System SHALL NOT create custom button implementations when shadcn components can fulfill the requirements

### Requirement 5: Interaction Behavior Preservation

**User Story:** As a user, I want the card interactions to work smoothly, so that my experience is not disrupted by the UI improvements.

#### Acceptance Criteria

1. WHEN clicking the Favorite_Button, THE System SHALL prevent event propagation to avoid expanding the card
2. WHEN clicking the card background, THE System SHALL expand/collapse the card as before
3. WHEN the card is expanded, THE Right_Panel SHALL display the description and action buttons
4. THE animation transitions SHALL maintain the existing smooth easing (0.4, 0.0, 0.2, 1.0)
5. THE System SHALL preserve all existing accessibility attributes (aria-label, etc.)

### Requirement 6: Responsive Design Maintenance

**User Story:** As a user on different devices, I want the improved cards to work well on all screen sizes, so that I have a consistent experience across devices.

#### Acceptance Criteria

1. THE Featured_Cards SHALL maintain their horizontal scrolling behavior on all screen sizes
2. THE collapsed card width SHALL remain 240px
3. THE expanded card width SHALL remain 420px
4. THE card height SHALL remain 280px
5. THE Favorite_Button SHALL remain accessible and properly sized on mobile devices
