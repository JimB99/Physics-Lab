import { useEffect, useRef } from 'react';
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

export function UPlotChart({ title, xLabel, yLabel, xData, series, height = 220 }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current || xData.length === 0) return;

    const width = containerRef.current.clientWidth || 400;

    if (plotRef.current) {
      plotRef.current.destroy();
    }

    plotRef.current = new uPlot(
      {
        width,
        height,
        title,
        series: [
          { label: xLabel },
          ...series.map((s) => ({
            label: s.label,
            stroke: s.color,
            width: 2,
          })),
        ],
        axes: [
          { label: xLabel },
          { label: yLabel },
        ],
        scales: { x: { time: false } },
      },
      [xData, ...series.map((s) => s.data)],
      containerRef.current,
    );

    const onResize = () => {
      if (containerRef.current && plotRef.current) {
        plotRef.current.setSize({ width: containerRef.current.clientWidth, height });
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [title, xLabel, yLabel, xData, series, height]);

  if (xData.length === 0) {
    return <p className="muted">No data to plot.</p>;
  }

  return <div ref={containerRef} />;
}
