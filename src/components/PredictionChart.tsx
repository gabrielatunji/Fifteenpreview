import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface PredictionChartProps {
  compact?: boolean;
  volume?: string;
}

export function PredictionChart({ compact = false, volume = "$250.88k" }: PredictionChartProps) {
  const data = [
    { time: "16:00", value: 4100 },
    { time: "17:00", value: 4200 },
    { time: "18:00", value: 4150 },
    { time: "19:00", value: 4300 },
    { time: "20:00", value: 4250 },
    { time: "21:00", value: 4400 },
    { time: "22:00", value: 4200 },
    { time: "23:00", value: 4250 }
  ];

  return (
    <div className="relative">
      <div className="absolute top-0 left-0 text-xs text-gray-400 z-10">
        vol: {volume}
      </div>
      <ResponsiveContainer width="100%" height={compact ? 120 : 300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3D6734" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3D6734" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3D6734"
            strokeWidth={2}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}