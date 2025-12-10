import { db } from '@/db'
import { crops, fields } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, desc, eq } from 'drizzle-orm'

export const getCrops = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const data = await db
    .select({
      id: crops.id,
      name: crops.name,
      variety: crops.variety,
      season: crops.season,
      plantingDate: crops.plantingDate,
      expectedHarvestDate: crops.expectedHarvestDate,
      notes: crops.notes,
      fieldId: crops.fieldId,
      fieldName: fields.name,
      createdAt: crops.createdAt,
    })
    .from(crops)
    .innerJoin(fields, eq(crops.fieldId, fields.id))
    .where(eq(crops.userId, session.user.id))
    .orderBy(desc(crops.createdAt))

  console.log(
    '🌱 Crops fetched for user:',
    session.user.id,
    '- Count:',
    data.length,
  )
  return data
})

export const cropsQueryOptions = () =>
  queryOptions({
    queryKey: ['crops'],
    queryFn: () => getCrops(),
  })

type AddCropInput = {
  name: string
  fieldId: number
  variety?: string
  season: string
  plantingDate?: string
  expectedHarvestDate?: string
  notes?: string
}

export const addCrop = createServerFn({ method: 'POST' })
  .inputValidator((data: AddCropInput) => data)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Verify the field belongs to this user
    const [field] = await db
      .select()
      .from(fields)
      .where(
        and(eq(fields.id, data.fieldId), eq(fields.userId, session.user.id)),
      )

    if (!field) {
      throw new Error('Field not found or unauthorized')
    }

    const [newCrop] = await db
      .insert(crops)
      .values({
        userId: session.user.id,
        name: data.name,
        fieldId: data.fieldId,
        variety: data.variety,
        season: data.season,
        plantingDate: data.plantingDate,
        expectedHarvestDate: data.expectedHarvestDate,
        notes: data.notes,
      })
      .returning()

    console.log(
      '✅ Crop added for user:',
      session.user.id,
      '- Crop:',
      newCrop.name,
    )
    return newCrop
  })

export const deleteCrop = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Only delete crops whose field belongs to this user
    const result = await db.delete(crops).where(eq(crops.id, id)).returning()

    if (result.length > 0) {
      // Verify field ownership
      const [field] = await db
        .select()
        .from(fields)
        .where(eq(fields.id, result[0].fieldId))
      if (field?.userId !== session.user.id) {
        throw new Error('Unauthorized')
      }
    }

    console.log('🗑️ Crop deleted for user:', session.user.id, '- Crop ID:', id)
    return { success: true }
  })
