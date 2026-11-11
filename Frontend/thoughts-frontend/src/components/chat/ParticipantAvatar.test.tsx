import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ParticipantAvatar } from "./ParticipantAvatar";

describe("ParticipantAvatar", () => {
  it("renders a fallback when a participant has no name", () => {
    render(<ParticipantAvatar name={undefined} />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("uses the supplied username as initials when the name is missing", () => {
    render(<ParticipantAvatar name="sample_user" />);

    expect(screen.getByText("S")).toBeInTheDocument();
  });
});
