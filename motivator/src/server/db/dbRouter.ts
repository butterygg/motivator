'use server'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
// contains the connection string to the neon database

console.log(`PG CONNECT xoxo ${process.env.PG_CONNECT_STR}`)
export const sql = neon(process.env.PG_CONNECT_STR || '')

// contains the drizzle object to send queries to the database
export const db = drizzle(sql, { schema: schema })

// See https://neon.tech/docs/serverless/serverless-driver
// for more information
