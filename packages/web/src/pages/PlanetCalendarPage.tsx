import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { AlignmentSearchResult, PairConjunctionResult } from 'physics-engine';
import {
  ORBITAL_PLANETS,
  PLANET_CALENDAR_PRESETS,
  addDays,
  applyPlanetCalendarPreset,
  formatDateString,
  getSolarSystemSnapshot,
  parseDateParts,
  todayUtcDate,
  validateDateParts,
  findBestAlignment,
  findClosestPair,
} from 'physics-engine';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import {
  PlanetCalendarResults,
  PlanetCalendarTabs,
  ScaleEducationCallout,
} from '../components/solar-system/PlanetCalendarPanels';
import { SolarSystemCanvas } from '../components/solar-system/SolarSystemCanvas';
import { PlaybackControls } from '../components/simulation/PlaybackControls';
import { usePlanetCalendarParams } from '../hooks/usePlanetCalendarParams';

const MAX_ANIMATION_FRAMES = 500;

function DateFields({
  prefix,
  day,
  month,
  year,
  onChange,
}: {
  prefix: string;
  day: number;
  month: number;
  year: number;
  onChange: (patch: { day?: number; month?: number; year?: number }) => void;
}) {
  const fieldStyle = { width: '100%', marginTop: '0.25rem' } as const;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <label>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Day</span>
        <input
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(e) => onChange({ day: parseInt(e.target.value, 10) || 1 })}
          style={fieldStyle}
        />
      </label>
      <label>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Month</span>
        <input
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => onChange({ month: parseInt(e.target.value, 10) || 1 })}
          style={fieldStyle}
        />
      </label>
      <label>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Year</span>
        <input
          type="number"
          min={1}
          value={year}
          onChange={(e) => onChange({ year: parseInt(e.target.value, 10) || 2000 })}
          style={fieldStyle}
        />
      </label>
      <span className="muted" style={{ gridColumn: '1 / -1', fontSize: '0.75rem' }}>{prefix}</span>
    </div>
  );
}

function rangeDays(start: Date, endExclusive: Date): number {
  return Math.max(0, Math.round((endExclusive.getTime() - start.getTime()) / 86_400_000));
}

function animationFrameCount(rangeStart: Date, rangeEnd: Date, userStep: number): number {
  const days = rangeDays(rangeStart, rangeEnd);
  if (days === 0) return 0;
  const effectiveStep = Math.max(userStep, Math.ceil(days / MAX_ANIMATION_FRAMES));
  return Math.ceil(days / effectiveStep);
}

function dateAtAnimationFrame(rangeStart: Date, rangeEnd: Date, userStep: number, frameIndex: number): Date {
  const days = rangeDays(rangeStart, rangeEnd);
  const effectiveStep = Math.max(userStep, Math.ceil(days / MAX_ANIMATION_FRAMES));
  const maxFrame = Math.max(animationFrameCount(rangeStart, rangeEnd, userStep) - 1, 0);
  const clamped = Math.min(Math.max(frameIndex, 0), maxFrame);
  return addDays(rangeStart, clamped * effectiveStep);
}

