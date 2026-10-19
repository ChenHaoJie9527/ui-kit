import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  useDropArea,
  type DropPayload,
  type UseDropAreaOptions,
} from "../useDropArea";

function createDataTransfer({
  files = [],
  uris = "",
  text = "",
}: {
  files?: File[];
  uris?: string;
  text?: string;
} = {}) {
  return {
    files,
    dropEffect: "none",
    getData: vi.fn<(format: string) => string>((format) => {
      if (format === "text/uri-list") {
        return uris;
      }
      if (format === "text/plain") {
        return text;
      }
      return "";
    }),
  } as unknown as DataTransfer;
}

function DropZone({ options }: { options: UseDropAreaOptions }) {
  const { over, bind } = useDropArea(options);

  return <div data-testid="zone" data-over={String(over)} {...bind} />;
}

describe("useDropArea", () => {
  it("tracks the drag-over state across nested elements", () => {
    render(<DropZone options={{}} />);
    const zone = screen.getByTestId("zone");
    const dataTransfer = createDataTransfer();

    fireEvent.dragEnter(zone, { dataTransfer });
    fireEvent.dragEnter(zone, { dataTransfer });
    expect(zone.getAttribute("data-over")).toBe("true");

    fireEvent.dragLeave(zone, { dataTransfer });
    expect(zone.getAttribute("data-over")).toBe("true");

    fireEvent.dragLeave(zone, { dataTransfer });
    expect(zone.getAttribute("data-over")).toBe("false");
  });

  it("parses files, links and text on drop", () => {
    const onFiles = vi.fn<(files: File[]) => void>();
    const onUri = vi.fn<(uri: string) => void>();
    const onText = vi.fn<(text: string) => void>();
    const onDrop = vi.fn<(payload: DropPayload) => void>();
    const file = new File(["content"], "notes.txt", { type: "text/plain" });

    render(<DropZone options={{ onFiles, onUri, onText, onDrop }} />);

    fireEvent.drop(screen.getByTestId("zone"), {
      dataTransfer: createDataTransfer({
        files: [file],
        uris: "https://example.com\n# comment\nhttps://ui-kit.dev",
        text: "hello",
      }),
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(onUri).toHaveBeenCalledWith("https://example.com");
    expect(onUri).toHaveBeenCalledWith("https://ui-kit.dev");
    expect(onText).toHaveBeenCalledWith("hello");
    expect(onDrop).toHaveBeenCalledWith({
      files: [file],
      uris: ["https://example.com", "https://ui-kit.dev"],
      text: "hello",
    });
    expect(screen.getByTestId("zone").getAttribute("data-over")).toBe("false");
  });
});
