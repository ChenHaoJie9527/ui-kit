import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Progress,
  ProgressDescription,
  ProgressLabel,
  ProgressValue,
} from "../Progress";

function Example({
  value,
  min,
  max,
  format,
  description,
}: {
  value: number | null;
  min?: number;
  max?: number;
  format?: (value: number, min: number, max: number) => string;
  description?: string;
}) {
  return (
    <Progress value={value} min={min} max={max}>
      <Progress.Label>正在下载</Progress.Label>
      <Progress.Value format={format} />
      {description ? (
        <Progress.Description>{description}</Progress.Description>
      ) : null}
    </Progress>
  );
}

function InteractiveExample({
  defaultValue,
  value,
  onValueChange,
  disabled,
  min,
  max,
  step,
}: {
  defaultValue?: number;
  value?: number | null;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Progress
      interactive
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
    >
      <Progress.Label>调整音量</Progress.Label>
      <Progress.Value />
    </Progress>
  );
}

function bar(): HTMLElement {
  const element = screen.getByRole("progressbar");

  if (!element) {
    throw new Error("progressbar not found");
  }

  return element;
}

function wrapper(): HTMLElement {
  const element = document.querySelector(".uk-progress");

  if (!element) {
    throw new Error("progress wrapper not found");
  }

  return element as HTMLElement;
}

function indicator(): HTMLElement {
  const element = document.querySelector(".uk-progress__indicator");

  if (!element) {
    throw new Error("indicator not found");
  }

  return element as HTMLElement;
}

/** jsdom 没有布局，给轨道一个 0–100 的矩形，让指针坐标可换算。 */
function mockTrackRect(track: HTMLElement, left = 0, width = 100): void {
  Object.defineProperty(track, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left,
      top: 0,
      right: left + width,
      bottom: 10,
      width,
      height: 10,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }),
  });
}

function interactiveTrack(): HTMLElement {
  const slider = screen.getByRole("slider");
  const track = slider.nextElementSibling as HTMLElement | null;

  if (!track || !track.classList.contains("uk-progress__track")) {
    throw new Error("interactive track not found");
  }

  mockTrackRect(track);
  return track;
}

