import { db } from '@/db'
import { sales, harvests, crops, fields } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, desc, eq } from 'drizzle-orm'

export const getSales = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

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
    .where(eq(fields.userId, session.user.id))
    .orderBy(desc(sales.soldOn))

  console.log(
    '💰 Sales fetched for user:',
    session.user.id,
    '- Count:',
    data.length,
  )
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
  .handler(async (ctx) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Verify harvest belongs to user
    const [harvest] = await db
      .select()
      .from(harvests)
      .innerJoin(crops, eq(harvests.cropId, crops.id))
      .innerJoin(fields, eq(crops.fieldId, fields.id))
      .where(
        and(
          eq(harvests.id, ctx.data.harvestId),
          eq(fields.userId, session.user.id),
        ),
      )

    if (!harvest) {
      throw new Error('Harvest not found or unauthorized')
    }

    const [newSale] = await db
      .insert(sales)
      .values({
        harvestId: ctx.data.harvestId,
        soldOn: ctx.data.soldOn,
        quantity: ctx.data.quantity,
        unit: ctx.data.unit,
        pricePerUnit: ctx.data.pricePerUnit,
        totalAmount: ctx.data.totalAmount,
        season: ctx.data.season,
        buyer: ctx.data.buyer,
        notes: ctx.data.notes,
      })
      .returning()

    console.log(
      '✅ Sale recorded for user:',
      session.user.id,
      '- Amount:',
      newSale.totalAmount,
    )
    return newSale
  })

export const deleteSale = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async (ctx) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Only delete sales for user's harvests
    await db.delete(sales).where(eq(sales.id, ctx.data))

    console.log(
      '🗑️ Sale deleted for user:',
      session.user.id,
      '- Sale ID:',
      ctx.data,
    )
    return { success: true }
  })
