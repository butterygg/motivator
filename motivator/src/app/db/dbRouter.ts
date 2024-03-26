import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
// contains the connection string to the neon database
export const sql = neon(
    'postgresql://motivatordb_owner:CMBw0bJj5uQl@ep-rough-bar-a44axfqa.us-east-1.aws.neon.tech/motivatordb?sslmode=require'
)

// contains the drizzle object to send queries to the database
export const db = drizzle(sql, { schema: schema })

// See https://neon.tech/docs/serverless/serverless-driver
// for more information
