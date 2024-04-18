import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/server/db/schema.ts',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.PG_CONNECT_STR || '',
    },
    verbose: true,
    strict: true,
})
