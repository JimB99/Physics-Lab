import { useEffect, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
}

interface UPlotChartProps {
  title: string;
  xLabel: string;
  yLabel: string;
  xData: number[];
  series: ChartSeries[];
  height?: number;
}

const AXIS_COLOR = '#8b9cb3';
const GRID_COLOR = 'rgba(139, 156, 179, 0.18)';

export function UPlotChart({ title, xLabel, yLabel, xData, series, height = 360 }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  const shapeKey = useMemo(
    () =>
      JSON.stringify({
        title,
        xLabel,
        yLabel,
        height,
        series: series.map((s) => [s.label, s.color]),
      }),
    [title, xLabel, yLabel, height, series],
  );

  const dataRef = useRef<uPlot.AlignedData>([xData, ...series.map((s) => s.data)] as uPlot.AlignedData);
  dataRef.current = [xData, ...series.map((s) => s.data)] as uPlot.AlignedData;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: uPlot.Options = {
      width: container.clientWidth || 400,
      height,
      title,
      cursor: { drag: { x: true, y: false } },
      series: [
        { label: xLabel },
        ...series.map((s) => ({ label: s.label, stroke: s.color, width: 2 })),
      ],
      axes: [
        { label: xLabel, stroke: AXIS_COLOR, grid: { stroke: GRID_COLOR, width: 1 }, ticks: { stroke: GRID_COLOR } },
        { label: yLabel, stroke: AXIS_COLOR, grid: { stroke: GRID_COLOR, width: 1 }, ticks: { stroke: GRID_COLOR } },
      ],
      scales: { x: { time: false } },
    };

    plotRef.current = new uPlot(options, dataRef.current, container);

    const observer = new ResizeObserver(() => {
      if (plotRef.current && container.clientWidth > 0) {
        plotRef.current.setSize({ width: container.clientWidth, height });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey]);

  useEffect(() => {
    plotRef.current?.setData(dataRef.current);
  }, [xData, series]);

  if (xData.length === 0) {
    return <p className="muted">No data to plot.</p>;
  }

  return <div ref={containerRef} style={{ minHeight: height }} />;
}
