import { db } from '@/db'
import { expenses, sales, crops, fields, harvests } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq, or, sql } from 'drizzle-orm'

export const getReportData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const userId = session.user.id

    // Get total expenses for user
    const expenseResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.totalCost}), 0)`,
      })
      .from(expenses)
      .leftJoin(crops, eq(expenses.cropId, crops.id))
      .leftJoin(fields, or(eq(expenses.fieldId, fields.id), eq(crops.fieldId, fields.id)))
      .where(eq(fields.userId, userId))

    // Get total revenue for user
    const revenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales)
      .innerJoin(harvests, eq(sales.harvestId, harvests.id))
      .innerJoin(crops, eq(harvests.cropId, crops.id))
      .innerJoin(fields, eq(crops.fieldId, fields.id))
      .where(eq(fields.userId, userId))

    // Get expenses by category for user
    const expensesByCategory = await db
      .select({
        category: expenses.category,
        total: sql<number>`SUM(${expenses.totalCost})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .leftJoin(crops, eq(expenses.cropId, crops.id))
      .leftJoin(fields, or(eq(expenses.fieldId, fields.id), eq(crops.fieldId, fields.id)))
      .where(eq(fields.userId, userId))
      .groupBy(expenses.category)
      .orderBy(sql`SUM(${expenses.totalCost}) DESC`)

    // Get recent expenses (last 5) for user
    const recentExpenses = await db
      .select({
        id: expenses.id,
        category: expenses.category,
        item: expenses.item,
        totalCost: expenses.totalCost,
        purchasedOn: expenses.purchasedOn,
      })
      .from(expenses)
      .leftJoin(crops, eq(expenses.cropId, crops.id))
      .leftJoin(fields, or(eq(expenses.fieldId, fields.id), eq(crops.fieldId, fields.id)))
      .where(eq(fields.userId, userId))
      .orderBy(sql`${expenses.purchasedOn} DESC`)
      .limit(5)

    // Get recent sales (last 5) for user
    const recentSales = await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        soldOn: sales.soldOn,
        buyer: sales.buyer,
      })
      .from(sales)
      .innerJoin(harvests, eq(sales.harvestId, harvests.id))
      .innerJoin(crops, eq(harvests.cropId, crops.id))
      .innerJoin(fields, eq(crops.fieldId, fields.id))
      .where(eq(fields.userId, userId))
      .orderBy(sql`${sales.soldOn} DESC`)
      .limit(5)

    const totalExpenses = expenseResult[0]?.total ?? 0
    const totalRevenue = revenueResult[0]?.total ?? 0
    const profit = totalRevenue - totalExpenses

    console.log('📊 Report data fetched for user:', userId)
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
