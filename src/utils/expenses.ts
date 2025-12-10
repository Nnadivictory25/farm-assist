import { db } from '@/db'
import { expenses, crops, fields } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export const getExpenses = createServerFn({ method: 'GET' }).handler(
  async () => {
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
      .orderBy(desc(expenses.purchasedOn))

    console.log('💸 Expenses fetched:', data.length)
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
    const [newExpense] = await db
      .insert(expenses)
      .values({
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

    console.log('✅ Expense added:', newExpense.item)
    return newExpense
  })

export const deleteExpense = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(expenses).where(eq(expenses.id, id))
    console.log('🗑️ Expense deleted:', id)
    return { success: true }
  })

// Common expense categories
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

