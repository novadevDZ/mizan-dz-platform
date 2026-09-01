import {
    index,
    integer,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "@/src/db/schema/organizations";
import { products } from "@/src/db/schema/products";

export const inventoryMovementTypeEnum =
    pgEnum(
        "inventory_movement_type",
        [
            "initial",
            "purchase",
            "sale",
            "sale_reversal",
            "customer_return",
            "damage",
            "adjustment_in",
            "adjustment_out",
            "transfer_in",
            "transfer_out",
            "stock_count",
        ],
    );

export const inventoryReferenceTypeEnum =
    pgEnum(
        "inventory_reference_type",
        [
            "sale",
            "purchase",
            "return",
            "adjustment",
            "transfer",
            "stock_count",
            "manual",
        ],
    );

export const inventoryMovements =
    pgTable(
        "inventory_movements",
        {
            id: uuid("id")
                .defaultRandom()
                .primaryKey(),

            organizationId:
                uuid("organization_id")
                    .notNull()
                    .references(
                        () =>
                            organizations.id,
                    ),

            productId:
                uuid("product_id")
                    .notNull()
                    .references(
                        () =>
                            products.id,
                    ),

            type:
                inventoryMovementTypeEnum(
                    "type",
                ).notNull(),

            referenceType:
                inventoryReferenceTypeEnum(
                    "reference_type",
                ),

            referenceId:
                uuid(
                    "reference_id",
                ),

            quantity:
                integer(
                    "quantity",
                ).notNull(),

            quantityChange:
                integer(
                    "quantity_change",
                ).notNull(),

            balanceBefore:
                integer(
                    "balance_before",
                ).notNull(),

            balanceAfter:
                integer(
                    "balance_after",
                ).notNull(),

            /**
             * Snapshot of the product cost
             * at the time of the movement.
             */
            unitCost:
                numeric(
                    "unit_cost",
                    {
                        precision: 12,
                        scale: 2,
                    },
                ),

            /**
             * Human-readable reason.
             */
            reason:
                text(
                    "reason",
                ),

            /**
             * Optional external/business
             * reference shown to users.
             *
             * Example:
             * SALE-20260820-1001
             */
            referenceNumber:
                varchar(
                    "reference_number",
                    {
                        length: 100,
                    },
                ),

            /**
             * Optional user responsible
             * for this tracking event.
             */
            createdBy:
                uuid(
                    "created_by",
                ),

            createdAt:
                timestamp(
                    "created_at",
                )
                    .notNull()
                    .defaultNow(),
        },

        (table) => [
            index(
                "inventory_movements_org_idx",
            ).on(
                table.organizationId,
            ),

            index(
                "inventory_movements_product_idx",
            ).on(
                table.productId,
            ),

            index(
                "inventory_movements_created_at_idx",
            ).on(
                table.createdAt,
            ),

            index(
                "inventory_movements_reference_idx",
            ).on(
                table.referenceType,
                table.referenceId,
            ),

            index(
                "inventory_movements_type_idx",
            ).on(
                table.type,
            ),

            /**
             * Idempotency / duplicate protection.
             */
            uniqueIndex(
                "inventory_movements_business_ref_idx",
            ).on(
                table.organizationId,
                table.productId,
                table.type,
                table.referenceType,
                table.referenceId,
            ),
        ],
    );