describe("Progress（只读）", () => {
  it("renders a progressbar with min / max / now", () => {
    render(<Example value={42} />);

    expect(bar().getAttribute("role")).toBe("progressbar");
    expect(bar().getAttribute("aria-valuemin")).toBe("0");
    expect(bar().getAttribute("aria-valuemax")).toBe("100");
    expect(bar().getAttribute("aria-valuenow")).toBe("42");
    expect(bar().classList.contains("uk-progress__track")).toBe(true);
  });

  it("is not focusable and exposes no slider", () => {
    render(<Example value={42} />);

    expect(bar().getAttribute("tabindex")).toBeNull();
    expect(document.querySelector(".uk-progress__thumb")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("associates the label through aria-labelledby", () => {
    render(<Example value={42} />);

    const labelId = bar().getAttribute("aria-labelledby");
    const label = labelId ? document.getElementById(labelId) : null;

    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("正在下载");
  });

  it("renders the value as a percentage of the range", () => {
    render(<Example value={42} />);

    expect(screen.getByText("42%")).not.toBeNull();
    expect(bar().getAttribute("aria-valuetext")).toBe("42%");
  });

  it("sizes the indicator from the value", () => {
    render(<Example value={25} />);

    expect(indicator().style.width).toBe("25%");
  });

  it("honors min / max", () => {
    render(<Example value={50} min={25} max={75} />);

    expect(bar().getAttribute("aria-valuemin")).toBe("25");
    expect(bar().getAttribute("aria-valuemax")).toBe("75");
    expect(bar().getAttribute("aria-valuenow")).toBe("50");
    expect(indicator().style.width).toBe("50%");
    expect(screen.getByText("50%")).not.toBeNull();
  });

  it("clamps out-of-range values", () => {
    render(<Example value={150} />);

    expect(bar().getAttribute("aria-valuenow")).toBe("100");
    expect(indicator().style.width).toBe("100%");

    render(<Example value={-20} />);

    const bars = screen.getAllByRole("progressbar");
    const indicators = document.querySelectorAll<HTMLElement>(
      ".uk-progress__indicator",
    );

    expect(bars[1]?.getAttribute("aria-valuenow")).toBe("0");
    expect(indicators[1]?.style.width).toBe("0%");
  });

  it("renders indeterminate without a now value", () => {
    render(<Example value={null} />);

    expect(bar().getAttribute("aria-valuenow")).toBeNull();
    expect(bar().getAttribute("data-indeterminate")).toBe("true");
    expect(bar().getAttribute("aria-valuetext")).toBeNull();
    expect(indicator().style.width).toBe("");
  });

  it("hides the value text while indeterminate", () => {
    render(<Example value={null} />);

    expect(document.querySelector(".uk-progress__value")).toBeNull();
  });

  it("supports a custom value format", () => {
    render(
      <Example value={42} format={(value, min, max) => `${value} / ${max}`} />,
    );

    expect(screen.getByText("42 / 100")).not.toBeNull();
  });

  it("exposes Label and Value through the compound API", () => {
    render(
      <Progress value={12}>
        <Progress.Label>复合写法</Progress.Label>
        <Progress.Value />
      </Progress>,
    );

    expect(screen.getByText("复合写法")).not.toBeNull();
    expect(screen.getByText("12%")).not.toBeNull();
  });

  it("renders the description as a live status region below the track", () => {
    render(<Example value={42} description="正在下载核心文件..." />);

    const status = screen.getByRole("status");

    expect(status.textContent).toBe("正在下载核心文件...");
    expect(status.classList.contains("uk-progress__description")).toBe(true);
    // role=status 在 progressbar 语义元素之外，与数值播报互不干扰。
    expect(bar().querySelector(".uk-progress__description")).toBeNull();
    // 位于轨道之后（下方）。
    expect(
      wrapper()
        .querySelector(".uk-progress__track")!
        .compareDocumentPosition(status),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders the flat exports as aliases", () => {
    render(
      <Progress value={12}>
        <ProgressLabel>平铺写法</ProgressLabel>
        <ProgressValue />
        <ProgressDescription>平铺状态文案</ProgressDescription>
      </Progress>,
    );

    expect(screen.getByText("平铺写法")).not.toBeNull();
    expect(screen.getByText("12%")).not.toBeNull();
    expect(screen.getByRole("status").textContent).toBe("平铺状态文案");
  });

  it("merges className onto the wrapper root", () => {
    render(
      <Progress value={12} className="custom-class">
        <Progress.Label>标签</Progress.Label>
      </Progress>,
    );

    expect(wrapper().classList.contains("custom-class")).toBe(true);
    expect(wrapper().classList.contains("uk-progress")).toBe(true);
  });

  it("throws when parts render outside the root", () => {
    expect(() => render(<ProgressLabel>孤立标签</ProgressLabel>)).toThrow(
      /must be rendered inside <Progress>/,
    );
  });
});

describe("Progress（交互）", () => {
  it("renders a native slider with min / max / step", () => {
    render(<InteractiveExample value={40} />);

    const slider = screen.getByRole("slider");

    expect(slider.tagName).toBe("INPUT");
    expect(slider.getAttribute("type")).toBe("range");
    expect(slider.getAttribute("min")).toBe("0");
    expect(slider.getAttribute("max")).toBe("100");
    expect(slider.getAttribute("step")).toBe("1");
    expect(slider.getAttribute("value")).toBe("40");
    expect(slider.getAttribute("aria-valuetext")).toBe("40%");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("associates the label with the slider", () => {
    render(<InteractiveExample value={40} />);

    const slider = screen.getByRole("slider");
    const labelId = slider.getAttribute("aria-labelledby");
    const label = labelId ? document.getElementById(labelId) : null;

    expect(label?.textContent).toBe("调整音量");
  });

  it("renders the thumb only in interactive mode", () => {
    render(<InteractiveExample value={40} />);
    render(<Example value={40} />);

    const tracks = document.querySelectorAll<HTMLElement>(
      ".uk-progress__track",
    );

    expect(tracks[0]?.querySelector(".uk-progress__thumb")).not.toBeNull();
    expect(tracks[1]?.querySelector(".uk-progress__thumb")).toBeNull();
  });

  it("sets the value on click and keeps the fill transition", () => {
    const onValueChange = vi.fn<(value: number) => void>();
    render(
      <InteractiveExample defaultValue={10} onValueChange={onValueChange} />,
    );

    const track = interactiveTrack();

    fireEvent.pointerDown(track, { clientX: 25, pointerId: 1 });
    fireEvent.pointerUp(track, { pointerId: 1 });

    expect(onValueChange).toHaveBeenLastCalledWith(25);
    expect(screen.getByRole("slider").getAttribute("value")).toBe("25");
    expect(screen.getByText("25%")).not.toBeNull();
    // 纯点击未进入拖拽，data-dragging 不出现，过渡动画保留。
    expect(track.getAttribute("data-dragging")).toBeNull();
  });

  it("drags the value with the pointer", () => {
    const onValueChange = vi.fn<(value: number) => void>();
    render(
      <InteractiveExample defaultValue={10} onValueChange={onValueChange} />,
    );

    const track = interactiveTrack();

    fireEvent.pointerDown(track, { clientX: 25, pointerId: 1 });
    fireEvent.pointerMove(track, { clientX: 75, pointerId: 1 });

    // 移动超过阈值进入拖拽：关闭过渡。
    expect(track.getAttribute("data-dragging")).toBe("true");
    expect(screen.getByRole("slider").getAttribute("value")).toBe("75");
    expect(onValueChange).toHaveBeenLastCalledWith(75);

    fireEvent.pointerUp(track, { pointerId: 1 });
    expect(track.getAttribute("data-dragging")).toBeNull();
  });

  it("clamps the drag to min / max", () => {
    render(<InteractiveExample defaultValue={10} />);

    const track = interactiveTrack();

    fireEvent.pointerDown(track, { clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(track, { clientX: 400, pointerId: 1 });

    expect(screen.getByRole("slider").getAttribute("value")).toBe("100");

    fireEvent.pointerMove(track, { clientX: -100, pointerId: 1 });
    expect(screen.getByRole("slider").getAttribute("value")).toBe("0");
  });

  it("adjusts with the keyboard", () => {
    render(<InteractiveExample defaultValue={50} />);

    const slider = screen.getByRole("slider");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("value")).toBe("51");

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider.getAttribute("value")).toBe("50");

    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(slider.getAttribute("value")).toBe("60");

    fireEvent.keyDown(slider, { key: "PageDown" });
    expect(slider.getAttribute("value")).toBe("50");

    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider.getAttribute("value")).toBe("0");

    fireEvent.keyDown(slider, { key: "End" });
    expect(slider.getAttribute("value")).toBe("100");
  });

  it("clamps keyboard values at the boundaries", () => {
    render(<InteractiveExample defaultValue={99} />);

    const slider = screen.getByRole("slider");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("value")).toBe("100");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("value")).toBe("100");
  });

  it("honors step for keyboard and pointer", () => {
    render(<InteractiveExample defaultValue={0} step={5} />);

    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("value")).toBe("5");

    const track = interactiveTrack();
    fireEvent.pointerDown(track, { clientX: 23, pointerId: 1 });
    // 23 / 100 * 100 = 23 → 就近步长 25
    expect(slider.getAttribute("value")).toBe("25");
  });

  it("reports changes in controlled and uncontrolled modes", () => {
    const onValueChange = vi.fn<(value: number) => void>();

    render(<InteractiveExample value={30} onValueChange={onValueChange} />);
    const track = interactiveTrack();
    fireEvent.pointerDown(track, { clientX: 50, pointerId: 1 });

    expect(onValueChange).toHaveBeenCalledWith(50);

    render(
      <InteractiveExample defaultValue={30} onValueChange={onValueChange} />,
    );
    const slider = screen.getAllByRole("slider")[1];
    const track2 = slider?.nextElementSibling as HTMLElement | null;

    if (!track2 || !track2.classList.contains("uk-progress__track")) {
      throw new Error("interactive track not found");
    }

    mockTrackRect(track2);
    fireEvent.pointerDown(track2, { clientX: 60, pointerId: 1 });

    expect(onValueChange).toHaveBeenLastCalledWith(60);
  });

  it("respects min / max for the slider", () => {
    render(<InteractiveExample defaultValue={50} min={25} max={75} />);

    const slider = screen.getByRole("slider");

    expect(slider.getAttribute("min")).toBe("25");
    expect(slider.getAttribute("max")).toBe("75");
    expect(slider.getAttribute("value")).toBe("50");

    const track = interactiveTrack();
    fireEvent.pointerDown(track, { clientX: 0, pointerId: 1 });
    expect(slider.getAttribute("value")).toBe("25");
  });

  it("ignores pointer and keyboard when disabled", () => {
    const onValueChange = vi.fn<(value: number) => void>();
    render(
      <InteractiveExample
        defaultValue={30}
        disabled
        onValueChange={onValueChange}
      />,
    );

    const slider = screen.getByRole("slider");
    expect((slider as HTMLInputElement).disabled).toBe(true);

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("value")).toBe("30");
    expect(onValueChange).not.toHaveBeenCalled();

    const track = interactiveTrack();
    fireEvent.pointerDown(track, { clientX: 80, pointerId: 1 });
    expect(slider.getAttribute("value")).toBe("30");
  });
});
