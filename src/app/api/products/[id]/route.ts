import {NextRequest} from "next/server";
import {
    and,
    eq,
    isNull,
} from "drizzle-orm";

import {db} from "@/src/db";
import {products} from "@/src/db/schema/products";

import {requirePermission} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

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

function isValidUuid(
    value: string,
) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

/**
 * GET /api/products/:id
 */
export async function GET(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    },
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

        const {id} =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid product ID.",
                400,
            );
        }

        const [product] =
            await db
                .select({
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
                })
                .from(products)
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
                        isNull(
                            products.deletedAt,
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

        return apiSuccess(
            product,
        );
    } catch (error) {
        console.error(
            "[GET /api/products/:id]",
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
 * PATCH /api/products/:id
 */
export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    },
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "products",
            "update",
        );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const {id} =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid product ID.",
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

        const updateData: {
            name?: string;
            sku?: string | null;
            description?: string | null;
            purchasePrice?: string;
            sellingPrice?: string;
            stockQuantity?: number;
            updatedAt?: Date;
        } = {};

        if ("name" in input) {
            if (
                typeof input.name !==
                "string" ||
                !input.name.trim()
            ) {
                return apiError(
                    "Product name must be a non-empty string.",
                    400,
                );
            }

            updateData.name =
                input.name.trim();
        }

        if ("sku" in input) {
            if (
                input.sku !== null &&
                typeof input.sku !==
                "string"
            ) {
                return apiError(
                    "SKU must be a string or null.",
                    400,
                );
            }

            updateData.sku =
                typeof input.sku ===
                "string"
                    ? input.sku.trim() ||
                    null
                    : null;
        }

        if ("description" in input) {
            if (
                input.description !==
                null &&
                typeof input.description !==
                "string"
            ) {
                return apiError(
                    "Description must be a string or null.",
                    400,
                );
            }

            updateData.description =
                typeof input.description ===
                "string"
                    ? input.description.trim() ||
                    null
                    : null;
        }

        if ("purchasePrice" in input) {
            const value =
                typeof input.purchasePrice ===
                "string" ||
                typeof input.purchasePrice ===
                "number"
                    ? Number(
                        input.purchasePrice,
                    )
                    : NaN;

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                return apiError(
                    "Purchase price must be a valid non-negative number.",
                    400,
                );
            }

            updateData.purchasePrice =
                value.toFixed(2);
        }

        if ("sellingPrice" in input) {
            const value =
                typeof input.sellingPrice ===
                "string" ||
                typeof input.sellingPrice ===
                "number"
                    ? Number(
                        input.sellingPrice,
                    )
                    : NaN;

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                return apiError(
                    "Selling price must be a valid non-negative number.",
                    400,
                );
            }

            updateData.sellingPrice =
                value.toFixed(2);
        }

        if ("stockQuantity" in input) {
            const value =
                typeof input.stockQuantity ===
                "string" ||
                typeof input.stockQuantity ===
                "number"
                    ? Number(
                        input.stockQuantity,
                    )
                    : NaN;

            if (
                !Number.isInteger(value) ||
                value < 0
            ) {
                return apiError(
                    "Stock quantity must be a valid non-negative integer.",
                    400,
                );
            }

            updateData.stockQuantity =
                value;
        }

        if (
            Object.keys(updateData)
                .length === 0
        ) {
            return apiError(
                "No fields to update.",
                400,
            );
        }

        updateData.updatedAt =
            new Date();

        const [product] =
            await db
                .update(products)
                .set(updateData)
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
                        isNull(
                            products.deletedAt,
                        ),
                    ),
                )
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
                });

        if (!product) {
            return apiError(
                "Product not found.",
                404,
            );
        }

        return apiSuccess(
            product,
        );
    } catch (error) {
        console.error(
            "[PATCH /api/products/:id]",
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
 * DELETE /api/products/:id
 *
 * Soft delete / archive.
 */
export async function DELETE(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    },
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "products",
            "delete",
        );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const {id} =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid product ID.",
                400,
            );
        }

        const [product] =
            await db
                .update(products)
                .set({
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                })
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
                        isNull(
                            products.deletedAt,
                        ),
                    ),
                )
                .returning({
                    id: products.id,
                    deletedAt:
                    products.deletedAt,
                });

        if (!product) {
            return apiError(
                "Product not found.",
                404,
            );
        }

        return apiSuccess({
            id: product.id,
            archived: true,
            deletedAt:
            product.deletedAt,
        });
    } catch (error) {
        console.error(
            "[DELETE /api/products/:id]",
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