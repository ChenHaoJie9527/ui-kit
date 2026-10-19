import { useCallback, useEffect, useState, type RefObject } from "react";

export interface UseVideoState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  ended: boolean;
  readyState: number;
  buffered: TimeRanges | null;
  error: MediaError | null;
}

export interface UseVideoControls {
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
}

export type UseVideoResult = UseVideoState & UseVideoControls;

const MEDIA_EVENTS = [
  "play",
  "playing",
  "pause",
  "timeupdate",
  "durationchange",
  "volumechange",
  "ratechange",
  "ended",
  "loadedmetadata",
  "progress",
  "seeking",
  "seeked",
  "waiting",
  "canplay",
  "error",
] as const;

const emptyState: UseVideoState = {
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  ended: false,
  readyState: 0,
  buffered: null,
  error: null,
};

function readState(video: HTMLVideoElement | null): UseVideoState {
  if (!video) {
    return emptyState;
  }

  return {
    playing: !video.paused && !video.ended,
    currentTime: video.currentTime,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
    volume: video.volume,
    muted: video.muted,
    playbackRate: video.playbackRate,
    ended: video.ended,
    readyState: video.readyState,
    buffered: video.buffered,
    error: video.error,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 跟踪并控制一个 <video> 元素。
 *
 * 状态由媒体事件驱动（播放、暂停、seek、音量、倍速等），controls 里的
 * 方法直接操作元素；把返回的 state 用于渲染播放器 UI，避免自己拼事件。
 */
export function useVideo(
  ref: RefObject<HTMLVideoElement | null>,
): UseVideoResult {
  const [state, setState] = useState<UseVideoState>(emptyState);

  useEffect(() => {
    const video = ref.current;

    if (!video) {
      return;
    }

    const sync = () => setState(readState(video));

    sync();
    MEDIA_EVENTS.forEach((eventName) =>
      video.addEventListener(eventName, sync),
    );

    return () => {
      MEDIA_EVENTS.forEach((eventName) =>
        video.removeEventListener(eventName, sync),
      );
    };
  }, [ref]);

  const play = useCallback(async () => {
    await ref.current?.play();
    setState(readState(ref.current));
  }, [ref]);

  const pause = useCallback(() => {
    ref.current?.pause();
    setState(readState(ref.current));
  }, [ref]);

  const toggle = useCallback(async () => {
    const video = ref.current;

    if (!video) {
      return;
    }

    if (video.paused || video.ended) {
      await video.play();
    } else {
      video.pause();
    }

    setState(readState(video));
  }, [ref]);

  const seek = useCallback(
    (time: number) => {
      const video = ref.current;

      if (!video) {
        return;
      }

      const max = Number.isFinite(video.duration) ? video.duration : time;
      video.currentTime = clamp(time, 0, Math.max(0, max));
      setState(readState(video));
    },
    [ref],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const video = ref.current;

      if (!video) {
        return;
      }

      video.volume = clamp(volume, 0, 1);
      setState(readState(video));
    },
    [ref],
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      const video = ref.current;

      if (!video) {
        return;
      }

      video.muted = muted;
      setState(readState(video));
    },
    [ref],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const video = ref.current;

      if (!video) {
        return;
      }

      video.playbackRate = rate;
      setState(readState(video));
    },
    [ref],
  );

  return {
    ...state,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    setMuted,
    setPlaybackRate,
  };
}
