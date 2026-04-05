import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManikantLanding from '../src/pages/ManikantLanding';

/**
 * Tests for Hero Mobile Side-by-Side Layout
 * Validates: Requirements 1.1, 1.2, 4.1
 */
describe('Hero Brutalist Layout Direction', () => {
  beforeEach(() => {
    // Reset any viewport changes
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  it('should maintain flex-direction row at desktop viewport (1024px)', () => {
    const { container } = render(
      <BrowserRouter>
        <ManikantLanding />
      </BrowserRouter>
    );

    const heroMain = container.querySelector('.hero-brutalist-main');
    expect(heroMain).toBeTruthy();

    const styles = window.getComputedStyle(heroMain!);
    expect(styles.flexDirection).toBe('row');
  });

  it('should maintain flex-direction row at tablet viewport (768px)', () => {
    // Mock viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { container } = render(
      <BrowserRouter>
        <ManikantLanding />
      </BrowserRouter>
    );

    const heroMain = container.querySelector('.hero-brutalist-main');
    expect(heroMain).toBeTruthy();

    const styles = window.getComputedStyle(heroMain!);
    expect(styles.flexDirection).toBe('row');
  });

  it('should maintain flex-direction row at mobile viewport (480px)', () => {
    // Mock viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    const { container } = render(
      <BrowserRouter>
        <ManikantLanding />
      </BrowserRouter>
    );

    const heroMain = container.querySelector('.hero-brutalist-main');
    expect(heroMain).toBeTruthy();

    const styles = window.getComputedStyle(heroMain!);
    expect(styles.flexDirection).toBe('row');
  });

  it('should maintain flex-direction row at small mobile viewport (320px)', () => {
    // Mock viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    const { container } = render(
      <BrowserRouter>
        <ManikantLanding />
      </BrowserRouter>
    );

    const heroMain = container.querySelector('.hero-brutalist-main');
    expect(heroMain).toBeTruthy();

    const styles = window.getComputedStyle(heroMain!);
    expect(styles.flexDirection).toBe('row');
  });

  it('should have equal flex values for content and visual areas', () => {
    const { container } = render(
      <BrowserRouter>
        <ManikantLanding />
      </BrowserRouter>
    );

    const contentArea = container.querySelector('.hero-brutalist-content');
    const visualArea = container.querySelector('.hero-brutalist-visual');

    expect(contentArea).toBeTruthy();
    expect(visualArea).toBeTruthy();

    const contentStyles = window.getComputedStyle(contentArea!);
    const visualStyles = window.getComputedStyle(visualArea!);

    // Both should have flex: 1 (computed as '1 1 0%')
    expect(contentStyles.flex).toBe('1 1 0%');
    expect(visualStyles.flex).toBe('1 1 0%');
  });

  it('should display both content and visual areas side by side', () => {
    const { container } = render(
      <BrowserRouter>
        <ManikantLanding />
      </BrowserRouter>
    );

    const heroMain = container.querySelector('.hero-brutalist-main');
    const contentArea = container.querySelector('.hero-brutalist-content');
    const visualArea = container.querySelector('.hero-brutalist-visual');

    expect(heroMain).toBeTruthy();
    expect(contentArea).toBeTruthy();
    expect(visualArea).toBeTruthy();

    // Verify both areas are children of hero-main
    expect(heroMain!.contains(contentArea!)).toBe(true);
    expect(heroMain!.contains(visualArea!)).toBe(true);
  });
});
