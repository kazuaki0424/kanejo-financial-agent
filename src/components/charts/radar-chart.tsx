'use client';

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts';

interface RadarDataPoint {
  label: string;
  value: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
}

export function RadarChart({ data }: RadarChartProps): React.ReactElement {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--color-ink-muted)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 'dataMax']}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="スコア"
            dataKey="value"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
