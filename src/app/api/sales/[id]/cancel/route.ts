import { NextRequest } from "next/server";
import {
    and,
    eq,
    sql,
} from "drizzle-orm";

import { db } from "@/src/db";

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
 * POST /api/sales/:id/cancel
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
            "cancel",
        );

        const { id } =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid sale ID.",
                400,
            );
        }

        const canceledSale =
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
                        "canceled"
                    ) {
                        throw Object.assign(
                            new Error(
                                "Sale is already canceled.",
                            ),
                            { status: 409 },
                        );
                    }

                    /*
                     * Only a confirmed sale affected
                     * inventory.
                     *
                     * Therefore only a confirmed sale
                     * needs stock restoration.
                     */
                    if (
                        sale.status ===
                        "confirmed"
                    ) {
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

                        for (
                            const item of
                            items
                            ) {
                            const [
                                updated,
                            ] =
                                await tx
                                    .update(
                                        products,
                                    )
                                    .set({
                                        stockQuantity:
                                            sql`${products.stockQuantity} + ${item.quantity}`,
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
                                        ),
                                    )
                                    .returning({
                                        id:
                                        products.id,
                                    });

                            if (!updated) {
                                throw Object.assign(
                                    new Error(
                                        "Failed to restore product stock.",
                                    ),
                                    {
                                        status: 409,
                                    },
                                );
                            }
                        }
                    }

                    const [
                        updatedSale,
                    ] =
                        await tx
                            .update(sales)
                            .set({
                                status:
                                    "canceled",
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
                            "Failed to cancel sale.",
                        );
                    }

                    return updatedSale;
                },
            );

        return apiSuccess(
            canceledSale,
        );
    } catch (error) {
        console.error(
            "[POST /api/sales/:id/cancel]",
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