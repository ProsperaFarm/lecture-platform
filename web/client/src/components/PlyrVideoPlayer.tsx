import { useEffect, useRef } from "react";

interface PlyrVideoPlayerProps {
  youtubeUrl: string;
}

export function PlyrVideoPlayer({ youtubeUrl }: PlyrVideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const plyrInstanceRef = useRef<any>(null);

  // Extract YouTube video ID
  const getYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(youtubeUrl);

  useEffect(() => {
    if (!videoId || !playerRef.current) return;

    // Load Plyr CSS if not already loaded
    if (!document.querySelector('link[href*="plyr.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
      document.head.appendChild(link);
    }

    // Load Plyr JS and initialize
    const loadPlyr = async () => {
      // Check if Plyr is already loaded
      if (!(window as any).Plyr) {
        const script = document.createElement('script');
        script.src = 'https://cdn.plyr.io/3.7.8/plyr.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Initialize Plyr
      const Plyr = (window as any).Plyr;
      if (Plyr && playerRef.current) {
        plyrInstanceRef.current = new Plyr(playerRef.current, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'settings',
            'fullscreen'
          ],
          youtube: {
            noCookie: true, // Use youtube-nocookie.com
            rel: 0, // Don't show related videos
            showinfo: 0, // Hide video title
            iv_load_policy: 3, // Hide annotations
            modestbranding: 1 // Minimal YouTube branding
          },
          hideControls: false,
          resetOnEnd: false,
        });

        // Disable right-click
        playerRef.current.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          return false;
        });
      }
    };

    loadPlyr().catch(console.error);

    // Cleanup
    return () => {
      if (plyrInstanceRef.current) {
        plyrInstanceRef.current.destroy();
      }
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">URL de vídeo inválida</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 select-none" style={{ userSelect: 'none' }}>
      <div
        ref={playerRef}
        className="plyr__video-embed w-full h-full"
        data-plyr-provider="youtube"
        data-plyr-embed-id={videoId}
      />
    </div>
  );
}
