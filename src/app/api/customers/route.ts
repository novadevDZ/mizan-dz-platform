import {NextRequest} from "next/server";
import {
    and,
    count,
    desc,
    eq,
    ilike,
    isNull,
    or,
    sql,
} from "drizzle-orm";

import {db} from "@/src/db";

import {customers} from "@/src/db/schema/customers";
import {sales} from "@/src/db/schema/sales";
import {payments} from "@/src/db/schema/payments";

import {
    requirePermission,
} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const FINANCIAL_STATUSES = [
    "all",
    "outstanding",
    "unpaid",
] as const;

type FinancialStatus =
    (typeof FINANCIAL_STATUSES)[number];

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

function parseFinancialStatus(
    value: string | null,
): FinancialStatus {
    if (!value) {
        return "all";
    }

    return FINANCIAL_STATUSES.includes(
        value as FinancialStatus,
    )
        ? (value as FinancialStatus)
        : "all";
}

/**
 * POST /api/customers
 */
export async function POST(
    request: NextRequest,
) {
    try {
        const permission =
            await requirePermission(
                "customers",
                "create",
            );

        const organizationId =
            permission.organizationId;

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

        const name =
            typeof input.name === "string"
                ? input.name.trim()
                : "";

        const phone =
            typeof input.phone === "string"
                ? input.phone.trim() || null
                : null;

        const address =
            typeof input.address === "string"
                ? input.address.trim() || null
                : null;

        const notes =
            typeof input.notes === "string"
                ? input.notes.trim() || null
                : null;

        if (!name) {
            return apiError(
                "Customer name is required.",
                400,
            );
        }

        const [customer] =
            await db
                .insert(customers)
                .values({
                    organizationId,
                    name,
                    phone,
                    address,
                    notes,
                })
                .returning({
                    id:
                    customers.id,

                    organizationId:
                    customers.organizationId,

                    name:
                    customers.name,

                    phone:
                    customers.phone,

                    address:
                    customers.address,

                    notes:
                    customers.notes,

                    createdAt:
                    customers.createdAt,

                    updatedAt:
                    customers.updatedAt,
                });

        if (!customer) {
            return apiError(
                "Failed to create customer.",
                500,
            );
        }

        return apiSuccess(
            customer,
            201,
        );
    } catch (error) {
        console.error(
            "[POST /api/customers]",
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
 * GET /api/customers
 *
 * Query parameters:
 * - search
 * - financialStatus=all|outstanding|unpaid
 * - page
 * - limit
 */
export async function GET(
    request: NextRequest,
) {
    try {
        const {organizationId} =
            await requirePermission(
                "customers",
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
                ?.trim() ?? "";

        const rawFinancialStatus =
            params
                .get("financialStatus")
                ?.trim() ?? "";

        if (
            rawFinancialStatus &&
            !FINANCIAL_STATUSES.includes(
                rawFinancialStatus as FinancialStatus,
            )
        ) {
            return apiError(
                "Invalid financial status.",
                400,
            );
        }

        const financialStatus =
            parseFinancialStatus(
                rawFinancialStatus ||
                null,
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
            (page - 1) * limit;

        /*
         * Explicit reference to the
         * outer customers table.
         *
         * This prevents PostgreSQL from
         * interpreting "id" ambiguously.
         */
        const outerCustomerId =
            sql.raw(
                `"customers"."id"`,
            );

        /*
         * Confirmed sales total.
         */
        const salesTotal =
            sql<string>`
                COALESCE(
                    (
                        SELECT
                            SUM(
                                s.total_amount
                            )
                        FROM
                            sales s
                        WHERE
                            s.customer_id =
                ${outerCustomerId}
                AND
                s
                .
                organization_id
                =
                ${organizationId}
                AND
                s
                .
                status
                =
                'confirmed'
                ),
                0
                )
            `;

        /*
         * Confirmed payments total.
         */
        const paidTotal =
            sql<string>`
                COALESCE(
                    (
                        SELECT
                            SUM(
                                p.amount
                            )
                        FROM
                            payments p
                        INNER JOIN
                            sales ps
                        ON
                            ps.id =
                            p.sale_id
                        WHERE
                            p.customer_id =
                ${outerCustomerId}
                AND
                p
                .
                organization_id
                =
                ${organizationId}
                AND
                ps
                .
                organization_id
                =
                ${organizationId}
                AND
                ps
                .
                status
                =
                'confirmed'
                ),
                0
                )
            `;

        /*
         * Outstanding balance.
         */
        const outstanding =
            sql<string>`
                GREATEST(
                    (
                        ${salesTotal}
                        -
                        ${paidTotal}
                    ),
                    0
                )
            `;

        const filters = [
            eq(
                customers.organizationId,
                organizationId,
            ),

            isNull(
                customers.deletedAt,
            ),
        ];

        /*
         * Search by name or phone.
         */
        if (search) {
            const searchFilter =
                or(
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
         * Outstanding customers:
         * positive remaining balance.
         */
        if (
            financialStatus ===
            "outstanding"
        ) {
            filters.push(
                sql`
                    ${outstanding}
                    > 0
                `,
            );
        }

        /*
         * Unpaid customers:
         * confirmed sales exist,
         * but no confirmed-sale
         * payments exist.
         */
        if (
            financialStatus ===
            "unpaid"
        ) {
            filters.push(
                sql`
                    ${salesTotal}
                    > 0
                `,
            );

            filters.push(
                sql`
                    ${paidTotal}
                    = 0
                `,
            );
        }

        const whereClause =
            and(...filters);

        const [
            items,
            countResult,
        ] = await Promise.all([
            db
                .select({
                    id:
                    customers.id,

                    name:
                    customers.name,

                    phone:
                    customers.phone,

                    address:
                    customers.address,

                    notes:
                    customers.notes,

                    createdAt:
                    customers.createdAt,

                    updatedAt:
                    customers.updatedAt,

                    salesTotal:

                        sql<string>`
                            ${salesTotal}
                        `,

                    paidTotal:

                        sql<string>`
                            ${paidTotal}
                        `,

                    outstanding:

                        sql<string>`
                            ${outstanding}
                        `,
                })
                .from(customers)
                .where(
                    whereClause,
                )
                .orderBy(
                    desc(
                        customers.createdAt,
                    ),
                )
                .limit(limit)
                .offset(offset),

            db
                .select({
                    total:
                        count(),
                })
                .from(customers)
                .where(
                    whereClause,
                ),
        ]);

        const total =
            Number(
                countResult[0]
                    ?.total ?? 0,
            );

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total / limit,
                );

        const normalizedItems =
            items.map(
                (customer) => {
                    const customerSalesTotal =
                        Number(
                            customer.salesTotal ??
                            0,
                        );

                    const customerPaidTotal =
                        Number(
                            customer.paidTotal ??
                            0,
                        );

                    const customerOutstanding =
                        Math.max(
                            Number(
                                customer.outstanding ??
                                0,
                            ),
                            0,
                        );

                    let customerFinancialStatus:
                        | "paid"
                        | "outstanding"
                        | "unpaid";

                    if (
                        customerSalesTotal <=
                        0
                    ) {
                        customerFinancialStatus =
                            "paid";
                    } else if (
                        customerOutstanding <=
                        0
                    ) {
                        customerFinancialStatus =
                            "paid";
                    } else if (
                        customerPaidTotal <=
                        0
                    ) {
                        customerFinancialStatus =
                            "unpaid";
                    } else {
                        customerFinancialStatus =
                            "outstanding";
                    }

                    return {
                        ...customer,

                        salesTotal:
                        customerSalesTotal,

                        paidTotal:
                        customerPaidTotal,

                        outstanding:
                        customerOutstanding,

                        financialStatus:
                        customerFinancialStatus,
                    };
                },
            );

        return apiSuccess({
            items:
            normalizedItems,

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
            "[GET /api/customers]",
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