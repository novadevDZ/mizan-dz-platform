import {NextRequest} from "next/server";

import {
    and,
    count,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    isNull,
    or,
    sql,
} from "drizzle-orm";

import {db} from "@/src/db";

import {
    customers,
    products,
    sales,
    saleItems,
    invoices,
    invoiceItems,
    inventoryMovements,
} from "@/src/db/schema";

import {requirePermission} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type SaleStatus =
    typeof sales.$inferSelect.status;

type SaleCreationStatus =
    Extract<SaleStatus, "draft" | "confirmed">;

type SaleItemInput = {
    productId: unknown;
    quantity: unknown;
};

type SaleError = Error & {
    status?: number;
    code?: string;
};

type PreparedSaleItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
};

type SaleInsert =
    typeof sales.$inferInsert;

type SaleItemInsert =
    typeof saleItems.$inferInsert;

type InvoiceInsert =
    typeof invoices.$inferInsert;

type InvoiceItemInsert =
    typeof invoiceItems.$inferInsert;

type InventoryMovementInsert =
    typeof inventoryMovements.$inferInsert;

function createSaleError(
    message: string,
    status: number,
): SaleError {
    const error =
        new Error(message) as SaleError;

    error.status = status;

    return error;
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

function parseInteger(
    value: string | null,
    fallback: number,
    min = 1,
    max?: number,
): number {
    if (value === null) {
        return fallback;
    }

    const parsed =
        Number(value);

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

/**
 * Parse a positive integer while preserving
 * the actual database type expected by Drizzle.
 */
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

    const parsed =
        Number(normalized);

    if (
        !Number.isSafeInteger(parsed) ||
        parsed <= 0
    ) {
        return null;
    }

    return parsed;
}

function isValidUuid(
    value: string,
): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
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

    const normalized =
        String(value).trim();

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
    ] =
        normalized.split(".");

    const cents =
        Number(
            `${whole}${decimal.padEnd(2, "0")}`,
        );

    if (
        !Number.isSafeInteger(cents)
    ) {
        return null;
    }

    return cents;
}

function centsToMoney(
    cents: number,
): string {
    return (
        cents / 100
    ).toFixed(2);
}

function parseDueAt(
    value: unknown,
): Date | null {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value !== "string"
    ) {
        throw createSaleError(
            "dueAt must be a valid ISO date string.",
            400,
        );
    }

    const normalized =
        value.trim();

    if (!normalized) {
        return null;
    }

    const parsed =
        new Date(normalized);

    if (
        Number.isNaN(
            parsed.getTime(),
        )
    ) {
        throw createSaleError(
            "dueAt must be a valid ISO date.",
            400,
        );
    }

    return parsed;
}

function generateInvoiceNumber(
    saleId: string,
): string {
    const year =
        new Date().getFullYear();

    const shortId =
        saleId
            .replace(/-/g, "")
            .slice(0, 8)
            .toUpperCase();

    return `INV-${year}-${shortId}`;
}

function isUniqueViolation(
    error: unknown,
): boolean {
    if (
        !error ||
        typeof error !== "object"
    ) {
        return false;
    }

    const candidate =
        error as {
            code?: unknown;
            cause?: {
                code?: unknown;
            };
        };

    return (
        candidate.code === "23505" ||
        candidate.cause?.code === "23505"
    );
}

/**
 * POST /api/sales
 */
