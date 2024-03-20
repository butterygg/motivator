import {
    boolean,
    date,
    integer,
    pgTable,
    text,
    uuid,
} from 'drizzle-orm/pg-core'

export const user = pgTable('users', {
    address: text('address').primaryKey(),
})

export const assessor = pgTable('assessor', {
    address: text('address').primaryKey(),
})

export const assessor_slot = pgTable('assessor_slot', {
    id: uuid('id').defaultRandom().primaryKey(),
    assessor_ID: uuid('assessor').references(() => assessor.address),
    done: boolean('done').default(false),
    week: integer('week').default(0),
})

export const reward = pgTable('reward', {
    id: uuid('id').defaultRandom().primaryKey(),
    amount: integer('amount'),
    date: date('date'),
    assessor_slot_ID: uuid('assessor_ID').references(() => assessor_slot.id),
    user_Address: text('user_Address').references(() => user.address),
})

export const assessor_slot_user = pgTable('assessor_slot_user', {
    id: uuid('id').defaultRandom().primaryKey(),
    assessor_slot_ID: uuid('assessor_slot_ID').references(
        () => assessor_slot.id
    ),
    user_Address: text('user_Address').references(() => user.address),
})
