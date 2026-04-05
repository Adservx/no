# Design Document: Hero Mobile Side-by-Side Layout

## Overview

This feature modifies the hero section's responsive behavior to maintain a side-by-side (horizontal) layout on mobile devices instead of the current vertical stacking. The design preserves the existing brutalist aesthetic while optimizing content readability and visual presentation within the constrained 50/50 split layout on mobile viewports.

The current implementation uses media queries that switch from `flex-direction: row` (desktop) to `flex-direction: column` (mobile). This design removes those column-forcing media queries and implements proportional scaling of typography, spacing, and visual elements to ensure both content and visual areas remain functional and aesthetically pleasing when constrained to 50% viewport width.

### Key Design Principles

1. **Layout Consistency**: Maintain `flex-direction: row` across all viewport widths
2. **Proportional Scaling**: Scale typography, spacing, and visual elements proportionally for mobile
3. **Touch Optimization**: Ensure interactive elements meet minimum touch target requirements
4. **Performance**: Minimize layout shifts and maintain smooth transitions
5. **Accessibility**: Preserve keyboard navigation, focus states, and screen reader compatibility

## Architecture

### Component Structure

The hero section consists of two main areas within a flex container:

```
.hero-brutalist
└── .hero-brutalist-main (flex container)
    ├── .hero-brutalist-content (Content Area - 50% on mobile)
    │   ├── .hero-brutalist-badge
    │   ├── .hero-brutalist-title
    │   └── .hero-brutalist-bottom
    │       ├── .hero-brutalist-description
    │       └── .hero-brutalist-cta
    └── .hero-brutalist-visual (Visual Area - 50% on mobile)
        ├── .hero-brutalist-bg
        └── .hero-brutalist-card
            ├── .hero-brutalist-card-image (video/img)
            ├── .hero-brutalist-card-title
            └── .hero-brutalist-card-text
```

### Layout Strategy

**Desktop (≥1024px)**: Current behavior maintained
- Content Area: 58.333% width (7/12 columns)
- Visual Area: 41.667% width (5/12 columns)

**Tablet (768px-1023px)**: New side-by-side behavior
- Content Area: 50% width
- Visual Area: 50% width

**Mobile (<768px)**: New side-by-side behavior
- Content Area: 50% width
- Visual Area: 50% width

### Responsive Breakpoints

The design uses three primary breakpoints:
- **1024px**: Desktop threshold (existing)
- **768px**: Tablet/mobile threshold (modified behavior)
- **480px**: Small mobile threshold (modified behavior)

## Components and Interfaces

### CSS Modifications

#### 1. Hero Main Container

**Current Implementation:**
```css
@media (max-width: 1023px) {
  .hero-brutalist-main {
    flex-direction: row; /* Already correct */
  }
}

@media (max-width: 768px) {
  .hero-brutalist-main {
    flex-direction: row; /* Currently column - needs change */
  }
}
```

**Design Change:**
- Remove any `flex-direction: column` declarations for mobile
- Ensure `flex-direction: row` is maintained across all breakpoints
- Add explicit `flex: 1` to both content and visual areas for equal width distribution

#### 2. Content Area Scaling

**Typography Scaling Strategy:**

| Element | Desktop | Tablet (768-1023px) | Mobile (<768px) | Small Mobile (<480px) |
|---------|---------|---------------------|-----------------|----------------------|
| Title | clamp(3rem, 10vw, 10rem) | clamp(3rem, 10vw, 6rem) | clamp(1.5rem, 5vw, 2.5rem) | clamp(1.25rem, 4vw, 2rem) |
| Description | 1.25rem | 1rem | 0.875rem | 0.75rem |
| Badge | 0.875rem | 0.75rem | 0.65rem | 0.6rem |
| CTA Button | 1.25rem | 1rem | 0.875rem | 0.75rem |

**Padding Reduction:**

