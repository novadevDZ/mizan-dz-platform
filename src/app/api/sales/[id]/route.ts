import { NextRequest } from "next/server";
import {
    and,
    eq,
    inArray,
    isNull,
} from "drizzle-orm";

import { db } from "@/src/db";

import {
    customers,
    products,
    saleItems,
    sales,
} from "@/src/db/schema";

import { requirePermission } from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

type Context = {
    params: Promise<{
        id: string;
    }>;
};

function getErrorStatus(error: unknown): number | null {
    if (
        error instanceof Error &&
        "status" in error &&
        typeof error.status === "number"
    ) {
        return error.status;
    }

    return null;
}

function isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function parseMoneyToCents(value: unknown): number | null {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const normalized = String(value).trim();

    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
        return null;
    }

    const [whole, decimal = ""] = normalized.split(".");

    const cents = Number(
        `${whole}${decimal.padEnd(2, "0")}`,
    );

    return Number.isSafeInteger(cents)
        ? cents
        : null;
}

function centsToMoney(cents: number): string {
    return (cents / 100).toFixed(2);
}

/**
 * GET /api/sales/:id
 */
export async function GET(
    _request: NextRequest,
    context: Context,
) {
    try {
        const { organizationId } =
            await requirePermission(
                "sales",
                "read",
            );

        const { id } = await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid sale ID.",
                400,
            );
        }

        const [sale] = await db
            .select({
                id: sales.id,
                organizationId: sales.organizationId,
                customerId: sales.customerId,
                customerName: customers.name,
                saleNumber: sales.saleNumber,
                status: sales.status,
                totalAmount: sales.totalAmount,
                createdBy: sales.createdBy,
                createdAt: sales.createdAt,
                updatedAt: sales.updatedAt,
            })
            .from(sales)
            .leftJoin(
                customers,
                eq(
                    customers.id,
                    sales.customerId,
                ),
            )
            .where(
                and(
                    eq(
                        sales.id,
                        id,
                    ),
                    eq(
                        sales.organizationId,
                        organizationId,
                    ),
                ),
            )
            .limit(1);

        if (!sale) {
            return apiError(
                "Sale not found.",
                404,
            );
        }

        const items = await db
            .select({
                id: saleItems.id,
                productId: saleItems.productId,
                productName: products.name,
                sku: products.sku,
                quantity: saleItems.quantity,
                unitPrice: saleItems.unitPrice,
                subtotal: saleItems.subtotal,
            })
            .from(saleItems)
            .leftJoin(
                products,
                eq(
                    products.id,
                    saleItems.productId,
                ),
            )
            .where(
                eq(
                    saleItems.saleId,
                    sale.id,
                ),
            );

        return apiSuccess({
            ...sale,
            items,
        });
    } catch (error) {
        console.error(
            "[GET /api/sales/:id]",
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
 * PATCH /api/sales/:id
 *
 * Draft sales only.
 *
 * Status changes are handled by
 * dedicated confirm/cancel endpoints.
 */
export async function PATCH(
    request: NextRequest,
    context: Context,
) {
    try {
        const { organizationId } =
            await requirePermission(
                "sales",
                "update",
            );

        const { id } = await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid sale ID.",
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

        const result =
            await db.transaction(
                async (tx) => {
                    const [existing] =
                        await tx
                            .select({
                                id: sales.id,
                                organizationId:
                                sales.organizationId,
                                customerId:
                                sales.customerId,
                                saleNumber:
                                sales.saleNumber,
                                status:
                                sales.status,
                                totalAmount:
                                sales.totalAmount,
                            })
                            .from(sales)
                            .where(
                                and(
                                    eq(
                                        sales.id,
                                        id,
                                    ),
                                    eq(
                                        sales.organizationId,
                                        organizationId,
                                    ),
                                ),
                            )
                            .limit(1);

                    if (!existing) {
                        throw Object.assign(
                            new Error(
                                "Sale not found.",
                            ),
                            {
                                status: 404,
                            },
                        );
                    }

                    if (
                        existing.status !==
                        "draft"
                    ) {
                        throw Object.assign(
                            new Error(
                                "Only draft sales can be updated.",
                            ),
                            {
                                status: 409,
                            },
                        );
                    }

                    if ("status" in input) {
                        throw Object.assign(
                            new Error(
                                "Use the confirm or cancel endpoint to change sale status.",
                            ),
                            {
                                status: 400,
                            },
                        );
                    }

                    const updateSale: Partial<
                        typeof sales.$inferInsert
                    > = {};

                    let hasChanges = false;

                    /**
                     * saleNumber
                     */
                    if (
                        "saleNumber" in
                        input
                    ) {
                        if (
                            typeof input.saleNumber !==
                            "string" ||
                            !input.saleNumber.trim()
                        ) {
                            throw Object.assign(
                                new Error(
                                    "Sale number must be a non-empty string.",
                                ),
                                {
                                    status: 400,
                                },
                            );
                        }

                        const saleNumber =
                            input.saleNumber.trim();

                        if (
                            saleNumber.length >
                            50
                        ) {
                            throw Object.assign(
                                new Error(
                                    "Sale number must not exceed 50 characters.",
                                ),
                                {
                                    status: 400,
                                },
                            );
                        }

                        updateSale.saleNumber =
                            saleNumber;

                        hasChanges = true;
                    }

                    /**
                     * customerId
                     */
                    if (
                        "customerId" in
                        input
                    ) {
                        if (
                            typeof input.customerId !==
                            "string"
                        ) {
                            throw Object.assign(
                                new Error(
                                    "Invalid customer ID.",
                                ),
                                {
                                    status: 400,
                                },
                            );
                        }

                        const customerId =
                            input.customerId.trim();

                        if (
                            !isValidUuid(
                                customerId,
                            )
                        ) {
                            throw Object.assign(
                                new Error(
                                    "Invalid customer ID.",
                                ),
                                {
                                    status: 400,
                                },
                            );
                        }

                        const [customer] =
                            await tx
                                .select({
                                    id:
                                    customers.id,
                                })
                                .from(
                                    customers,
                                )
                                .where(
                                    and(
                                        eq(
                                            customers.id,
                                            customerId,
                                        ),
                                        eq(
                                            customers.organizationId,
                                            organizationId,
                                        ),
                                    ),
                                )
                                .limit(1);

                        if (!customer) {
                            throw Object.assign(
                                new Error(
                                    "Customer not found.",
                                ),
                                {
                                    status: 404,
                                },
                            );
                        }

                        updateSale.customerId =
                            customerId;

                        hasChanges = true;
                    }

                    /**
                     * items
                     */
                    if ("items" in input) {
                        if (
                            !Array.isArray(
                                input.items,
                            ) ||
                            input.items.length ===
                            0
                        ) {
                            throw Object.assign(
                                new Error(
                                    "At least one sale item is required.",
                                ),
                                {
                                    status: 400,
                                },
                            );
                        }

                        const parsedItems: Array<{
                            productId: string;
                            quantity: number;
                        }> = [];

                        const productIds =
                            new Set<string>();

                        for (
                            const raw of
                            input.items
                            ) {
                            if (
                                typeof raw !==
                                "object" ||
                                raw === null ||
                                Array.isArray(
                                    raw,
                                )
                            ) {
                                throw Object.assign(
                                    new Error(
                                        "Invalid sale item.",
                                    ),
                                    {
                                        status: 400,
                                    },
                                );
                            }

                            const item =
                                raw as Record<
                                    string,
                                    unknown
                                >;

                            const productId =
                                typeof item.productId ===
                                "string"
                                    ? item.productId.trim()
                                    : "";

                            const quantity =
                                typeof item.quantity ===
                                "string" ||
                                typeof item.quantity ===
                                "number"
                                    ? Number(
                                        item.quantity,
                                    )
                                    : NaN;

                            if (
                                !isValidUuid(
                                    productId,
                                )
                            ) {
                                throw Object.assign(
                                    new Error(
                                        "Invalid product ID.",
                                    ),
                                    {
                                        status: 400,
                                    },
                                );
                            }

                            if (
                                !Number.isInteger(
                                    quantity,
                                ) ||
                                quantity <= 0
                            ) {
                                throw Object.assign(
                                    new Error(
                                        "Sale quantity must be a positive integer.",
                                    ),
                                    {
                                        status: 400,
                                    },
                                );
                            }

                            if (
                                productIds.has(
                                    productId,
                                )
                            ) {
                                throw Object.assign(
                                    new Error(
                                        "A product cannot appear more than once in the same sale.",
                                    ),
                                    {
                                        status: 400,
                                    },
                                );
                            }

                            productIds.add(
                                productId,
                            );

                            parsedItems.push({
                                productId,
                                quantity,
                            });
                        }

                        const fetchedProducts =
                            await tx
                                .select({
                                    id:
                                    products.id,
                                    sellingPrice:
                                    products.sellingPrice,
                                })
                                .from(
                                    products,
                                )
                                .where(
                                    and(
                                        eq(
                                            products.organizationId,
                                            organizationId,
                                        ),
                                        inArray(
                                            products.id,
                                            Array.from(
                                                productIds,
                                            ),
                                        ),
                                        isNull(
                                            products.deletedAt,
                                        ),
                                    ),
                                );

                        if (
                            fetchedProducts.length !==
                            parsedItems.length
                        ) {
                            throw Object.assign(
                                new Error(
                                    "One or more products were not found or are archived.",
                                ),
                                {
                                    status: 404,
                                },
                            );
                        }

                        const productMap =
                            new Map(
                                fetchedProducts.map(
                                    (
                                        product,
                                    ) => [
                                        product.id,
                                        product,
                                    ],
                                ),
                            );

                        let totalCents = 0;

                        await tx
                            .delete(
                                saleItems,
                            )
                            .where(
                                eq(
                                    saleItems.saleId,
                                    existing.id,
                                ),
                            );

                        for (
                            const item of
                            parsedItems
                            ) {
                            const product =
                                productMap.get(
                                    item.productId,
                                );

                            if (!product) {
                                throw Object.assign(
                                    new Error(
                                        "Product not found.",
                                    ),
                                    {
                                        status: 404,
                                    },
                                );
                            }

                            const price =
                                parseMoneyToCents(
                                    product.sellingPrice,
                                );

                            if (
                                price ===
                                null
                            ) {
                                throw Object.assign(
                                    new Error(
                                        "Invalid product selling price.",
                                    ),
                                    {
                                        status: 500,
                                    },
                                );
                            }

                            const subtotal =
                                price *
                                item.quantity;

                            totalCents +=
                                subtotal;

                            await tx
                                .insert(
                                    saleItems,
                                )
                                .values({
                                    saleId:
                                    existing.id,

                                    productId:
                                    item.productId,

                                    /*
                                     * quantity is INTEGER
                                     * in PostgreSQL.
                                     *
                                     * Therefore it must be
                                     * passed as number,
                                     * NOT string.
                                     */
                                    quantity:
                                    item.quantity,

                                    /*
                                     * unitPrice is NUMERIC,
                                     * so Drizzle expects
                                     * the string representation.
                                     */
                                    unitPrice:
                                        centsToMoney(
                                            price,
                                        ),

                                    /*
                                     * subtotal is NUMERIC.
                                     */
                                    subtotal:
                                        centsToMoney(
                                            subtotal,
                                        ),
                                });
                        }

                        updateSale.totalAmount =
                            centsToMoney(
                                totalCents,
                            );

                        hasChanges = true;
                    }

                    if (!hasChanges) {
                        throw Object.assign(
                            new Error(
                                "No fields to update.",
                            ),
                            {
                                status: 400,
                            },
                        );
                    }

                    updateSale.updatedAt =
                        new Date();

                    const [updated] =
                        await tx
                            .update(sales)
                            .set(updateSale)
                            .where(
                                and(
                                    eq(
                                        sales.id,
                                        existing.id,
                                    ),
                                    eq(
                                        sales.organizationId,
                                        organizationId,
                                    ),
                                    eq(
                                        sales.status,
                                        existing.status,
                                    ),
                                ),
                            )
                            .returning({
                                id: sales.id,
                                organizationId:
                                sales.organizationId,
                                customerId:
                                sales.customerId,
                                saleNumber:
                                sales.saleNumber,
                                status:
                                sales.status,
                                totalAmount:
                                sales.totalAmount,
                                createdAt:
                                sales.createdAt,
                                updatedAt:
                                sales.updatedAt,
                            });

                    if (!updated) {
                        throw Object.assign(
                            new Error(
                                "Failed to update sale.",
                            ),
                            {
                                status: 500,
                            },
                        );
                    }

                    return updated;
                },
            );

        return apiSuccess(result);
    } catch (error) {
        console.error(
            "[PATCH /api/sales/:id]",
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