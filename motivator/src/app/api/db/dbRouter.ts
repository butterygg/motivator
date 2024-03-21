import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// contains the connection string to the neon database
export const sql = neon(
    'postgresql://motivatordb_owner:CMBw0bJj5uQl@ep-wispy-salad-a4yk2grq.us-east-1.aws.neon.tech/motivatordb?sslmode=require'
)

// contains the drizzle object to send queries to the database
export const db = drizzle(sql)

// See https://neon.tech/docs/serverless/serverless-driver
// for more information
