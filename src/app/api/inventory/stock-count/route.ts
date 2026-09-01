import { NextRequest } from "next/server";

import {
    and,
    eq,
    isNull,
} from "drizzle-orm";

import { db } from "@/src/db";

import {
    inventoryMovements,
    products,
} from "@/src/db/schema";

import {
    requirePermission,
} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

function isValidUuid(
    value: unknown,
): value is string {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
        )
    );
}

export async function POST(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } =
            await requirePermission(
                "products",
                "update",
            );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const body: unknown =
            await request.json();

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            return apiError(
                "Invalid request body.",
                400,
            );
        }

        const input =
            body as Record<
                string,
                unknown
            >;

        const productId =
            typeof input.productId ===
            "string"
                ? input.productId.trim()
                : "";

        const countedQuantity =
            typeof input.countedQuantity ===
            "string" ||
            typeof input.countedQuantity ===
            "number"
                ? Number(
                    input.countedQuantity,
                )
                : NaN;

        const reason =
            typeof input.reason ===
            "string"
                ? input.reason.trim()
                : "";

        if (
            !isValidUuid(
                productId,
            )
        ) {
            return apiError(
                "A valid product ID is required.",
                400,
            );
        }

        if (
            !Number.isInteger(
                countedQuantity,
            ) ||
            countedQuantity < 0
        ) {
            return apiError(
                "Counted quantity must be a non-negative integer.",
                400,
            );
        }

        const result =
            await db.transaction(
                async (tx) => {
                    const [
                        product,
                    ] =
                        await tx
                            .select({
                                id:
                                products.id,

                                stockQuantity:
                                products.stockQuantity,

                                purchasePrice:
                                products.purchasePrice,
                            })
                            .from(
                                products,
                            )
                            .where(
                                and(
                                    eq(
                                        products.id,
                                        productId,
                                    ),

                                    eq(
                                        products.organizationId,
                                        organizationId,
                                    ),

                                    isNull(
                                        products.deletedAt,
                                    ),
                                ),
                            )
                            .limit(1);

                    if (!product) {
                        throw new Error(
                            "Product not found.",
                        );
                    }

                    const expected =
                        Number(
                            product.stockQuantity,
                        );

                    const difference =
                        countedQuantity -
                        expected;

                    /*
                     * Nothing to reconcile.
                     */
                    if (
                        difference ===
                        0
                    ) {
                        return null;
                    }

                    /*
                     * Optimistic concurrency.
                     *
                     * If another inventory event
                     * changed the stock since
                     * we read it, this update
                     * returns zero rows.
                     */
                    const [
                        updatedProduct,
                    ] =
                        await tx
                            .update(
                                products,
                            )
                            .set({
                                stockQuantity:
                                countedQuantity,

                                updatedAt:
                                    new Date(),
                            })
                            .where(
                                and(
                                    eq(
                                        products.id,
                                        productId,
                                    ),

                                    eq(
                                        products.organizationId,
                                        organizationId,
                                    ),

                                    isNull(
                                        products.deletedAt,
                                    ),

                                    eq(
                                        products.stockQuantity,
                                        expected,
                                    ),
                                ),
                            )
                            .returning({
                                id:
                                products.id,

                                stockQuantity:
                                products.stockQuantity,
                            });

                    if (
                        !updatedProduct
                    ) {
                        throw new Error(
                            "Stock changed while the count was being recorded. Refresh and count again.",
                        );
                    }

                    const quantity =
                        Math.abs(
                            difference,
                        );

                    const [
                        movement,
                    ] =
                        await tx
                            .insert(
                                inventoryMovements,
                            )
                            .values({
                                organizationId,

                                productId,

                                type:
                                    "stock_count",

                                referenceType:
                                    "stock_count",

                                referenceId:
                                    null,

                                quantity,

                                quantityChange:
                                difference,

                                balanceBefore:
                                expected,

                                balanceAfter:
                                countedQuantity,

                                unitCost:
                                product.purchasePrice,

                                reason:
                                    reason ||
                                    "Physical stock count",

                                referenceNumber:
                                    null,

                                createdBy:
                                    null,
                            })
                            .returning({
                                id:
                                inventoryMovements.id,
                            });

                    if (!movement) {
                        throw new Error(
                            "Failed to create stock count movement.",
                        );
                    }

                    return {
                        productId,

                        movementId:
                        movement.id,

                        quantity,

                        difference,

                        balanceBefore:
                        expected,

                        balanceAfter:
                        countedQuantity,
                    };
                },
            );

        return apiSuccess(
            result,
            201,
        );
    } catch (error) {
        console.error(
            "[POST /api/inventory/stock-count]",
            error,
        );

        return apiError(
            error instanceof Error
                ? error.message
                : "Failed to record stock count.",
            400,
        );
    }
}