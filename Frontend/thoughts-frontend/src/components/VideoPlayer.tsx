import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    try { vid.muted = true; } catch {}

    const playIfVisible = async () => {
      try {
        await vid.play();
        if (!cancelled) setIsPlaying(true);
      } catch {}
    };

    const pauseIfHidden = () => {
      try { vid.pause(); } catch {}
      setIsPlaying(false);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          playIfVisible();
        } else {
          pauseIfHidden();
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(vid);
    return () => { cancelled = true; observer.disconnect(); };
  }, [src]);

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const newMuted = !isMuted;
    vid.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (vid.paused) { await vid.play(); setIsPlaying(true); }
      else { vid.pause(); setIsPlaying(false); }
    } catch {}
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        onContextMenu={(e) => e.preventDefault()}
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
        className="w-full object-cover max-h-80 bg-black"
      />

      {showControls && (
        <button
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white z-10"
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      )}

      {showControls && (
        <button
          onClick={toggleMute}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}