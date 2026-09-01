import { findBestAlignment, findClosestPair } from 'physics-engine';
import type {
  AlignmentMetric,
  AlignmentSearchResult,
  DisplayScaleMode,
  OrbitalPlanetId,
  PairConjunctionResult,
} from 'physics-engine';

export interface AlignmentRequest {
  requestId: number;
  startMs: number;
  endMs: number;
  metric: AlignmentMetric;
  scaleMode: DisplayScaleMode;
  pairA: OrbitalPlanetId;
  pairB: OrbitalPlanetId;
}

export interface AlignmentResponse {
  requestId: number;
  alignment: AlignmentSearchResult | null;
  pair: PairConjunctionResult | null;
  error?: string;
}

self.onmessage = (event: MessageEvent<AlignmentRequest>) => {
  const request = event.data;
  const start = new Date(request.startMs);
  const end = new Date(request.endMs);

  try {
    const alignment = findBestAlignment(start, end, request.metric, request.scaleMode);
    const pair =
      request.pairA === request.pairB
        ? null
        : findClosestPair(request.pairA, request.pairB, start, end, request.scaleMode);
    const response: AlignmentResponse = { requestId: request.requestId, alignment, pair };
    self.postMessage(response);
  } catch (error) {
    const response: AlignmentResponse = {
      requestId: request.requestId,
      alignment: null,
      pair: null,
      error: error instanceof Error ? error.message : 'Search failed',
    };
    self.postMessage(response);
  }
};
