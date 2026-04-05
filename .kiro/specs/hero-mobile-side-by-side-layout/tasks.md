# Implementation Plan: Hero Mobile Side-by-Side Layout

## Overview

This implementation modifies the hero section's responsive CSS to maintain a horizontal (side-by-side) layout on mobile devices instead of the current vertical stacking. The changes are purely CSS-based, requiring no React component modifications. The implementation focuses on removing column-forcing media queries, implementing proportional scaling for typography and spacing, and optimizing touch interactions for mobile devices.

## Tasks

- [x] 1. Remove column-forcing media queries and establish side-by-side layout foundation
  - Remove `flex-direction: column` declarations from mobile media queries
  - Ensure `.hero-brutalist-main` maintains `flex-direction: row` at all breakpoints
  - Add explicit `flex: 1` to both `.hero-brutalist-content` and `.hero-brutalist-visual` for equal width distribution
  - Verify layout remains horizontal at 768px, 480px, and 320px breakpoints
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1_

- [x] 1.1 Write unit tests for layout direction
  - Test that flex-direction is 'row' at all viewport widths
  - Test that content and visual areas have equal flex values
  - _Requirements: 1.1, 1.2, 4.1_

- [ ] 2. Implement proportional typography scaling for mobile viewports
  - [~] 2.1 Scale hero title for mobile breakpoints
    - Update `.hero-brutalist-title` font-size for <768px: `clamp(1.5rem, 5vw, 2.5rem)`
    - Update `.hero-brutalist-title` font-size for <480px: `clamp(1.25rem, 4vw, 2rem)`
    - Adjust line-height to 1.05 for better mobile readability
    - _Requirements: 2.1, 2.3_

  - [~] 2.2 Scale description text for mobile breakpoints
    - Update `.hero-brutalist-description` font-size for <768px: `0.875rem`
    - Update `.hero-brutalist-description` font-size for <480px: `0.75rem`
    - Adjust line-height for mobile: 1.5 at <768px, 1.4 at <480px
    - _Requirements: 2.1, 2.4_

  - [~] 2.3 Scale badge and CTA button typography
    - Update `.hero-brutalist-badge` font-size for <768px: `0.65rem`, <480px: `0.6rem`
    - Update `.hero-brutalist-cta` font-size for <768px: `0.875rem`, <480px: `0.75rem`
    - _Requirements: 2.1, 2.5_

- [~] 2.4 Write unit tests for typography scaling
  - Test computed font sizes at key breakpoints (768px, 480px, 320px)
  - Verify text remains readable and doesn't overflow containers
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 3. Reduce padding and spacing for mobile optimization
  - [~] 3.1 Adjust content area padding
    - Update `.hero-brutalist-content` padding for <768px: `2rem 1rem`
    - Update `.hero-brutalist-content` padding for <480px: `1.5rem 0.75rem`
    - _Requirements: 2.2, 2.3_

  - [~] 3.2 Adjust visual area and card padding
    - Update `.hero-brutalist-visual` padding for <768px: `1.5rem 1rem`
    - Update `.hero-brutalist-visual` padding for <480px: `1rem 0.75rem`
    - Update `.hero-brutalist-card` padding for <768px: `1rem`, <480px: `0.75rem`
    - _Requirements: 2.2, 3.2_

  - [~] 3.3 Adjust spacing between elements
    - Update `.hero-brutalist-bottom` gap for <768px: `1rem`, <480px: `0.75rem`
    - Update `.hero-brutalist-badge` margin-bottom for <768px: `1rem`, <480px: `0.75rem`
    - Update `.hero-brutalist-description` padding-left for <768px: `0.75rem`, <480px: `0.5rem`
    - _Requirements: 2.2, 4.2_

