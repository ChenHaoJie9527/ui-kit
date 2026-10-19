import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVideo } from "../useVideo";

const videos: HTMLVideoElement[] = [];

function createVideo() {
  const video = document.createElement("video");
  let paused = true;
  let ended = false;

  Object.defineProperty(video, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(video, "ended", {
    configurable: true,
    get: () => ended,
  });
  Object.defineProperty(video, "duration", {
    configurable: true,
    get: () => 120,
  });

  video.play = vi.fn<() => Promise<void>>(async () => {
    paused = false;
    ended = false;
    video.dispatchEvent(new Event("play"));
  });
  video.pause = vi.fn<() => void>(() => {
    paused = true;
    video.dispatchEvent(new Event("pause"));
  });

  document.body.append(video);
  videos.push(video);

  return {
    video,
    setEnded(value: boolean) {
      ended = value;
    },
  };
}

afterEach(() => {
  videos.splice(0).forEach((video) => video.remove());
});

describe("useVideo", () => {
  it("reads the initial media state", () => {
    const { video } = createVideo();
    const ref = { current: video };
    const { result } = renderHook(() => useVideo(ref));

    expect(result.current.duration).toBe(120);
    expect(result.current.playing).toBe(false);
    expect(result.current.volume).toBe(1);
    expect(result.current.playbackRate).toBe(1);
  });

  it("plays, pauses and tracks playback state", async () => {
    const { video } = createVideo();
    const ref = { current: video };
    const { result } = renderHook(() => useVideo(ref));

    await act(async () => {
      await result.current.play();
    });
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(result.current.playing).toBe(true);

    act(() => {
      result.current.pause();
    });
    expect(result.current.playing).toBe(false);
  });

  it("seeks within the media duration", () => {
    const { video } = createVideo();
    const ref = { current: video };
    const { result } = renderHook(() => useVideo(ref));

    act(() => {
      result.current.seek(60);
    });
    expect(video.currentTime).toBe(60);

    act(() => {
      result.current.seek(-10);
    });
    expect(video.currentTime).toBe(0);

    act(() => {
      result.current.seek(999);
    });
    expect(video.currentTime).toBe(120);
  });

  it("updates volume, mute and playback rate", () => {
    const { video } = createVideo();
    const ref = { current: video };
    const { result } = renderHook(() => useVideo(ref));

    act(() => {
      result.current.setVolume(0.4);
      result.current.setMuted(true);
      result.current.setPlaybackRate(1.5);
    });

    expect(result.current.volume).toBe(0.4);
    expect(result.current.muted).toBe(true);
    expect(result.current.playbackRate).toBe(1.5);
  });

  it("reacts to timeupdate events", () => {
    const { video, setEnded } = createVideo();
    const ref = { current: video };
    const { result } = renderHook(() => useVideo(ref));

    act(() => {
      video.currentTime = 42;
      video.dispatchEvent(new Event("timeupdate"));
    });
    expect(result.current.currentTime).toBe(42);

    act(() => {
      setEnded(true);
      video.dispatchEvent(new Event("ended"));
    });
    expect(result.current.ended).toBe(true);
    expect(result.current.playing).toBe(false);
  });
});
