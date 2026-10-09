import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface NutritionPieChartProps {
  pieData: Array<{ name: string; value: number; color: string }>;
}

export default function NutritionPieChart({ pieData }: NutritionPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
          }}
          formatter={(value, name) => {
            const total = pieData.reduce(
              (a: number, b: { value: number }) => a + b.value,
              0,
            );
            return [
              `${Number(value).toFixed(0)} kcal (${((Number(value) / total) * 100).toFixed(1)}%)`,
              name,
            ];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
