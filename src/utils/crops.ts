import { db } from '@/db'
import { crops, fields } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export const getCrops = createServerFn({ method: 'GET' }).handler(async () => {
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
    .leftJoin(fields, eq(crops.fieldId, fields.id))
    .orderBy(desc(crops.createdAt))

  console.log('🌱 Crops fetched:', data.length)
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
    const [newCrop] = await db
      .insert(crops)
      .values({
        name: data.name,
        fieldId: data.fieldId,
        variety: data.variety,
        season: data.season,
        plantingDate: data.plantingDate,
        expectedHarvestDate: data.expectedHarvestDate,
        notes: data.notes,
      })
      .returning()

    console.log('✅ Crop added:', newCrop.name)
    return newCrop
  })

export const deleteCrop = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(crops).where(eq(crops.id, id))
    console.log('🗑️ Crop deleted:', id)
    return { success: true }
  })

