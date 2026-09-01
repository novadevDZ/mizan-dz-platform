import { NextRequest } from "next/server";

import {
    and,
    desc,
    eq,
    ilike,
    or,
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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseInteger(
    value: string | null,
    fallback: number,
    min: number,
    max: number,
) {
    if (!value) {
        return fallback;
    }

    const parsed =
        Number(value);

    if (
        !Number.isInteger(
            parsed,
        )
    ) {
        return fallback;
    }

    return Math.min(
        Math.max(
            parsed,
            min,
        ),
        max,
    );
}

export async function GET(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } =
            await requirePermission(
                "products",
                "read",
            );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const params =
            request.nextUrl
                .searchParams;

        const page =
            parseInteger(
                params.get(
                    "page",
                ),
                DEFAULT_PAGE,
                1,
                10_000,
            );

        const limit =
            parseInteger(
                params.get(
                    "limit",
                ),
                DEFAULT_LIMIT,
                1,
                MAX_LIMIT,
            );

        const search =
            params
                .get("search")
                ?.trim() ?? "";

        const filters = [
            eq(
                inventoryMovements.organizationId,
                organizationId,
            ),
        ];

        if (search) {
            filters.push(
                or(
                    ilike(
                        products.name,
                        `%${search}%`,
                    ),

                    ilike(
                        products.sku,
                        `%${search}%`,
                    ),

                    ilike(
                        inventoryMovements.referenceNumber,
                        `%${search}%`,
                    ),

                    ilike(
                        inventoryMovements.reason,
                        `%${search}%`,
                    ),
                )!,
            );
        }

        const movements =
            await db
                .select({
                    id:
                    inventoryMovements.id,

                    productId:
                    inventoryMovements.productId,

                    productName:
                    products.name,

                    sku:
                    products.sku,

                    type:
                    inventoryMovements.type,

                    referenceType:
                    inventoryMovements.referenceType,

                    referenceId:
                    inventoryMovements.referenceId,

                    referenceNumber:
                    inventoryMovements.referenceNumber,

                    quantity:
                    inventoryMovements.quantity,

                    quantityChange:
                    inventoryMovements.quantityChange,

                    balanceBefore:
                    inventoryMovements.balanceBefore,

                    balanceAfter:
                    inventoryMovements.balanceAfter,

                    unitCost:
                    inventoryMovements.unitCost,

                    reason:
                    inventoryMovements.reason,

                    createdBy:
                    inventoryMovements.createdBy,

                    createdAt:
                    inventoryMovements.createdAt,
                })
                .from(
                    inventoryMovements,
                )
                .innerJoin(
                    products,
                    and(
                        eq(
                            products.id,
                            inventoryMovements.productId,
                        ),

                        eq(
                            products.organizationId,
                            organizationId,
                        ),
                    ),
                )
                .where(
                    and(
                        ...filters,
                    ),
                )
                .orderBy(
                    desc(
                        inventoryMovements.createdAt,
                    ),
                )
                .limit(limit)
                .offset(
                    (page - 1) *
                    limit,
                );

        return apiSuccess({
            items:
                movements.map(
                    (
                        movement,
                    ) => ({
                        ...movement,

                        quantity:
                            Number(
                                movement.quantity,
                            ),

                        quantityChange:
                            Number(
                                movement.quantityChange,
                            ),

                        balanceBefore:
                            Number(
                                movement.balanceBefore,
                            ),

                        balanceAfter:
                            Number(
                                movement.balanceAfter,
                            ),

                        unitCost:
                            movement.unitCost ===
                            null
                                ? null
                                : Number(
                                    movement.unitCost,
                                ),
                    }),
                ),

            pagination: {
                page,
                limit,

                hasNextPage:
                    movements.length ===
                    limit,

                hasPreviousPage:
                    page > 1,
            },
        });
    } catch (error) {
        console.error(
            "[GET /api/inventory/movements]",
            error,
        );

        return apiError(
            "Internal server error.",
            500,
        );
    }
}