import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { reportQueryOptions } from '@/utils/reports'
import { formatCurrency, formatDate } from '@/utils/format'
import { authMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/dashboard/reports')({
  component: ReportsPage,
  server: {
    middleware: [authMiddleware],
  },
})

const CATEGORY_ICONS: Record<string, string> = {
  Seeds: '🌱',
  Fertilizer: '🧪',
  Pesticides: '🐛',
  Labor: '👷',
  Equipment: '🚜',
  Fuel: '⛽',
  Transport: '🚚',
  Storage: '📦',
  Other: '📋',
}

function ReportsPage() {
  const { data, isLoading } = useQuery(reportQueryOptions())

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 h-48 bg-muted rounded-3xl animate-pulse" />
          <div className="h-32 bg-muted rounded-3xl animate-pulse" />
          <div className="h-32 bg-muted rounded-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  const { totalExpenses, totalRevenue, profit, expensesByCategory, recentExpenses, recentSales } =
    data ?? {
      totalExpenses: 0,
      totalRevenue: 0,
      profit: 0,
      expensesByCategory: [],
      recentExpenses: [],
      recentSales: [],
    }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Financial overview of your farm</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Main Profit Card */}
        <div className="col-span-2 bg-gradient-to-br from-green-800 via-green-700 to-green-600 rounded-3xl shadow-lg p-7 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-green-100 text-sm font-medium uppercase tracking-wider mb-2 opacity-90">
              Net Profit
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {formatCurrency(profit)}
            </h2>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-green-50/90">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                {profit >= 0 ? '✓ Profitable' : '⚠ Loss'}
              </span>
              <span className="opacity-75">{new Date().getFullYear()} Season</span>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-3 opacity-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-16 h-16 text-emerald-900"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v5.69a.75.75 0 001.5 0v-5.69l1.72 1.72a.75.75 0 101.06-1.06l-3-3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide">
              Revenue
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-700 break-words">
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-red-50 rounded-3xl p-5 border border-red-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-3 opacity-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-16 h-16 text-red-900"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-.53 14.03a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V8.25a.75.75 0 00-1.5 0v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200" />
            <p className="text-xs text-red-800 font-bold uppercase tracking-wide">
              Expenses
            </p>
          </div>
          <p className="text-2xl font-bold text-red-700 break-words">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      {/* Expenses by Category */}
      {expensesByCategory.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Expenses by Category
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {expensesByCategory.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">
                    {CATEGORY_ICONS[cat.category] ?? '📋'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cat.category}</p>
                    <p className="text-xs text-gray-500">
                      {cat.count} expense{cat.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-red-600">
                  {formatCurrency(cat.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Recent Expenses
          </h3>
          {recentExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <p className="text-gray-400">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                      {CATEGORY_ICONS[expense.category] ?? '📋'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {expense.item}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(expense.purchasedOn)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-red-600 text-sm">
                    -{formatCurrency(expense.totalCost)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Sales</h3>
          {recentSales.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <p className="text-gray-400">No sales recorded yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                      💰
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {sale.buyer || 'Sale'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(sale.soldOn)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-600 text-sm">
                    +{formatCurrency(sale.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

