import { NextRequest } from "next/server";

import {
    and,
    count,
    eq,
    gt,
    ilike,
    isNull,
    lte,
    or,
} from "drizzle-orm";

import { db } from "@/src/db";

import {
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

type LowStockStatus =
    | "all"
    | "out_of_stock"
    | "critical"
    | "low_stock";

function parseInteger(
    value: string | null,
    fallback: number,
    min: number,
    max: number,
) {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
        return fallback;
    }

    return Math.min(
        Math.max(parsed, min),
        max,
    );
}

function parseStatus(
    value: string | null,
): LowStockStatus {
    if (
        value === "out_of_stock" ||
        value === "critical" ||
        value === "low_stock"
    ) {
        return value;
    }

    return "all";
}

export async function GET(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
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
            request.nextUrl.searchParams;

        const page = parseInteger(
            params.get("page"),
            DEFAULT_PAGE,
            1,
            10_000,
        );

        const limit = parseInteger(
            params.get("limit"),
            DEFAULT_LIMIT,
            1,
            MAX_LIMIT,
        );

        const search =
            params.get("search")?.trim() ?? "";

        const status =
            parseStatus(
                params.get("status"),
            );

        const baseFilters = [
            eq(
                products.organizationId,
                organizationId,
            ),
            isNull(products.deletedAt),
            lte(
                products.stockQuantity,
                products.reorderLevel,
            ),
        ];

        if (search) {
            baseFilters.push(
                or(
                    ilike(
                        products.name,
                        `%${search}%`,
                    ),
                    ilike(
                        products.sku,
                        `%${search}%`,
                    ),
                )!,
            );
        }

        const statusFilters = [
            ...baseFilters,
        ];

        if (status === "out_of_stock") {
            statusFilters.push(
                eq(
                    products.stockQuantity,
                    0,
                ),
            );
        }

        if (status === "critical") {
            statusFilters.push(
                gt(
                    products.stockQuantity,
                    0,
                ),
                lte(
                    products.stockQuantity,
                    // Critical means 50% or less of the reorder level.
                    // For odd reorder levels, this intentionally keeps
                    // the database comparison simple and predictable.
                    products.reorderLevel,
                ),
            );
        }

        if (status === "low_stock") {
            statusFilters.push(
                gt(
                    products.stockQuantity,
                    0,
                ),
            );
        }

        const [
            totalResult,
            outOfStockResult,
            criticalResult,
            lowStockResult,
        ] = await Promise.all([
            db
                .select({
                    count: count(),
                })
                .from(products)
                .where(
                    and(
                        ...baseFilters,
                    ),
                ),

            db
                .select({
                    count: count(),
                })
                .from(products)
                .where(
                    and(
                        ...baseFilters,
                        eq(
                            products.stockQuantity,
                            0,
                        ),
                    ),
                ),

            db
                .select({
                    count: count(),
                })
                .from(products)
                .where(
                    and(
                        ...baseFilters,
                        gt(
                            products.stockQuantity,
                            0,
                        ),
                        lte(
                            products.stockQuantity,
                            products.reorderLevel,
                        ),
                    ),
                ),

            db
                .select({
                    count: count(),
                })
                .from(products)
                .where(
                    and(
                        ...baseFilters,
                        gt(
                            products.stockQuantity,
                            0,
                        ),
                    ),
                ),
        ]);

        const [
            rows,
        ] = await Promise.all([
            db
                .select({
                    id: products.id,

                    name: products.name,

                    sku: products.sku,

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
                .from(products)
                .where(
                    and(
                        ...statusFilters,
                    ),
                )
                .orderBy(
                    products.stockQuantity,
                )
                .limit(limit)
                .offset(
                    (page - 1) * limit,
                ),
        ]);

        const total =
            Number(
                totalResult[0]?.count ?? 0,
            );

        const outOfStock =
            Number(
                outOfStockResult[0]?.count ??
                0,
            );

        const critical =
            Number(
                criticalResult[0]?.count ??
                0,
            );

        const lowStock =
            Number(
                lowStockResult[0]?.count ??
                0,
            );

        const totalPages =
            Math.max(
                Math.ceil(
                    total / limit,
                ),
                1,
            );

        const items = rows.map(
            (product) => {
                const stockQuantity =
                    Number(
                        product.stockQuantity,
                    );

                const reorderLevel =
                    Number(
                        product.reorderLevel,
                    );

                let productStatus:
                    | "out_of_stock"
                    | "critical"
                    | "low_stock";

                if (
                    stockQuantity <= 0
                ) {
                    productStatus =
                        "out_of_stock";
                } else if (
                    stockQuantity <=
                    reorderLevel
                ) {
                    productStatus =
                        "critical";
                } else {
                    productStatus =
                        "low_stock";
                }

                return {
                    ...product,

                    purchasePrice:
                        Number(
                            product.purchasePrice,
                        ),

                    sellingPrice:
                        Number(
                            product.sellingPrice,
                        ),

                    stockQuantity,

                    reorderLevel,

                    shortage:
                        Math.max(
                            reorderLevel -
                            stockQuantity,
                            0,
                        ),

                    status:
                    productStatus,

                    stockPercentage:
                        reorderLevel > 0
                            ? Number(
                                (
                                    (stockQuantity /
                                        reorderLevel) *
                                    100
                                ).toFixed(1),
                            )
                            : 0,
                };
            },
        );

        return apiSuccess({
            items,

            summary: {
                total,
                outOfStock,
                critical,
                lowStock,
            },

            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage:
                    page <
                    totalPages,
                hasPreviousPage:
                    page > 1,
            },
        });
    } catch (error) {
        console.error(
            "[GET /api/inventory/low-stock]",
            error,
        );

        return apiError(
            "Internal server error.",
            500,
        );
    }
}