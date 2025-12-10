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
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    plugins: [tanstackStartCookies()]
})