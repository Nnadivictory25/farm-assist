import { db } from '@/db'
import { fields } from '@/db/schema'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export const getFields = createServerFn({ method: 'GET' }).handler(async () => {
    const data = await db
        .select()
        .from(fields)
        .orderBy(desc(fields.createdAt))

    console.log('🌾 Fields fetched:', data.length)
    return data
})

export const fieldsQueryOptions = () =>
    queryOptions({
        queryKey: ['fields'],
        queryFn: () => getFields(),
    })

type AddFieldInput = {
    name: string
    areaHa?: number
    location?: string
    season: string
    notes?: string
    userId?: string
}

export const addField = createServerFn({ method: 'POST' })
    .inputValidator((data: AddFieldInput) => data)
    .handler(async ({ data }) => {
        const [newField] = await db
            .insert(fields)
            .values({
                name: data.name,
                areaHa: data.areaHa,
                location: data.location,
                season: data.season,
                notes: data.notes,
                userId: data.userId,
            })
            .returning()

        console.log('✅ Field added:', newField.name)
        return newField
    })

export const deleteField = createServerFn({ method: 'POST' })
    .inputValidator((id: number) => id)
    .handler(async ({ data: id }) => {
        await db.delete(fields).where(eq(fields.id, id))
        console.log('🗑️ Field deleted:', id)
        return { success: true }
    })

