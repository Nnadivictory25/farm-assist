import { db } from '@/db'
import { crops, expenses, fields, harvests, sales } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'

export const getStats = createServerFn({ method: 'GET' }).handler(
    async () => {
        const [stats] = await db
            .select({
                fieldCount: sql<number>`(select count(*) from ${fields})`,
                cropCount: sql<number>`(select count(*) from ${crops})`,
                harvestCount: sql<number>`(select count(*) from ${harvests})`,
                totalExpenses: sql<number>`(select coalesce(sum(${expenses.totalCost}), 0) from ${expenses})`,
                totalRevenue: sql<number>`(select coalesce(sum(${sales.totalAmount}), 0) from ${sales})`,
            })
            .from(sql`(select 1)`)

        const revenue = stats?.totalRevenue ?? 0
        const expensesTotal = stats?.totalExpenses ?? 0

        console.log('📊 Dashboard data fetched:', stats)

        return {
            fieldCount: stats?.fieldCount ?? 0,
            cropCount: stats?.cropCount ?? 0,
            harvestCount: stats?.harvestCount ?? 0,
            totalExpenses: expensesTotal,
            totalRevenue: revenue,
            profit: revenue - expensesTotal,
        }
    },
)

export const statsQueryOptions = () =>
    queryOptions({
        queryKey: ['stats'],
        queryFn: () => getStats(),
    })