export async function POST(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } =
            await requirePermission(
                "sales",
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
            body as Record<
                string,
                unknown
            >;

        const saleNumber =
            typeof input.saleNumber ===
            "string"
                ? input.saleNumber.trim()
                : "";

        const customerId =
            typeof input.customerId ===
            "string"
                ? input.customerId.trim()
                : "";

        const status:
            SaleCreationStatus | null =
            input.status === "draft" ||
            input.status === "confirmed"
                ? input.status
                : null;

        const rawItems =
            Array.isArray(input.items)
                ? input.items
                : null;

        let dueAt:
            Date | null = null;

        try {
            dueAt =
                parseDueAt(
                    input.dueAt,
                );
        } catch (
            error
            ) {
            const statusCode =
                getErrorStatus(
                    error,
                );

            if (
                statusCode !== null &&
                error instanceof Error
            ) {
                return apiError(
                    error.message,
                    statusCode,
                );
            }

            return apiError(
                "Invalid due date.",
                400,
            );
        }

        if (!saleNumber) {
            return apiError(
                "Sale number is required.",
                400,
            );
        }

        if (
            saleNumber.length >
            50
        ) {
            return apiError(
                "Sale number must not exceed 50 characters.",
                400,
            );
        }

        if (
            !customerId ||
            !isValidUuid(
                customerId,
            )
        ) {
            return apiError(
                "A valid customer ID is required.",
                400,
            );
        }

        if (!status) {
            return apiError(
                "Sale status must be draft or confirmed.",
                400,
            );
        }

        if (
            !rawItems ||
            rawItems.length === 0
        ) {
            return apiError(
                "At least one sale item is required.",
                400,
            );
        }

        if (
            dueAt &&
            dueAt.getTime() <
            Date.now()
        ) {
            return apiError(
                "Due date cannot be in the past.",
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
            const rawItem of
            rawItems
            ) {
            if (
                typeof rawItem !==
                "object" ||
                rawItem === null ||
                Array.isArray(
                    rawItem,
                )
            ) {
                return apiError(
                    "Invalid sale item.",
                    400,
                );
            }

            const item =
                rawItem as SaleItemInput;

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
                !productId ||
                !isValidUuid(
                    productId,
                )
            ) {
                return apiError(
                    "Invalid product ID.",
                    400,
                );
            }

            if (
                quantity === null
            ) {
                return apiError(
                    "Sale quantity must be a positive integer.",
                    400,
                );
            }

            if (
                productIds.has(
                    productId,
                )
            ) {
                return apiError(
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

        const result =
            await db.transaction(
                async (tx) => {
                    /*
                     * 1. Validate customer
                     */
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
                        throw createSaleError(
                            "Customer not found.",
                            404,
                        );
                    }

                    /*
                     * 2. Check duplicate sale number
                     */
                    const [
                        existingSale,
                    ] =
                        await tx
                            .select({
                                id:
                                sales.id,
                            })
                            .from(
                                sales,
                            )
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
                        existingSale
                    ) {
                        throw createSaleError(
                            `Sale number "${saleNumber}" already exists.`,
                            409,
                        );
                    }

                    /*
                     * 3. Fetch products
                     */
                    const fetchedProducts =
                        await tx
                            .select({
                                id:
                                products.id,

                                name:
                                products.name,

                                sellingPrice:
                                products.sellingPrice,

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
                        throw createSaleError(
                            "One or more products were not found or are archived.",
                            404,
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

                    /*
                     * 4. Calculate totals
                     */
                    let totalCents =
                        0;

                    const preparedItems:
                        PreparedSaleItem[] =
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
                            throw createSaleError(
                                "Product not found.",
                                404,
                            );
                        }

                        const unitPriceCents =
                            parseMoneyToCents(
                                product.sellingPrice,
                            );

                        if (
                            unitPriceCents ===
                            null ||
                            unitPriceCents <
                            0
                        ) {
                            throw createSaleError(
                                `Invalid selling price for product "${product.name}".`,
                                500,
                            );
                        }

                        if (
                            item.quantity >
                            Math.floor(
                                Number.MAX_SAFE_INTEGER /
                                Math.max(
                                    unitPriceCents,
                                    1,
                                ),
                            )
                        ) {
                            throw createSaleError(
                                "Sale amount is too large.",
                                400,
                            );
                        }

                        const subtotalCents =
                            unitPriceCents *
                            item.quantity;

                        if (
                            !Number.isSafeInteger(
                                subtotalCents,
                            )
                        ) {
                            throw createSaleError(
                                "Sale amount is too large.",
                                400,
                            );
                        }

                        totalCents +=
                            subtotalCents;

                        if (
                            !Number.isSafeInteger(
                                totalCents,
                            )
                        ) {
                            throw createSaleError(
                                "Sale total is too large.",
                                400,
                            );
                        }

                        preparedItems.push({
                            productId:
                            item.productId,

                            productName:
                            product.name,

                            quantity:
                            item.quantity,

                            unitPriceCents,

                            subtotalCents,
                        });
                    }

                    /*
                     * 5. Insert sale
                     */
                    const saleValues:
                        SaleInsert =
                        {
                            organizationId,

                            customerId,

                            saleNumber,

                            status,

                            totalAmount:
                                centsToMoney(
                                    totalCents,
                                ),
                        };

                    let insertedSale:
                        typeof sales.$inferSelect;

                    try {
                        const [
                            sale,
                        ] =
                            await tx
                                .insert(
                                    sales,
                                )
                                .values(
                                    saleValues,
                                )
                                .returning();

                        if (!sale) {
                            throw createSaleError(
                                "Failed to create sale.",
                                500,
                            );
                        }

                        insertedSale =
                            sale;
                    } catch (
                        error
                        ) {
                        if (
                            isUniqueViolation(
                                error,
                            )
                        ) {
                            throw createSaleError(
                                `Sale number "${saleNumber}" already exists.`,
                                409,
                            );
                        }

                        throw error;
                    }

                    /*
                     * 6. Insert sale items
                     *
                     * saleItems.quantity must be NUMBER.
                     */
                    const saleItemValues:
                        SaleItemInsert[] =
                        preparedItems.map(
                            (
                                item,
                            ) => ({
                                saleId:
                                insertedSale.id,

                                productId:
                                item.productId,

                                quantity:
                                item.quantity,

                                unitPrice:
                                    centsToMoney(
                                        item.unitPriceCents,
                                    ),

                                subtotal:
                                    centsToMoney(
                                        item.subtotalCents,
                                    ),
                            }),
                        );

                    await tx
                        .insert(
                            saleItems,
                        )
                        .values(
                            saleItemValues,
                        );

                    /*
                     * 7. Confirmed sale:
                     * update stock and create
                     * inventory movements.
                     */
                    if (
                        status ===
                        "confirmed"
                    ) {
                        for (
                            const item of
                            preparedItems
                            ) {
                            const [
                                updatedProduct,
                            ] =
                                await tx
                                    .update(
                                        products,
                                    )
                                    .set({
                                        stockQuantity:
                                            sql`${products.stockQuantity}
                                            -
                                            ${item.quantity}`,

                                        updatedAt:
                                            new Date(),
                                    })
                                    .where(
                                        and(
                                            eq(
                                                products.id,
                                                item.productId,
                                            ),

                                            eq(
                                                products.organizationId,
                                                organizationId,
                                            ),

                                            isNull(
                                                products.deletedAt,
                                            ),

                                            gte(
                                                products.stockQuantity,
                                                item.quantity,
                                            ),
                                        ),
                                    )
                                    .returning({
                                        id:
                                        products.id,

                                        stockQuantity:
                                        products.stockQuantity,

                                        purchasePrice:
                                        products.purchasePrice,
                                    });

                            if (
                                !updatedProduct
                            ) {
                                throw createSaleError(
                                    `Insufficient stock for product "${item.productName}".`,
                                    409,
                                );
                            }

                            const balanceAfter =
                                Number(
                                    updatedProduct.stockQuantity,
                                );

                            if (
                                !Number.isInteger(
                                    balanceAfter,
                                )
                            ) {
                                throw createSaleError(
                                    "Invalid resulting stock quantity.",
                                    500,
                                );
                            }

                            /*
                             * quantityChange must be NUMBER.
                             */
                            const quantityChange =
                                -item.quantity;

                            const balanceBefore =
                                balanceAfter -
                                quantityChange;

                            if (
                                !Number.isInteger(
                                    balanceBefore,
                                ) ||
                                balanceBefore <
                                0
                            ) {
                                throw createSaleError(
                                    "Invalid stock balance calculation.",
                                    500,
                                );
                            }

                            /*
                             * inventoryMovements.quantity
                             * must be NUMBER.
                             */
                            const movementValues:
                                InventoryMovementInsert =
                                {
                                    organizationId,

                                    productId:
                                    item.productId,

                                    type:
                                        "sale",

                                    referenceType:
                                        "sale",

                                    referenceId:
                                    insertedSale.id,

                                    quantity:
                                    item.quantity,

                                    quantityChange,

                                    balanceBefore,

                                    balanceAfter,

                                    unitCost:
                                    updatedProduct.purchasePrice,

                                    reason:
                                        `Sale ${insertedSale.saleNumber}`,

                                    referenceNumber:
                                    insertedSale.saleNumber,

                                    createdBy:
                                    insertedSale.createdBy,
                                };

                            const [
                                movement,
                            ] =
                                await tx
                                    .insert(
                                        inventoryMovements,
                                    )
                                    .values(
                                        movementValues,
                                    )
                                    .returning();

                            if (
                                !movement
                            ) {
                                throw createSaleError(
                                    "Failed to create inventory movement.",
                                    500,
                                );
                            }
                        }
                    }

                    /*
                     * 8. Create invoice
                     */
                    const invoiceStatus =
                        status ===
                        "confirmed"
                            ? "issued"
                            : "draft";

                    const now =
                        new Date();

                    const invoiceNumber =
                        generateInvoiceNumber(
                            insertedSale.id,
                        );

                    const invoiceValues:
                        InvoiceInsert =
                        {
                            organizationId:
                            insertedSale.organizationId,

                            saleId:
                            insertedSale.id,

                            customerId:
                            insertedSale.customerId,

                            invoiceNumber,

                            status:
                            invoiceStatus,

                            issuedAt:
                                status ===
                                "confirmed"
                                    ? now
                                    : null,

                            dueAt,

                            subtotal:
                                centsToMoney(
                                    totalCents,
                                ),

                            discount:
                                "0.00",

                            total:
                                centsToMoney(
                                    totalCents,
                                ),

                            notes:
                                null,

                            createdAt:
                            now,

                            updatedAt:
                            now,
                        };

                    let insertedInvoice:
                        typeof invoices.$inferSelect;

                    try {
                        const [
                            invoice,
                        ] =
                            await tx
                                .insert(
                                    invoices,
                                )
                                .values(
                                    invoiceValues,
                                )
                                .returning();

                        if (!invoice) {
                            throw createSaleError(
                                "Failed to create invoice.",
                                500,
                            );
                        }

                        insertedInvoice =
                            invoice;
                    } catch (
                        error
                        ) {
                        if (
                            isUniqueViolation(
                                error,
                            )
                        ) {
                            throw createSaleError(
                                `Invoice number "${invoiceNumber}" already exists.`,
                                409,
                            );
                        }

                        throw error;
                    }

                    /*
                     * 9. Create invoice items
                     *
                     * IMPORTANT:
                     * invoiceItems.quantity in your
                     * current schema is a STRING.
                     *
                     * Do NOT change this to:
                     * quantity: item.quantity
                     *
                     * because that creates the opposite
                     * TypeScript error.
                     */
                    const invoiceItemValues:
                        InvoiceItemInsert[] =
                        preparedItems.map(
                            (
                                item,
                            ) => ({
                                invoiceId:
                                insertedInvoice.id,

                                productId:
                                item.productId,

                                productName:
                                item.productName,

                                description:
                                    null,

                                quantity:
                                    String(
                                        item.quantity,
                                    ),

                                unitPrice:
                                    centsToMoney(
                                        item.unitPriceCents,
                                    ),

                                subtotal:
                                    centsToMoney(
                                        item.subtotalCents,
                                    ),
                            }),
                        );

                    await tx
                        .insert(
                            invoiceItems,
                        )
                        .values(
                            invoiceItemValues,
                        );

                    /*
                     * 10. Return result
                     */
                    return {
                        sale:
                        insertedSale,

                        invoice:
                        insertedInvoice,

                        total:
                            centsToMoney(
                                totalCents,
                            ),
                    };
                },
            );

        return apiSuccess(
            result,
            201,
        );
    } catch (
        error
        ) {
        console.error(
            "[POST /api/sales]",
            error,
        );

        const status =
            getErrorStatus(
                error,
            );

        if (
            status !== null
        ) {
            return apiError(
                error instanceof Error
                    ? error.message
                    : "Request failed.",
                status,
            );
        }

        if (
            isUniqueViolation(
                error,
            )
        ) {
            return apiError(
                "A unique constraint was violated.",
                409,
            );
        }

        return apiError(
            "Internal server error.",
            500,
        );
    }
}

/**
 * GET /api/sales
 */
export async function GET(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } =
            await requirePermission(
                "sales",
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
            params
                .get("search")
                ?.trim() ??
            "";

        const status =
            params.get(
                "status",
            );

        const page =
            parseInteger(
                params.get("page"),
                DEFAULT_PAGE,
                1,
            );

        const limit =
            parseInteger(
                params.get("limit"),
                DEFAULT_LIMIT,
                1,
                MAX_LIMIT,
            );

        const offset =
            (page - 1) *
            limit;

        const filters = [
            eq(
                sales.organizationId,
                organizationId,
            ),
        ];

        const saleStatus =
            status === "draft" ||
            status === "confirmed" ||
            status === "canceled"
                ? status
                : null;

        if (
            saleStatus !== null
        ) {
            filters.push(
                eq(
                    sales.status,
                    saleStatus,
                ),
            );
        }

        if (search) {
            const searchFilter =
                or(
                    ilike(
                        sales.saleNumber,
                        `%${search}%`,
                    ),

                    ilike(
                        customers.name,
                        `%${search}%`,
                    ),
                );

            if (
                searchFilter
            ) {
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
        ] =
            await Promise.all([
                db
                    .select({
                        id:
                        sales.id,

                        saleNumber:
                        sales.saleNumber,

                        customerId:
                        sales.customerId,

                        customerName:
                        customers.name,

                        status:
                        sales.status,

                        totalAmount:
                        sales.totalAmount,

                        createdAt:
                        sales.createdAt,

                        updatedAt:
                        sales.updatedAt,
                    })
                    .from(
                        sales,
                    )
                    .leftJoin(
                        customers,
                        and(
                            eq(
                                customers.id,
                                sales.customerId,
                            ),

                            eq(
                                customers.organizationId,
                                organizationId,
                            ),
                        ),
                    )
                    .where(
                        whereClause,
                    )
                    .orderBy(
                        desc(
                            sales.createdAt,
                        ),
                    )
                    .limit(
                        limit,
                    )
                    .offset(
                        offset,
                    ),

                db
                    .select({
                        total:
                            count(),
                    })
                    .from(
                        sales,
                    )
                    .leftJoin(
                        customers,
                        and(
                            eq(
                                customers.id,
                                sales.customerId,
                            ),

                            eq(
                                customers.organizationId,
                                organizationId,
                            ),
                        ),
                    )
                    .where(
                        whereClause,
                    ),
            ]);

        const total =
            Number(
                countResult[0]
                    ?.total ??
                0,
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
                    page <
                    totalPages,

                hasPreviousPage:
                    page >
                    1,
            },
        });
    } catch (
        error
        ) {
        console.error(
            "[GET /api/sales]",
            error,
        );

        const status =
            getErrorStatus(
                error,
            );

        if (
            status !== null
        ) {
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