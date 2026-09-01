import {
    numeric,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "@/src/db/schema/organizations";
import { invoiceStatusEnum } from "@/src/db/schema/enums";
import { sales } from "@/src/db/schema/sales";
import { customers } from "@/src/db/schema/customers";

export const invoices = pgTable(
    "invoices",
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

        saleId: uuid("sale_id")
            .notNull()
            .references(
                () => sales.id,
                {
                    onDelete: "restrict",
                },
            ),

        customerId: uuid(
            "customer_id",
        )
            .notNull()
            .references(
                () => customers.id,
                {
                    onDelete: "restrict",
                },
            ),

        invoiceNumber: varchar(
            "invoice_number",
            {
                length: 50,
            },
        ).notNull(),

        status: invoiceStatusEnum(
            "status",
        )
            .notNull()
            .default("draft"),

        issuedAt:
            timestamp("issued_at"),

        dueAt:
            timestamp("due_at"),

        subtotal: numeric(
            "subtotal",
            {
                precision: 14,
                scale: 2,
            },
        )
            .notNull()
            .default("0"),

        discount: numeric(
            "discount",
            {
                precision: 14,
                scale: 2,
            },
        )
            .notNull()
            .default("0"),

        total: numeric(
            "total",
            {
                precision: 14,
                scale: 2,
            },
        )
            .notNull()
            .default("0"),

        notes: varchar(
            "notes",
            {
                length: 1000,
            },
        ),

        createdAt:
            timestamp(
                "created_at",
            )
                .defaultNow()
                .notNull(),

        updatedAt:
            timestamp(
                "updated_at",
            )
                .defaultNow()
                .notNull(),
    },
    (table) => ({
        invoiceNumberOrganizationUnique:
            uniqueIndex(
                "invoices_org_invoice_number_unique",
            ).on(
                table.organizationId,
                table.invoiceNumber,
            ),

        saleUnique:
            uniqueIndex(
                "invoices_sale_unique",
            ).on(
                table.saleId,
            ),
    }),
);