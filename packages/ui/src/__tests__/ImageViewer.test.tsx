import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ImageViewer,
  useImageViewer,
  type ImageViewerImage,
} from "../ImageViewer";

const IMAGES = [
  {
    id: "one",
    src: "https://example.com/one.jpg",
    alt: "第一张",
    width: 1200,
    height: 900,
    caption: "说明一",
  },
  {
    id: "two",
    src: "https://example.com/two.jpg",
    alt: "第二张",
    width: 900,
    height: 1200,
  },
  {
    id: "three",
    src: "https://example.com/three.jpg",
    alt: "第三张",
    width: 1600,
    height: 900,
    caption: "说明三",
  },
];

function getDialog(): HTMLDialogElement | null {
  return document.querySelector("dialog");
}

function CustomControls() {
  const { hasPrevious, hasNext, previous, next } = useImageViewer();

  return (
    <div data-testid="custom">
      <button type="button" disabled={!hasPrevious} onClick={previous}>
        前
      </button>
      <button type="button" disabled={!hasNext} onClick={next}>
        后
      </button>
    </div>
  );
}

function StaleValueHarness() {
  const [images, setImages] = useState(IMAGES);

  return (
    <>
      <button type="button" onClick={() => setImages(IMAGES.slice(1))}>
        移除第一张
      </button>
      <ImageViewer images={images} defaultValue="one" />
    </>
  );
}

