// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CadWorkspace } from "./CadWorkspace";

describe("CadWorkspace Component", () => {
  it("renders feature history tree sidebar with initial features", () => {
    cleanup();
    render(<CadWorkspace />);
    expect(screen.getByText("Feature History")).toBeDefined();
    expect(screen.getAllByText("Base Sketch 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Base Extrude").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Outer Corner Fillets").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Center Bore Hole").length).toBeGreaterThan(0);
  });

  it("opens Property Inspector when a feature in history tree is clicked", () => {
    cleanup();
    render(<CadWorkspace />);
    const extrudeFeature = screen.getAllByText("Base Extrude")[0];
    fireEvent.click(extrudeFeature);

    expect(screen.getAllByText("Property Inspector").length).toBeGreaterThan(0);
    const input = screen.getByLabelText("Feature Name") as HTMLInputElement;
    expect(input.value).toBe("Base Extrude");
    expect(screen.getByText("Extrusion distance along Z-axis")).toBeDefined();
  });

  it("allows editing parametric dimensions in the Property Inspector drawer", () => {
    cleanup();
    render(<CadWorkspace />);
    const extrudeFeature = screen.getAllByText("Base Extrude")[0];
    fireEvent.click(extrudeFeature);

    const depthInput = screen.getByLabelText("Depth (Z)") as HTMLInputElement;
    expect(depthInput.value).toBe("25");

    fireEvent.change(depthInput, { target: { value: "50" } });
    expect(depthInput.value).toBe("50");

    const applyButton = screen.getByText("💾 Apply Changes");
    fireEvent.click(applyButton);
  });

  it("supports reordering feature operations", () => {
    cleanup();
    render(<CadWorkspace />);
    const moveDownButtons = screen.getAllByTitle("Move Down in History");
    expect(moveDownButtons.length).toBeGreaterThan(0);

    // Reorder first feature down
    fireEvent.click(moveDownButtons[0]);

    // Check list rendered order
    const featureItems = screen.getAllByRole("listitem");
    expect(featureItems.length).toBeGreaterThan(1);
  });

  it("supports toggling feature suppression", () => {
    cleanup();
    render(<CadWorkspace />);
    const suppressButtons = screen.getAllByTitle("Suppress Operation");
    expect(suppressButtons.length).toBeGreaterThan(0);

    fireEvent.click(suppressButtons[0]);

    // Should indicate suppressed state
    expect(screen.getAllByText("Suppressed").length).toBeGreaterThan(0);
  });

  it("allows setting and clearing the rollback bar", () => {
    cleanup();
    render(<CadWorkspace />);
    const rollbackBtn = screen.getByText("⏱️ Set Rollback Bar");
    fireEvent.click(rollbackBtn);

    expect(screen.getByText("▶️ End Rollback (Show All)")).toBeDefined();
  });

  it("allows adding a new feature operation", () => {
    cleanup();
    render(<CadWorkspace />);
    const addBtn = screen.getByText("+ Add Feature");
    fireEvent.click(addBtn);

    const addBossExtrude = screen.getByText(/Boss Extrude/i);
    fireEvent.click(addBossExtrude);

    expect(screen.getAllByText("New EXTRUDE").length).toBeGreaterThan(0);
  });
});
