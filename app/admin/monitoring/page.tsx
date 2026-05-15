'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Circle, AlertCircle } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const queueMetricsData = [
  { time: '00:00', depth: 150 },
  { time: '05:00', depth: 280 },
  { time: '10:00', depth: 450 },
  { time: '15:00', depth: 320 },
  { time: '20:00', depth: 680 },
  { time: '25:00', depth: 520 },
  { time: '30:00', depth: 380 },
  { time: '35:00', depth: 250 },
  { time: '40:00', depth: 150 },
  { time: '45:00', depth: 420 },
  { time: '50:00', depth: 580 },
  { time: '55:00', depth: 450 },
  { time: '60:00', depth: 320 },
]

const alertLog = [
  {
    id: 1,
    timestamp: '2024-06-20 14:32:15',
    severity: 'ERROR',
    service: 'Payment Service',
    message: 'Database connection timeout',
  },
  {
    id: 2,
    timestamp: '2024-06-20 14:28:02',
    severity: 'WARNING',
    service: 'Queue Service',
    message: 'High queue depth detected (1000+ users)',
  },
  {
    id: 3,
    timestamp: '2024-06-20 14:15:34',
    severity: 'INFO',
    service: 'API Gateway',
    message: 'Rate limit threshold 80% reached',
  },
  {
    id: 4,
    timestamp: '2024-06-20 14:02:11',
    severity: 'WARNING',
    service: 'Inventory Service',
    message: 'Low memory detected (85% usage)',
  },
  {
    id: 5,
    timestamp: '2024-06-20 13:45:22',
    severity: 'INFO',
    service: 'Database',
    message: 'Daily backup completed successfully',
  },
]

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  latency: number
  uptime: number
  lastChecked: string
}

export default function MonitoringPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Gateway',
      status: 'operational',
      latency: 45,
      uptime: 99.9,
      lastChecked: '2 menit lalu',
    },
    {
      name: 'Queue Service',
      status: 'operational',
      latency: 78,
      uptime: 99.8,
      lastChecked: '2 menit lalu',
    },
    {
      name: 'Inventory Service',
      status: 'degraded',
      latency: 156,
      uptime: 98.5,
      lastChecked: '1 menit lalu',
    },
    {
      name: 'Payment Service',
      status: 'operational',
      latency: 92,
      uptime: 99.9,
      lastChecked: '2 menit lalu',
    },
    {
      name: 'Database',
      status: 'operational',
      latency: 23,
      uptime: 99.95,
      lastChecked: '1 menit lalu',
    },
  ])

  // Simulate real-time latency updates
  useEffect(() => {
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((service) => ({
          ...service,
          latency: Math.max(10, service.latency + (Math.random() - 0.5) * 40),
          lastChecked: 'Sekarang',
        }))
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: 'operational' | 'degraded' | 'down') => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-500'
      case 'degraded':
        return 'bg-amber-500'
      case 'down':
        return 'bg-red-500'
    }
  }

  const getStatusLabel = (status: 'operational' | 'degraded' | 'down') => {
    switch (status) {
      case 'operational':
        return 'Operasional'
      case 'degraded':
        return 'Terdegradasi'
      case 'down':
        return 'Offline'
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }

  const overallStatus = services.every((s) => s.status === 'operational') ? 'operational' : 'degraded'

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground mb-2">System Status</h1>
              <p className="text-zinc-400">Monitoring kesehatan sistem real-time</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Circle size={12} className="fill-emerald-500 text-emerald-500" />
              <span className="font-semibold text-emerald-400">
                {overallStatus === 'operational' ? 'Semua Sistem Operasional' : 'Ada Masalah'}
              </span>
            </div>
          </div>

          {/* Service Status Cards */}
          <div>
            <h2 className="font-bold text-foreground mb-4">Status Layanan</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <div className="flex items-center gap-2">
                      <Circle size={10} className={`fill-current ${getStatusColor(service.status)}`} />
                      <span className="text-xs font-medium text-zinc-400">{getStatusLabel(service.status)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Latency</span>
                      <span className="font-mono text-amber-400">{Math.round(service.latency)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Uptime</span>
                      <span className="font-mono text-emerald-400">{service.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Last Check</span>
                      <span className="text-xs text-zinc-500">{service.lastChecked}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Queue Metrics Chart */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="font-bold text-foreground mb-4">Kedalaman Antrian (60 Menit Terakhir)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={queueMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#fafafa' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="depth"
                    stroke="#fbbf24"
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Inventory Stats */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="font-bold text-foreground mb-4">Inventaris Tiket</h2>
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
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#fbbf24" />
                    <Cell fill="#52525b" />
                    <Cell fill="#71717a" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-zinc-400">Terjual: 35.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  <span className="text-zinc-400">Tersedia: 18.000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <span className="text-zinc-400">Terkunci: 8.500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Log */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Alert Log
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">Timestamp</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">Severity</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">Service</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {alertLog.map((alert) => (
                    <tr
                      key={alert.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-xs text-zinc-500">{alert.timestamp}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getAlertColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-foreground font-semibold">{alert.service}</td>
                      <td className="py-3 px-3 text-zinc-400">{alert.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
