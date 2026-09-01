import {NextRequest} from "next/server";
import {
    and,
    count,
    desc,
    eq,
    ilike,
    or,
} from "drizzle-orm";

import {db} from "@/src/db";

import {invoices} from "@/src/db/schema/invoices";
import {customers} from "@/src/db/schema/customers";
import {sales} from "@/src/db/schema/sales";

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
 * GET /api/invoices
 *
 * Query parameters:
 * - search
 * - page
 * - limit
 *
 * Invoices are automatically generated
 * from sales, therefore this endpoint
 * is read-only.
 */
export async function GET(
    request: NextRequest,
) {
    try {
        const {organizationId} =
            await requirePermission(
                "invoices",
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
         * ---------------------------------------------------------
         * Filters
         * ---------------------------------------------------------
         */

        const filters = [
            eq(
                invoices.organizationId,
                organizationId,
            ),
        ];

        /*
         * Search by:
         * - invoice number
         * - customer name
         * - customer phone
         */
        if (search) {
            const searchFilter =
                or(
                    ilike(
                        invoices.invoiceNumber,
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

        const whereClause =
            and(...filters);

        /*
         * ---------------------------------------------------------
         * Fetch invoices
         * ---------------------------------------------------------
         */

        const [
            items,
            countResult,
        ] = await Promise.all([
            db
                .select({
                    id:
                    invoices.id,

                    invoiceNumber:
                    invoices.invoiceNumber,

                    saleId:
                    invoices.saleId,

                    customerId:
                    invoices.customerId,

                    status:
                    invoices.status,

                    issuedAt:
                    invoices.issuedAt,

                    dueAt:
                    invoices.dueAt,

                    subtotal:
                    invoices.subtotal,

                    discount:
                    invoices.discount,

                    total:
                    invoices.total,

                    notes:
                    invoices.notes,

                    createdAt:
                    invoices.createdAt,

                    updatedAt:
                    invoices.updatedAt,

                    customer: {
                        id:
                        customers.id,

                        name:
                        customers.name,

                        phone:
                        customers.phone,
                    },

                    sale: {
                        id:
                        sales.id,

                        totalAmount:
                        sales.totalAmount,

                        status:
                        sales.status,

                        createdAt:
                        sales.createdAt,
                    },
                })
                .from(invoices)

                .leftJoin(
                    customers,
                    eq(
                        invoices.customerId,
                        customers.id,
                    ),
                )

                .leftJoin(
                    sales,
                    eq(
                        invoices.saleId,
                        sales.id,
                    ),
                )

                .where(
                    whereClause,
                )

                .orderBy(
                    desc(
                        invoices.createdAt,
                    ),
                )

                .limit(limit)
                .offset(offset),

            /*
             * -----------------------------------------------------
             * Count
             * -----------------------------------------------------
             */

            db
                .select({
                    total:
                        count(),
                })
                .from(invoices)

                .leftJoin(
                    customers,
                    eq(
                        invoices.customerId,
                        customers.id,
                    ),
                )

                .where(
                    whereClause,
                ),
        ]);

        /*
         * ---------------------------------------------------------
         * Pagination
         * ---------------------------------------------------------
         */

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

        /*
         * ---------------------------------------------------------
         * Normalize numeric values
         * ---------------------------------------------------------
         */

        const normalizedItems =
            items.map(
                (invoice) => ({
                    ...invoice,

                    subtotal:
                        Number(
                            invoice.subtotal ??
                            0,
                        ),

                    discount:
                        Number(
                            invoice.discount ??
                            0,
                        ),

                    total:
                        Number(
                            invoice.total ??
                            0,
                        ),

                    sale:
                        invoice.sale
                            ? {
                                ...invoice.sale,

                                totalAmount:
                                    Number(
                                        invoice
                                            .sale
                                            .totalAmount ??
                                        0,
                                    ),
                            }
                            : null,
                }),
            );

        /*
         * ---------------------------------------------------------
         * Response
         * ---------------------------------------------------------
         */

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
            "[GET /api/invoices]",
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