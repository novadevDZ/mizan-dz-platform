import {
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "@/src/db/schema/organizations";
import { expenseCategoryEnum } from "@/src/db/schema/enums";
import { members } from "@/src/db/schema/members";

export const expenses = pgTable("expenses", {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    organizationId: uuid("organization_id")
        .notNull()
        .references(() => organizations.id),

    title: varchar("title", {
        length: 100,
    }).notNull(),

    category: expenseCategoryEnum("category")
        .notNull()
        .default("other"),

    amount: numeric("amount", {
        precision: 12,
        scale: 2,
    }).notNull(),

    description: text("description"),

    createdBy: uuid("created_by")
        .notNull()
        .references(() => members.id),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

    deletedAt: timestamp("deleted_at"),
});