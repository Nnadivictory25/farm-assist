import { eq, sql, sum } from 'drizzle-orm'
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
  const [
    fieldCount,
    cropCount,
    harvestCount,
    cropExpensesResult,
    directExpensesResult,
    revenueResult,
  ] = await Promise.all([
    // Count queries
    db.$count(fields, eq(fields.userId, userId)),
    db.$count(
      crops,
      sql`EXISTS (
            SELECT 1 FROM ${fields} WHERE ${fields.id} = ${crops.fieldId} AND ${fields.userId} = ${userId}
        )`,
    ),
    db.$count(
      harvests,
      sql`EXISTS (
            SELECT 1 FROM ${crops}
            INNER JOIN ${fields} ON ${crops.fieldId} = ${fields.id}
            WHERE ${harvests.cropId} = ${crops.id} AND ${fields.userId} = ${userId}
        )`,
    ),

    // Expense calculations
    db
      .select({ total: sum(expenses.totalCost) })
      .from(expenses)
      .innerJoin(crops, eq(expenses.cropId, crops.id))
      .innerJoin(fields, eq(crops.fieldId, fields.id))
      .where(eq(fields.userId, userId)),

    db
      .select({ total: sum(expenses.totalCost) })
      .from(expenses)
      .innerJoin(fields, eq(expenses.fieldId, fields.id))
      .where(sql`${fields.userId} = ${userId} AND ${expenses.cropId} IS NULL`),

    // Revenue calculation
    db
      .select({ total: sum(sales.totalAmount) })
      .from(sales)
      .innerJoin(harvests, eq(sales.harvestId, harvests.id))
      .innerJoin(crops, eq(harvests.cropId, crops.id))
      .innerJoin(fields, eq(crops.fieldId, fields.id))
      .where(eq(fields.userId, userId)),
  ])

  const totalExpenses =
    Number(cropExpensesResult[0]?.total ?? 0) +
    Number(directExpensesResult[0]?.total ?? 0)
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
