'use client';

import { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';

interface Segment {
  id: string;
  sequence: number;
  hlsUrl: string;
  duration: number;
  thumbnailUrl?: string | null;
}

interface ScenePlayerProps {
  sceneId: string;
  segments: Segment[];
  totalDuration: number;
  onSegmentChange?: (segmentIndex: number) => void;
}

export function ScenePlayer({
  sceneId,
  segments,
  totalDuration,
  onSegmentChange,
}: ScenePlayerProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSegment = segments[currentSegmentIndex];

  const handleSegmentEnd = () => {
    if (currentSegmentIndex < segments.length - 1) {
      // Move to next segment
      const nextIndex = currentSegmentIndex + 1;
      setCurrentSegmentIndex(nextIndex);
      onSegmentChange?.(nextIndex);
    } else {
      // Scene ended
      setIsPlaying(false);
    }
  };

  const jumpToSegment = (index: number) => {
    setCurrentSegmentIndex(index);
    onSegmentChange?.(index);
  };

  if (!currentSegment) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <p className="text-gray-400">No segments available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main player */}
      <VideoPlayer
        src={currentSegment.hlsUrl}
        poster={currentSegment.thumbnailUrl || undefined}
        autoPlay={isPlaying}
        onEnded={handleSegmentEnd}
        className="aspect-video"
      />

      {/* Segment info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Segment {currentSegmentIndex + 1} of {segments.length}
        </span>
        <span>Total: {formatDuration(totalDuration)}</span>
      </div>

      {/* Segment timeline */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {segments.map((segment, index) => (
          <button
            key={segment.id}
            onClick={() => jumpToSegment(index)}
            className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden border-2 transition-all ${
              index === currentSegmentIndex
                ? 'border-blue-500 ring-2 ring-blue-500/50'
                : 'border-transparent hover:border-gray-400'
            }`}
          >
            {segment.thumbnailUrl ? (
              <img
                src={segment.thumbnailUrl}
                alt={`Segment ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                {index + 1}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
