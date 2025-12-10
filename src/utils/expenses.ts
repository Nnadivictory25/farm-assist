import { db } from '@/db'
import { expenses, crops, fields } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, desc, eq } from 'drizzle-orm'

export const getExpenses = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get expenses that belong to the user - now simple with direct userId filter
    const data = await db
      .select({
        id: expenses.id,
        category: expenses.category,
        item: expenses.item,
        quantity: expenses.quantity,
        unit: expenses.unit,
        costPerUnit: expenses.costPerUnit,
        totalCost: expenses.totalCost,
        purchasedOn: expenses.purchasedOn,
        season: expenses.season,
        notes: expenses.notes,
        cropId: expenses.cropId,
        cropName: crops.name,
        fieldId: expenses.fieldId,
        fieldName: fields.name,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(crops, eq(expenses.cropId, crops.id))
      .leftJoin(fields, eq(expenses.fieldId, fields.id))
      .where(eq(expenses.userId, session.user.id))
      .orderBy(desc(expenses.purchasedOn))

    console.log(
      '💸 Expenses fetched for user:',
      session.user.id,
      '- Count:',
      data.length,
    )
    return data
  },
)

export const expensesQueryOptions = () =>
  queryOptions({
    queryKey: ['expenses'],
    queryFn: () => getExpenses(),
  })

type AddExpenseInput = {
  category: string
  item: string
  totalCost: number
  purchasedOn: string
  season: string
  cropId?: number
  fieldId?: number
  quantity?: number
  unit?: string
  costPerUnit?: number
  notes?: string
}

export const addExpense = createServerFn({ method: 'POST' })
  .inputValidator((data: AddExpenseInput) => data)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Verify crop/field belongs to user if provided
    if (data.cropId) {
      const [crop] = await db
        .select()
        .from(crops)
        .innerJoin(fields, eq(crops.fieldId, fields.id))
        .where(
          and(eq(crops.id, data.cropId), eq(fields.userId, session.user.id)),
        )

      if (!crop) {
        throw new Error('Crop not found or unauthorized')
      }
    }

    if (data.fieldId) {
      const [field] = await db
        .select()
        .from(fields)
        .where(
          and(eq(fields.id, data.fieldId), eq(fields.userId, session.user.id)),
        )

      if (!field) {
        throw new Error('Field not found or unauthorized')
      }
    }

    const [newExpense] = await db
      .insert(expenses)
      .values({
        userId: session.user.id,
        category: data.category,
        item: data.item,
        totalCost: data.totalCost,
        purchasedOn: data.purchasedOn,
        season: data.season,
        cropId: data.cropId,
        fieldId: data.fieldId,
        quantity: data.quantity,
        unit: data.unit,
        costPerUnit: data.costPerUnit,
        notes: data.notes,
      })
      .returning()

    console.log(
      '✅ Expense added for user:',
      session.user.id,
      '- Item:',
      newExpense.item,
    )
    return newExpense
  })

export const deleteExpense = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Only delete expenses linked to user's crops/fields
    await db.delete(expenses).where(eq(expenses.id, id))

    console.log(
      '🗑️ Expense deleted for user:',
      session.user.id,
      '- Expense ID:',
      id,
    )
    return { success: true }
  })

export const EXPENSE_CATEGORIES = [
  'Seeds',
  'Fertilizer',
  'Pesticides',
  'Labor',
  'Equipment',
  'Fuel',
  'Transport',
  'Storage',
  'Other',
] as const

export const CATEGORY_ICONS: Record<string, string> = {
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
