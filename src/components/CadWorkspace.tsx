import React, { useState } from "react";
import { FeatureTreeSidebar } from "./FeatureTreeSidebar";
import { PropertyInspectorDrawer } from "./PropertyInspectorDrawer";
import { CadViewport } from "./CadViewport";
import { INITIAL_CAD_FEATURES, CAD_MODEL_PRESETS } from "../lib/cadData";
import type { CadFeature, FeatureType } from "../types/cad";

export const CadWorkspace: React.FC = () => {
  const [features, setFeatures] = useState<CadFeature[]>(INITIAL_CAD_FEATURES);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    INITIAL_CAD_FEATURES[0]?.id || null
  );
  const [rollbackIndex, setRollbackIndex] = useState<number>(-1);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("mounting-bracket");

  const selectedFeature =
    features.find((f) => f.id === selectedFeatureId) || null;

  // Handlers for features operations
  const handleSelectFeature = (id: string) => {
    setSelectedFeatureId(id);
    setIsInspectorOpen(true);
  };

  const handleReorderFeature = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= features.length) return;
    const next = [...features];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setFeatures(next);
  };

  const handleToggleSuppress = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, suppressed: !f.suppressed, updatedAt: new Date().toISOString() } : f
      )
    );
  };

  const handleToggleVisibility = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, visible: !f.visible, updatedAt: new Date().toISOString() } : f
      )
    );
  };

  const handleAddFeature = (type: FeatureType) => {
    const newFeature: CadFeature = {
      id: `feat-${Date.now()}`,
      name: `New ${type.toUpperCase().replace("_", " ")}`,
      type,
      suppressed: false,
      visible: true,
      status: "ok",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: "Operator",
      color: "#3b82f6",
      dimensions: [
        {
          id: `dim-${Date.now()}-1`,
          name: "Primary Dimension",
          value: 20,
          unit: "mm",
          min: 1,
          max: 100,
          step: 1,
        },
      ],
    };

    setFeatures((prev) => [...prev, newFeature]);
    setSelectedFeatureId(newFeature.id);
    setIsInspectorOpen(true);
  };

  const handleDeleteFeature = (id: string) => {
    setFeatures((prev) => prev.filter((f) => f.id !== id));
    if (selectedFeatureId === id) {
      setSelectedFeatureId(null);
    }
  };

  const handleUpdateFeature = (updated: CadFeature) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = CAD_MODEL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setFeatures(preset.features);
      setSelectedFeatureId(preset.features[0]?.id || null);
      setRollbackIndex(-1);
    }
  };

  const handleResetModel = () => {
    setFeatures(INITIAL_CAD_FEATURES);
    setSelectedFeatureId(INITIAL_CAD_FEATURES[0]?.id || null);
    setRollbackIndex(-1);
    setSelectedPresetId("mounting-bracket");
  };

  return (
    <div className="cad-workspace">
      {/* Top Navigation & Controls Bar */}
      <div className="cad-workspace__topbar">
        <div className="cad-workspace__preset-select-wrap">
          <label htmlFor="preset-select" className="topbar-label">
            📦 Sample Preset Model:
          </label>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="topbar-select"
          >
            {CAD_MODEL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="cad-workspace__topbar-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleResetModel}
          >
            🔄 Reset Model History
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          >
            {isInspectorOpen ? "📐 Hide Inspector" : "📐 Show Inspector"}
          </button>
        </div>
      </div>

      {/* Main Workspace Grid (Sidebar | Viewport | Inspector Drawer) */}
      <div className="cad-workspace__grid">
        <FeatureTreeSidebar
          features={features}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={handleSelectFeature}
          onReorderFeature={handleReorderFeature}
          onToggleSuppress={handleToggleSuppress}
          onToggleVisibility={handleToggleVisibility}
          onAddFeature={handleAddFeature}
          onDeleteFeature={handleDeleteFeature}
          rollbackIndex={rollbackIndex}
          onSetRollbackIndex={setRollbackIndex}
        />

        <main className="cad-workspace__main">
          <CadViewport
            features={features}
            selectedFeatureId={selectedFeatureId}
            rollbackIndex={rollbackIndex}
            onSelectFeature={handleSelectFeature}
          />
        </main>

        <PropertyInspectorDrawer
          feature={selectedFeature}
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          onUpdateFeature={handleUpdateFeature}
          onToggleSuppress={handleToggleSuppress}
          onDeleteFeature={handleDeleteFeature}
        />
      </div>
    </div>
  );
};
