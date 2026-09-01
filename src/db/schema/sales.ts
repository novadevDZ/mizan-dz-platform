import {numeric, pgTable, timestamp, uuid, varchar} from "drizzle-orm/pg-core";
import {organizations} from "@/src/db/schema/organizations";
import {customers} from "@/src/db/schema/customers";
import {saleStatusEnum} from "@/src/db/schema/enums";
import {members} from "@/src/db/schema/members";

export const sales = pgTable("sales", {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    saleNumber: varchar("sale_number", {length:50}).notNull(),
    status: saleStatusEnum("status").notNull().default("draft"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2}).notNull(),
    createdBy: uuid("created_by").references(() => members.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})