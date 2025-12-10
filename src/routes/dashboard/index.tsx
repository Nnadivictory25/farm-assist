import { Card, CardContent } from '@/components/ui/card'
import { authMiddleware } from '@/middleware/auth'
import { statsQueryOptions } from '@/utils/dashboard'
import { formatCurrency } from '@/utils/format'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Leaf,
  MapPin,
  Package,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
  server: {
    middleware: [authMiddleware],
  },
})

function DashboardHome() {
  const { data: stats } = useSuspenseQuery(statsQueryOptions())

  const statCards = [
    {
      title: 'Total Fields',
      value: stats?.fieldCount ?? 0,
      icon: MapPin,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Crops',
      value: stats?.cropCount ?? 0,
      icon: Leaf,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Harvests',
      value: stats?.harvestCount ?? 0,
      icon: Package,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats?.totalExpenses ?? 0),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats?.profit ?? 0),
      icon: Wallet,
      color: (stats?.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: (stats?.profit ?? 0) >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your farm operations
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="py-3 shadow-none">
            <CardContent className="flex items-center justify-between py-0">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p
                  className={`text-xl font-bold ${stat.title === 'Net Profit' ? stat.color : ''}`}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
