import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const client = createClient({ url: process.env.DATABASE_URL! })
const db = drizzle(client)

async function runMigrations() {
    console.log('🌱 Running migrations...')

    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('✅ Migrations complete!')
    process.exit(0)
}

runMigrations().catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})

