import { NextRequest } from "next/server";
import {
    and,
    count,
    desc,
    eq,
    ilike,
    or,
    sql,
} from "drizzle-orm";

import { db } from "@/src/db";

import { expenses } from "@/src/db/schema/expenses";
import { members } from "@/src/db/schema/members";

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

const EXPENSE_CATEGORIES = [
    "rent",
    "transport",
    "electricity",
    "internet",
    "salary",
    "maintenance",
    "supplies",
    "other",
] as const;

type ExpenseCategory =
    (typeof EXPENSE_CATEGORIES)[number];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseInteger(
    value: string | null,
    fallback: number,
    min = 1,
    max?: number,
): number {
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

function isExpenseCategory(
    value: unknown,
): value is ExpenseCategory {
    return (
        typeof value === "string" &&
        EXPENSE_CATEGORIES.includes(
            value as ExpenseCategory,
        )
    );
}

function parseMoney(
    value: unknown,
): string | null {
    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const normalized =
        String(value).trim();

    /*
     * Accepted:
     *
     * 100
     * 100.5
     * 100.50
     *
     * Rejected:
     *
     * -100
     * 0
     * 10.999
     * abc
     */
    if (
        !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(
            normalized,
        )
    ) {
        return null;
    }

    const numericValue =
        Number(normalized);

    if (
        !Number.isFinite(
            numericValue,
        ) ||
        numericValue <= 0
    ) {
        return null;
    }

    return numericValue.toFixed(2);
}

/* -------------------------------------------------------------------------- */
/* POST /api/expenses                                                         */
/* -------------------------------------------------------------------------- */

export async function POST(
    request: NextRequest,
) {
    try {
        /*
         * requirePermission:
         *
         * 1. Checks authentication
         * 2. Checks active organization
         * 3. Checks expenses:create permission
         */
        const {
            organizationId,
            session,
        } = await requirePermission(
            "expenses",
            "create",
        );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        if (
            !session?.user?.id
        ) {
            return apiError(
                "Authenticated user not found.",
                401,
            );
        }

        const userId =
            session.user.id;

        /* ------------------------------------------------------------------ */
        /* Request body                                                       */
        /* ------------------------------------------------------------------ */

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

        /* ------------------------------------------------------------------ */
        /* Title                                                              */
        /* ------------------------------------------------------------------ */

        if (
            typeof input.title !== "string" ||
            !input.title.trim()
        ) {
            return apiError(
                "Title is required.",
                400,
            );
        }

        const title =
            input.title.trim();

        if (
            title.length > 100
        ) {
            return apiError(
                "Title must not exceed 100 characters.",
                400,
            );
        }

        /* ------------------------------------------------------------------ */
        /* Category                                                            */
        /* ------------------------------------------------------------------ */

        const category =
            input.category ??
            "other";

        if (
            !isExpenseCategory(
                category,
            )
        ) {
            return apiError(
                "Invalid expense category.",
                400,
            );
        }

        /* ------------------------------------------------------------------ */
        /* Amount                                                              */
        /* ------------------------------------------------------------------ */

        const amount =
            parseMoney(
                input.amount,
            );

        if (!amount) {
            return apiError(
                "Amount must be a positive number with up to 2 decimal places.",
                400,
            );
        }

        /* ------------------------------------------------------------------ */
        /* Description                                                         */
        /* ------------------------------------------------------------------ */

        let description:
            | string
            | null = null;

        if (
            input.description !==
            undefined &&
            input.description !== null
        ) {
            if (
                typeof input.description !==
                "string"
            ) {
                return apiError(
                    "Description must be a string.",
                    400,
                );
            }

            const normalized =
                input.description.trim();

            if (
                normalized.length >
                5000
            ) {
                return apiError(
                    "Description must not exceed 5000 characters.",
                    400,
                );
            }

            description =
                normalized ||
                null;
        }

        /* ------------------------------------------------------------------ */
        /* Find current member                                                 */
        /* ------------------------------------------------------------------ */

        const [member] =
            await db
                .select({
                    id:
                    members.id,

                    organizationId:
                    members.organizationId,

                    userId:
                    members.userId,
                })
                .from(members)
                .where(
                    and(
                        eq(
                            members.organizationId,
                            organizationId,
                        ),

                        eq(
                            members.userId,
                            userId,
                        ),
                    ),
                )
                .limit(1);

        if (!member) {
            return apiError(
                "Member not found in the active organization.",
                404,
            );
        }

        /* ------------------------------------------------------------------ */
        /* Create expense                                                      */
        /* ------------------------------------------------------------------ */

        const [expense] =
            await db
                .insert(expenses)
                .values({
                    organizationId,

                    title,

                    category,

                    amount,

                    description,

                    createdBy:
                    member.id,
                })
                .returning({
                    id:
                    expenses.id,

                    organizationId:
                    expenses.organizationId,

                    title:
                    expenses.title,

                    category:
                    expenses.category,

                    amount:
                    expenses.amount,

                    description:
                    expenses.description,

                    createdBy:
                    expenses.createdBy,

                    createdAt:
                    expenses.createdAt,
                });

        if (!expense) {
            return apiError(
                "Failed to create expense.",
                500,
            );
        }

        return apiSuccess(
            {
                ...expense,

                amount:
                    Number(
                        expense.amount,
                    ),
            },
            201,
        );
    } catch (error) {
        console.error(
            "[POST /api/expenses]",
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

/* -------------------------------------------------------------------------- */
/* GET /api/expenses                                                          */
/* -------------------------------------------------------------------------- */

export async function GET(
    request: NextRequest,
) {
    try {
        /*
         * Only users with expenses:read
         * can access this endpoint.
         */
        const {
            organizationId,
        } = await requirePermission(
            "expenses",
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

        /* ------------------------------------------------------------------ */
        /* Search                                                              */
        /* ------------------------------------------------------------------ */

        const search =
            params
                .get("search")
                ?.trim() ?? "";

        /* ------------------------------------------------------------------ */
        /* Category                                                            */
        /* ------------------------------------------------------------------ */

        const rawCategory =
            params
                .get("category")
                ?.trim() ?? "";

        if (
            rawCategory &&
            !isExpenseCategory(
                rawCategory,
            )
        ) {
            return apiError(
                "Invalid expense category.",
                400,
            );
        }

        const category =
            rawCategory
                ? (rawCategory as ExpenseCategory)
                : null;

        /* ------------------------------------------------------------------ */
        /* Pagination                                                          */
        /* ------------------------------------------------------------------ */

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

        /* ------------------------------------------------------------------ */
        /* Filters                                                             */
        /* ------------------------------------------------------------------ */

        const filters = [
            eq(
                expenses.organizationId,
                organizationId,
            ),
        ];

        /*
         * Search title or description.
         */
        if (search) {
            const searchFilter =
                or(
                    ilike(
                        expenses.title,
                        `%${search}%`,
                    ),

                    ilike(
                        expenses.description,
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
         * Category filter.
         */
        if (category) {
            filters.push(
                eq(
                    expenses.category,
                    category,
                ),
            );
        }

        const whereClause =
            and(...filters);

        /* ------------------------------------------------------------------ */
        /* Queries                                                             */
        /* ------------------------------------------------------------------ */

        const [
            items,
            countResult,
            totalResult,
        ] = await Promise.all([
            /*
             * Expenses.
             */
            db
                .select({
                    id:
                    expenses.id,

                    organizationId:
                    expenses.organizationId,

                    title:
                    expenses.title,

                    category:
                    expenses.category,

                    amount:
                    expenses.amount,

                    description:
                    expenses.description,

                    createdBy:
                    expenses.createdBy,

                    createdAt:
                    expenses.createdAt,
                })
                .from(expenses)
                .where(
                    whereClause,
                )
                .orderBy(
                    desc(
                        expenses.createdAt,
                    ),
                )
                .limit(limit)
                .offset(offset),

            /*
             * Number of expenses.
             */
            db
                .select({
                    total:
                        count(),
                })
                .from(expenses)
                .where(
                    whereClause,
                ),

            /*
             * Total amount.
             */
            db
                .select({
                    total:
                        sql<string>`
                            COALESCE(
                                SUM(
                                    ${expenses.amount}
                                ),
                                0
                            )
                        `,
                })
                .from(expenses)
                .where(
                    whereClause,
                ),
        ]);

        /* ------------------------------------------------------------------ */
        /* Pagination calculations                                             */
        /* ------------------------------------------------------------------ */

        const total =
            Number(
                countResult[0]
                    ?.total ?? 0,
            );

        const totalAmount =
            Number(
                totalResult[0]
                    ?.total ?? 0,
            );

        const totalPages =
            total === 0
                ? 0
                : Math.ceil(
                    total /
                    limit,
                );

        /* ------------------------------------------------------------------ */
        /* Response                                                            */
        /* ------------------------------------------------------------------ */

        return apiSuccess({
            items:
                items.map(
                    (expense) => ({
                        ...expense,

                        amount:
                            Number(
                                expense.amount,
                            ),
                    }),
                ),

            summary: {
                totalExpenses:
                total,

                totalAmount,
            },

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
            "[GET /api/expenses]",
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