import { describe, it, vi } from "vitest";
import { subscribeToSignals } from "./database";

// Mock supabase module
vi.mock("./supabase", () => {
  let onCallback: any = null;
  const mockChannel = {
    on: (_event: string, _filter: any, callback: any) => {
      onCallback = callback;
      return mockChannel;
    },
    subscribe: (_callback: any) => {
      return mockChannel;
    }
  };

  return {
    databaseMode: "live",
    supabase: {
      channel: () => mockChannel,
      removeChannel: vi.fn(),
    },
    getOnCallback: () => onCallback,
  };
});

import * as supabaseMod from "./supabase";
const getOnCallback = (supabaseMod as any).getOnCallback;

describe("subscribeToSignals performance", () => {
  it("benchmark realtime events", async () => {
    let callCount = 0;
    const onChange = () => {
      callCount++;
      // Simulate heavy work like fetching
      let sum = 0;
      for(let i=0; i<10000; i++) sum += i;
    };

    subscribeToSignals(onChange);
    const cb = getOnCallback();

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      cb();
    }

    // For debounce/throttle we might need to wait
    await new Promise(r => setTimeout(r, 200));

    const end = performance.now();
    console.log(`Execution time for 10000 events: ${(end - start).toFixed(2)}ms`);
    console.log(`onChange called ${callCount} times`);
  });
});
