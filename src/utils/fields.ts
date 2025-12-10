import { db } from '@/db'
import { fields } from '@/db/schema'
import { auth } from '@/lib/auth'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, desc, eq } from 'drizzle-orm'

export const getFields = createServerFn({ method: 'GET' }).handler(async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const data = await db
        .select()
        .from(fields)
        .where(eq(fields.userId, session.user.id))
        .orderBy(desc(fields.createdAt))

    console.log('🌾 Fields fetched for user:', session.user.id, '- Count:', data.length)
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
}

export const addField = createServerFn({ method: 'POST' })
    .inputValidator((data: AddFieldInput) => data)
    .handler(async ({ data }) => {
        const headers = getRequestHeaders()
        const session = await auth.api.getSession({ headers })

        if (!session?.user?.id) {
            throw new Error('Unauthorized')
        }

        const [newField] = await db
            .insert(fields)
            .values({
                name: data.name,
                areaHa: data.areaHa,
                location: data.location,
                season: data.season,
                notes: data.notes,
                userId: session.user.id,
            })
            .returning()

        console.log('✅ Field added for user:', session.user.id, '- Field:', newField.name)
        return newField
    })

export const deleteField = createServerFn({ method: 'POST' })
    .inputValidator((id: number) => id)
    .handler(async ({ data: id }) => {
        const headers = getRequestHeaders()
        const session = await auth.api.getSession({ headers })

        if (!session?.user?.id) {
            throw new Error('Unauthorized')
        }

        // Only delete if the field belongs to this user
        await db.delete(fields).where(
            and(eq(fields.id, id), eq(fields.userId, session.user.id))
        )

        console.log('🗑️ Field deleted for user:', session.user.id, '- Field ID:', id)
        return { success: true }
    })

