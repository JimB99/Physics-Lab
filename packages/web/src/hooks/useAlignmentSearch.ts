import { useEffect, useRef, useState } from 'react';
import { findBestAlignment, findClosestPair } from 'physics-engine';
import type {
  AlignmentMetric,
  AlignmentSearchKind,
  AlignmentSearchResult,
  DisplayScaleMode,
  OrbitalPlanetId,
  PairConjunctionResult,
} from 'physics-engine';
import type { AlignmentRequest, AlignmentResponse } from '../workers/alignment.worker';

export interface AlignmentSearchState {
  searching: boolean;
  alignment: AlignmentSearchResult | null;
  pair: PairConjunctionResult | null;
  error: string | null;
}

interface UseAlignmentSearchOptions {
  enabled: boolean;
  start: Date;
  endExclusive: Date;
  metric: AlignmentMetric;
  scaleMode: DisplayScaleMode;
  searchKind: AlignmentSearchKind;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

const IDLE: AlignmentSearchState = { searching: false, alignment: null, pair: null, error: null };

export function useAlignmentSearch(options: UseAlignmentSearchOptions): AlignmentSearchState {
  const { enabled, start, endExclusive, metric, scaleMode, searchKind, pairA, pairB } = options;
  const [state, setState] = useState<AlignmentSearchState>(IDLE);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const startMs = start.getTime();
  const endMs = endExclusive.getTime();

  useEffect(() => {
    if (!enabled) {
      setState(IDLE);
      return;
    }

    const requestId = ++requestIdRef.current;
    setState({ searching: true, alignment: null, pair: null, error: null });

    if (typeof Worker === 'undefined') {
      try {
        const alignment =
          searchKind === 'cluster'
            ? findBestAlignment(new Date(startMs), new Date(endMs), metric, scaleMode)
            : null;
        const pair =
          searchKind === 'pair' && pairA !== pairB
            ? findClosestPair(pairA, pairB, new Date(startMs), new Date(endMs), scaleMode)
            : null;
        setState({ searching: false, alignment, pair, error: null });
      } catch (error) {
        setState({
          searching: false,
          alignment: null,
          pair: null,
          error: error instanceof Error ? error.message : 'Search failed',
        });
      }
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/alignment.worker.ts', import.meta.url), {
        type: 'module',
      });
    }

    const worker = workerRef.current;
    const onMessage = (event: MessageEvent<AlignmentResponse>) => {
      if (event.data.requestId !== requestIdRef.current) return;
      setState({
        searching: false,
        alignment: event.data.alignment,
        pair: event.data.pair,
        error: event.data.error ?? null,
      });
    };
    worker.addEventListener('message', onMessage);

    const request: AlignmentRequest = {
      requestId,
      startMs,
      endMs,
      metric,
      scaleMode,
      searchKind,
      pairA,
      pairB,
    };
    worker.postMessage(request);

    return () => {
      worker.removeEventListener('message', onMessage);
    };
  }, [enabled, startMs, endMs, metric, scaleMode, searchKind, pairA, pairB]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  return state;
}
