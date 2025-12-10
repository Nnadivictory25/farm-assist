import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { fields, crops, harvests, expenses, sales } from '@/db/schema'

export const Route = createFileRoute('/api/seed')({
  server: {
    handlers: {
      POST: async () => {
        const headers = getRequestHeaders()
        const session = await auth.api.getSession({ headers })

        if (!session?.user?.id) {
          return Response.json(
            { error: 'Unauthorized - please log in first' },
            { status: 401 },
          )
        }

        const userId = session.user.id
        console.log('🌱 Seeding database for user:', userId)

        // Note: Not clearing existing data - seeding is additive

        // 1. Create sample fields
        const sampleFields = [
          {
            name: 'North Field',
            areaHa: 5.2,
            location: 'North side of farm',
            season: '2024 Long Rains',
          },
          {
            name: 'South Field',
            areaHa: 3.8,
            location: 'South side of farm',
            season: '2024 Long Rains',
          },
          {
            name: 'East Garden',
            areaHa: 1.5,
            location: 'East side of farm',
            season: '2024 Long Rains',
          },
        ]

        const insertedFields = []
        for (const field of sampleFields) {
          const [inserted] = await db
            .insert(fields)
            .values({
              userId,
              ...field,
            })
            .returning()
          insertedFields.push(inserted)
        }

        // 2. Create sample crops
        const sampleCrops = [
          {
            fieldId: insertedFields[0].id,
            name: 'Maize',
            variety: 'Hybrid 511',
            season: '2024 Long Rains',
            plantingDate: '2024-03-15',
            expectedHarvestDate: '2024-07-15',
          },
          {
            fieldId: insertedFields[0].id,
            name: 'Beans',
            variety: 'Rose Coco',
            season: '2024 Long Rains',
            plantingDate: '2024-03-20',
            expectedHarvestDate: '2024-06-20',
          },
          {
            fieldId: insertedFields[1].id,
            name: 'Tomatoes',
            variety: 'Roma VF',
            season: '2024 Long Rains',
            plantingDate: '2024-02-10',
            expectedHarvestDate: '2024-05-10',
          },
          {
            fieldId: insertedFields[2].id,
            name: 'Kale',
            variety: 'Collard Greens',
            season: '2024 Long Rains',
            plantingDate: '2024-01-15',
            expectedHarvestDate: '2024-04-15',
          },
        ]

        const insertedCrops = []
        for (const crop of sampleCrops) {
          const [inserted] = await db
            .insert(crops)
            .values({
              userId,
              ...crop,
            })
            .returning()
          insertedCrops.push(inserted)
        }

        // 3. Create sample harvests
        const sampleHarvests = [
          {
            cropId: insertedCrops[0].id,
            harvestedOn: '2024-07-10',
            quantity: 2500,
            unit: 'kg',
            season: '2024 Long Rains',
            qualityGrade: 'Grade A',
          },
          {
            cropId: insertedCrops[1].id,
            harvestedOn: '2024-06-15',
            quantity: 800,
            unit: 'kg',
            season: '2024 Long Rains',
            qualityGrade: 'Grade B',
          },
          {
            cropId: insertedCrops[2].id,
            harvestedOn: '2024-05-05',
            quantity: 1200,
            unit: 'kg',
            season: '2024 Long Rains',
            qualityGrade: 'Grade A',
          },
          {
            cropId: insertedCrops[3].id,
            harvestedOn: '2024-04-10',
            quantity: 300,
            unit: 'kg',
            season: '2024 Long Rains',
            qualityGrade: 'Grade A',
          },
        ]

        const insertedHarvests = []
        for (const harvest of sampleHarvests) {
          const [inserted] = await db
            .insert(harvests)
            .values({
              userId,
              ...harvest,
            })
            .returning()
          insertedHarvests.push(inserted)
        }

        // 4. Create sample expenses
        const sampleExpenses = [
          {
            fieldId: insertedFields[0].id,
            category: 'Seeds',
            item: 'Maize Seeds',
            totalCost: 15000,
            purchasedOn: '2024-03-10',
            season: '2024 Long Rains',
          },
          {
            fieldId: insertedFields[0].id,
            category: 'Fertilizer',
            item: 'NPK Fertilizer',
            totalCost: 25000,
            purchasedOn: '2024-03-12',
            season: '2024 Long Rains',
          },
          {
            fieldId: insertedFields[1].id,
            category: 'Seeds',
            item: 'Tomato Seeds',
            totalCost: 8000,
            purchasedOn: '2024-02-05',
            season: '2024 Long Rains',
          },
          {
            fieldId: insertedFields[2].id,
            category: 'Equipment',
            item: 'Garden Tools',
            totalCost: 12000,
            purchasedOn: '2024-01-10',
            season: '2024 Long Rains',
          },
          {
            cropId: insertedCrops[0].id,
            category: 'Labor',
            item: 'Maize Planting Labor',
            totalCost: 18000,
            purchasedOn: '2024-03-16',
            season: '2024 Long Rains',
          },
          {
            cropId: insertedCrops[1].id,
            category: 'Pesticides',
            item: 'Bean Insecticide',
            totalCost: 9500,
            purchasedOn: '2024-04-01',
            season: '2024 Long Rains',
          },
          {
            cropId: insertedCrops[2].id,
            category: 'Labor',
            item: 'Tomato Harvesting',
            totalCost: 22000,
            purchasedOn: '2024-05-06',
            season: '2024 Long Rains',
          },
          {
            cropId: insertedCrops[3].id,
            category: 'Transport',
            item: 'Kale Transport',
            totalCost: 6500,
            purchasedOn: '2024-04-11',
            season: '2024 Long Rains',
          },
        ]

        for (const expense of sampleExpenses) {
          await db.insert(expenses).values({
            userId,
            ...expense,
          })
        }

        // 5. Create sample sales
        const sampleSales = [
          {
            harvestId: insertedHarvests[0].id,
            soldOn: '2024-07-12',
            buyer: 'Local Market',
            quantity: 2000,
            unit: 'kg',
            pricePerUnit: 25,
            totalAmount: 50000,
            season: '2024 Long Rains',
          },
          {
            harvestId: insertedHarvests[1].id,
            soldOn: '2024-06-18',
            buyer: 'Cooperative',
            quantity: 600,
            unit: 'kg',
            pricePerUnit: 35,
            totalAmount: 21000,
            season: '2024 Long Rains',
          },
          {
            harvestId: insertedHarvests[2].id,
            soldOn: '2024-05-08',
            buyer: 'Restaurant Chain',
            quantity: 1000,
            unit: 'kg',
            pricePerUnit: 40,
            totalAmount: 40000,
            season: '2024 Long Rains',
          },
          {
            harvestId: insertedHarvests[3].id,
            soldOn: '2024-04-12',
            buyer: 'Farmers Market',
            quantity: 250,
            unit: 'kg',
            pricePerUnit: 30,
            totalAmount: 7500,
            season: '2024 Long Rains',
          },
        ]

        for (const sale of sampleSales) {
          await db.insert(sales).values({
            userId,
            ...sale,
          })
        }

        console.log('✅ Database seeded successfully for user:', userId)

        // Redirect to dashboard after seeding
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/dashboard',
          },
        })
      },
    },
  },
})
