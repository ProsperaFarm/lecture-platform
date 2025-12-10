import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isLoading, setIsLoading] = useState(true);
  const [showInitialOverlay, setShowInitialOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);
  const initialOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownInitialOverlay = useRef(false);

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
        playerRef.current.on('play', () => {
          setIsPaused(false);
        });
        
        playerRef.current.on('pause', () => {
          setIsPaused(true);
        });

        // Listen to loading/buffering events
        playerRef.current.on('waiting', () => {
          setIsLoading(true);
        });

        // Listen to playing event - video started playing after loading
        playerRef.current.on('playing', () => {
          setIsLoading(false);
          
          // Show overlay for 3 seconds only on FIRST play after loading
          if (!hasShownInitialOverlay.current) {
            hasShownInitialOverlay.current = true;
            setShowInitialOverlay(true);
            
            // Clear any existing timeout
            if (initialOverlayTimeoutRef.current) {
              clearTimeout(initialOverlayTimeoutRef.current);
            }
            
            // Hide overlay after 3 seconds
            initialOverlayTimeoutRef.current = setTimeout(() => {
              setShowInitialOverlay(false);
            }, 3000);
          }
        });

        // Listen to fullscreen changes
        playerRef.current.on('enterfullscreen', () => {
          setIsFullscreen(true);
          // Find the fullscreen container (Plyr wraps the player in a fullscreen element)
          setTimeout(() => {
            const fsElement = videoRef.current?.closest('.plyr--fullscreen-active');
            if (fsElement) {
              setFullscreenContainer(fsElement as HTMLElement);
            }
          }, 100);
        });

        playerRef.current.on('exitfullscreen', () => {
          setIsFullscreen(false);
          setFullscreenContainer(null);
        });
      }
    };

    document.head.appendChild(script);

    // Also listen to native fullscreen API
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      
      if (isFs) {
        // Find the fullscreen element
        const fsElement = document.fullscreenElement;
        if (fsElement) {
          setFullscreenContainer(fsElement as HTMLElement);
        }
      } else {
        setFullscreenContainer(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      // Clear timeout
      if (initialOverlayTimeoutRef.current) {
        clearTimeout(initialOverlayTimeoutRef.current);
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

  // Show overlays when paused OR loading OR during initial 5 seconds after loading
  const showOverlays = isPaused || isLoading || showInitialOverlay;

  // Render overlays component
  const renderOverlays = () => (
    <>
      {showOverlays && (
        <>
          {/* Top branded bar - covers title area */}
          <div 
            className={`absolute top-0 left-0 right-0 pointer-events-auto ${isFullscreen ? 'z-[9999]' : 'z-10'}`}
            style={{ height: isFullscreen ? '138px' : '115px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-b from-black/95 via-black/85 to-transparent h-full flex items-start gap-3 ${isFullscreen ? 'p-6' : 'p-4'}`}>
              <div className={`rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 ${isFullscreen ? 'w-16 h-16' : 'w-12 h-12'}`}>
                <GraduationCap className={`text-white ${isFullscreen ? 'w-9 h-9' : 'w-7 h-7'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-white font-bold leading-tight ${isFullscreen ? 'text-xl' : 'text-base'}`}>
                  Prospera Academy
                </h3>
                <p className={`text-white/80 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                  Plataforma de Cursos
                </p>
              </div>
            </div>
          </div>

          {/* Bottom branded bar - covers YouTube logo and share buttons */}
          <div 
            className={`absolute bottom-0 left-0 right-0 pointer-events-auto ${isFullscreen ? 'z-[9999]' : 'z-10'}`}
            style={{ height: isFullscreen ? '120px' : '100px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-t from-black/95 via-black/80 to-transparent h-full flex flex-col justify-end ${isFullscreen ? 'p-6 pt-10' : 'p-4 pt-8'}`}>
              <div className="space-y-2">
                {/* Course info */}
                {courseTitle && (
                  <div className="flex items-center gap-2">
                    <BookOpen className={`text-green-400 flex-shrink-0 ${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-white/60 uppercase tracking-wide ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                        Curso
                      </p>
                      <p className={`text-white font-semibold truncate ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                        {courseTitle}
                      </p>
                    </div>
                  </div>
                )}

                {/* Module and lesson */}
                {(moduleTitle || lessonTitle) && (
                  <div className="flex items-center gap-2">
                    <Play className={`text-green-400 flex-shrink-0 ${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    <div className="flex-1 min-w-0">
                      {moduleTitle && (
                        <p className={`text-white/80 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                          {moduleTitle}
                        </p>
                      )}
                      {lessonTitle && (
                        <p className={`text-white font-medium truncate ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                          {lessonTitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <div 
      className="absolute inset-0 select-none" 
      style={{ userSelect: 'none' }}
      onContextMenu={handleContextMenu}
    >
      {/* Plyr Player */}
      <div ref={videoRef} className="w-full h-full" />
      
      {/* Transparent overlay to block right-click on video iframe */}
      <div 
        className="absolute inset-0"
        style={{ 
          zIndex: 5,
          pointerEvents: 'auto',
          background: 'transparent'
        }}
        onContextMenu={handleContextMenu}
      />

      {/* Render overlays - use portal when in fullscreen */}
      {isFullscreen && fullscreenContainer
        ? createPortal(renderOverlays(), fullscreenContainer)
        : renderOverlays()
      }
    </div>
  );
}

// Declare Plyr type
declare global {
  interface Window {
    Plyr: any;
  }
}
