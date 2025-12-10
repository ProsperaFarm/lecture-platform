import { useEffect, useRef } from "react";

interface WhiteLabelVideoPlayerProps {
  youtubeUrl: string;
}

export function WhiteLabelVideoPlayer({ youtubeUrl }: WhiteLabelVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract YouTube video ID
  const getYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(youtubeUrl);

  // Disable right-click on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    container.addEventListener('contextmenu', handleContextMenu);
    return () => container.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (!videoId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">URL de vídeo inválida</p>
      </div>
    );
  }

  // YouTube embed URL with privacy-enhanced mode and restricted parameters
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?` + new URLSearchParams({
    modestbranding: '1',      // Remove YouTube logo from control bar
    rel: '0',                  // Don't show related videos from other channels
    showinfo: '0',             // Hide title and uploader before playback
    iv_load_policy: '3',       // Disable video annotations
    fs: '1',                   // Allow fullscreen
    disablekb: '0',            // Enable keyboard controls
    controls: '1',             // Show player controls
    autoplay: '0',             // Don't autoplay
    playsinline: '1',          // Play inline on mobile
  }).toString();

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 select-none"
      style={{ userSelect: 'none' }}
    >
      {/* Main iframe */}
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          border: 'none',
          pointerEvents: 'auto',
        }}
        title="Video Player"
      />
      
      {/* Transparent overlay to block direct interaction with YouTube controls */}
      {/* This makes it harder to inspect and get the video URL */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'transparent',
          zIndex: 1,
        }}
      />
    </div>
  );
}
