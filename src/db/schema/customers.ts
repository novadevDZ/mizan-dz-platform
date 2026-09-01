import {
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const customers = pgTable(
    "customers",
    {
        id: uuid("id")
            .defaultRandom()
            .primaryKey(),

        organizationId: uuid(
            "organization_id",
        )
            .notNull()
            .references(
                () => organizations.id,
                {
                    onDelete: "cascade",
                },
            ),

        name: text("name")
            .notNull(),

        phone: text("phone"),

        address: text("address"),

        notes: text("notes"),

        createdAt: timestamp(
            "created_at",
            {
                withTimezone: true,
            },
        )
            .defaultNow()
            .notNull(),

        updatedAt: timestamp(
            "updated_at",
            {
                withTimezone: true,
            },
        )
            .defaultNow()
            .notNull(),

        deletedAt: timestamp(
            "deleted_at",
            {
                withTimezone: true,
            }),
    },
);