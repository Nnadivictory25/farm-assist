import { db } from '@/db'
import { crops, expenses, fields, harvests, sales } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { sql } from 'drizzle-orm'

export const getStats = createServerFn({ method: 'GET' }).handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const userId = session.user.id

    // Get stats using separate queries to avoid ambiguous column references
    const [fieldCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(fields)
        .where(sql`${fields.userId} = ${userId}`)

    const [cropCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(crops)
        .innerJoin(fields, sql`${crops.fieldId} = ${fields.id}`)
        .where(sql`${fields.userId} = ${userId}`)

    const [harvestCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(harvests)
        .innerJoin(crops, sql`${harvests.cropId} = ${crops.id}`)
        .innerJoin(fields, sql`${crops.fieldId} = ${fields.id}`)
        .where(sql`${fields.userId} = ${userId}`)

    // Calculate total expenses by combining expenses from crops and direct field expenses
    const [cropExpenses] = await db
        .select({ sum: sql<number>`coalesce(sum(${expenses.totalCost}), 0)` })
        .from(expenses)
        .innerJoin(crops, sql`${expenses.cropId} = ${crops.id}`)
        .innerJoin(fields, sql`${crops.fieldId} = ${fields.id}`)
        .where(sql`${fields.userId} = ${userId}`)

    const [directFieldExpenses] = await db
        .select({ sum: sql<number>`coalesce(sum(${expenses.totalCost}), 0)` })
        .from(expenses)
        .innerJoin(fields, sql`${expenses.fieldId} = ${fields.id}`)
        .where(sql`${fields.userId} = ${userId} and ${expenses.cropId} is null`)

    const totalExpensesValue =
        (cropExpenses?.sum ?? 0) + (directFieldExpenses?.sum ?? 0)

    const [totalRevenue] = await db
        .select({ sum: sql<number>`coalesce(sum(${sales.totalAmount}), 0)` })
        .from(sales)
        .innerJoin(harvests, sql`${sales.harvestId} = ${harvests.id}`)
        .innerJoin(crops, sql`${harvests.cropId} = ${crops.id}`)
        .innerJoin(fields, sql`${crops.fieldId} = ${fields.id}`)
        .where(sql`${fields.userId} = ${userId}`)

    const stats = {
        fieldCount: fieldCount?.count ?? 0,
        cropCount: cropCount?.count ?? 0,
        harvestCount: harvestCount?.count ?? 0,
        totalExpenses: totalExpensesValue,
        totalRevenue: totalRevenue?.sum ?? 0,
    }

    const revenue = stats?.totalRevenue ?? 0
    const expensesTotal = stats?.totalExpenses ?? 0

    console.log('📊 Dashboard data fetched for user:', userId, stats)

    return {
        fieldCount: stats?.fieldCount ?? 0,
        cropCount: stats?.cropCount ?? 0,
        harvestCount: stats?.harvestCount ?? 0,
        totalExpenses: expensesTotal,
        totalRevenue: revenue,
        profit: revenue - expensesTotal,
    }
})

export const statsQueryOptions = () =>
    queryOptions({
        queryKey: ['stats'],
        queryFn: () => getStats(),
    })
