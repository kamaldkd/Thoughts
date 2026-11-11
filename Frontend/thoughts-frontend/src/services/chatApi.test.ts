import { describe, expect, it } from "vitest";
import { getMessageSenderId } from "./chatApi";

describe("getMessageSenderId", () => {
  it("normalizes a raw sender ID", () => {
    expect(getMessageSenderId("ABC123")).toBe("abc123");
  });

  it("extracts a sender ID from a populated participant", () => {
    expect(getMessageSenderId({ _id: "ABC123" })).toBe("abc123");
  });

  it("extracts a sender ID from an ObjectId-like value", () => {
    expect(
      getMessageSenderId({
        toHexString: () => "ABC123",
      })
    ).toBe("abc123");
  });

  it("returns an empty ID for unsupported values", () => {
    expect(getMessageSenderId(null)).toBe("");
  });
});
