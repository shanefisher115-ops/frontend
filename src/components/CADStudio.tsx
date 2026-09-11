import { useState } from "react";
import { CADFeatureTree } from "./CADFeatureTree";
import { CADPropertyInspector } from "./CADPropertyInspector";
import { CADViewport } from "./CADViewport";
import {
  createInitialCADState,
  reorderFeatures,
  moveFeatureUp,
  moveFeatureDown,
  updateFeatureParameters,
  createNewFeature,
  validateFeatureSequence,
} from "../lib/cadState";
import type { CADFeatureType, CADFeature } from "../types/cad";

export function CADStudio() {
  const [cadState, setCadState] = useState(createInitialCADState);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const { features, selectedFeatureId, rollbackIndex, searchQuery, filterType } = cadState;

  const selectedFeature = features.find((f) => f.id === selectedFeatureId) || null;

  // Handlers
  const handleSelectFeature = (id: string) => {
    setCadState((prev) => ({
      ...prev,
      selectedFeatureId: id,
    }));
    setInspectorOpen(true);
  };

  const handleReorderFeature = (fromIndex: number, toIndex: number) => {
    setCadState((prev) => {
      const nextFeatures = reorderFeatures(prev.features, fromIndex, toIndex);
      return {
        ...prev,
        features: nextFeatures,
        rollbackIndex: Math.min(prev.rollbackIndex, nextFeatures.length),
      };
    });
  };

  const handleMoveUp = (id: string) => {
    setCadState((prev) => {
      const nextFeatures = moveFeatureUp(prev.features, id);
      return { ...prev, features: nextFeatures };
    });
  };

  const handleMoveDown = (id: string) => {
    setCadState((prev) => {
      const nextFeatures = moveFeatureDown(prev.features, id);
      return { ...prev, features: nextFeatures };
    });
  };

  const handleUpdateParameters = (id: string, newParams: Partial<CADFeature["parameters"]>) => {
    setCadState((prev) => {
      const nextFeatures = updateFeatureParameters(prev.features, id, newParams);
      return { ...prev, features: nextFeatures };
    });
  };

  const handleUpdateName = (id: string, newName: string) => {
    setCadState((prev) => ({
      ...prev,
      features: prev.features.map((f) => (f.id === id ? { ...f, name: newName } : f)),
    }));
  };

  const handleToggleSuppress = (id: string) => {
    setCadState((prev) => {
      const nextFeatures = prev.features.map((f) => {
        if (f.id !== id) return f;
        return { ...f, suppressed: !f.suppressed };
      });
      return { ...prev, features: validateFeatureSequence(nextFeatures) };
    });
  };

  const handleToggleVisibility = (id: string) => {
    setCadState((prev) => ({
      ...prev,
      features: prev.features.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)),
    }));
  };

  const handleAddFeature = (type: CADFeatureType) => {
    setCadState((prev) => {
      const countOfType = prev.features.filter((f) => f.type === type).length;
      const newFeat = createNewFeature(type, countOfType);
      const nextFeatures = validateFeatureSequence([...prev.features, newFeat]);
      return {
        ...prev,
        features: nextFeatures,
        selectedFeatureId: newFeat.id,
        rollbackIndex: nextFeatures.length,
      };
    });
    setInspectorOpen(true);
  };

  const handleDuplicateFeature = (id: string) => {
    const feat = features.find((f) => f.id === id);
    if (!feat) return;

    setCadState((prev) => {
      const index = prev.features.findIndex((f) => f.id === id);
      const dup: CADFeature = {
        ...feat,
        id: `feat-${feat.type}-${Date.now().toString(36)}`,
        name: `${feat.name} (Copy)`,
        created_at: new Date().toISOString(),
        parameters: { ...feat.parameters },
      };
      const nextFeatures = [...prev.features];
      nextFeatures.splice(index + 1, 0, dup);

      return {
        ...prev,
        features: validateFeatureSequence(nextFeatures),
        selectedFeatureId: dup.id,
        rollbackIndex: Math.min(prev.rollbackIndex + 1, nextFeatures.length),
      };
    });
  };

  const handleDeleteFeature = (id: string) => {
    setCadState((prev) => {
      const nextFeatures = prev.features.filter((f) => f.id !== id);
      const remainingSelected = prev.selectedFeatureId === id
        ? (nextFeatures[0]?.id || null)
        : prev.selectedFeatureId;

      return {
        ...prev,
        features: validateFeatureSequence(nextFeatures),
        selectedFeatureId: remainingSelected,
        rollbackIndex: Math.min(prev.rollbackIndex, nextFeatures.length),
      };
    });
  };

  const handleSetRollbackIndex = (index: number) => {
    setCadState((prev) => ({
      ...prev,
      rollbackIndex: Math.max(0, Math.min(index, prev.features.length)),
    }));
  };

  const handleResetHistory = () => {
    setCadState(createInitialCADState());
  };

  return (
    <div className="cad-studio">
      {/* CAD Layout Container */}
      <div className="cad-studio__layout">
        {/* Left Sidebar: CAD Feature Tree */}
        <CADFeatureTree
          features={features}
          selectedFeatureId={selectedFeatureId}
          rollbackIndex={rollbackIndex}
          searchQuery={searchQuery}
          filterType={filterType}
          onSelectFeature={handleSelectFeature}
          onReorderFeature={handleReorderFeature}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleSuppress={handleToggleSuppress}
          onToggleVisibility={handleToggleVisibility}
          onAddFeature={handleAddFeature}
          onSetRollbackIndex={handleSetRollbackIndex}
          onSearchChange={(query) => setCadState((p) => ({ ...p, searchQuery: query }))}
          onFilterTypeChange={(filter) => setCadState((p) => ({ ...p, filterType: filter }))}
          onResetHistory={handleResetHistory}
        />

        {/* Center: 3D Viewport */}
        <main className="cad-studio__viewport-area">
          <CADViewport
            features={features}
            selectedFeatureId={selectedFeatureId}
            rollbackIndex={rollbackIndex}
            onSelectFeature={handleSelectFeature}
          />
        </main>

        {/* Right Drawer: Property Inspector */}
        <CADPropertyInspector
          feature={selectedFeature}
          features={features}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          onUpdateParameters={handleUpdateParameters}
          onUpdateName={handleUpdateName}
          onToggleSuppress={handleToggleSuppress}
          onToggleVisibility={handleToggleVisibility}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDuplicate={handleDuplicateFeature}
          onDelete={handleDeleteFeature}
        />
      </div>
    </div>
  );
}