export function PlanetCalendarPage() {
  const [params, setParams] = usePlanetCalendarParams();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [error, setError] = useState<string | null>(null);
  const [animIndex, setAnimIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [searching, setSearching] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentSearchResult | null>(null);
  const [pairResult, setPairResult] = useState<PairConjunctionResult | null>(null);

  const snapshotDate = useMemo(
    () => parseDateParts(params.day, params.month, params.year),
    [params.day, params.month, params.year],
  );
  const rangeStart = useMemo(
    () => parseDateParts(params.startDay, params.startMonth, params.startYear),
    [params.startDay, params.startMonth, params.startYear],
  );
  const rangeEnd = useMemo(
    () => parseDateParts(params.endDay, params.endMonth, params.endYear),
    [params.endDay, params.endMonth, params.endYear],
  );

  const animationMeta = useMemo(() => {
    if (params.mode !== 'animate') return null;
    const days = rangeDays(rangeStart, rangeEnd);
    const effectiveStep = Math.max(params.stepDays, Math.ceil(days / MAX_ANIMATION_FRAMES));
    const frames = animationFrameCount(rangeStart, rangeEnd, params.stepDays);
    return { days, effectiveStep, frames };
  }, [params.mode, rangeStart, rangeEnd, params.stepDays]);

  const activeDate =
    params.mode === 'animate' && animationMeta && animationMeta.frames > 0
      ? dateAtAnimationFrame(rangeStart, rangeEnd, params.stepDays, animIndex)
      : snapshotDate;

  const displayDate =
    params.mode === 'alignment' && alignmentResult ? alignmentResult.date : activeDate;

  const positions = useMemo(() => {
    if (params.mode === 'alignment' && alignmentResult) return alignmentResult.positions;
    return getSolarSystemSnapshot(displayDate, params.scaleMode).positions;
  }, [params.mode, alignmentResult, displayDate, params.scaleMode]);

  useEffect(() => {
    setAnimIndex(0);
    setPlaying(false);
  }, [params.mode, params.startDay, params.startMonth, params.startYear, params.endDay, params.endMonth, params.endYear, params.stepDays]);

  useEffect(() => {
    const err =
      validateDateParts(params.day, params.month, params.year) ??
      (params.mode !== 'snapshot'
        ? validateDateParts(params.startDay, params.startMonth, params.startYear) ??
          validateDateParts(params.endDay, params.endMonth, params.endYear) ??
          (rangeEnd <= rangeStart ? 'End date must be after start date' : null)
        : null);
    setError(err);
  }, [params, rangeEnd, rangeStart]);

  useEffect(() => {
    if (params.mode !== 'alignment' || error) {
      setAlignmentResult(null);
      setPairResult(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      const alignment = findBestAlignment(rangeStart, rangeEnd, params.alignmentMetric, params.scaleMode);
      const pair = findClosestPair(params.pairA, params.pairB, rangeStart, rangeEnd, params.scaleMode);
      setAlignmentResult(alignment);
      setPairResult(pair);
      setSearching(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    params.mode,
    params.alignmentMetric,
    params.pairA,
    params.pairB,
    params.scaleMode,
    rangeStart,
    rangeEnd,
    error,
  ]);

  useEffect(() => {
    if (!playing || !animationMeta || animationMeta.frames === 0) return;
    const id = setInterval(() => {
      setAnimIndex((index) => {
        const next = index + 1;
        if (next >= animationMeta.frames) {
          setPlaying(false);
          return animationMeta.frames - 1;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(id);
  }, [playing, animationMeta]);

  const title = formatDateString(displayDate);
  const resultsFooter = useMemo(() => {
    if (params.mode !== 'alignment') return undefined;
    if (searching) return 'Searching…';
    const parts: string[] = [];
    if (alignmentResult) {
      parts.push(
        `Best cluster (${params.alignmentMetric}): ${alignmentResult.score.toFixed(3)} AU on ${formatDateString(alignmentResult.date)}`,
      );
    } else {
      parts.push('No dates in the selected range.');
    }
    if (pairResult) {
      parts.push(
        `Closest ${pairResult.bodyA}–${pairResult.bodyB}: ${pairResult.distanceAu.toFixed(3)} AU on ${formatDateString(pairResult.date)}`,
      );
    }
    return parts.join(' · ');
  }, [params.mode, params.alignmentMetric, alignmentResult, pairResult, searching]);

  const selectStyle = {
    width: '100%',
    padding: '0.45rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    marginTop: '0.25rem',
  } as const;

  const setToday = () => {
    const today = todayUtcDate();
    setParams({
      day: today.getUTCDate(),
      month: today.getUTCMonth() + 1,
      year: today.getUTCFullYear(),
    });
  };

  return (
    <WorkspaceLayout
      title="Planet Calendar"
      inputs={
        <div>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Heliocentric solar-system positions from VSOP87. Pick a date, find a cluster window, or animate.
          </p>
          <Link to="/solar-system" className="muted" style={{ fontSize: '0.85rem' }}>
            ← Solar System hub
          </Link>

          <div style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Presets</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
              {PLANET_CALENDAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.description}
                  onClick={() => setParams(applyPlanetCalendarPreset(preset.id))}
                  style={{ textAlign: 'left' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Mode</span>
            <select
              value={params.mode}
              onChange={(e) => setParams({ mode: e.target.value as typeof params.mode })}
              style={selectStyle}
            >
              <option value="snapshot">Position on date</option>
              <option value="alignment">Find best cluster in range</option>
              <option value="animate">Animate range</option>
            </select>
          </label>

          {params.mode === 'snapshot' && (
            <>
              <DateFields
                prefix="Selected date (UTC noon)"
                day={params.day}
                month={params.month}
                year={params.year}
                onChange={(patch) => setParams(patch)}
              />
              <button type="button" onClick={setToday}>
                Today (UTC)
              </button>
            </>
          )}

          {params.mode !== 'snapshot' && (
            <>
              <DateFields
                prefix="Range start"
                day={params.startDay}
                month={params.startMonth}
                year={params.startYear}
                onChange={(patch) =>
                  setParams({
                    startDay: patch.day ?? params.startDay,
                    startMonth: patch.month ?? params.startMonth,
                    startYear: patch.year ?? params.startYear,
                  })
                }
              />
              <DateFields
                prefix="Range end (exclusive)"
                day={params.endDay}
                month={params.endMonth}
                year={params.endYear}
                onChange={(patch) =>
                  setParams({
                    endDay: patch.day ?? params.endDay,
                    endMonth: patch.month ?? params.endMonth,
                    endYear: patch.year ?? params.endYear,
                  })
                }
              />
            </>
          )}

          {params.mode === 'animate' && (
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>Step (days, minimum)</span>
              <input
                type="number"
                min={1}
                value={params.stepDays}
                onChange={(e) => setParams({ stepDays: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
              {animationMeta && animationMeta.days > 0 && (
                <span className="muted" style={{ fontSize: '0.75rem' }}>
                  {animationMeta.frames} frames
                  {animationMeta.effectiveStep > params.stepDays
                    ? ` (auto step ${animationMeta.effectiveStep} days for large range)`
                    : ''}
                </span>
              )}
            </label>
          )}

          {params.mode === 'alignment' && (
            <>
              <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 0.75rem' }}>
                Uses fast numerical search — no day-by-day scan.
              </p>
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <span className="muted" style={{ fontSize: '0.8rem' }}>Cluster metric</span>
                <select
                  value={params.alignmentMetric}
                  onChange={(e) => setParams({ alignmentMetric: e.target.value as typeof params.alignmentMetric })}
                  style={selectStyle}
                >
                  <option value="pairwiseSum">Minimize sum of all pair distances</option>
                  <option value="maxPairwise">Minimize maximum pair distance</option>
                  <option value="chainByLongitude">Minimize longitude chain distance</option>
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>Pair A</span>
                  <select
                    value={params.pairA}
                    onChange={(e) => setParams({ pairA: e.target.value as typeof params.pairA })}
                    style={selectStyle}
                  >
                    {ORBITAL_PLANETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>Pair B</span>
                  <select
                    value={params.pairB}
                    onChange={(e) => setParams({ pairB: e.target.value as typeof params.pairB })}
                    style={selectStyle}
                  >
                    {ORBITAL_PLANETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          <label style={{ display: 'block', marginTop: '0.75rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Display scale</span>
            <select
              value={params.scaleMode}
              onChange={(e) => setParams({ scaleMode: e.target.value as typeof params.scaleMode })}
              style={selectStyle}
            >
              <option value="schematic">Schematic spacing (readable orbits)</option>
              <option value="true">True ecliptic distances (AU)</option>
            </select>
          </label>
          <ScaleEducationCallout scaleMode={params.scaleMode} />

          {error && <p className="error">{error}</p>}
        </div>
      }
      simulation={
        <div>
          {!error ? (
            <>
              <SolarSystemCanvas positions={positions} title={title} scaleMode={params.scaleMode} />
              {params.mode === 'animate' && animationMeta && animationMeta.frames > 0 && (
                <PlaybackControls
                  playing={playing}
                  time={animIndex}
                  duration={Math.max(animationMeta.frames - 1, 0)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onRestart={() => {
                    setAnimIndex(0);
                    setPlaying(false);
                  }}
                  onScrub={(index) => {
                    setAnimIndex(Math.round(index));
                    setPlaying(false);
                  }}
                />
              )}
              {params.mode === 'animate' && animationMeta && animationMeta.frames === 0 && (
                <p className="error">No frames in this range — widen the end date or reduce the step.</p>
              )}
              {params.mode === 'alignment' && searching && (
                <p className="muted" style={{ textAlign: 'center', marginTop: '0.75rem' }}>Searching…</p>
              )}
            </>
          ) : (
            <p className="muted">Fix the date inputs to render the solar system.</p>
          )}
        </div>
      }
      results={
        !error ? (
          <PlanetCalendarResults positions={positions} highlightId={highlight} footer={resultsFooter} />
        ) : (
          <p className="muted">Results appear when inputs are valid.</p>
        )
      }
      tabs={<PlanetCalendarTabs scaleMode={params.scaleMode} alignmentMetric={params.alignmentMetric} />}
    />
  );
}
