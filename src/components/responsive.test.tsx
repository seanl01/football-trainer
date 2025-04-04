import { render, screen, act } from '@testing-library/react';
import { Responsive } from './responsive';
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the CSS variables and media queries
const originalGetComputedStyle = window.getComputedStyle;
const originalMatchMedia = window.matchMedia;

describe('Responsive component', () => {
  beforeEach(() => {
    // Mock getComputedStyle to return our breakpoint values
    window.getComputedStyle = () => ({
      getPropertyValue: (prop) => {
        const breakpoints = {
          '--breakpoint-sm': '40rem',
          '--breakpoint-md': '48rem',
          '--breakpoint-lg': '64rem',
          '--breakpoint-xl': '80rem',
          '--breakpoint-2xl': '96rem',
        };
        //@ts-ignore
        return breakpoints[prop] || '';
      }
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    // Restore original functions
    window.getComputedStyle = originalGetComputedStyle;
    window.matchMedia = originalMatchMedia;
  });

  test('renders xs content when screen is smaller than sm breakpoint', () => {
    // Mock matchMedia to return false for all breakpoints
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <Responsive
        xs={<div>xs content</div>}
        sm={<div>sm content</div>}
        md={<div>md content</div>}
      />
    );

    expect(screen.getByText('xs content'))
  });

  test('renders sm content when screen is between sm and md breakpoints', () => {
    // Mock matchMedia to return true only for sm breakpoint
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('40rem'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <Responsive
        xs={<div>xs content</div>}
        sm={<div>sm content</div>}
        md={<div>md content</div>}
      />
    );

    expect(screen.getByText('sm content'))
  });

  test('renders md content when screen is between md and lg breakpoints', () => {
    // Mock matchMedia to return true for sm and md breakpoints
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('40rem') || query.includes('48rem'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <Responsive
        xs={<div>xs content</div>}
        sm={<div>sm content</div>}
        md={<div>md content</div>}
        lg={<div>lg content</div>}
      />
    );

    expect(screen.getByText('md content'))
  });

  test('responds to window resize events', async () => {
    // Initially mock to show xs
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(
      <Responsive
        xs={<div>xs content</div>}
        md={<div>md content</div>}
      />
    );

    expect(screen.getByText('xs content'))
    // Now update the mock to show md and trigger resize
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('40rem') || query.includes('48rem'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    // Trigger window resize
    act(() => {
      window.innerWidth = 800; // Set to a width that would match md
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByText('md content'))
  });

  test('falls back to smaller breakpoint when a breakpoint is missing', () => {
    // Mock matchMedia to return true for all breakpoints
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(
      <Responsive
        xs={<div>xs content</div>}
        md={<div>md content</div>}
      />
    );

    // Should show md since we're mocking as if all breakpoints match
    // and md is the largest available breakpoint
    expect(screen.getByText('md content'))
  });
});
