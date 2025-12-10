import { db } from '@/db'
import { expenses, sales } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'

export const getReportData = createServerFn({ method: 'GET' }).handler(
  async () => {
    // Get total expenses
    const expenseResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.totalCost}), 0)`,
      })
      .from(expenses)

    // Get total revenue
    const revenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales)

    // Get expenses by category
    const expensesByCategory = await db
      .select({
        category: expenses.category,
        total: sql<number>`SUM(${expenses.totalCost})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .groupBy(expenses.category)
      .orderBy(sql`SUM(${expenses.totalCost}) DESC`)

    // Get recent expenses (last 5)
    const recentExpenses = await db
      .select({
        id: expenses.id,
        category: expenses.category,
        item: expenses.item,
        totalCost: expenses.totalCost,
        purchasedOn: expenses.purchasedOn,
      })
      .from(expenses)
      .orderBy(sql`${expenses.purchasedOn} DESC`)
      .limit(5)

    // Get recent sales (last 5)
    const recentSales = await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        soldOn: sales.soldOn,
        buyer: sales.buyer,
      })
      .from(sales)
      .orderBy(sql`${sales.soldOn} DESC`)
      .limit(5)

    const totalExpenses = expenseResult[0]?.total ?? 0
    const totalRevenue = revenueResult[0]?.total ?? 0
    const profit = totalRevenue - totalExpenses

    console.log('📊 Report data fetched')
    return {
      totalExpenses,
      totalRevenue,
      profit,
      expensesByCategory,
      recentExpenses,
      recentSales,
    }
  },
)

export const reportQueryOptions = () =>
  queryOptions({
    queryKey: ['report'],
    queryFn: () => getReportData(),
  })

