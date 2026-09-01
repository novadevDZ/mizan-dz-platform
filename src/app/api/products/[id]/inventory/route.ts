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

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

function isValidUuid(
    value: string,
) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

export async function GET(
    request: NextRequest,
    context: RouteContext,
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

        const {
            id,
        } = await context.params;

        if (
            !isValidUuid(id)
        ) {
            return apiError(
                "Invalid product ID.",
                400,
            );
        }

        const params =
            request.nextUrl
                .searchParams;

        const search =
            params
                .get("search")
                ?.trim() ?? "";

        const page =
            Math.max(
                Number(
                    params.get(
                        "page",
                    ) ??
                    "1",
                ) || 1,
                1,
            );

        const limit =
            Math.min(
                Math.max(
                    Number(
                        params.get(
                            "limit",
                        ) ??
                        "50",
                    ) || 50,
                    1,
                ),
                100,
            );

        const [
            product,
        ] =
            await db
                .select({
                    id:
                    products.id,

                    organizationId:
                    products.organizationId,

                    name:
                    products.name,

                    sku:
                    products.sku,

                    description:
                    products.description,

                    purchasePrice:
                    products.purchasePrice,

                    sellingPrice:
                    products.sellingPrice,

                    stockQuantity:
                    products.stockQuantity,

                    reorderLevel:
                    products.reorderLevel,

                    createdAt:
                    products.createdAt,

                    updatedAt:
                    products.updatedAt,
                })
                .from(
                    products,
                )
                .where(
                    and(
                        eq(
                            products.id,
                            id,
                        ),

                        eq(
                            products.organizationId,
                            organizationId,
                        ),
                    ),
                )
                .limit(1);

        if (!product) {
            return apiError(
                "Product not found.",
                404,
            );
        }

        const filters = [
            eq(
                inventoryMovements.organizationId,
                organizationId,
            ),

            eq(
                inventoryMovements.productId,
                id,
            ),
        ];

        if (search) {
            filters.push(
                or(
                    ilike(
                        inventoryMovements.reason,
                        `%${search}%`,
                    ),

                    ilike(
                        inventoryMovements.referenceNumber,
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

        const stockQuantity =
            Number(
                product.stockQuantity,
            );

        const purchasePrice =
            Number(
                product.purchasePrice,
            );

        const sellingPrice =
            Number(
                product.sellingPrice,
            );

        return apiSuccess({
            product: {
                ...product,

                purchasePrice,

                sellingPrice,

                stockQuantity,

                reorderLevel:
                    Number(
                        product.reorderLevel,
                    ),
            },

            summary: {
                currentStock:
                stockQuantity,

                reorderLevel:
                    Number(
                        product.reorderLevel,
                    ),

                stockValue:
                    Number(
                        (
                            stockQuantity *
                            purchasePrice
                        ).toFixed(2),
                    ),

                retailValue:
                    Number(
                        (
                            stockQuantity *
                            sellingPrice
                        ).toFixed(2),
                    ),
            },

            movements:
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
            "[GET /api/products/[id]/inventory]",
            error,
        );

        return apiError(
            "Internal server error.",
            500,
        );
    }
}