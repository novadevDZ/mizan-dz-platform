import { NextRequest } from "next/server";

import {
    and,
    eq,
    isNull,
} from "drizzle-orm";

import { db } from "@/src/db";

import { expenses } from "@/src/db/schema/expenses";
import { expenseCategoryEnum } from "@/src/db/schema/enums";
import { members } from "@/src/db/schema/members";
import { user } from "@/src/db/schema/auth";

import {
    requirePermission,
} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

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

type ExpenseCategoryDb =
    (typeof expenseCategoryEnum.enumValues)[number];

type Context = {
    params: Promise<{
        id: string;
    }>;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
/* GET /api/expenses/[id]                                                    */
/* -------------------------------------------------------------------------- */

export async function GET(
    _request: NextRequest,
    context: Context,
) {
    try {
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

        const { id } =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid expense ID.",
                400,
            );
        }

        /*
         * One query:
         *
         * expenses
         *    ↓ createdBy
         * members.id
         *    ↓ userId
         * user.id
         *
         * createdByName is returned only
         * in the API response. It is not
         * stored in expenses.
         */
        const [expense] =
            await db
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

                    createdByName:
                    user.name,

                    createdAt:
                    expenses.createdAt,

                    deletedAt:
                    expenses.deletedAt,
                })
                .from(expenses)
                .leftJoin(
                    members,
                    and(
                        eq(
                            members.id,
                            expenses.createdBy,
                        ),
                        eq(
                            members.organizationId,
                            organizationId,
                        ),
                    ),
                )
                .leftJoin(
                    user,
                    eq(
                        user.id,
                        members.userId,
                    ),
                )
                .where(
                    and(
                        eq(
                            expenses.id,
                            id,
                        ),

                        eq(
                            expenses.organizationId,
                            organizationId,
                        ),

                        isNull(
                            expenses.deletedAt,
                        ),
                    ),
                )
                .limit(1);

        if (!expense) {
            return apiError(
                "Expense not found.",
                404,
            );
        }

        return apiSuccess({
            ...expense,

            amount:
                Number(
                    expense.amount,
                ),

            createdByName:
                expense.createdByName ??
                "Unknown member",
        });
    } catch (error) {
        console.error(
            "[GET /api/expenses/:id]",
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

/* -------------------------------------------------------------------------- */
/* PATCH /api/expenses/[id]                                                   */
/* -------------------------------------------------------------------------- */

export async function PATCH(
    request: NextRequest,
    context: Context,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "expenses",
            "update",
        );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const { id } =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid expense ID.",
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

        /*
         * Verify active expense.
         */
        const [existing] =
            await db
                .select({
                    id:
                    expenses.id,
                })
                .from(expenses)
                .where(
                    and(
                        eq(
                            expenses.id,
                            id,
                        ),

                        eq(
                            expenses.organizationId,
                            organizationId,
                        ),

                        isNull(
                            expenses.deletedAt,
                        ),
                    ),
                )
                .limit(1);

        if (!existing) {
            return apiError(
                "Expense not found.",
                404,
            );
        }

        const updateData: {
            title?: string;
            category?: ExpenseCategoryDb;
            amount?: string;
            description?: string | null;
        } = {};

        /* ------------------------------- TITLE ---------------------------- */

        if ("title" in input) {
            if (
                typeof input.title !==
                "string" ||
                !input.title.trim()
            ) {
                return apiError(
                    "Title must be a non-empty string.",
                    400,
                );
            }

            const title =
                input.title.trim();

            if (
                title.length >
                100
            ) {
                return apiError(
                    "Title must not exceed 100 characters.",
                    400,
                );
            }

            updateData.title =
                title;
        }

        /* ----------------------------- CATEGORY -------------------------- */

        if ("category" in input) {
            if (
                !isExpenseCategory(
                    input.category,
                )
            ) {
                return apiError(
                    "Invalid expense category.",
                    400,
                );
            }

            updateData.category =
                input.category;
        }

        /* ------------------------------- AMOUNT -------------------------- */

        if ("amount" in input) {
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

            updateData.amount =
                amount;
        }

        /* ----------------------------- DESCRIPTION ----------------------- */

        if (
            "description" in
            input
        ) {
            if (
                input.description !==
                null &&
                typeof input.description !==
                "string"
            ) {
                return apiError(
                    "Description must be a string or null.",
                    400,
                );
            }

            if (
                input.description ===
                null
            ) {
                updateData.description =
                    null;
            } else {
                const description =
                    input.description.trim();

                if (
                    description.length >
                    5000
                ) {
                    return apiError(
                        "Description must not exceed 5000 characters.",
                        400,
                    );
                }

                updateData.description =
                    description || null;
            }
        }

        if (
            Object.keys(
                updateData,
            ).length === 0
        ) {
            return apiError(
                "No fields to update.",
                400,
            );
        }

        /* ------------------------------- UPDATE -------------------------- */

        const [updated] =
            await db
                .update(expenses)
                .set(updateData)
                .where(
                    and(
                        eq(
                            expenses.id,
                            id,
                        ),

                        eq(
                            expenses.organizationId,
                            organizationId,
                        ),

                        isNull(
                            expenses.deletedAt,
                        ),
                    ),
                )
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

                    deletedAt:
                    expenses.deletedAt,
                });

        if (!updated) {
            return apiError(
                "Failed to update expense.",
                500,
            );
        }

        /*
         * Get creator name for the response only.
         */
        const [creator] =
            await db
                .select({
                    name:
                    user.name,
                })
                .from(members)
                .leftJoin(
                    user,
                    eq(
                        user.id,
                        members.userId,
                    ),
                )
                .where(
                    and(
                        eq(
                            members.id,
                            updated.createdBy,
                        ),

                        eq(
                            members.organizationId,
                            organizationId,
                        ),
                    ),
                )
                .limit(1);

        return apiSuccess({
            ...updated,

            amount:
                Number(
                    updated.amount,
                ),

            createdByName:
                creator?.name ??
                "Unknown member",
        });
    } catch (error) {
        console.error(
            "[PATCH /api/expenses/:id]",
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

/* -------------------------------------------------------------------------- */
/* DELETE /api/expenses/[id]                                                  */
/* -------------------------------------------------------------------------- */

export async function DELETE(
    _request: NextRequest,
    context: Context,
) {
    try {
        const {
            organizationId,
        } = await requirePermission(
            "expenses",
            "delete",
        );

        if (!organizationId) {
            return apiError(
                "No active organization found.",
                400,
            );
        }

        const { id } =
            await context.params;

        if (!isValidUuid(id)) {
            return apiError(
                "Invalid expense ID.",
                400,
            );
        }

        /*
         * Soft delete.
         */
        const [deleted] =
            await db
                .update(expenses)
                .set({
                    deletedAt:
                        new Date(),
                })
                .where(
                    and(
                        eq(
                            expenses.id,
                            id,
                        ),

                        eq(
                            expenses.organizationId,
                            organizationId,
                        ),

                        isNull(
                            expenses.deletedAt,
                        ),
                    ),
                )
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

                    deletedAt:
                    expenses.deletedAt,
                });

        if (!deleted) {
            return apiError(
                "Expense not found.",
                404,
            );
        }

        return apiSuccess({
            ...deleted,

            amount:
                Number(
                    deleted.amount,
                ),
        });
    } catch (error) {
        console.error(
            "[DELETE /api/expenses/:id]",
            error,
        );

        const status =
            getErrorStatus(
                error,
            );

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