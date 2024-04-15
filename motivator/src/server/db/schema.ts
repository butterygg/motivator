import { relations } from 'drizzle-orm'
import {
    PgTableWithColumns,
    boolean,
    date,
    decimal,
    integer,
    pgTable,
    text,
    uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable('users', {
    address: text('address').unique().primaryKey(),
    isBot: boolean('is_bot').default(false),
    owner: text('owner'),
})

export const usersRelations = relations(user, ({ one }) => ({
    invitee: one(user, {
        fields: [user.owner],
        references: [user.address],
    }),
}))

export const stats = pgTable('stats', {
    user_address: text('user_address')
        .references(() => user.address)
        .primaryKey(),
    actions: integer('actions').default(0),
    volume: integer('volume').default(0),
})

export const assessor = pgTable('assessor', {
    address: text('address').unique().primaryKey(),
})

export const assessor_slot = pgTable('assessor_slot', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_ID: text('assessor_id').references(() => assessor.address),
    done: boolean('done').default(false),
    week: integer('week').default(0),
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
    timestamp: date('timestamp').default('now()'),
    user_address: text('user_address').references(() => user.address),
    pnl_longs: decimal('pnl_longs'),
    pnl_shorts: decimal('pnl_shorts'),
    pnl_lps: decimal('pnl_lps'),
    volume_longs: decimal('volume_longs'),
    volume_shorts: decimal('volume_shorts'),
    volume_lps: decimal('volume_lps'),
    balance_longs: decimal('balance_longs'),
    balance_shorts: decimal('balance_shorts'),
    balance_lps: decimal('balance_lps'),
    action_count_shorts: decimal('action_count_shorts'),
    action_count_longs: decimal('action_count_longs'),
    action_count_lps: decimal('action_count_lps'),
})

export const offChainActions = pgTable('off_chain_actions', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    user_address: text('user_address').references(() => user.address),
    feedback: boolean('feedback').default(false),
    strategyWriteUp: boolean('strategy_write_up').default(false),
    communityEngagement: boolean('community_engagement').default(false),
})
