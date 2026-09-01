import {
    numeric,
    pgTable,
    text,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { invoices } from "@/src/db/schema/invoices";
import { products } from "@/src/db/schema/products";

export const invoiceItems =
    pgTable(
        "invoice_items",
        {
            id: uuid("id")
                .defaultRandom()
                .primaryKey(),

            invoiceId: uuid(
                "invoice_id",
            )
                .notNull()
                .references(
                    () => invoices.id,
                    {
                        onDelete:
                            "cascade",
                    },
                ),

            productId: uuid(
                "product_id",
            )
                .notNull()
                .references(
                    () => products.id,
                    {
                        onDelete:
                            "restrict",
                    },
                ),

            productName: text(
                "product_name",
            ).notNull(),

            description:
                text(
                    "description",
                ),

            quantity: numeric(
                "quantity",
                {
                    precision: 14,
                    scale: 3,
                },
            ).notNull(),

            unitPrice: numeric(
                "unit_price",
                {
                    precision: 14,
                    scale: 2,
                },
            ).notNull(),

            subtotal: numeric(
                "subtotal",
                {
                    precision: 14,
                    scale: 2,
                },
            ).notNull(),
        },
    );