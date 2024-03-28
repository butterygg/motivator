import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'
import { config } from '../../../drizzle.config'
// contains the connection string to the neon database

// contains the drizzle object to send queries to the database
export const db = drizzle(neon(config.dbCredentials.connectionString), {
    schema,
})

// See https://neon.tech/docs/serverless/serverless-driver
// for more information