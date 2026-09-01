import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MotionSample } from 'physics-engine';
import { downloadTextFile, samplesToCsv } from '../../lib/exportCsv';

interface ResultsActionsProps {
  samples: MotionSample[];
  csvBasename: string;
}

export function ResultsActions({ samples, csvBasename }: ResultsActionsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <button type="button" onClick={copyLink} style={{ fontSize: '0.8rem' }}>
        {copied ? 'Link copied' : 'Copy shareable link'}
      </button>
      <button
        type="button"
        disabled={samples.length === 0}
        style={{ fontSize: '0.8rem' }}
        onClick={() => downloadTextFile(`${csvBasename}.csv`, samplesToCsv(samples))}
      >
        Download samples (CSV)
      </button>
      <button
        type="button"
        style={{ fontSize: '0.8rem' }}
        onClick={() => navigate(location.pathname, { replace: true })}
      >
        Reset to defaults
      </button>
    </div>
  );
}
