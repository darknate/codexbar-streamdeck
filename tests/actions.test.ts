import { describe, expect, it } from "vitest";

import { getDueSubscriberIds } from "../src/actions/usage-button";

describe("poll scheduling", () => {
  it("only marks subscribers due when their own refresh deadline has elapsed", () => {
    const subscribers = new Map([
      ["fast", { nextPollAt: 2_000 }],
      ["slow", { nextPollAt: 60_000 }],
    ]);

    expect(getDueSubscriberIds(subscribers, 2_000)).toEqual(["fast"]);
    expect(getDueSubscriberIds(subscribers, 59_999)).toEqual(["fast"]);
    expect(getDueSubscriberIds(subscribers, 60_000)).toEqual(["fast", "slow"]);
  });
});
