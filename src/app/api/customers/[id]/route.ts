import {NextRequest} from "next/server";
import {and, eq, isNull} from "drizzle-orm";

import {db} from "@/src/db";
import {customers} from "@/src/db/schema/customers";

import {requirePermission} from "@/src/lib/require-permission";

import {apiError, apiSuccess} from "@/src/lib/api-response";

import {updateCustomerSchema} from "@/src/lib/validators/customer";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

/**
 * Extract an HTTP status from an unknown thrown error.
 */
function getErrorStatus(error: unknown): number {
    if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof error.status === "number"
    ) {
        return error.status;
    }

    return 500;
}

/**
 * Extract a safe error message.
 */
function getErrorMessage(
    error: unknown,
    fallback = "Internal server error.",
): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

/**
 * GET /api/customers/:id
 */
export async function GET(
    _request: NextRequest,
    {params}: RouteContext,
) {
    try {
        const {id} = await params;

        const {organizationId} = await requirePermission(
            "customers",
            "read",
        );

        const [customer] = await db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                address: customers.address,
                notes: customers.notes,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt,
            })
            .from(customers)
            .where(
                and(
                    eq(customers.id, id),
                    eq(
                        customers.organizationId,
                        organizationId,
                    ),
                    isNull(customers.deletedAt),
                ),
            )
            .limit(1);

        if (!customer) {
            return apiError(
                "Customer not found.",
                404,
            );
        }

        return apiSuccess(customer);
    } catch (error) {
        console.error(
            "[GET /api/customers/:id]",
            error,
        );

        const status = getErrorStatus(error);

        return apiError(
            status === 500
                ? "Internal server error."
                : getErrorMessage(error),
            status,
        );
    }
}

/**
 * PATCH /api/customers/:id
 */
export async function PATCH(
    request: NextRequest,
    {params}: RouteContext,
) {
    try {
        const {id} = await params;

        const {organizationId} = await requirePermission(
            "customers",
            "update",
        );

        const body = await request.json();

        const parsed = updateCustomerSchema.safeParse(body);

        if (!parsed.success) {
            return apiError(
                parsed.error.issues
                    .map((issue) => issue.message)
                    .join(" "),
                400,
            );
        }

        if (Object.keys(parsed.data).length === 0) {
            return apiError(
                "No fields provided for update.",
                400,
            );
        }

        const data = parsed.data;

        const [customer] = await db
            .update(customers)
            .set({
                ...(data.name !== undefined && {
                    name: data.name,
                }),

                ...(data.phone !== undefined && {
                    phone: data.phone ?? null,
                }),

                ...(data.address !== undefined && {
                    address: data.address ?? null,
                }),

                ...(data.notes !== undefined && {
                    notes: data.notes ?? null,
                }),

                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(customers.id, id),
                    eq(
                        customers.organizationId,
                        organizationId,
                    ),
                    isNull(customers.deletedAt),
                ),
            )
            .returning({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                address: customers.address,
                notes: customers.notes,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt,
            });

        if (!customer) {
            return apiError(
                "Customer not found.",
                404,
            );
        }

        return apiSuccess(customer);
    } catch (error) {
        console.error(
            "[PATCH /api/customers/:id]",
            error,
        );

        const status = getErrorStatus(error);

        return apiError(
            status === 500
                ? "Internal server error."
                : getErrorMessage(error),
            status,
        );
    }
}

/**
 * DELETE /api/customers/:id
 *
 * Soft delete.
 */
export async function DELETE(
    _request: NextRequest,
    {params}: RouteContext,
) {
    try {
        const {id} = await params;

        const {organizationId} = await requirePermission(
            "customers",
            "delete",
        );

        const [customer] = await db
            .update(customers)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(customers.id, id),
                    eq(
                        customers.organizationId,
                        organizationId,
                    ),
                    isNull(customers.deletedAt),
                ),
            )
            .returning({
                id: customers.id,
            });

        if (!customer) {
            return apiError(
                "Customer not found.",
                404,
            );
        }

        return apiSuccess({
            id: customer.id,
            deleted: true,
        });
    } catch (error) {
        console.error(
            "[DELETE /api/customers/:id]",
            error,
        );

        const status = getErrorStatus(error);

        return apiError(
            status === 500
                ? "Internal server error."
                : getErrorMessage(error),
            status,
        );
    }
}