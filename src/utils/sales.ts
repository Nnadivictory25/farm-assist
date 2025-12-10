import { db } from '@/db'
import { sales, harvests, crops, fields } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export const getSales = createServerFn({ method: 'GET' }).handler(async () => {
  const data = await db
    .select({
      id: sales.id,
      soldOn: sales.soldOn,
      buyer: sales.buyer,
      quantity: sales.quantity,
      unit: sales.unit,
      pricePerUnit: sales.pricePerUnit,
      totalAmount: sales.totalAmount,
      season: sales.season,
      notes: sales.notes,
      harvestId: sales.harvestId,
      cropName: crops.name,
      fieldName: fields.name,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .innerJoin(harvests, eq(sales.harvestId, harvests.id))
    .innerJoin(crops, eq(harvests.cropId, crops.id))
    .leftJoin(fields, eq(crops.fieldId, fields.id))
    .orderBy(desc(sales.soldOn))

  console.log('💰 Sales fetched:', data.length)
  return data
})

export const salesQueryOptions = () =>
  queryOptions({
    queryKey: ['sales'],
    queryFn: () => getSales(),
  })

type AddSaleInput = {
  harvestId: number
  soldOn: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalAmount: number
  season: string
  buyer?: string
  notes?: string
}

export const addSale = createServerFn({ method: 'POST' })
  .inputValidator((data: AddSaleInput) => data)
  .handler(async ({ data }) => {
    const [newSale] = await db
      .insert(sales)
      .values({
        harvestId: data.harvestId,
        soldOn: data.soldOn,
        quantity: data.quantity,
        unit: data.unit,
        pricePerUnit: data.pricePerUnit,
        totalAmount: data.totalAmount,
        season: data.season,
        buyer: data.buyer,
        notes: data.notes,
      })
      .returning()

    console.log('✅ Sale recorded:', newSale.totalAmount)
    return newSale
  })

export const deleteSale = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(sales).where(eq(sales.id, id))
    console.log('🗑️ Sale deleted:', id)
    return { success: true }
  })

