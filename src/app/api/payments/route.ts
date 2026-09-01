import {NextRequest} from "next/server";
import {
    and,
    count,
    desc,
    eq,
    ilike,
    or,
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

import {
    createPaymentSchema,
} from "@/src/lib/validators/payment";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const PAYMENT_METHODS = [
    "cash",
    "cheque",
    "bank transfer",
    "ccp transfer",
    "baridimob",
    "edahabia",
    "card",
    "other",
] as const;

type PaymentMethod =
    (typeof PAYMENT_METHODS)[number];

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

function isValidUuid(
    value: string,
) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function parsePaymentMethod(
    value: string | null,
): PaymentMethod | null {
    if (!value) {
        return null;
    }

    const normalized =
        value.trim();

    return PAYMENT_METHODS.includes(
        normalized as PaymentMethod,
    )
        ? (normalized as PaymentMethod)
        : null;
}

/**
 * POST /api/payments
 *
 * Create a payment for a sale.
 */
export async function POST(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "payments",
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

        const parsed =
            createPaymentSchema.safeParse(
                body,
            );

        if (!parsed.success) {
            return apiError(
                parsed.error.issues
                    .map(
                        (issue) =>
                            issue.message,
                    )
                    .join(" "),
                400,
            );
        }

        const {
            saleId,
            amount,
            paymentMethod,
            note,
        } = parsed.data;

        /*
         * Load the sale and make sure
         * it belongs to this organization.
         */
        const [sale] =
            await db
                .select({
                    id: sales.id,
                    saleNumber:
                    sales.saleNumber,
                    customerId:
                    sales.customerId,
                    customerName:
                    customers.name,
                    totalAmount:
                    sales.totalAmount,
                    status:
                    sales.status,
                })
                .from(sales)
                .innerJoin(
                    customers,
                    eq(
                        sales.customerId,
                        customers.id,
                    ),
                )
                .where(
                    and(
                        eq(
                            sales.id,
                            saleId,
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

        if (!sale) {
            return apiError(
                "Sale not found.",
                404,
            );
        }

        if (sale.status !== "confirmed") {
            return apiError(
                "Payments can only be added to confirmed sales.",
                409,
            );
        }

        /*
         * Calculate the total amount
         * already paid for THIS sale.
         */
        const [
            paymentTotal,
        ] = await db
            .select({
                total: sql<string>`
                    COALESCE(
                        SUM(
                            ${payments.amount}
                        ),
                        0
                    )
                `,
            })
            .from(payments)
            .where(
                and(
                    eq(
                        payments.saleId,
                        sale.id,
                    ),
                    eq(
                        payments.organizationId,
                        organizationId,
                    ),
                    eq(
                        payments.customerId,
                        sale.customerId,
                    ),
                ),
            );

        const saleTotal =
            Number(
                sale.totalAmount ?? 0,
            );

        const alreadyPaid =
            Number(
                paymentTotal?.total ?? 0,
            );

        const outstanding =
            Math.max(
                saleTotal -
                alreadyPaid,
                0,
            );

        if (outstanding <= 0) {
            return apiError(
                "This sale is already fully paid.",
                409,
            );
        }

        if (amount > outstanding) {
            return apiError(
                `Payment amount exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
                409,
            );
        }

        /*
         * Create payment.
         */
        const [
            payment,
        ] = await db
            .insert(payments)
            .values({
                organizationId,

                customerId:
                sale.customerId,

                saleId:
                sale.id,

                amount:
                    amount.toString(),

                paymentMethod:
                    paymentMethod as
                        typeof payments.$inferInsert.paymentMethod,

                note:
                    note?.trim() ||
                    null,
            })
            .returning({
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
            });

        if (!payment) {
            return apiError(
                "Failed to create payment.",
                500,
            );
        }

        const remaining =
            Math.max(
                outstanding -
                amount,
                0,
            );

        return apiSuccess(
            {
                ...payment,

                amount:
                    Number(
                        payment.amount,
                    ),

                sale: {
                    id:
                    sale.id,

                    saleNumber:
                    sale.saleNumber,

                    customerId:
                    sale.customerId,

                    customerName:
                    sale.customerName,

                    totalAmount:
                    saleTotal,
                },

                balance: {
                    previousPaid:
                    alreadyPaid,

                    payment:
                    amount,

                    remaining,
                },
            },
            201,
        );
    } catch (error) {
        console.error(
            "[POST /api/payments]",
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
 * GET /api/payments
 *
 * Query params:
 *
 * saleId
 * search
 * paymentMethod
 * page
 * limit
 */
export async function GET(
    request: NextRequest,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "payments",
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

        /*
         * IMPORTANT:
         *
         * SaleDetails calls:
         *
         * /api/payments?saleId=...
         *
         * We MUST filter by saleId.
         */
        const saleId =
            params.get("saleId")?.trim() ??
            "";

        if (
            saleId &&
            !isValidUuid(saleId)
        ) {
            return apiError(
                "Invalid sale ID.",
                400,
            );
        }

        const search =
            params
                .get("search")
                ?.trim() ?? "";

        const paymentMethod =
            parsePaymentMethod(
                params.get(
                    "paymentMethod",
                ),
            );

        const rawPaymentMethod =
            params
                .get("paymentMethod")
                ?.trim() ?? "";

        if (
            rawPaymentMethod &&
            !paymentMethod
        ) {
            return apiError(
                "Invalid payment method.",
                400,
            );
        }

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

        /*
         * Base tenant filters.
         */
        const filters = [
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
        ];

        /*
         * IMPORTANT:
         *
         * When saleId is provided,
         * only payments belonging to
         * that sale are returned.
         */
        if (saleId) {
            filters.push(
                eq(
                    payments.saleId,
                    saleId,
                ),
            );
        }

        /*
         * Search:
         *
         * sale number
         * customer name
         * customer phone
         */
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

                    ilike(
                        customers.phone,
                        `%${search}%`,
                    ),
                );

            if (searchFilter) {
                filters.push(
                    searchFilter,
                );
            }
        }

        /*
         * Payment method filter.
         */
        if (paymentMethod) {
            filters.push(
                eq(
                    payments.paymentMethod,
                    paymentMethod,
                ),
            );
        }

        const whereClause =
            and(...filters);

        /*
         * Get payments + total count.
         */
        const [
            items,
            countResult,
        ] = await Promise.all([
            db
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
                    whereClause,
                )
                .orderBy(
                    desc(
                        payments.createdAt,
                    ),
                )
                .limit(limit)
                .offset(offset),

            db
                .select({
                    total:
                        count(),
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
                    whereClause,
                ),
        ]);

        /*
         * IMPORTANT:
         *
         * Calculate paidTotal PER SALE,
         * not globally.
         *
         * This is what SaleDetails needs.
         */
        const saleIds =
            Array.from(
                new Set(
                    items.map(
                        (payment) =>
                            payment.saleId,
                    ),
                ),
            );

        const paidTotals =
            new Map<string, number>();

        if (saleIds.length > 0) {
            const totals =
                await db
                    .select({
                        saleId:
                        payments.saleId,

                        total:
                            sql<string>`
                                COALESCE(
                                    SUM(
                                        ${payments.amount}
                                    ),
                                    0
                                )
                            `,
                    })
                    .from(payments)
                    .where(
                        and(
                            eq(
                                payments.organizationId,
                                organizationId,
                            ),
                            // PostgreSQL / Drizzle
                            sql`${payments.saleId} IN (${sql.join(
                                saleIds.map(
                                    (id) =>
                                        sql`${id}::uuid`,
                                ),
                                sql`, `,
                            )})`,
                        ),
                    )
                    .groupBy(
                        payments.saleId,
                    );

            for (
                const row of totals
                ) {
                paidTotals.set(
                    row.saleId,
                    Number(
                        row.total ?? 0,
                    ),
                );
            }
        }

        const total =
            Number(
                countResult[0]
                    ?.total ?? 0,
            );

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total /
                    limit,
                );

        return apiSuccess({
            items: items.map(
                (payment) => {
                    const amount =
                        Number(
                            payment.amount ??
                            0,
                        );

                    const saleTotal =
                        Number(
                            payment.saleTotal ??
                            0,
                        );

                    /*
                     * This is now the total
                     * paid ONLY for this sale.
                     */
                    const paidTotal =
                        paidTotals.get(
                            payment.saleId,
                        ) ?? 0;

                    const outstanding =
                        Math.max(
                            saleTotal -
                            paidTotal,
                            0,
                        );

                    return {
                        ...payment,

                        amount,

                        saleTotal,

                        paidTotal,

                        outstanding,
                    };
                },
            ),

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
            "[GET /api/payments]",
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