import { useEffect, useRef, useState } from "react";
import { GraduationCap, Play, BookOpen } from "lucide-react";

interface PlyrVideoPlayerProps {
  youtubeUrl: string;
  courseTitle?: string;
  lessonTitle?: string;
  moduleTitle?: string;
}

export function PlyrVideoPlayer({ 
  youtubeUrl,
  courseTitle = "",
  lessonTitle = "",
  moduleTitle = ""
}: PlyrVideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Extract YouTube video ID
  const getYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(youtubeUrl);

  useEffect(() => {
    if (!videoId || !videoRef.current) return;

    // Load Plyr CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.plyr.io/3.7.8/plyr.css";
    document.head.appendChild(link);

    // Load Plyr JS
    const script = document.createElement("script");
    script.src = "https://cdn.plyr.io/3.7.8/plyr.js";
    script.async = true;

    script.onload = () => {
      if (window.Plyr && videoRef.current) {
        // Create YouTube iframe
        const iframe = document.createElement("div");
        iframe.setAttribute("data-plyr-provider", "youtube");
        iframe.setAttribute("data-plyr-embed-id", videoId);
        videoRef.current.appendChild(iframe);

        // Initialize Plyr
        playerRef.current = new window.Plyr(iframe, {
          youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
          },
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'settings',
            'fullscreen',
          ],
        });

        // Listen to play/pause events
        playerRef.current.on('play', () => setIsPaused(false));
        playerRef.current.on('pause', () => setIsPaused(true));
      }
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  // Disable right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  if (!videoId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">URL de vídeo inválida</p>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 select-none" 
      style={{ userSelect: 'none' }}
      onContextMenu={handleContextMenu}
    >
      {/* Plyr Player */}
      <div ref={videoRef} className="w-full h-full" />

      {/* Branded Overlays - Only when paused */}
      {isPaused && (
        <>
          {/* Top branded bar - covers title area */}
          <div 
            className="absolute top-0 left-0 right-0 z-50 pointer-events-auto"
            style={{ height: '80px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-black/90 via-black/70 to-transparent h-full p-4 flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base leading-tight">Prospera Academy</h3>
                <p className="text-white/80 text-xs">Plataforma de Cursos</p>
              </div>
            </div>
          </div>

          {/* Bottom branded bar - covers YouTube logo and share buttons */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto"
            style={{ height: '100px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent h-full p-4 pt-8 flex flex-col justify-end">
              <div className="space-y-2">
                {/* Course info */}
                {courseTitle && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs uppercase tracking-wide">Curso</p>
                      <p className="text-white font-semibold text-sm truncate">{courseTitle}</p>
                    </div>
                  </div>
                )}

                {/* Module and lesson */}
                {(moduleTitle || lessonTitle) && (
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {moduleTitle && (
                        <p className="text-white/80 text-xs truncate">{moduleTitle}</p>
                      )}
                      {lessonTitle && (
                        <p className="text-white font-medium text-sm truncate">{lessonTitle}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Corner overlays to block specific YouTube buttons */}
          {/* Bottom-left: "Watch on YouTube" button */}
          <div 
            className="absolute bottom-2 left-2 w-40 h-12 bg-black/95 rounded z-50 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: 'blur(10px)' }}
          />

          {/* Top-right: Share/More buttons */}
          <div 
            className="absolute top-2 right-2 w-32 h-10 bg-black/95 rounded z-50 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ backdropFilter: 'blur(10px)' }}
          />
        </>
      )}
    </div>
  );
}

// Declare Plyr type
declare global {
  interface Window {
    Plyr: any;
  }
}
