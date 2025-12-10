import { eq, sum } from 'drizzle-orm'
import { db } from '@/db'
import { crops, expenses, fields, harvests, sales } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const getStats = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  // Run all independent queries in parallel for better performance
  const [fieldCount, cropCount, harvestCount, expensesResult, revenueResult] =
    await Promise.all([
      // Count queries
      db.$count(fields, eq(fields.userId, userId)),
      db.$count(crops, eq(crops.userId, userId)),
      db.$count(harvests, eq(harvests.userId, userId)),

      // Expense calculations
      db
        .select({ total: sum(expenses.totalCost) })
        .from(expenses)
        .where(eq(expenses.userId, userId)),

      // Revenue calculation
      db
        .select({ total: sum(sales.totalAmount) })
        .from(sales)
        .where(eq(sales.userId, userId)),
    ])

  const totalExpenses = Number(expensesResult[0]?.total ?? 0)
  const totalRevenue = Number(revenueResult[0]?.total ?? 0)

  const stats = {
    fieldCount,
    cropCount,
    harvestCount,
    totalExpenses,
    totalRevenue,
  }

  console.log('📊 Dashboard data fetched for user:', userId, stats)

  return {
    fieldCount: stats.fieldCount,
    cropCount: stats.cropCount,
    harvestCount: stats.harvestCount,
    totalExpenses: stats.totalExpenses,
    totalRevenue: stats.totalRevenue,
    profit: Number(stats.totalRevenue) - Number(stats.totalExpenses),
  }
})

export const statsQueryOptions = () =>
  queryOptions({
    queryKey: ['stats'],
    queryFn: () => getStats(),
  })
