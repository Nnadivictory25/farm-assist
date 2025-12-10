import { db } from '@/db'
import { harvests, crops, fields } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export const getHarvests = createServerFn({ method: 'GET' }).handler(
  async () => {
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
      .orderBy(desc(harvests.harvestedOn))

    console.log('🌾 Harvests fetched:', data.length)
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
  .handler(async ({ data }) => {
    const [newHarvest] = await db
      .insert(harvests)
      .values({
        cropId: data.cropId,
        harvestedOn: data.harvestedOn,
        quantity: data.quantity,
        unit: data.unit,
        season: data.season,
        qualityGrade: data.qualityGrade,
        notes: data.notes,
      })
      .returning()

    console.log('✅ Harvest added:', newHarvest.quantity, newHarvest.unit)
    return newHarvest
  })

export const deleteHarvest = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    await db.delete(harvests).where(eq(harvests.id, id))
    console.log('🗑️ Harvest deleted:', id)
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
export const QUALITY_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Mixed'] as const