- [ ] 4. Scale visual area card and media elements
  - [~] 4.1 Adjust floating card dimensions
    - Update `.hero-brutalist-card` max-width for <768px: `100%`
    - Update `.hero-brutalist-card` min-height for <768px: `auto`
    - Remove rotation transform on mobile: `transform: rotate(0deg)`
    - _Requirements: 3.1, 3.4_

  - [~] 4.2 Scale card image/video dimensions
    - Update `.hero-brutalist-card-image` height for <768px: `8rem`
    - Update `.hero-brutalist-card-image` height for <480px: `7rem`
    - Ensure `object-fit: cover` maintains aspect ratio
    - _Requirements: 3.1, 3.3_

  - [~] 4.3 Reduce card borders and shadows for mobile
    - Update `.hero-brutalist-card` border for <768px: `2px solid`
    - Update `.hero-brutalist-card` box-shadow for <768px: `4px 4px 0px 0px`
    - Update `.hero-brutalist-card` box-shadow for <480px: `3px 3px 0px 0px`
    - Update `.hero-brutalist-card-image` border for <768px: `2px solid`
    - _Requirements: 3.2_

  - [~] 4.4 Scale card typography
    - Update `.hero-brutalist-card-title` font-size for <768px: `1rem`, <480px: `0.875rem`
    - Update `.hero-brutalist-card-text` font-size for <768px: `0.75rem`, <480px: `0.7rem`
    - _Requirements: 3.1_

- [~] 4.5 Write unit tests for visual area scaling
  - Test card dimensions at mobile breakpoints
  - Verify image/video maintains aspect ratio
  - Test border and shadow values
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [~] 5. Checkpoint - Verify layout and scaling
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Optimize touch interactions and disable hover effects
  - [~] 6.1 Ensure CTA button meets touch target requirements
    - Verify `.hero-brutalist-cta` padding for <768px: `0.75rem 1.5rem` (minimum 44x44px)
    - Verify `.hero-brutalist-cta` padding for <480px: `0.65rem 1.25rem` (minimum 44x44px)
    - Update box-shadow on hover for mobile to prevent excessive movement
    - _Requirements: 2.5, 5.1_

  - [~] 6.2 Disable hover effects on floating card for mobile
    - Add `@media (max-width: 768px)` rule to reset `.hero-brutalist-card:hover` transform
    - Reset `.hero-brutalist-card:hover` box-shadow to non-hover state
    - Reset `.hero-brutalist-card:hover .hero-brutalist-card-title` font-size
    - Reset `.hero-brutalist-card:hover .hero-brutalist-card-title::after` width to 0
    - Reset `.hero-brutalist-card:hover .hero-brutalist-card-text` font-size
    - Reset `.hero-brutalist-card:hover .hero-brutalist-card-image` border-color
    - _Requirements: 5.2, 5.4_

  - [~] 6.3 Disable hover effects on CTA button for mobile
    - Update `.hero-brutalist-cta:hover` transform for <768px: `translate(2px, 2px)`
    - Update `.hero-brutalist-cta:hover` box-shadow for <768px: `2px 2px 0px 0px`
    - _Requirements: 5.2_

- [~] 6.4 Write integration tests for touch interactions
  - Test CTA button dimensions meet minimum 44x44px requirement
  - Verify hover effects are disabled on touch devices
  - Test smooth scroll behavior on CTA button click
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Validate responsive behavior and accessibility
  - [~] 7.1 Test layout consistency across breakpoints
    - Verify side-by-side layout at 1024px, 768px, 480px, and 320px
    - Test smooth transitions between viewport sizes
    - Ensure no horizontal scrolling at any viewport width
    - _Requirements: 4.1, 4.2_

  - [~] 7.2 Verify accessibility features preserved
    - Test keyboard navigation (Tab order: content → visual)
    - Verify focus states on interactive elements
    - Ensure animations respect `prefers-reduced-motion`
    - _Requirements: 4.5_

  - [~] 7.3 Validate visual area background positioning
    - Ensure `.hero-brutalist-bg` remains visible at all mobile viewports
    - Verify background image positioning and opacity
    - _Requirements: 3.5_

- [~] 7.4 Write visual regression tests
  - Capture snapshots at key breakpoints (1024px, 768px, 480px, 320px)
  - Compare against baseline to detect unintended layout shifts
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [~] 8. Final checkpoint - Cross-browser and device testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are CSS-only; no React component modifications required
- The existing CSS file already has mobile media queries that need modification, not creation
- Focus on maintaining the brutalist aesthetic while optimizing for mobile constraints
- Test on physical devices (iOS Safari, Chrome Android) for accurate touch interaction validation
- Consider using browser DevTools device emulation for initial testing before physical device testing

