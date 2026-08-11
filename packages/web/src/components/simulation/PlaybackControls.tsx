interface PlaybackControlsProps {
  playing: boolean;
  time: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onScrub: (t: number) => void;
}

export function PlaybackControls({
  playing,
  time,
  duration,
  onPlay,
  onPause,
  onRestart,
  onScrub,
}: PlaybackControlsProps) {
  return (
    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {playing ? (
          <button type="button" onClick={onPause}>Pause</button>
        ) : (
          <button type="button" onClick={onPlay}>Play</button>
        )}
        <button type="button" onClick={onRestart}>Restart</button>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={time}
        onChange={(e) => onScrub(parseFloat(e.target.value))}
        style={{ width: '100%', maxWidth: 400 }}
      />
    </div>
  );
}