describe("ImageViewer", () => {
  it("renders the default gallery with one thumbnail per image", () => {
    render(<ImageViewer images={IMAGES} />);

    const gallery = screen.getByRole("region", { name: "图片画廊" });

    expect(gallery).toBeTruthy();
    expect(
      gallery.querySelectorAll(".uk-image-viewer__thumbnail"),
    ).toHaveLength(3);
  });

  it("opens the lightbox from a thumbnail and reports the selection", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(<ImageViewer images={IMAGES} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "打开图片 第二张" }));

    expect(onValueChange).toHaveBeenCalledWith("two");

    const dialog = getDialog();

    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute("aria-label")).toBe("图片画廊");
  });

  it("is controlled by value and honours default value", async () => {
    const { rerender } = render(
      <ImageViewer
        images={IMAGES}
        value="two"
        onValueChange={() => {}}
        label="受控画廊"
      />,
    );

    expect(getDialog()?.getAttribute("aria-label")).toBe("受控画廊");

    const counter = screen.getByText("2 / 3");

    expect(counter).toBeTruthy();

    rerender(
      <ImageViewer images={IMAGES} value={null} onValueChange={() => {}} />,
    );

    // 退出动画期间层保持挂载（投影等待），真实浏览器中随后卸载；
    // jsdom 无布局测量，断言退出已开始（data-state 翻转为 closed）。
    await waitFor(() => {
      expect(getDialog()?.getAttribute("data-state")).toBe("closed");
    });
  });

  it("navigates with the previous and next controls and disables bounds", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="two"
        onValueChange={onValueChange}
      />,
    );

    const previous = screen.getByRole("button", { name: "上一张图片" });
    const next = screen.getByRole("button", { name: "下一张图片" });

    fireEvent.click(previous);
    expect(onValueChange).toHaveBeenLastCalledWith("one");

    fireEvent.click(previous);
    expect(onValueChange).toHaveBeenLastCalledWith("one");

    expect(
      (screen.getByRole("button", { name: "上一张图片" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect((next as HTMLButtonElement).disabled).toBe(false);
  });

  it("moves with arrow keys on the panel", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        onValueChange={onValueChange}
      />,
    );

    const dialog = getDialog()!;

    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenLastCalledWith("two");

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenLastCalledWith("one");
  });

  it("closes on Escape", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        onValueChange={onValueChange}
      />,
    );

    const dialog = getDialog()!;
    const cancel = new Event("cancel", { cancelable: true });

    act(() => {
      dialog.dispatchEvent(cancel);
    });

    expect(cancel.defaultPrevented).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("closes when clicking the backdrop", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        onValueChange={onValueChange}
      />,
    );

    const dialog = getDialog()!;

    fireEvent.click(dialog);

    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("closes when clicking empty panel area but not the image", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        onValueChange={onValueChange}
      />,
    );

    const panel = document.querySelector(".uk-image-viewer__panel")!;
    const image = document.querySelector(".uk-image-viewer__image")!;

    fireEvent.pointerDown(image);
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(panel);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("swipes horizontally to change images", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        onValueChange={onValueChange}
      />,
    );

    const image = document.querySelector(".uk-image-viewer__image")!;

    fireEvent.pointerDown(image, { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(image, { clientX: 120, clientY: 105 });

    expect(onValueChange).toHaveBeenLastCalledWith("two");
  });

  it("ignores swipes that are mostly vertical", () => {
    const onValueChange = vi.fn<(id: string | null) => void>();

    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        onValueChange={onValueChange}
      />,
    );

    const image = document.querySelector(".uk-image-viewer__image")!;

    fireEvent.pointerDown(image, { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(image, { clientX: 190, clientY: 200 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("toggles zoom and exposes its pressed state", () => {
    render(<ImageViewer images={IMAGES} defaultValue="one" />);

    const zoom = screen.getByRole("button", { name: "放大图片" });

    fireEvent.click(zoom);

    const zoomedOut = screen.getByRole("button", { name: "缩小图片" });

    expect(zoomedOut.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows a load error placeholder", () => {
    render(<ImageViewer images={IMAGES} defaultValue="one" />);

    const image = document.querySelector(".uk-image-viewer__image")!;

    fireEvent.error(image);

    expect(screen.getByRole("status").textContent).toContain("图片加载失败");
  });

  it("falls back to alt when caption is missing", () => {
    render(<ImageViewer images={IMAGES} defaultValue="two" />);

    expect(screen.getByText("第二张")).toBeTruthy();
  });

  it("renders a custom caption renderer", () => {
    render(
      <ImageViewer
        images={IMAGES}
        defaultValue="one"
        renderCaption={(image) => `自定义：${image.alt}`}
      />,
    );

    expect(screen.getByText("自定义：第一张")).toBeTruthy();
  });

  it("supports custom composition with useImageViewer", () => {
    render(
      <ImageViewer images={IMAGES} defaultValue="two">
        <CustomControls />
        <ImageViewer.Content />
      </ImageViewer>,
    );

    const custom = screen.getByTestId("custom");
    const prevButton = custom.querySelectorAll(
      "button",
    )[0] as HTMLButtonElement;
    const nextButton = custom.querySelectorAll(
      "button",
    )[1] as HTMLButtonElement;

    expect(custom).toBeTruthy();
    expect(prevButton.disabled).toBe(false);
    expect(nextButton.disabled).toBe(false);

    fireEvent.click(nextButton);

    expect(screen.getByText("3 / 3")).toBeTruthy();
    expect(nextButton.disabled).toBe(true);
  });

  it("throws on duplicate ids", () => {
    const images: ImageViewerImage[] = [{ ...IMAGES[0]! }, { ...IMAGES[0]! }];

    expect(() => render(<ImageViewer images={images} />)).toThrow(
      "ImageViewer 要求图片 id 唯一",
    );
  });

  it("throws on non-positive dimensions", () => {
    const images = [
      {
        id: "broken",
        src: "https://example.com/broken.jpg",
        alt: "坏图",
        width: 0,
        height: 100,
      },
    ];

    expect(() => render(<ImageViewer images={images} />)).toThrow(
      "ImageViewer 要求 width / height 为正数",
    );
  });

  it("clears a stale value when the image is removed", async () => {
    render(<StaleValueHarness />);

    fireEvent.click(screen.getByRole("button", { name: "移除第一张" }));

    await waitFor(() => {
      expect(getDialog()).toBeNull();
    });
  });
});