| Breakpoint | Content Padding | Card Padding |
|------------|----------------|--------------|
| Desktop (≥1024px) | 4rem 3rem | 1.5rem |
| Tablet (768-1023px) | 2.5rem 1.5rem | 1.5rem |
| Mobile (<768px) | 2rem 1rem | 1rem |
| Small Mobile (<480px) | 1.5rem 0.75rem | 0.75rem |

#### 3. Visual Area Adaptation

**Floating Card Scaling:**
- Desktop: max-width 400px, min-height 500px
- Tablet: max-width none, height auto
- Mobile: max-width 100%, min-height auto
- Small Mobile: max-width 100%, min-height auto

**Card Image/Video Dimensions:**
- Desktop: height 16rem (256px)
- Mobile (<768px): height 8rem (128px)
- Small Mobile (<480px): height 7rem (112px)

**Border and Shadow Scaling:**
- Desktop: border 4px, shadow 12px offset
- Mobile: border 2px, shadow 4px offset
- Small Mobile: border 2px, shadow 3px offset

#### 4. Touch Target Optimization

**CTA Button Minimum Dimensions:**
- Minimum touch target: 44x44px (WCAG 2.1 Level AAA)
- Mobile padding: 0.75rem 1.5rem (12px 24px)
- Small mobile padding: 0.65rem 1.25rem (10.4px 20px)

**Hover Effect Disabling:**
```css
@media (max-width: 768px) {
  .hero-brutalist-card:hover {
    transform: none !important;
    box-shadow: [original] !important;
  }
  
  .hero-brutalist-card:hover .hero-brutalist-card-title,
  .hero-brutalist-card:hover .hero-brutalist-card-text,
  .hero-brutalist-card:hover .hero-brutalist-card-image {
    /* Reset to non-hover state */
  }
}
```

### React Component Interface

No changes required to ManikantLanding.tsx component structure. The existing JSX remains unchanged:

```tsx
<section className="hero-brutalist">
  <div className="hero-brutalist-main">
    <div className="hero-brutalist-content">
      {/* Content elements */}
    </div>
    <div className="hero-brutalist-visual">
      {/* Visual elements */}
    </div>
  </div>
</section>
```

## Data Models

No data model changes required. This is a pure CSS/styling modification.

## Error Handling

### Layout Degradation Scenarios

1. **Extremely Narrow Viewports (<320px)**
   - Fallback: Maintain side-by-side layout with further reduced typography
   - Use `overflow-wrap: break-word` to prevent text overflow
   - Minimum font sizes to prevent illegibility

2. **Content Overflow**
   - Apply `overflow: hidden` to parent containers
   - Use `text-overflow: ellipsis` for single-line text elements
   - Ensure multi-line text wraps appropriately with `word-wrap: break-word`

3. **Image/Video Loading Failures**
   - Existing background color provides fallback
   - Video element has poster attribute support (if needed)
   - Background image layer provides visual interest even if card media fails

4. **Touch Event Conflicts**
   - Disable hover effects on touch devices using `@media (hover: none)`
   - Prevent accidental card interactions by removing pointer events on mobile
   - Maintain CTA button as primary interactive element

### Browser Compatibility

- **Flexbox**: Supported in all modern browsers (IE11+)
- **CSS Custom Properties**: Supported in all modern browsers (IE11 with fallbacks)
- **clamp()**: Supported in modern browsers (fallback to fixed sizes for older browsers)
- **aspect-ratio**: Not used (using padding-based aspect ratio if needed)

## Testing Strategy

This feature involves UI rendering and responsive layout behavior, which is not suitable for property-based testing. The testing strategy focuses on visual regression testing, responsive behavior validation, and interaction testing.

### Unit Testing Approach

1. **Snapshot Tests**
   - Capture rendered output at key breakpoints (1024px, 768px, 480px, 320px)
   - Verify CSS class application
   - Ensure no unexpected DOM structure changes

