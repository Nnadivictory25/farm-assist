import { db } from '@/db'
import { harvests, crops, fields } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { getRequestHeaders } from '@tanstack/react-start/server'

export const getHarvests = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const data = await db
      .select({
        id: harvests.id,
        harvestedOn: harvests.harvestedOn,
        quantity: harvests.quantity,
        unit: harvests.unit,
        qualityGrade: harvests.qualityGrade,
        season: harvests.season,
        notes: harvests.notes,
        cropId: harvests.cropId,
        cropName: crops.name,
        fieldName: fields.name,
        createdAt: harvests.createdAt,
      })
      .from(harvests)
      .innerJoin(crops, eq(harvests.cropId, crops.id))
      .leftJoin(fields, eq(crops.fieldId, fields.id))
      .where(eq(harvests.userId, session.user.id))
      .orderBy(desc(harvests.harvestedOn))

    console.log(
      '🌾 Harvests fetched for user:',
      session.user.id,
      '- Count:',
      data.length,
    )
    return data
  },
)

export const harvestsQueryOptions = () =>
  queryOptions({
    queryKey: ['harvests'],
    queryFn: () => getHarvests(),
  })

type AddHarvestInput = {
  cropId: number
  harvestedOn: string
  quantity: number
  unit: string
  season: string
  qualityGrade?: string
  notes?: string
}

export const addHarvest = createServerFn({ method: 'POST' })
  .inputValidator((data: AddHarvestInput) => data)
  .handler(async (ctx) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Verify crop belongs to user
    const [crop] = await db
      .select()
      .from(crops)
      .innerJoin(fields, eq(crops.fieldId, fields.id))
      .where(
        and(eq(crops.id, ctx.data.cropId), eq(fields.userId, session.user.id)),
      )

    if (!crop) {
      throw new Error('Crop not found or unauthorized')
    }

    const [newHarvest] = await db
      .insert(harvests)
      .values({
        userId: session.user.id,
        cropId: ctx.data.cropId,
        harvestedOn: ctx.data.harvestedOn,
        quantity: ctx.data.quantity,
        unit: ctx.data.unit,
        season: ctx.data.season,
        qualityGrade: ctx.data.qualityGrade,
        notes: ctx.data.notes,
      })
      .returning()

    console.log(
      '✅ Harvest added for user:',
      session.user.id,
      '- Quantity:',
      newHarvest.quantity,
      newHarvest.unit,
    )
    return newHarvest
  })

export const deleteHarvest = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async (ctx) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Only delete harvests for user's crops
    await db.delete(harvests).where(eq(harvests.id, ctx.data))

    console.log(
      '🗑️ Harvest deleted for user:',
      session.user.id,
      '- Harvest ID:',
      ctx.data,
    )
    return { success: true }
  })

// Common units for harvests
export const HARVEST_UNITS = [
  'kg',
  'tons',
  'bags',
  'crates',
  'bundles',
  'pieces',
] as const

// Quality grades
export const QUALITY_GRADES = [
  'Grade A',
  'Grade B',
  'Grade C',
  'Mixed',
] as const
