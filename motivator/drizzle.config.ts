import type { Config } from 'drizzle-kit'
export default {
    schema: './src/app/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.NEXT_PUBLIC_PG_CONNECT_STR || '',
    },
} satisfies Config