2. **Responsive Behavior Tests**
   - Test viewport resize behavior
   - Verify flex-direction remains 'row' at all breakpoints
   - Validate computed styles at different viewport widths

3. **Interaction Tests**
   - Verify CTA button click handler fires correctly
   - Test smooth scroll behavior
   - Validate touch target dimensions meet minimum requirements

4. **Accessibility Tests**
   - Verify keyboard navigation works correctly
   - Test focus states on interactive elements
   - Validate ARIA labels and semantic HTML structure

### Integration Testing

1. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers: Safari iOS, Chrome Android

2. **Device Testing**
   - Physical device testing on iOS and Android
   - Emulator testing for various screen sizes
   - Orientation testing (portrait/landscape)

3. **Performance Testing**
   - Measure layout shift (CLS) during viewport transitions
   - Verify animation performance (60fps target)
   - Test video autoplay behavior on mobile

### Manual Testing Checklist

- [ ] Content remains readable at 50% width on mobile
- [ ] Visual area displays correctly at 50% width on mobile
- [ ] No horizontal scrolling occurs at any viewport width
- [ ] CTA button meets minimum touch target size
- [ ] Hover effects disabled on touch devices
- [ ] Smooth transitions between breakpoints
- [ ] Typography scales appropriately
- [ ] Card image/video maintains aspect ratio
- [ ] All animations perform smoothly
- [ ] Accessibility features preserved

### Test Implementation

Using Vitest and React Testing Library:

```typescript
describe('Hero Mobile Side-by-Side Layout', () => {
  it('maintains row layout on mobile viewports', () => {
    // Test flex-direction at various viewport widths
  });

  it('scales typography proportionally on mobile', () => {
    // Test computed font sizes at mobile breakpoints
  });

  it('ensures CTA button meets touch target requirements', () => {
    // Test button dimensions >= 44x44px
  });

  it('disables hover effects on touch devices', () => {
    // Test hover state changes on touch vs non-touch
  });
});
```

## Implementation Notes

### CSS Modification Strategy

1. **Phase 1**: Remove column-forcing media queries
   - Locate and remove `flex-direction: column` for mobile breakpoints
   - Ensure `flex: 1` is applied to both content and visual areas

2. **Phase 2**: Implement proportional scaling
   - Update typography sizes using clamp() or fixed values
   - Reduce padding and spacing for mobile breakpoints
   - Scale card dimensions and borders

3. **Phase 3**: Optimize touch interactions
   - Disable hover effects for mobile
   - Ensure touch target compliance
   - Test interaction behavior

4. **Phase 4**: Validate and refine
   - Cross-browser testing
   - Device testing
   - Performance validation

### Potential Challenges

1. **Text Readability**: With 50% width constraint, longer text may become difficult to read
   - Mitigation: Aggressive font size reduction and line-height optimization
   - Consider truncating or abbreviating text for mobile if needed

2. **Visual Balance**: Equal 50/50 split may not be visually optimal
   - Mitigation: Test various ratios (e.g., 55/45, 60/40) if 50/50 proves problematic
   - Adjust padding to create visual breathing room

3. **Touch Target Conflicts**: Limited space may cause interactive elements to overlap
   - Mitigation: Increase spacing between interactive elements
   - Reduce non-essential interactive features on mobile

4. **Performance**: Additional media queries and style calculations
   - Mitigation: Minimize redundant CSS rules
   - Use CSS containment where appropriate

### Accessibility Considerations

- Maintain semantic HTML structure
- Preserve keyboard navigation order (left-to-right: content → visual)
- Ensure sufficient color contrast ratios
- Provide focus indicators for interactive elements
- Test with screen readers (VoiceOver, TalkBack)
- Support reduced motion preferences (existing implementation preserved)

### Future Enhancements

- Consider user preference toggle for layout orientation
- Implement swipe gestures for mobile navigation
- Add lazy loading for video content on mobile
- Optimize image delivery based on viewport size
- Consider progressive enhancement for older browsers
