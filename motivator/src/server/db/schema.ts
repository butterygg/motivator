import { relations, sql } from 'drizzle-orm'
import {
    PgTableWithColumns,
    boolean,
    date,
    decimal,
    doublePrecision,
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable('users', {
    address: text('address').unique().primaryKey(),
})

// export const stats = pgTable('stats', {
//     user_address: text('user_address')
//         .references(() => user.address)
//         .primaryKey(),
//     actions: integer('actions').default(0),
//     volume: integer('volume').default(0),
// })

export const assessor = pgTable('assessor', {
    address: text('address').unique().primaryKey(),
})

export const assessor_slot = pgTable('assessor_slot', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_ID: text('assessor_id').references(() => assessor.address),
    done: boolean('done').default(false),
    week: integer('week').default(1),
})

export const reward = pgTable('reward', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    amount: integer('amount'),
    date: date('date'),
    assessor_slot_id: uuid('assessor_slot_id').references(
        () => assessor_slot.id
    ),
    user_address: text('user_address').references(() => user.address),
})

export const assessor_slot_user = pgTable('assessor_slot_user', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_slot_id: uuid('assessor_slot_id').references(
        () => assessor_slot.id
    ),
    user_address: text('user_address').references(() => user.address),
})

export const statistics = pgTable('statistics', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    timestamp: timestamp('timestamp', {
        precision: 3,
        mode: 'string',
        withTimezone: false,
    }),
    user_address: text('user_address').references(() => user.address),
    action_count_longs: doublePrecision('action_count_longs'),
    action_count_shorts: doublePrecision('action_count_shorts'),
    action_count_lps: doublePrecision('action_count_lps'),
    volume_longs: doublePrecision('volume_longs'),
    volume_shorts: doublePrecision('volume_shorts'),
    volume_lps: doublePrecision('volume_lps'),
    pnl_longs: doublePrecision('pnl_longs'),
    pnl_shorts: doublePrecision('pnl_shorts'),
    pnl_lps: doublePrecision('pnl_lps'),
})

export const totals = pgTable('totals', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    user_address: text('user_address').references(() => user.address),
    week: integer('week').default(1),
    totalActions: doublePrecision('total_actions'),
    totalVolume: doublePrecision('total_volume'),
    totalPnl: doublePrecision('total_pnl'),
})

export const offChainActions = pgTable('off_chain_actions', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    user_address: text('user_address').references(() => user.address),
    feedback: boolean('feedback').default(false),
    strategyWriteUp: boolean('strategy_write_up').default(false),
    communityEngagement: boolean('community_engagement').default(false),
    isBot: boolean('is_bot').default(false),
})
