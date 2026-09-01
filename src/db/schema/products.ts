import {
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "@/src/db/schema/organizations";

export const products = pgTable("products", {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    organizationId: uuid("organization_id")
        .notNull()
        .references(
            () => organizations.id,
        ),

    name: text("name")
        .notNull(),

    sku: varchar("sku", {
        length: 100,
    }),

    description: text(
        "description",
    ),

    purchasePrice: numeric(
        "purchase_price",
        {
            precision: 12,
            scale: 2,
        },
    ).notNull(),

    sellingPrice: numeric(
        "selling_price",
        {
            precision: 12,
            scale: 2,
        },
    ).notNull(),

    stockQuantity: integer(
        "stock_quantity",
    ).notNull(),

    reorderLevel: integer(
        "reorder_level",
    )
        .notNull()
        .default(10),

    createdAt: timestamp(
        "created_at",
    )
        .notNull()
        .defaultNow(),

    updatedAt: timestamp(
        "updated_at",
    )
        .notNull()
        .defaultNow(),

    deletedAt: timestamp(
        "deleted_at",
    ),
});