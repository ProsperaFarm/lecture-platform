import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GraduationCap, Play, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLanguageName } from "@/lib/language";

interface PlyrVideoPlayerProps {
  youtubeUrl: string;
  lessonId: string;
  courseId: string;
  courseTitle?: string;
  lessonTitle?: string;
  moduleTitle?: string;
  language?: string | null;
  prevLessonId?: string | null;
  prevLessonTitle?: string | null;
  nextLessonId?: string | null;
  nextLessonTitle?: string | null;
  onNavigate?: (lessonId: string) => void;
}

export function PlyrVideoPlayer({ 
  youtubeUrl,
  lessonId,
  courseId,
  courseTitle = "",
  lessonTitle = "",
  moduleTitle = "",
  language = null,
  prevLessonId = null,
  prevLessonTitle = null,
  nextLessonId = null,
  nextLessonTitle = null,
  onNavigate
}: PlyrVideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInitialOverlay, setShowInitialOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const initialOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownInitialOverlay = useRef(false);
  const hasMarkedComplete = useRef(false); // Track if we've already marked this lesson as complete
  
  // State for next video auto-play overlay
  const [showNextVideoOverlay, setShowNextVideoOverlay] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get tRPC utils for query invalidation
  const utils = trpc.useUtils();
  
  // Mutation to update progress
  const updateProgress = trpc.progress.upsert.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh progress display
      utils.progress.getByCourse.invalidate({ courseId });
      utils.progress.getByLesson.invalidate({ lessonId });
      utils.progress.getStats.invalidate({ courseId });
      console.log(`[Progress] ✅ Progress updated for lesson ${lessonId}`);
    },
    onError: (error) => {
      console.error(`[Progress] ❌ Failed to update progress for lesson ${lessonId}:`, error);
    },
  });

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
    
    // Add custom CSS for green play button and disable right-click on iframe
    const style = document.createElement("style");
    style.textContent = `
      /* Customize Plyr play button to green */
      .plyr--video .plyr__control.plyr__tab-focus,
      .plyr--video .plyr__control:hover,
      .plyr--video .plyr__control[aria-expanded=true] {
        background: #16a34a !important; /* green-600 */
      }
      .plyr__control--overlaid {
        background: rgba(22, 163, 74, 0.9) !important; /* green-600 with opacity */
      }
      .plyr__control--overlaid:hover {
        background: rgba(22, 163, 74, 1) !important;
      }
      /* Disable right-click on YouTube iframe */
      .plyr iframe {
        pointer-events: none !important;
      }
      /* Re-enable pointer events on Plyr controls and increase z-index */
      .plyr__controls {
        pointer-events: auto !important;
        z-index: 50 !important; /* Above overlay (z-1) and text (z-2) */
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent) !important;
      }
      /* Ensure controls visible when paused */
      .plyr--paused .plyr__controls {
        z-index: 50 !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      /* Force controls to be above everything */
      .plyr__control-bar {
        z-index: 50 !important;
      }
      /* Customize progress bar color to green */
      .plyr--full-ui input[type=range] {
        color: #16a34a !important; /* green-600 */
      }
      .plyr__progress__buffer {
        color: rgba(22, 163, 74, 0.25) !important;
      }
      /* Customize volume bar color to green */
      .plyr--video .plyr__volume input[type=range] {
        color: #16a34a !important; /* green-600 */
      }
    `;
    document.head.appendChild(style);

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
          
          // Save initial progress when video starts playing (marks lesson as started)
          if (playerRef.current && playerRef.current.media) {
            try {
              const currentTime = Math.floor(playerRef.current.currentTime || 0);
              if (!isNaN(currentTime) && currentTime >= 0) {
                console.log(`[Progress] Video started playing - Saving initial progress: ${currentTime}s for lesson ${lessonId}`);
                updateProgress.mutate({
                  lessonId,
                  courseId,
                  completed: false,
                  lastWatchedPosition: currentTime,
                });
              }
            } catch (error) {
              console.error('[Progress] Error saving initial progress:', error);
            }
          }
          
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

        // Listen to time updates to detect completion
        playerRef.current.on('timeupdate', (event: any) => {
          if (hasMarkedComplete.current) return; // Already marked, skip

          const currentTime = playerRef.current.currentTime;
          const duration = playerRef.current.duration;

          if (!duration || duration === 0) return;

          // Mark as complete if:
          // 1. Reached 90% of the video, OR
          // 2. Within last 30 seconds
          const percentComplete = (currentTime / duration) * 100;
          const secondsRemaining = duration - currentTime;

          if (percentComplete >= 90 || secondsRemaining <= 30) {
            hasMarkedComplete.current = true;
            console.log(`[Progress] Auto-marking lesson ${lessonId} as complete (${percentComplete.toFixed(1)}% watched)`);
            
            updateProgress.mutate({
              lessonId,
              courseId,
              completed: true,
              lastWatchedPosition: Math.floor(currentTime),
            });
          }
        });

        // Listen to video end event
        playerRef.current.on('ended', () => {
          console.log(`[Player] 🎬 Video ended for lesson ${lessonId}`);
          
          // Always mark as complete when video ends (even if already marked via timeupdate)
          if (playerRef.current && playerRef.current.media) {
            try {
              const finalTime = Math.floor(playerRef.current.duration || 0);
              console.log(`[Progress] ✅ Video ended - Marking lesson ${lessonId} as complete (duration: ${finalTime}s)`);
              
              hasMarkedComplete.current = true;
              updateProgress.mutate({
                lessonId,
                courseId,
                completed: true,
                lastWatchedPosition: finalTime,
              });
            } catch (error) {
              console.error('[Progress] Error marking lesson as complete:', error);
            }
          }

          // Show next video overlay if there is a next lesson
          if (nextLessonId && nextLessonTitle && onNavigate) {
            console.log(`[Player] 📺 Showing next video overlay for: ${nextLessonTitle}`);
            setShowNextVideoOverlay(true);
            setCountdown(10);
            
            // Clear any existing interval
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            
            // Start countdown with proper closure
            let currentCount = 10;
            countdownIntervalRef.current = setInterval(() => {
              currentCount--;
              console.log(`[Player] ⏱️ Countdown: ${currentCount} seconds`);
              setCountdown(currentCount);
              
              if (currentCount <= 0) {
                // Clear interval and close overlay
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
                  countdownIntervalRef.current = null;
                }
                setShowNextVideoOverlay(false);
                
                // Auto-navigate to next lesson
                console.log(`[Player] 🚀 Auto-navigating to next lesson: ${nextLessonId}`);
                onNavigate(nextLessonId);
              }
            }, 1000);
          } else {
            console.log(`[Player] ℹ️ No next lesson available - last video in course`);
          }
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
      
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [videoId, lessonId, courseId, nextLessonId, nextLessonTitle, onNavigate]);
  
  // Reset refs and cleanup countdown when lesson changes
  useEffect(() => {
    // Reset completion tracking when lesson changes
    hasMarkedComplete.current = false;
    hasShownInitialOverlay.current = false;
    
    // Cleanup countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowNextVideoOverlay(false);
    setCountdown(10);
  }, [lessonId]);

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

          {/* Gradient to cover YouTube logo (bottom-right corner only) */}
          <div 
            className="absolute bottom-0 right-0 pointer-events-none"
            style={{ height: '54px', width: '20%' }}
          >
            <div className="bg-gradient-to-l from-black/95 via-black/70 to-transparent h-full" />
          </div>

          {/* Subtle gradient overlay for text readability - positioned above controls */}
          <div 
            className={`absolute left-0 right-0 pointer-events-none ${isFullscreen ? 'z-[9999]' : ''}`}
            style={{ 
              bottom: isFullscreen ? '60px' : '54px',
              height: isFullscreen ? '40px' : '30px'
            }}
          >
            <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent h-full" />
          </div>

          {/* Course info text - positioned above controls */}
          <div 
            className={`absolute left-0 right-0 pointer-events-none ${isFullscreen ? 'z-[9999]' : ''}`}
            style={{ bottom: isFullscreen ? '60px' : '54px' }}
          >
            <div className={`${isFullscreen ? 'px-6' : 'px-4'}`}>
              <div className="space-y-2">
                {/* Course info */}
                {courseTitle && (
                  <div className="flex items-center gap-2">
                    <BookOpen className={`text-green-400 flex-shrink-0 ${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-white/60 uppercase tracking-wide ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                          Curso
                        </p>
                        {language && getLanguageName(language) && (
                          <span className={`text-white/60 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                            • {getLanguageName(language)}
                          </span>
                        )}
                      </div>
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
      className="absolute inset-0 select-none group" 
      style={{ userSelect: 'none' }}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Plyr Player */}
      <div ref={videoRef} className="w-full h-full" />

      {/* Render overlays - use portal when in fullscreen */}
      {isFullscreen && fullscreenContainer
        ? createPortal(renderOverlays(), fullscreenContainer)
        : renderOverlays()
      }

      {/* Navigation buttons - show on hover */}
      {isHovering && (
        <>
          {/* Previous button */}
          {prevLessonId && prevLessonTitle && (
            <button
              onClick={() => onNavigate?.(prevLessonId)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[100] group/nav"
              aria-label="Aula anterior"
            >
              <div className="relative">
                <div className="bg-black/70 hover:bg-black/90 rounded-full p-3 transition-all duration-200">
                  <ChevronLeft className="w-8 h-8 text-white" />
                </div>
                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs max-w-[200px] leading-tight">
                    {prevLessonTitle}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Next button */}
          {nextLessonId && nextLessonTitle && (
            <button
              onClick={() => onNavigate?.(nextLessonId)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] group/nav"
              aria-label="Próxima aula"
            >
              <div className="relative">
                <div className="bg-black/70 hover:bg-black/90 rounded-full p-3 transition-all duration-200">
                  <ChevronRight className="w-8 h-8 text-white" />
                </div>
                {/* Tooltip */}
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs max-w-[200px] leading-tight">
                    {nextLessonTitle}
                  </div>
                </div>
              </div>
            </button>
          )}
        </>
      )}

      {/* Next Video Auto-Play Overlay */}
      {showNextVideoOverlay && nextLessonId && nextLessonTitle && (
        <div className={`absolute inset-0 z-[200] flex items-center justify-center ${isFullscreen ? 'bg-black/90' : 'bg-black/80'}`}>
          <div className="bg-card border rounded-lg shadow-xl p-8 max-w-md mx-4 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                Aula Concluída!
              </h3>
              <p className="text-muted-foreground">
                Próxima aula começará em:
              </p>
              <div className="text-6xl font-bold text-primary my-4">
                {countdown}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Próxima aula:</p>
                <p className="text-lg font-semibold text-foreground">
                  {nextLessonTitle}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Navigate immediately
                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                  if (onNavigate && nextLessonId) {
                    onNavigate(nextLessonId);
                  }
                  setShowNextVideoOverlay(false);
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
              >
                Assistir Agora
              </button>
              <button
                onClick={() => {
                  // Cancel auto-play
                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                  setShowNextVideoOverlay(false);
                  setCountdown(10);
                }}
                className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
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
