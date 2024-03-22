import {
    boolean,
    date,
    integer,
    pgTable,
    text,
    uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable('users', {
    address: text('address').unique().primaryKey(),
})

export const stats = pgTable('stats', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    user_address: text('user_address').references(() => user.address),
    actions: integer('week').default(0),
    volume: integer('value').default(0),
})

export const assessor = pgTable('assessor', {
    address: text('address').unique().primaryKey(),
})

export const assessor_slot = pgTable('assessor_slot', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_ID: text('assessor').references(() => assessor.address),
    done: boolean('done').default(false),
    week: integer('week').default(0),
})

export const reward = pgTable('reward', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    amount: integer('amount'),
    date: date('date'),
    assessor_slot_ID: uuid('assessor_ID').references(() => assessor_slot.id),
    user_address: text('user_address').references(() => user.address),
})

export const assessor_slot_user = pgTable('assessor_slot_user', {
    id: uuid('id').defaultRandom().unique().primaryKey(),
    assessor_slot_ID: uuid('assessor_slot_ID').references(
        () => assessor_slot.id
    ),
    user_address: text('user_address').references(() => user.address),
})
