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

type SaleItemInsert =
    typeof saleItems.$inferInsert;

function createError(
    message: string,
    status: number,
): Error & {
    status: number;
} {
    return Object.assign(
        new Error(message),
        {
            status,
        },
    );
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

function isValidUuid(
    value: string,
): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function parsePositiveInteger(
    value: unknown,
): number | null {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const normalized =
        typeof value === "string"
            ? value.trim()
            : String(value);

    if (!/^\d+$/.test(normalized)) {
        return null;
    }

    const parsed = Number(normalized);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed <= 0
    ) {
        return null;
    }

    return parsed;
}

function parseMoneyToCents(
    value: unknown,
): number | null {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const normalized = String(value).trim();

    if (
        !/^\d+(?:\.\d{1,2})?$/.test(
            normalized,
        )
    ) {
        return null;
    }

    const [
        whole,
        decimal = "",
    ] = normalized.split(".");

    const cents = Number(
        `${whole}${decimal.padEnd(2, "0")}`,
    );

    if (!Number.isSafeInteger(cents)) {
        return null;
    }

    return cents;
}

function centsToMoney(
    cents: number,
): string {
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

        const { id } =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid sale ID.",
                400,
            );
        }

        const [sale] =
            await db
                .select({
                    id: sales.id,

                    organizationId:
                    sales.organizationId,

                    customerId:
                    sales.customerId,

                    customerName:
                    customers.name,

                    saleNumber:
                    sales.saleNumber,

                    status:
                    sales.status,

                    totalAmount:
                    sales.totalAmount,

                    createdBy:
                    sales.createdBy,

                    createdAt:
                    sales.createdAt,

                    updatedAt:
                    sales.updatedAt,
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

        const items =
            await db
                .select({
                    id: saleItems.id,

                    productId:
                    saleItems.productId,

                    productName:
                    products.name,

                    sku:
                    products.sku,

                    quantity:
                    saleItems.quantity,

                    unitPrice:
                    saleItems.unitPrice,

                    subtotal:
                    saleItems.subtotal,
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
 * Supported:
 * - saleNumber
 * - customerId
 * - items
 *
 * Status is intentionally immutable here.
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

        const { id } =
            await context.params;

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
                    /*
                     * 1. Load sale
                     */
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
                        throw createError(
                            "Sale not found.",
                            404,
                        );
                    }

                    /*
                     * 2. Only draft sales
                     */
                    if (
                        existing.status !==
                        "draft"
                    ) {
                        throw createError(
                            "Only draft sales can be updated.",
                            409,
                        );
                    }

                    /*
                     * 3. Status cannot be changed
                     */
                    if ("status" in input) {
                        throw createError(
                            "Use the confirm or cancel endpoint to change sale status.",
                            400,
                        );
                    }

                    const updateSale:
                        Partial<
                            typeof sales.$inferInsert
                        > = {};

                    let hasChanges =
                        false;

                    /*
                     * 4. saleNumber
                     */
                    if (
                        "saleNumber" in input
                    ) {
                        if (
                            typeof input.saleNumber !==
                            "string" ||
                            !input.saleNumber.trim()
                        ) {
                            throw createError(
                                "Sale number must be a non-empty string.",
                                400,
                            );
                        }

                        const saleNumber =
                            input.saleNumber.trim();

                        if (
                            saleNumber.length >
                            50
                        ) {
                            throw createError(
                                "Sale number must not exceed 50 characters.",
                                400,
                            );
                        }

                        if (
                            saleNumber !==
                            existing.saleNumber
                        ) {
                            const [duplicate] =
                                await tx
                                    .select({
                                        id:
                                        sales.id,
                                    })
                                    .from(sales)
                                    .where(
                                        and(
                                            eq(
                                                sales.organizationId,
                                                organizationId,
                                            ),
                                            eq(
                                                sales.saleNumber,
                                                saleNumber,
                                            ),
                                        ),
                                    )
                                    .limit(1);

                            if (
                                duplicate &&
                                duplicate.id !==
                                existing.id
                            ) {
                                throw createError(
                                    `Sale number "${saleNumber}" already exists.`,
                                    409,
                                );
                            }

                            updateSale.saleNumber =
                                saleNumber;

                            hasChanges = true;
                        }
                    }

                    /*
                     * 5. customerId
                     */
                    if (
                        "customerId" in input
                    ) {
                        if (
                            typeof input.customerId !==
                            "string"
                        ) {
                            throw createError(
                                "Invalid customer ID.",
                                400,
                            );
                        }

                        const customerId =
                            input.customerId.trim();

                        if (
                            !isValidUuid(
                                customerId,
                            )
                        ) {
                            throw createError(
                                "Invalid customer ID.",
                                400,
                            );
                        }

                        if (
                            customerId !==
                            existing.customerId
                        ) {
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
                                            isNull(
                                                customers.deletedAt,
                                            ),
                                        ),
                                    )
                                    .limit(1);

                            if (!customer) {
                                throw createError(
                                    "Customer not found.",
                                    404,
                                );
                            }

                            updateSale.customerId =
                                customerId;

                            hasChanges = true;
                        }
                    }

                    /*
                     * 6. Items
                     */
                    if ("items" in input) {
                        if (
                            !Array.isArray(
                                input.items,
                            ) ||
                            input.items.length ===
                            0
                        ) {
                            throw createError(
                                "At least one sale item is required.",
                                400,
                            );
                        }

                        const parsedItems:
                            Array<{
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
                                Array.isArray(raw)
                            ) {
                                throw createError(
                                    "Invalid sale item.",
                                    400,
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
                                parsePositiveInteger(
                                    item.quantity,
                                );

                            if (
                                !isValidUuid(
                                    productId,
                                )
                            ) {
                                throw createError(
                                    "Invalid product ID.",
                                    400,
                                );
                            }

                            if (
                                quantity === null
                            ) {
                                throw createError(
                                    "Sale quantity must be a positive integer.",
                                    400,
                                );
                            }

                            if (
                                productIds.has(
                                    productId,
                                )
                            ) {
                                throw createError(
                                    "A product cannot appear more than once in the same sale.",
                                    400,
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

                        /*
                         * Fetch products
                         */
                        const fetchedProducts =
                            await tx
                                .select({
                                    id:
                                    products.id,

                                    sellingPrice:
                                    products.sellingPrice,
                                })
                                .from(products)
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
                            throw createError(
                                "One or more products were not found or are archived.",
                                404,
                            );
                        }

                        const productMap =
                            new Map(
                                fetchedProducts.map(
                                    (product) => [
                                        product.id,
                                        product,
                                    ],
                                ),
                            );

                        let totalCents =
                            0;

                        const newSaleItems:
                            SaleItemInsert[] =
                            [];

                        for (
                            const item of
                            parsedItems
                            ) {
                            const product =
                                productMap.get(
                                    item.productId,
                                );

                            if (!product) {
                                throw createError(
                                    "Product not found.",
                                    404,
                                );
                            }

                            const price =
                                parseMoneyToCents(
                                    product.sellingPrice,
                                );

                            if (
                                price === null ||
                                price < 0
                            ) {
                                throw createError(
                                    "Invalid product selling price.",
                                    500,
                                );
                            }

                            if (
                                item.quantity >
                                Math.floor(
                                    Number.MAX_SAFE_INTEGER /
                                    Math.max(
                                        price,
                                        1,
                                    ),
                                )
                            ) {
                                throw createError(
                                    "Sale amount is too large.",
                                    400,
                                );
                            }

                            const subtotal =
                                price *
                                item.quantity;

                            if (
                                !Number.isSafeInteger(
                                    subtotal,
                                )
                            ) {
                                throw createError(
                                    "Sale item subtotal is too large.",
                                    400,
                                );
                            }

                            totalCents +=
                                subtotal;

                            if (
                                !Number.isSafeInteger(
                                    totalCents,
                                )
                            ) {
                                throw createError(
                                    "Sale total is too large.",
                                    400,
                                );
                            }

                            /*
                             * quantity remains a number.
                             */
                            const saleItem:
                                SaleItemInsert =
                                {
                                    saleId:
                                    existing.id,

                                    productId:
                                    item.productId,

                                    quantity:
                                    item.quantity,

                                    unitPrice:
                                        centsToMoney(
                                            price,
                                        ),

                                    subtotal:
                                        centsToMoney(
                                            subtotal,
                                        ),
                                };

                            newSaleItems.push(
                                saleItem,
                            );
                        }

                        /*
                         * Replace existing items.
                         */
                        await tx
                            .delete(saleItems)
                            .where(
                                eq(
                                    saleItems.saleId,
                                    existing.id,
                                ),
                            );

                        await tx
                            .insert(saleItems)
                            .values(
                                newSaleItems,
                            );

                        updateSale.totalAmount =
                            centsToMoney(
                                totalCents,
                            );

                        hasChanges = true;
                    }

                    /*
                     * 7. Check changes
                     */
                    if (!hasChanges) {
                        throw createError(
                            "No fields to update.",
                            400,
                        );
                    }

                    updateSale.updatedAt =
                        new Date();

                    /*
                     * 8. Update sale
                     */
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
                        throw createError(
                            "Failed to update sale.",
                            500,
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