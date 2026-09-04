// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CadViewport } from './CadViewport';

vi.mock('three', async () => {
  const actualThree = await vi.importActual<typeof import('three')>('three');

  class MockWebGLRenderer {
    domElement = document.createElement('canvas');
    shadowMap = { enabled: false, type: 0 };
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }

  return {
    ...actualThree,
    WebGLRenderer: MockWebGLRenderer,
  };
});

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => {
  class MockOrbitControls {
    enableDamping = true;
    dampingFactor = 0.05;
    target = { set: vi.fn(), copy: vi.fn() };
    update = vi.fn();
    dispose = vi.fn();
  }
  return {
    OrbitControls: MockOrbitControls,
  };
});

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CadViewport Component', () => {
  it('renders CAD model and toolpath selection controls', () => {
    render(<CadViewport />);

    expect(screen.getByLabelText(/CAD Model:/i)).toBeDefined();
    expect(screen.getByLabelText(/CAM Path:/i)).toBeDefined();
    expect(screen.getByText(/CNC DIGITAL READOUT/i)).toBeDefined();
  });

  it('allows toggling wireframe mode', () => {
    render(<CadViewport />);

    const wireframeBtn = screen.getByRole('button', { name: /Toggle Wireframe Mesh/i });
    expect(wireframeBtn.classList.contains('cad-btn--active')).toBe(false);

    fireEvent.click(wireframeBtn);
    expect(wireframeBtn.classList.contains('cad-btn--active')).toBe(true);

    fireEvent.click(wireframeBtn);
    expect(wireframeBtn.classList.contains('cad-btn--active')).toBe(false);
  });

  it('allows toggling playback state', () => {
    render(<CadViewport />);

    const playPauseBtn = screen.getByRole('button', { name: /Pause Animation/i });
    expect(playPauseBtn).toBeDefined();

    fireEvent.click(playPauseBtn);
    expect(screen.getByRole('button', { name: /Play Animation/i })).toBeDefined();
  });

  it('allows changing active CAD model and CAM toolpath options', () => {
    render(<CadViewport />);

    const modelSelect = screen.getByLabelText(/CAD Model:/i) as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'pocket' } });
    expect(modelSelect.value).toBe('pocket');

    const toolpathSelect = screen.getByLabelText(/CAM Path:/i) as HTMLSelectElement;
    fireEvent.change(toolpathSelect, { target: { value: 'spiralPocket' } });
    expect(toolpathSelect.value).toBe('spiralPocket');
  });

  it('allows scrubbing progress slider', () => {
    render(<CadViewport />);

    const scrubber = screen.getByLabelText(/CAM Cutter Path Progress/i) as HTMLInputElement;
    fireEvent.change(scrubber, { target: { value: '0.75' } });
    expect(scrubber.value).toBe('0.75');
  });
});
