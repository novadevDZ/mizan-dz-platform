import {NextRequest} from "next/server";
import {
    and,
    count,
    desc,
    eq,
    ilike,
    isNull,
    or,
} from "drizzle-orm";

import {db} from "@/src/db";
import {products} from "@/src/db/schema/products";

import {requirePermission} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseInteger(
    value: string | null,
    fallback: number,
    min = 1,
    max?: number,
) {
    if (value === null) {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
        return fallback;
    }

    if (parsed < min) {
        return min;
    }

    if (
        max !== undefined &&
        parsed > max
    ) {
        return max;
    }

    return parsed;
}

function getErrorStatus(
    error: unknown,
): number | null {
    if (
        error instanceof Error &&
        "status" in error &&
        typeof error.status === "number"
    ) {
        return error.status;
    }

    return null;
}

/**
 * POST /api/products
 */
export async function POST(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "products",
            "create",
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
            body as Record<string, unknown>;

        const name =
            typeof input.name === "string"
                ? input.name.trim()
                : "";

        const sku =
            typeof input.sku === "string"
                ? input.sku.trim() || null
                : null;

        const description =
            typeof input.description ===
            "string"
                ? input.description.trim() ||
                null
                : null;

        const purchasePrice =
            typeof input.purchasePrice ===
            "string" ||
            typeof input.purchasePrice ===
            "number"
                ? Number(input.purchasePrice)
                : NaN;

        const sellingPrice =
            typeof input.sellingPrice ===
            "string" ||
            typeof input.sellingPrice ===
            "number"
                ? Number(input.sellingPrice)
                : NaN;

        const stockQuantity =
            typeof input.stockQuantity ===
            "string" ||
            typeof input.stockQuantity ===
            "number"
                ? Number(input.stockQuantity)
                : NaN;

        if (!name) {
            return apiError(
                "Product name is required.",
                400,
            );
        }

        if (
            !Number.isFinite(
                purchasePrice,
            ) ||
            purchasePrice < 0
        ) {
            return apiError(
                "Purchase price must be a valid non-negative number.",
                400,
            );
        }

        if (
            !Number.isFinite(
                sellingPrice,
            ) ||
            sellingPrice < 0
        ) {
            return apiError(
                "Selling price must be a valid non-negative number.",
                400,
            );
        }

        if (
            !Number.isInteger(
                stockQuantity,
            ) ||
            stockQuantity < 0
        ) {
            return apiError(
                "Stock quantity must be a valid non-negative integer.",
                400,
            );
        }

        const [product] =
            await db
                .insert(products)
                .values({
                    organizationId,
                    name,
                    sku,
                    description,
                    purchasePrice:
                        purchasePrice.toFixed(2),
                    sellingPrice:
                        sellingPrice.toFixed(2),
                    stockQuantity,
                })
                .returning({
                    id: products.id,
                    organizationId:
                    products.organizationId,
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
                    createdAt:
                    products.createdAt,
                    updatedAt:
                    products.updatedAt,
                    deletedAt:
                    products.deletedAt,
                });

        if (!product) {
            return apiError(
                "Failed to create product.",
                500,
            );
        }

        return apiSuccess(
            product,
            201,
        );
    } catch (error) {
        console.error(
            "[POST /api/products]",
            error,
        );

        const status =
            getErrorStatus(error);

        if (status !== null) {
            return apiError(
                error instanceof Error
                    ? error.message
                    : "Request failed.",
                status,
            );
        }

        return apiError(
            "Internal server error.",
            500,
        );
    }
}

/**
 * GET /api/products
 */
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

        const search =
            params.get("search")?.trim() ?? "";

        const page = parseInteger(
            params.get("page"),
            DEFAULT_PAGE,
            1,
        );

        const limit = parseInteger(
            params.get("limit"),
            DEFAULT_LIMIT,
            1,
            MAX_LIMIT,
        );

        const offset =
            (page - 1) * limit;

        const filters = [
            eq(
                products.organizationId,
                organizationId,
            ),
            isNull(
                products.deletedAt,
            ),
        ];

        if (search) {
            const searchFilter = or(
                ilike(
                    products.name,
                    `%${search}%`,
                ),
                ilike(
                    products.sku,
                    `%${search}%`,
                ),
                ilike(
                    products.description,
                    `%${search}%`,
                ),
            );

            if (searchFilter) {
                filters.push(
                    searchFilter,
                );
            }
        }

        const whereClause =
            and(...filters);

        const [
            items,
            countResult,
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
                    createdAt:
                    products.createdAt,
                    updatedAt:
                    products.updatedAt,
                })
                .from(products)
                .where(whereClause)
                .orderBy(
                    desc(
                        products.createdAt,
                    ),
                )
                .limit(limit)
                .offset(offset),

            db
                .select({
                    total: count(),
                })
                .from(products)
                .where(whereClause),
        ]);

        const total =
            Number(
                countResult[0]?.total ?? 0,
            );

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total / limit,
                );

        return apiSuccess({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage:
                    page < totalPages,
                hasPreviousPage:
                    page > 1,
            },
        });
    } catch (error) {
        console.error(
            "[GET /api/products]",
            error,
        );

        const status =
            getErrorStatus(error);

        if (status !== null) {
            return apiError(
                error instanceof Error
                    ? error.message
                    : "Request failed.",
                status,
            );
        }

        return apiError(
            "Internal server error.",
            500,
        );
    }
}