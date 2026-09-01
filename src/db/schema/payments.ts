import {numeric, pgTable, uuid, text, timestamp} from "drizzle-orm/pg-core";
import {organizations} from "@/src/db/schema/organizations";
import {customers} from "@/src/db/schema/customers";
import {sales} from "@/src/db/schema/sales";
import {paymentMethodEnum} from "@/src/db/schema/enums";



export const payments = pgTable("payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    amount: numeric("amount", { precision: 12, scale: 2}).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})