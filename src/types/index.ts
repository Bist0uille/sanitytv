export type DetectionSignal =
  | 'clickbait_title'
  | 'rage_bait'
  | 'brainrot_structural'
  | 'sensationalism';

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  isShort?: boolean;
}

export interface ScoredVideo extends VideoMetadata {
  score: number;
  signals: ReadonlyArray<{
    kind: DetectionSignal;
    contribution: number;
    detail?: string;
  }>;
}
