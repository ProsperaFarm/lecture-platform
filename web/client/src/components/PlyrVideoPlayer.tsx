import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, GraduationCap } from "lucide-react";

interface PlyrVideoPlayerProps {
  youtubeUrl: string;
  courseTitle?: string;
  lessonTitle?: string;
  moduleTitle?: string;
}

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function PlyrVideoPlayer({ 
  youtubeUrl, 
  courseTitle = "",
  lessonTitle = "",
  moduleTitle = ""
}: PlyrVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Extract YouTube video ID
  const getYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(youtubeUrl);

  useEffect(() => {
    if (!videoId) return;

    // Load YouTube IFrame API
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer();
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        // Wait for it to load
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYT);
            initializePlayer();
          }
        }, 100);
        return;
      }

      // Load the script
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    };

    const initializePlayer = () => {
      if (!containerRef.current) return;

      // Create iframe element
      const iframe = document.createElement('div');
      iframe.id = `youtube-player-${videoId}`;
      containerRef.current.appendChild(iframe);

      playerRef.current = new window.YT.Player(iframe.id, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PAUSED = 2
            // YT.PlayerState.PLAYING = 1
            setIsPaused(event.data === 2);
          },
        },
      });
    };

    loadYouTubeAPI();

    // Cleanup
    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const handlePlay = () => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  };

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
      {/* YouTube Player Container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ position: 'relative' }}
      />

      {/* Branded Overlay when paused */}
      {isPaused && isReady && (
        <>
          {/* Full overlay with gradient */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            }}
          />

          {/* Top branding bar */}
          <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="bg-gradient-to-b from-black/80 to-transparent p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Prospera Academy</h3>
                  <p className="text-white/80 text-sm">Plataforma de Cursos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom info bar - covers YouTube buttons */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="bg-gradient-to-t from-black/95 via-black/90 to-transparent p-6 pt-12">
              <div className="space-y-3">
                {/* Course info */}
                {courseTitle && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide">Curso</p>
                      <p className="text-white font-semibold">{courseTitle}</p>
                    </div>
                  </div>
                )}

                {/* Module and lesson info */}
                {(moduleTitle || lessonTitle) && (
                  <div className="flex items-start gap-2">
                    <Play className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      {moduleTitle && (
                        <p className="text-white/80 text-sm">{moduleTitle}</p>
                      )}
                      {lessonTitle && (
                        <p className="text-white font-medium">{lessonTitle}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom play button - centered */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <Button
              onClick={handlePlay}
              className="bg-green-600 hover:bg-green-700 text-white shadow-2xl pointer-events-auto"
              size="lg"
            >
              <Play className="w-6 h-6 mr-2 fill-white" />
              Continuar Assistindo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
