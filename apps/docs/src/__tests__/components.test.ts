import { describe, expect, it } from "vitest";
import { componentMetas, isNewComponent } from "../content/components";

describe("component release metadata", () => {
  it("maps the Radio Group display name to its published export", () => {
    const radioGroup = componentMetas.find(
      (meta) => meta.path === "components/radio-group",
    );

    expect(radioGroup?.releaseName).toBe("RadioGroup");
    expect(radioGroup?.introducedIn).toBe("0.12.1");
    expect(
      radioGroup &&
        isNewComponent(radioGroup, {
          now: new Date("2026-10-28T00:00:00Z"),
          currentVersion: "0.12.1",
        }),
    ).toBe(true);
  });
});
