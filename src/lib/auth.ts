import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
    },
    database: drizzleAdapter(db, {
        provider: 'sqlite',
        usePlural: true,
    }),
    plugins: [tanstackStartCookies()]
})