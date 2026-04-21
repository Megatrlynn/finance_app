import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface SparkPoint {
  label: string
  value: number
}

interface MiniSparklineProps {
  data: SparkPoint[]
  stroke?: string
}

export function MiniSparkline({ data, stroke = '#10b981' }: MiniSparklineProps) {
  return (
    <div className="h-9 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
