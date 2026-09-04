import { InputMessageType } from "../../types/pixelstreaming";

/**
 * Normalizes pixel coordinates inside an element (width x height) to uint16 [0, 65535].
 */
export function normalizeCoordinates(
  elementX: number,
  elementY: number,
  width: number,
  height: number,
): { x: number; y: number } {
  if (width <= 0 || height <= 0) return { x: 0, y: 0 };
  const normalizedX = Math.max(0, Math.min(65535, Math.round((elementX / width) * 65535)));
  const normalizedY = Math.max(0, Math.min(65535, Math.round((elementY / height) * 65535)));
  return { x: normalizedX, y: normalizedY };
}

/**
 * Encodes MouseMove event into UE5 Pixel Streaming binary format.
 */
export function encodeMouseMove(
  x: number,
  y: number,
  deltaX = 0,
  deltaY = 0,
): Uint8Array {
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.MouseMove);
  view.setUint16(1, x, true);
  view.setUint16(3, y, true);
  view.setInt16(5, Math.max(-32768, Math.min(32767, deltaX)), true);
  view.setInt16(7, Math.max(-32768, Math.min(32767, deltaY)), true);
  return new Uint8Array(buffer);
}

/**
 * Encodes MouseDown event into UE5 Pixel Streaming binary format.
 */
export function encodeMouseDown(
  button: number,
  x: number,
  y: number,
): Uint8Array {
  const buffer = new ArrayBuffer(6);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.MouseDown);
  view.setUint8(1, button);
  view.setUint16(2, x, true);
  view.setUint16(4, y, true);
  return new Uint8Array(buffer);
}

/**
 * Encodes MouseUp event into UE5 Pixel Streaming binary format.
 */
export function encodeMouseUp(
  button: number,
  x: number,
  y: number,
): Uint8Array {
  const buffer = new ArrayBuffer(6);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.MouseUp);
  view.setUint8(1, button);
  view.setUint16(2, x, true);
  view.setUint16(4, y, true);
  return new Uint8Array(buffer);
}

/**
 * Encodes MouseWheel event into UE5 Pixel Streaming binary format.
 */
export function encodeMouseWheel(
  deltaY: number,
  x: number,
  y: number,
): Uint8Array {
  const buffer = new ArrayBuffer(7);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.MouseWheel);
  view.setInt16(1, Math.max(-32768, Math.min(32767, deltaY)), true);
  view.setUint16(3, x, true);
  view.setUint16(5, y, true);
  return new Uint8Array(buffer);
}

/**
 * Encodes KeyDown event into UE5 Pixel Streaming binary format.
 */
export function encodeKeyDown(
  keyCode: number,
  isRepeat = false,
): Uint8Array {
  const buffer = new ArrayBuffer(3);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.KeyDown);
  view.setUint8(1, keyCode & 0xff);
  view.setUint8(2, isRepeat ? 1 : 0);
  return new Uint8Array(buffer);
}

/**
 * Encodes KeyUp event into UE5 Pixel Streaming binary format.
 */
export function encodeKeyUp(keyCode: number): Uint8Array {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.KeyUp);
  view.setUint8(1, keyCode & 0xff);
  return new Uint8Array(buffer);
}

/**
 * Encodes KeyPress event into UE5 Pixel Streaming binary format.
 */
export function encodeKeyPress(charCode: number): Uint8Array {
  const buffer = new ArrayBuffer(3);
  const view = new DataView(buffer);
  view.setUint8(0, InputMessageType.KeyPress);
  view.setUint16(1, charCode, true);
  return new Uint8Array(buffer);
}

/**
 * Encodes a UI interaction descriptor object into a JSON string format for UE5 DataChannel.
 */
export function encodeUIInteraction(
  descriptor: Record<string, unknown> | string,
): string {
  return JSON.stringify({
    type: "UIInteraction",
    descriptor,
  });
}
