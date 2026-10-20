import { useRef, useState } from "react";
import { Button } from "@seam/ui";
import { useVideo } from "@seam/hooks";

const SRC =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function formatTime(seconds = 0) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function Demo() {
  const videoRef = useRef(document.createElement("video"));
  const [playError, setPlayError] = useState("");
  const video = useVideo(videoRef);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <video
        ref={videoRef}
        src={SRC}
        playsInline
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 12,
          background: "#020617",
        }}
      >
        <track
          kind="captions"
          srcLang="zh"
          label="中文字幕"
          src="data:text/vtt,WEBVTT%0A%0A"
        />
      </video>

      <div
        style={{
          display: "grid",
          gap: 10,
          border: "1px solid var(--uk-border)",
          borderRadius: 10,
          padding: 12,
          background: "var(--uk-surface-raised)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            size="sm"
            onClick={() => {
              setPlayError("");
              void video.toggle().catch(() => {
                setPlayError("播放被浏览器或网络拦截");
              });
            }}
          >
            {video.playing ? "暂停" : "播放"}
          </Button>
          <input
            type="range"
            min="0"
            max={video.duration || 0}
            step="0.1"
            value={Math.min(video.currentTime, video.duration || 0)}
            aria-label="播放进度"
            onChange={(event) => video.seek(Number(event.target.value))}
            style={{ flex: 1 }}
          />
          <code
            style={{
              fontFamily: "var(--uk-font-mono)",
              fontSize: 11.5,
              whiteSpace: "nowrap",
            }}
          >
            {formatTime(video.currentTime)} / {formatTime(video.duration)}
          </code>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => video.setMuted(!video.muted)}
          >
            {video.muted ? "取消静音" : "静音"}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={video.volume}
            aria-label="音量"
            onChange={(event) => video.setVolume(Number(event.target.value))}
            style={{ width: 100 }}
          />
          {[0.5, 1, 1.5, 2].map((rate) => (
            <Button
              key={rate}
              size="sm"
              variant={video.playbackRate === rate ? "secondary" : "ghost"}
              onClick={() => video.setPlaybackRate(rate)}
            >
              {rate}×
            </Button>
          ))}
        </div>
      </div>

      {playError ? (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--uk-danger)" }}>
          {playError}
        </p>
      ) : null}
    </div>
  );
}
