const SPEEDS = [0.25, 0.5, 1, 2, 4];

interface PlaybackControlsProps {
  playing: boolean;
  time: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onScrub: (t: number) => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  unitLabel?: string;
  step?: number;
}

export function PlaybackControls({
  playing,
  time,
  duration,
  onPlay,
  onPause,
  onRestart,
  onScrub,
  speed = 1,
  onSpeedChange,
  unitLabel = 's',
  step = 0.01,
}: PlaybackControlsProps) {
  return (
    <div
      style={{
        marginTop: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" onClick={playing ? onPause : onPlay} aria-pressed={playing}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onRestart}>
          Restart
        </button>
        {onSpeedChange && (
          <label style={{ fontSize: '0.8rem' }} className="muted">
            Speed{' '}
            <select
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              style={{ marginLeft: '0.25rem', padding: '0.2rem' }}
            >
              {SPEEDS.map((option) => (
                <option key={option} value={option}>
                  {option}×
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="muted" style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
          {time.toFixed(step >= 1 ? 0 : 2)} / {duration.toFixed(step >= 1 ? 0 : 2)} {unitLabel}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        step={step}
        value={time}
        aria-label={`Playback position in ${unitLabel}`}
        onChange={(e) => onScrub(Number(e.target.value))}
        style={{ width: '100%', maxWidth: 400 }}
      />
    </div>
  );
}
