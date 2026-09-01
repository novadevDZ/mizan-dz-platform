import {integer, numeric, pgTable, uuid} from "drizzle-orm/pg-core";
import {sales} from "@/src/db/schema/sales";
import {products} from "@/src/db/schema/products";


export const saleItems = pgTable("sale_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    productId: uuid("product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2}).notNull(),
    subtotal: numeric("sub_total", { precision: 12, scale: 2}).notNull(),
})