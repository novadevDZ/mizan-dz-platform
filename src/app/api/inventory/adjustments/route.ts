import { NextRequest } from "next/server";

import {
    and,
    eq,
    gte,
    isNull,
    sql,
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

        const direction =
            input.direction;

        const quantity =
            typeof input.quantity ===
            "string" ||
            typeof input.quantity ===
            "number"
                ? Number(
                    input.quantity,
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
            direction !== "in" &&
            direction !== "out"
        ) {
            return apiError(
                "Direction must be in or out.",
                400,
            );
        }

        if (
            !Number.isInteger(
                quantity,
            ) ||
            quantity <= 0
        ) {
            return apiError(
                "Quantity must be a positive integer.",
                400,
            );
        }

        if (!reason) {
            return apiError(
                "A reason is required.",
                400,
            );
        }

        const result =
            await db.transaction(
                async (tx) => {
                    /*
                     * Read current product state.
                     */
                    const [
                        product,
                    ] =
                        await tx
                            .select({
                                id:
                                products.id,

                                purchasePrice:
                                products.purchasePrice,

                                stockQuantity:
                                products.stockQuantity,
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

                    const quantityChange =
                        direction ===
                        "in"
                            ? quantity
                            : -quantity;

                    /*
                     * Atomic update.
                     *
                     * For "out", the stock
                     * must be sufficient.
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
                                    sql`
                                        ${products.stockQuantity}
                                        +
                                        ${quantityChange}
                                    `,

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

                                    direction ===
                                    "out"
                                        ? gte(
                                            products.stockQuantity,
                                            quantity,
                                        )
                                        : sql`true`,
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
                            direction ===
                            "out"
                                ? "Insufficient stock."
                                : "Product not found or archived.",
                        );
                    }

                    const balanceAfter =
                        Number(
                            updatedProduct
                                .stockQuantity,
                        );

                    const balanceBefore =
                        balanceAfter -
                        quantityChange;

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
                                    direction ===
                                    "in"
                                        ? "adjustment_in"
                                        : "adjustment_out",

                                referenceType:
                                    "adjustment",

                                referenceId:
                                    null,

                                quantity,

                                quantityChange,

                                balanceBefore,

                                balanceAfter,

                                unitCost:
                                product.purchasePrice,

                                reason,

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
                            "Failed to create inventory movement.",
                        );
                    }

                    return {
                        productId,

                        movementId:
                        movement.id,

                        quantity,

                        quantityChange,

                        balanceBefore,

                        balanceAfter,
                    };
                },
            );

        return apiSuccess(
            result,
            201,
        );
    } catch (error) {
        console.error(
            "[POST /api/inventory/adjustments]",
            error,
        );

        return apiError(
            error instanceof Error
                ? error.message
                : "Failed to adjust stock.",
            400,
        );
    }
}