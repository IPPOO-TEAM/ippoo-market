import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import { SplashScreen, useSplashScreen } from '../splash-screen';

describe('SplashScreen', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should render logo and tagline', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    expect(screen.getByAltText('IPPOO Market')).toBeInTheDocument();
    expect(screen.getByText('IPPOO Market')).toBeInTheDocument();
  });

  it('should call onComplete after animation duration', async () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should display tagline after initial animation', async () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    await waitFor(() => {
      expect(screen.getByText(/grossiste africain/i)).toBeInTheDocument();
    }, { timeout: 1500 });
  });
});

describe('useSplashScreen', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should show splash on first visit', () => {
    const { result } = renderHook(() => useSplashScreen());
    expect(result.current.showSplash).toBe(true);
  });

  it('should not show splash if already shown in session', () => {
    sessionStorage.setItem('ippoo:splash-shown', '1');
    const { result } = renderHook(() => useSplashScreen());
    expect(result.current.showSplash).toBe(false);
  });

  it('should hide splash after handleComplete', () => {
    const { result } = renderHook(() => useSplashScreen());

    expect(result.current.showSplash).toBe(true);

    act(() => {
      result.current.handleComplete();
    });

    expect(result.current.showSplash).toBe(false);
    expect(sessionStorage.getItem('ippoo:splash-shown')).toBe('1');
  });
});

// Helper pour renderHook (simple version)
function renderHook<T>(hook: () => T) {
  let result: { current: T };
  function TestComponent() {
    result = { current: hook() };
    return null;
  }
  render(<TestComponent />);
  return { result: result! };
}

function act(callback: () => void) {
  callback();
}
