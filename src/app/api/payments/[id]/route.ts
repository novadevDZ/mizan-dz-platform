import {NextRequest} from "next/server";
import {
    and,
    eq,
    sql,
} from "drizzle-orm";

import {db} from "@/src/db";

import {payments} from "@/src/db/schema/payments";
import {sales} from "@/src/db/schema/sales";
import {customers} from "@/src/db/schema/customers";

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

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/payments/:id
 *
 * Returns a payment together with:
 * - sale information
 * - customer information
 * - total paid for the sale
 * - outstanding balance
 */
export async function GET(
    _request: NextRequest,
    {params}: RouteContext,
) {
    try {
        const {id} = await params;

        /*
         * IMPORTANT:
         * /api/payments/new must never reach
         * the UUID query below.
         */
        if (
            !id ||
            !UUID_REGEX.test(id)
        ) {
            return apiError(
                "Invalid payment ID.",
                400,
            );
        }

        const {organizationId} =
            await requirePermission(
                "payments",
                "read",
            );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const [payment] =
            await db
                .select({
                    id:
                    payments.id,

                    organizationId:
                    payments.organizationId,

                    customerId:
                    payments.customerId,

                    saleId:
                    payments.saleId,

                    amount:
                    payments.amount,

                    paymentMethod:
                    payments.paymentMethod,

                    note:
                    payments.note,

                    createdAt:
                    payments.createdAt,

                    saleNumber:
                    sales.saleNumber,

                    saleTotal:
                    sales.totalAmount,

                    customerName:
                    customers.name,

                    customerPhone:
                    customers.phone,

                    paidTotal:
                        sql<string>`
                            COALESCE(
                                (
                                    SELECT
                                        SUM(
                                            p2.amount
                                        )
                                    FROM payments p2
                                    WHERE
                                        p2.sale_id =
                            ${payments.saleId}
                            AND
                            p2
                            .
                            organization_id
                            =
                            ${organizationId}
                            AND
                            p2
                            .
                            customer_id
                            =
                            ${payments.customerId}
                            ),
                            0
                            )
                        `,
                })
                .from(payments)
                .innerJoin(
                    sales,
                    eq(
                        payments.saleId,
                        sales.id,
                    ),
                )
                .innerJoin(
                    customers,
                    eq(
                        payments.customerId,
                        customers.id,
                    ),
                )
                .where(
                    and(
                        eq(
                            payments.id,
                            id,
                        ),
                        eq(
                            payments.organizationId,
                            organizationId,
                        ),
                        eq(
                            sales.organizationId,
                            organizationId,
                        ),
                        eq(
                            customers.organizationId,
                            organizationId,
                        ),
                    ),
                )
                .limit(1);

        if (!payment) {
            return apiError(
                "Payment not found.",
                404,
            );
        }

        const amount =
            Number(
                payment.amount,
            ) || 0;

        const saleTotal =
            Number(
                payment.saleTotal,
            ) || 0;

        const paidTotal =
            Number(
                payment.paidTotal,
            ) || 0;

        const outstanding =
            Math.max(
                saleTotal -
                paidTotal,
                0,
            );

        return apiSuccess({
            ...payment,
            amount,
            saleTotal,
            paidTotal,
            outstanding,
        });
    } catch (error) {
        console.error(
            "[GET /api/payments/:id]",
            error,
        );

        return apiError(
            "Internal server error.",
            500,
        );
    }
}