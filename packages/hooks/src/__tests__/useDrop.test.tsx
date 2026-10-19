import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDrop } from "../useDrop";

function DropExample() {
  const { over, files, uris, text, bind } = useDrop();

  return (
    <div>
      <div data-testid="zone" data-over={String(over)} {...bind} />
      <output data-testid="files">
        {files.map((file) => file.name).join(",")}
      </output>
      <output data-testid="uris">{uris.join(",")}</output>
      <output data-testid="text">{text}</output>
    </div>
  );
}

function createDataTransfer() {
  const file = new File(["content"], "report.csv", { type: "text/csv" });

  return {
    files: [file],
    dropEffect: "none",
    getData: (format: string) => {
      if (format === "text/uri-list") {
        return "https://example.com";
      }
      if (format === "text/plain") {
        return "pasted";
      }
      return "";
    },
  } as unknown as DataTransfer;
}

describe("useDrop", () => {
  it("saves the most recent drop payload", () => {
    render(<DropExample />);

    fireEvent.drop(screen.getByTestId("zone"), {
      dataTransfer: createDataTransfer(),
    });

    expect(screen.getByTestId("files").textContent).toBe("report.csv");
    expect(screen.getByTestId("uris").textContent).toBe("https://example.com");
    expect(screen.getByTestId("text").textContent).toBe("pasted");
  });

  it("clears the payload when the drag leaves", () => {
    render(<DropExample />);
    const zone = screen.getByTestId("zone");

    fireEvent.drop(zone, { dataTransfer: createDataTransfer() });
    expect(screen.getByTestId("files").textContent).toBe("report.csv");

    fireEvent.dragLeave(zone, { dataTransfer: createDataTransfer() });
    expect(screen.getByTestId("files").textContent).toBe("");
    expect(screen.getByTestId("text").textContent).toBe("");
  });
});
