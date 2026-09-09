import React, { useState, useRef } from 'react';
import { CADViewport, type CADViewportHandle } from './CADViewport';
import { SAMPLE_TOOLPATHS } from '../lib/sampleToolpaths';
import type { ViewportConfig, MaterialType, ToolpathPoint } from '../types/cad';

export function CADConsole() {
  const viewportRef = useRef<CADViewportHandle>(null);

  const [selectedToolpathKey, setSelectedToolpathKey] = useState<string>('pocketAndContour');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentPoint, setCurrentPoint] = useState<ToolpathPoint>({
    x: 0,
    y: 0,
    z: 0,
    feedRate: 0,
    type: 'rapid',
  });

  const [config, setConfig] = useState<ViewportConfig>({
    wireframe: false,
    showGrid: true,
    showAxes: true,
    showToolpath: true,
    material: 'aluminum',
    cutColor: '#10b981',
    toolDiameter: 6,
  });

  const activeToolpath = SAMPLE_TOOLPATHS[selectedToolpathKey] || SAMPLE_TOOLPATHS.pocketAndContour;

  const handlePlayPause = () => {
    if (isPlaying) {
      viewportRef.current?.pause();
    } else {
      viewportRef.current?.play();
    }
  };

  const handleReset = () => {
    viewportRef.current?.resetAnimation();
    setProgress(0);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    viewportRef.current?.setAnimationProgress(val);
  };

  const handleViewChange = (view: 'isometric' | 'top' | 'front' | 'right') => {
    viewportRef.current?.setView(view);
  };

  const handleResetCamera = () => {
    viewportRef.current?.resetCamera();
  };

  return (
    <div className="cad-console-card card">
      <div className="cad-console__header">
        <div>
          <h2 className="card__title">3D CAD / CAM Toolpath Viewport</h2>
          <p className="console__subtitle" style={{ marginTop: '0.2rem' }}>
            Interactive Three.js 3D viewport, Orbit controls, Wireframe toggle & Material cutting simulation
          </p>
        </div>
        <div className="cad-console__presets">
          <label className="cad-select-label">
            <span>Preset Toolpath:</span>
            <select
              value={selectedToolpathKey}
              onChange={(e) => {
                setSelectedToolpathKey(e.target.value);
                setProgress(0);
                setIsPlaying(false);
              }}
              className="cad-select"
            >
              {Object.entries(SAMPLE_TOOLPATHS).map(([key, tp]) => (
                <option key={key} value={key}>
                  {tp.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="connection-card__desc" style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
        {activeToolpath.description} Stock dimensions:{' '}
        <code>
          {activeToolpath.stockDimensions.width} x {activeToolpath.stockDimensions.height} x{' '}
          {activeToolpath.stockDimensions.depth} mm
        </code>
      </p>

      {/* Main 3D Viewport Container */}
      <div className="cad-viewport-container">
        <CADViewport
          ref={viewportRef}
          toolpath={activeToolpath}
          config={config}
          playbackSpeed={playbackSpeed}
          onProgressChange={(prog, point) => {
            setProgress(prog);
            setCurrentPoint(point);
          }}
          onPlaybackStateChange={(playing) => setIsPlaying(playing)}
        />

        {/* Floating CAD View Overlay Controls */}
        <div className="cad-overlay-controls top-right">
          <div className="cad-button-group">
            <button
              type="button"
              className="cad-btn cad-btn--icon"
              title="Reset Camera"
              onClick={handleResetCamera}
            >
              🎯 Fit
            </button>
            <button
              type="button"
              className="cad-btn"
              onClick={() => handleViewChange('isometric')}
            >
              Iso
            </button>
            <button
              type="button"
              className="cad-btn"
              onClick={() => handleViewChange('top')}
            >
              Top
            </button>
            <button
              type="button"
              className="cad-btn"
              onClick={() => handleViewChange('front')}
            >
              Front
            </button>
            <button
              type="button"
              className="cad-btn"
              onClick={() => handleViewChange('right')}
            >
              Right
            </button>
          </div>
        </div>

        {/* Floating CAM Readout Stats (Top Left) */}
        <div className="cad-overlay-controls top-left cad-stat-box">
          <div className="cad-stat-item">
            <span className="cad-stat-label">X:</span>
            <span className="cad-stat-value">{currentPoint.x.toFixed(2)} mm</span>
          </div>
          <div className="cad-stat-item">
            <span className="cad-stat-label">Y:</span>
            <span className="cad-stat-value">{currentPoint.y.toFixed(2)} mm</span>
          </div>
          <div className="cad-stat-item">
            <span className="cad-stat-label">Z:</span>
            <span className="cad-stat-value">{currentPoint.z.toFixed(2)} mm</span>
          </div>
          <div className="cad-stat-item">
            <span className="cad-stat-label">Feed:</span>
            <span className="cad-stat-value">{currentPoint.feedRate} mm/min</span>
          </div>
          <div className="cad-stat-item">
            <span className="cad-stat-label">Move:</span>
            <span
              className={`cad-stat-badge cad-stat-badge--${currentPoint.type}`}
            >
              {currentPoint.type.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Animation Playback Scrubber Bar */}
      <div className="cad-playback-bar">
        <button
          type="button"
          className="cad-btn cad-btn--primary"
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button type="button" className="cad-btn" onClick={handleReset}>
          ⏹ Reset
        </button>

        <div className="cad-scrubber-wrap">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={handleScrubberChange}
            className="cad-scrubber"
            aria-label="CAM Animation Progress Scrubber"
          />
          <span className="cad-progress-text">{(progress * 100).toFixed(1)}%</span>
        </div>

        <div className="cad-speed-wrap">
          <span className="cad-label">Speed:</span>
          {[0.5, 1, 2, 5].map((spd) => (
            <button
              key={spd}
              type="button"
              className={`cad-btn cad-btn--sm ${playbackSpeed === spd ? 'cad-btn--active' : ''}`}
              onClick={() => setPlaybackSpeed(spd)}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* CAD Toolbar & Viewport Toggles */}
      <div className="cad-toolbar">
        <div className="cad-toolbar__group">
          <label className="cad-toggle">
            <input
              type="checkbox"
              checked={config.wireframe}
              onChange={(e) =>
                setConfig((c) => ({ ...c, wireframe: e.target.checked }))
              }
            />
            <span>Mesh Wireframe</span>
          </label>

          <label className="cad-toggle">
            <input
              type="checkbox"
              checked={config.showToolpath}
              onChange={(e) =>
                setConfig((c) => ({ ...c, showToolpath: e.target.checked }))
              }
            />
            <span>CAM Toolpath Line</span>
          </label>

          <label className="cad-toggle">
            <input
              type="checkbox"
              checked={config.showGrid}
              onChange={(e) =>
                setConfig((c) => ({ ...c, showGrid: e.target.checked }))
              }
            />
            <span>CAD Grid</span>
          </label>

          <label className="cad-toggle">
            <input
              type="checkbox"
              checked={config.showAxes}
              onChange={(e) =>
                setConfig((c) => ({ ...c, showAxes: e.target.checked }))
              }
            />
            <span>XYZ Axes</span>
          </label>
        </div>

        <div className="cad-toolbar__group">
          <label className="cad-select-label">
            <span>Stock Material:</span>
            <select
              value={config.material}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  material: e.target.value as MaterialType,
                }))
              }
              className="cad-select"
            >
              <option value="aluminum">Aluminum 6061</option>
              <option value="brass">Brass C360</option>
              <option value="steel">Stainless Steel</option>
              <option value="wood">Hardwood / MDF</option>
            </select>
          </label>

          <label className="cad-select-label">
            <span>Tool Diameter:</span>
            <select
              value={config.toolDiameter}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  toolDiameter: parseFloat(e.target.value),
                }))
              }
              className="cad-select"
            >
              <option value="3">3 mm Endmill</option>
              <option value="6">6 mm Endmill</option>
              <option value="10">10 mm Endmill</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
