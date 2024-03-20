import { neon } from '@neondatabase/serverless'

const sql = neon(
    'postgresql://motivatordb_owner:CMBw0bJj5uQl@ep-wispy-salad-a4yk2grq.us-east-1.aws.neon.tech/motivatordb?sslmode=require'
)

// See https://neon.tech/docs/serverless/serverless-driver
// for more information
