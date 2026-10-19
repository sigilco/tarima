import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const accessRequests = sqliteTable('access_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  intent: text('intent'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type AccessRequest = typeof accessRequests.$inferSelect
export type NewAccessRequest = typeof accessRequests.$inferInsert
