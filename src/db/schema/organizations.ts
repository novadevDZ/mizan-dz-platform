import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
    id: uuid("id").defaultRandom().primaryKey(),
    authOrganizationId: text("auth_organization_id")
        .notNull()
        .unique(),
    name: text("name").notNull(),
    phone: text("phone"),
    address: text("address"),
    wilaya: text("wilaya").notNull(),
    currency: text("currency").notNull().default("DZD"),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
    deletedAt: timestamp("deleted_at"),
});