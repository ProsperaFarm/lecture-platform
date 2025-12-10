declare module 'react-player' {
  import { Component } from 'react';

  export interface ReactPlayerProps {
    url?: string | string[] | MediaStream;
    playing?: boolean;
    loop?: boolean;
    controls?: boolean;
    light?: boolean | string;
    volume?: number;
    muted?: boolean;
    playbackRate?: number;
    width?: string | number;
    height?: string | number;
    style?: object;
    progressInterval?: number;
    playsinline?: boolean;
    pip?: boolean;
    stopOnUnmount?: boolean;
    fallback?: React.ReactElement;
    wrapper?: any;
    playIcon?: React.ReactElement;
    previewTabIndex?: number;
    config?: {
      youtube?: {
        playerVars?: object;
        embedOptions?: object;
        onUnstarted?: () => void;
      };
      facebook?: {
        appId?: string;
        version?: string;
        playerId?: string;
        attributes?: object;
      };
      soundcloud?: {
        options?: object;
      };
      vimeo?: {
        playerOptions?: object;
        title?: string;
      };
      wistia?: {
        options?: object;
        playerId?: string;
      };
      mixcloud?: {
        options?: object;
      };
      dailymotion?: {
        params?: object;
      };
      twitch?: {
        options?: object;
        playerId?: string;
      };
      file?: {
        attributes?: object;
        tracks?: object[];
        forceVideo?: boolean;
        forceAudio?: boolean;
        forceHLS?: boolean;
        forceDASH?: boolean;
        forceFLV?: boolean;
        hlsOptions?: object;
        hlsVersion?: string;
        dashVersion?: string;
        flvVersion?: string;
      };
    };
    onReady?: (player: ReactPlayer) => void;
    onStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onBuffer?: () => void;
    onBufferEnd?: () => void;
    onEnded?: () => void;
    onError?: (error: any, data?: any, hlsInstance?: any, hlsGlobal?: any) => void;
    onDuration?: (duration: number) => void;
    onSeek?: (seconds: number) => void;
    onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
    onEnablePIP?: () => void;
    onDisablePIP?: () => void;
  }

  export default class ReactPlayer extends Component<ReactPlayerProps, any> {
    seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
    getCurrentTime(): number;
    getDuration(): number;
    getInternalPlayer(key?: string): any;
  }
}
