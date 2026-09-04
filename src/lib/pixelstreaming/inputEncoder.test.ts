import { describe, it, expect } from "vitest";
import {
  normalizeCoordinates,
  encodeMouseMove,
  encodeMouseDown,
  encodeMouseUp,
  encodeMouseWheel,
  encodeKeyDown,
  encodeKeyUp,
  encodeKeyPress,
  encodeUIInteraction,
} from "./inputEncoder";
import { InputMessageType } from "../../types/pixelstreaming";

describe("inputEncoder", () => {
  describe("normalizeCoordinates", () => {
    it("normalizes element relative pixel coordinates to uint16 [0, 65535]", () => {
      expect(normalizeCoordinates(0, 0, 1920, 1080)).toEqual({ x: 0, y: 0 });
      expect(normalizeCoordinates(1920, 1080, 1920, 1080)).toEqual({ x: 65535, y: 65535 });
      expect(normalizeCoordinates(960, 540, 1920, 1080)).toEqual({ x: 32768, y: 32768 });
    });

    it("clamps out of bounds coordinates to [0, 65535]", () => {
      expect(normalizeCoordinates(-100, -50, 1000, 1000)).toEqual({ x: 0, y: 0 });
      expect(normalizeCoordinates(2000, 2000, 1000, 1000)).toEqual({ x: 65535, y: 65535 });
    });

    it("handles zero or negative width/height gracefully", () => {
      expect(normalizeCoordinates(10, 10, 0, 0)).toEqual({ x: 0, y: 0 });
    });
  });

  describe("encodeMouseMove", () => {
    it("encodes mouse move binary buffer with type header 50", () => {
      const bytes = encodeMouseMove(32768, 16384, 10, -5);
      expect(bytes.length).toBe(9);
      expect(bytes[0]).toBe(InputMessageType.MouseMove);

      const view = new DataView(bytes.buffer);
      expect(view.getUint16(1, true)).toBe(32768);
      expect(view.getUint16(3, true)).toBe(16384);
      expect(view.getInt16(5, true)).toBe(10);
      expect(view.getInt16(7, true)).toBe(-5);
    });
  });

  describe("encodeMouseDown and encodeMouseUp", () => {
    it("encodes mouse down binary buffer with type header 51 and button code", () => {
      const bytes = encodeMouseDown(2, 1000, 2000);
      expect(bytes.length).toBe(6);
      expect(bytes[0]).toBe(InputMessageType.MouseDown);
      expect(bytes[1]).toBe(2); // Right button

      const view = new DataView(bytes.buffer);
      expect(view.getUint16(2, true)).toBe(1000);
      expect(view.getUint16(4, true)).toBe(2000);
    });

    it("encodes mouse up binary buffer with type header 52", () => {
      const bytes = encodeMouseUp(0, 500, 600);
      expect(bytes.length).toBe(6);
      expect(bytes[0]).toBe(InputMessageType.MouseUp);
      expect(bytes[1]).toBe(0); // Left button
    });
  });

  describe("encodeMouseWheel", () => {
    it("encodes mouse wheel scroll with type header 53", () => {
      const bytes = encodeMouseWheel(-120, 5000, 10000);
      expect(bytes.length).toBe(7);
      expect(bytes[0]).toBe(InputMessageType.MouseWheel);

      const view = new DataView(bytes.buffer);
      expect(view.getInt16(1, true)).toBe(-120);
      expect(view.getUint16(3, true)).toBe(5000);
      expect(view.getUint16(5, true)).toBe(10000);
    });
  });

  describe("encodeKeyDown, encodeKeyUp, encodeKeyPress", () => {
    it("encodes KeyDown with keyCode and repeat flag", () => {
      const bytes = encodeKeyDown(65, true);
      expect(bytes.length).toBe(3);
      expect(bytes[0]).toBe(InputMessageType.KeyDown);
      expect(bytes[1]).toBe(65);
      expect(bytes[2]).toBe(1);
    });

    it("encodes KeyUp with keyCode", () => {
      const bytes = encodeKeyUp(65);
      expect(bytes.length).toBe(2);
      expect(bytes[0]).toBe(InputMessageType.KeyUp);
      expect(bytes[1]).toBe(65);
    });

    it("encodes KeyPress with charCode", () => {
      const bytes = encodeKeyPress(97);
      expect(bytes.length).toBe(3);
      expect(bytes[0]).toBe(InputMessageType.KeyPress);
      const view = new DataView(bytes.buffer);
      expect(view.getUint16(1, true)).toBe(97);
    });
  });

  describe("encodeUIInteraction", () => {
    it("serializes descriptor object into UIInteraction JSON payload", () => {
      const jsonStr = encodeUIInteraction({ action: "spawnVehicle", vehicleId: 42 });
      const parsed = JSON.parse(jsonStr);
      expect(parsed.type).toBe("UIInteraction");
      expect(parsed.descriptor).toEqual({ action: "spawnVehicle", vehicleId: 42 });
    });
  });
});
