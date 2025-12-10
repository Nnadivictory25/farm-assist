import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
}

// ============ BETTER-AUTH TABLES ============

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  phone: text('phone'),
  ...timestamps,
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp',
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
})

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ...timestamps,
})

// ============ FARM TABLES ============

export const fields = sqliteTable(
  'fields',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    areaHa: real('area_ha'),
    location: text('location'),
    season: text('season').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [index('fields_user_season_idx').on(table.userId, table.season)],
)

export const crops = sqliteTable(
  'crops',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fieldId: integer('field_id')
      .notNull()
      .references(() => fields.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    variety: text('variety'),
    season: text('season').notNull(),
    plantingDate: text('planting_date'),
    expectedHarvestDate: text('expected_harvest_date'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [index('crops_field_season_idx').on(table.fieldId, table.season)],
)

export const activities = sqliteTable(
  'activities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cropId: integer('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    performedOn: text('performed_on').notNull(),
    laborHours: real('labor_hours'),
    notes: text('notes'),
    season: text('season').notNull(),
    ...timestamps,
  },
  (table) => [
    index('activities_crop_date_idx').on(table.cropId, table.performedOn),
  ],
)

export const expenses = sqliteTable(
  'expenses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cropId: integer('crop_id').references(() => crops.id, {
      onDelete: 'set null',
    }),
    fieldId: integer('field_id').references(() => fields.id, {
      onDelete: 'set null',
    }),
    category: text('category').notNull(),
    item: text('item').notNull(),
    quantity: real('quantity'),
    unit: text('unit'),
    costPerUnit: real('cost_per_unit'),
    totalCost: real('total_cost').notNull(),
    purchasedOn: text('purchased_on').notNull(),
    season: text('season').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    index('expenses_crop_field_date_idx').on(
      table.cropId,
      table.fieldId,
      table.purchasedOn,
    ),
  ],
)

export const harvests = sqliteTable(
  'harvests',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cropId: integer('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'cascade' }),
    harvestedOn: text('harvested_on').notNull(),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
    qualityGrade: text('quality_grade'),
    season: text('season').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    index('harvests_crop_date_idx').on(table.cropId, table.harvestedOn),
  ],
)

export const sales = sqliteTable(
  'sales',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    harvestId: integer('harvest_id')
      .notNull()
      .references(() => harvests.id, { onDelete: 'cascade' }),
    soldOn: text('sold_on').notNull(),
    buyer: text('buyer'),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
    pricePerUnit: real('price_per_unit').notNull(),
    totalAmount: real('total_amount').notNull(),
    season: text('season').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    index('sales_harvest_date_idx').on(table.harvestId, table.soldOn),
  ],
)

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  fields: many(fields),
}))

export const fieldsRelations = relations(fields, ({ many, one }) => ({
  user: one(users, { fields: [fields.userId], references: [users.id] }),
  crops: many(crops),
  expenses: many(expenses),
}))

export const cropsRelations = relations(crops, ({ many, one }) => ({
  field: one(fields, { fields: [crops.fieldId], references: [fields.id] }),
  activities: many(activities),
  harvests: many(harvests),
  expenses: many(expenses),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  crop: one(crops, { fields: [activities.cropId], references: [crops.id] }),
}))

export const harvestsRelations = relations(harvests, ({ many, one }) => ({
  crop: one(crops, { fields: [harvests.cropId], references: [crops.id] }),
  sales: many(sales),
}))

export const salesRelations = relations(sales, ({ one }) => ({
  harvest: one(harvests, {
    fields: [sales.harvestId],
    references: [harvests.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  crop: one(crops, { fields: [expenses.cropId], references: [crops.id] }),
  field: one(fields, { fields: [expenses.fieldId], references: [fields.id] }),
}))
