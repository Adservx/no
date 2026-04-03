import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(document.querySelector('.page-loader')).toBeTruthy();
  });

  it('should use lazy loading for routes', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.page-loader')).toBeTruthy();
  });
});
