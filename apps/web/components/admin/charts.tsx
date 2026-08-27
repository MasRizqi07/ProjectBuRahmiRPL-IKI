'use client'

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export const revenueData = [
  { month: 'Jan', revenue: 8400000 },
  { month: 'Feb', revenue: 12100000 },
  { month: 'Mar', revenue: 9800000 },
  { month: 'Apr', revenue: 15300000 },
  { month: 'May', revenue: 18200000 },
  { month: 'Jun', revenue: 20500000 },
]

export const salesByConcert = [
  { name: 'Coldplay', value: 9200000 },
  { name: 'BLACKPINK', value: 8800000 },
  { name: 'Dewa 19', value: 4200000 },
  { name: 'Pamungkas', value: 2500000 },
  { name: 'Rich Brian', value: 5800000 },
  { name: 'Tulus', value: 3600000 },
]

export function AdminCharts() {
  return (
    <>
      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="font-display font-bold text-foreground mb-4">Revenue 6 Bulan Terakhir</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#fbbf24"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Distribution Pie */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="font-display font-bold text-foreground mb-4">Distribusi Penjualan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Terjual', value: 35000 },
                  { name: 'Tersedia', value: 18000 },
                  { name: 'Terkunci', value: 8500 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell key="terjual" fill="#fbbf24" />
                <Cell key="tersedia" fill="#71717a" />
                <Cell key="terkunci" fill="#52525b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by Concert Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-display font-bold text-foreground mb-4">Penjualan per Konser</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesByConcert}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#71717a" />
            <YAxis stroke="#71717a" />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
              labelStyle={{ color: '#fafafa' }}
              formatter={(value) => `Rp ${(value as number).toLocaleString('id-ID')}`}
            />
            <Bar dataKey="value" fill="#fbbf24" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

export default AdminCharts
