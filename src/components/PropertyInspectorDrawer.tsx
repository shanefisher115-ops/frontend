import React, { useState, useEffect } from "react";
import type { CadFeature, CadDimension, DimensionUnit } from "../types/cad";

interface PropertyInspectorDrawerProps {
  feature: CadFeature | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFeature: (updated: CadFeature) => void;
  onToggleSuppress: (id: string) => void;
  onDeleteFeature: (id: string) => void;
}

export const PropertyInspectorDrawer: React.FC<PropertyInspectorDrawerProps> = ({
  feature,
  isOpen,
  onClose,
  onUpdateFeature,
  onToggleSuppress,
  onDeleteFeature,
}) => {
  const [editedFeature, setEditedFeature] = useState<CadFeature | null>(feature);
  const [newDimName, setNewDimName] = useState("");
  const [newDimVal, setNewDimVal] = useState<number>(10);
  const [newDimUnit, setNewDimUnit] = useState<DimensionUnit>("mm");
  const [showAddDim, setShowAddDim] = useState(false);

  useEffect(() => {
    setEditedFeature(feature);
  }, [feature]);

  if (!isOpen || !editedFeature) {
    return null;
  }

  const handleNameChange = (newName: string) => {
    setEditedFeature({
      ...editedFeature,
      name: newName,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDimensionChange = (
    dimId: string,
    key: keyof CadDimension,
    val: any
  ) => {
    const nextDims = editedFeature.dimensions.map((d) => {
      if (d.id === dimId) {
        return { ...d, [key]: val };
      }
      return d;
    });

    setEditedFeature({
      ...editedFeature,
      dimensions: nextDims,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = () => {
    if (editedFeature) {
      onUpdateFeature(editedFeature);
    }
  };

  const handleAddDimension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDimName.trim()) return;

    const newDim: CadDimension = {
      id: `dim-${Date.now()}`,
      name: newDimName.trim(),
      value: Number(newDimVal),
      unit: newDimUnit,
      min: 0,
      max: newDimVal * 5 || 100,
      step: 1,
    };

    const updated = {
      ...editedFeature,
      dimensions: [...editedFeature.dimensions, newDim],
      updatedAt: new Date().toISOString(),
    };

    setEditedFeature(updated);
    setNewDimName("");
    setNewDimVal(10);
    setShowAddDim(false);
  };

  const handleDeleteDimension = (dimId: string) => {
    const updated = {
      ...editedFeature,
      dimensions: editedFeature.dimensions.filter((d) => d.id !== dimId),
      updatedAt: new Date().toISOString(),
    };
    setEditedFeature(updated);
  };

  return (
    <div
      className={`property-inspector-drawer ${isOpen ? "is-open" : ""}`}
      role="region"
      aria-label="Property Inspector Drawer"
    >
      <div className="inspector__header">
        <div className="inspector__title-wrap">
          <span className="inspector__badge">{editedFeature.type}</span>
          <h2 className="inspector__title">Property Inspector</h2>
        </div>
        <button
          type="button"
          className="inspector__close-btn"
          onClick={onClose}
          aria-label="Close Inspector"
        >
          ✕
        </button>
      </div>

      <div className="inspector__content">
        {/* Feature Overview Section */}
        <div className="inspector__section">
          <label className="inspector__label" htmlFor="feature-name-input">
            Feature Name
          </label>
          <input
            id="feature-name-input"
            type="text"
            value={editedFeature.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="inspector__input"
          />
        </div>

        <div className="inspector__meta-grid">
          <div className="meta-card">
            <span className="meta-card__label">Status</span>
            <span
              className={`meta-card__val status-pill status-pill--${editedFeature.status}`}
            >
              {editedFeature.status.toUpperCase()}
            </span>
          </div>
          <div className="meta-card">
            <span className="meta-card__label">Suppressed</span>
            <span className="meta-card__val">
              {editedFeature.suppressed ? "Yes 🚫" : "No ⚡"}
            </span>
          </div>
          <div className="meta-card">
            <span className="meta-card__label">Author</span>
            <span className="meta-card__val font-mono">
              {editedFeature.author || "System"}
            </span>
          </div>
          <div className="meta-card">
            <span className="meta-card__label">Updated</span>
            <span className="meta-card__val font-mono">
              {new Date(editedFeature.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Parametric Dimensions Section */}
        <div className="inspector__section">
          <div className="inspector__section-header">
            <h3>Parametric Dimensions</h3>
            <button
              type="button"
              className="btn btn--xs btn--outline"
              onClick={() => setShowAddDim(!showAddDim)}
            >
              {showAddDim ? "Cancel" : "+ Add Dimension"}
            </button>
          </div>

          {showAddDim && (
            <form
              onSubmit={handleAddDimension}
              className="inspector__add-dim-form"
            >
              <input
                type="text"
                placeholder="Dimension Name (e.g., Inner Radius)"
                value={newDimName}
                onChange={(e) => setNewDimName(e.target.value)}
                required
                className="inspector__input"
              />
              <div className="inspector__inline-fields">
                <input
                  type="number"
                  value={newDimVal}
                  onChange={(e) => setNewDimVal(Number(e.target.value))}
                  className="inspector__input"
                />
                <select
                  value={newDimUnit}
                  onChange={(e) =>
                    setNewDimUnit(e.target.value as DimensionUnit)
                  }
                  className="inspector__select"
                >
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                  <option value="deg">deg</option>
                </select>
                <button type="submit" className="btn btn--sm btn--primary">
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="dimension-list">
            {editedFeature.dimensions.length === 0 ? (
              <p className="inspector__empty">No parametric dimensions set.</p>
            ) : (
              editedFeature.dimensions.map((dim) => (
                <div key={dim.id} className="dimension-card">
                  <div className="dimension-card__header">
                    <span className="dimension-card__title">{dim.name}</span>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger icon-btn--xs"
                      onClick={() => handleDeleteDimension(dim.id)}
                      title="Delete Dimension"
                    >
                      ✕
                    </button>
                  </div>

                  {dim.description && (
                    <p className="dimension-card__desc">{dim.description}</p>
                  )}

                  <div className="dimension-card__controls">
                    <div className="dimension-card__num-input-wrap">
                      <input
                        type="number"
                        value={dim.value}
                        min={dim.min}
                        max={dim.max}
                        step={dim.step || 1}
                        onChange={(e) =>
                          handleDimensionChange(
                            dim.id,
                            "value",
                            Number(e.target.value)
                          )
                        }
                        className="inspector__input inspector__input--num"
                        aria-label={dim.name}
                      />
                      <span className="dimension-card__unit">{dim.unit}</span>
                    </div>

                    <input
                      type="range"
                      min={dim.min ?? 0}
                      max={dim.max ?? Math.max(100, dim.value * 2)}
                      step={dim.step || 1}
                      value={dim.value}
                      onChange={(e) =>
                        handleDimensionChange(
                          dim.id,
                          "value",
                          Number(e.target.value)
                        )
                      }
                      className="dimension-card__slider"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="inspector__footer">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSave}
        >
          💾 Apply Changes
        </button>

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onToggleSuppress(editedFeature.id)}
        >
          {editedFeature.suppressed ? "⚡ Unsuppress" : "🚫 Suppress"}
        </button>

        <button
          type="button"
          className="btn btn--danger"
          onClick={() => {
            onDeleteFeature(editedFeature.id);
            onClose();
          }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};
