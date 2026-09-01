import { NextRequest } from "next/server";
import {
    and,
    eq,
    gte,
    isNull,
    sql,
} from "drizzle-orm";

import { db } from "@/src/db/index";

import { sales } from "@/src/db/schema/sales";
import { saleItems } from "@/src/db/schema";
import { products } from "@/src/db/schema/products";

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
 * POST /api/sales/:id/confirm
 */
export async function POST(
    _request: NextRequest,
    context: Context,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
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

        const confirmedSale =
            await db.transaction(
                async (tx) => {
                    const [
                        sale,
                    ] =
                        await tx
                            .select({
                                id: sales.id,
                                status:
                                sales.status,
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

                    if (!sale) {
                        throw Object.assign(
                            new Error(
                                "Sale not found.",
                            ),
                            { status: 404 },
                        );
                    }

                    if (
                        sale.status ===
                        "confirmed"
                    ) {
                        throw Object.assign(
                            new Error(
                                "Sale is already confirmed.",
                            ),
                            { status: 409 },
                        );
                    }

                    if (
                        sale.status ===
                        "canceled"
                    ) {
                        throw Object.assign(
                            new Error(
                                "Canceled sales cannot be confirmed.",
                            ),
                            { status: 409 },
                        );
                    }

                    const items =
                        await tx
                            .select({
                                productId:
                                saleItems.productId,
                                quantity:
                                saleItems.quantity,
                            })
                            .from(
                                saleItems,
                            )
                            .where(
                                eq(
                                    saleItems.saleId,
                                    sale.id,
                                ),
                            );

                    if (
                        items.length === 0
                    ) {
                        throw Object.assign(
                            new Error(
                                "A sale must contain at least one item.",
                            ),
                            { status: 400 },
                        );
                    }

                    for (const item of items) {
                        const [
                            updated,
                        ] =
                            await tx
                                .update(
                                    products,
                                )
                                .set({
                                    stockQuantity:
                                        sql`${products.stockQuantity} - ${item.quantity}`,
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
                                });

                        if (!updated) {
                            throw Object.assign(
                                new Error(
                                    "Insufficient stock or product is no longer available.",
                                ),
                                { status: 409 },
                            );
                        }
                    }

                    const [updatedSale] =
                        await tx
                            .update(sales)
                            .set({
                                status:
                                    "confirmed",
                                updatedAt:
                                    new Date(),
                            })
                            .where(
                                and(
                                    eq(
                                        sales.id,
                                        sale.id,
                                    ),
                                    eq(
                                        sales.organizationId,
                                        organizationId,
                                    ),
                                    eq(
                                        sales.status,
                                        "draft",
                                    ),
                                ),
                            )
                            .returning({
                                id: sales.id,
                                saleNumber:
                                sales.saleNumber,
                                status:
                                sales.status,
                                totalAmount:
                                sales.totalAmount,
                                updatedAt:
                                sales.updatedAt,
                            });

                    if (!updatedSale) {
                        throw new Error(
                            "Failed to confirm sale.",
                        );
                    }

                    return updatedSale;
                },
            );

        return apiSuccess(
            confirmedSale,
        );
    } catch (error) {
        console.error(
            "[POST /api/sales/:id/confirm]",
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