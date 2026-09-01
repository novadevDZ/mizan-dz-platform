import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth";
import { db } from "@/src/db";

import { organizations } from "@/src/db/schema/organizations";
import { members } from "@/src/db/schema/members";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/organization-api";

import {
    ApiAuthError,
    requireApiSession,
} from "@/src/lib/require-api-session";

type OrganizationUpdateBody = {
    name?: unknown;
    slug?: unknown;
    logo?: unknown;
    phone?: unknown;
    address?: unknown;
    wilaya?: unknown;
    currency?: unknown;
};

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function normalizePhone(value: string) {
    return value.replace(/\s+/g, "").trim();
}

function isValidPhone(value: string) {
    return /^(0(5|6|7)\d{8}|\+213(5|6|7)\d{8})$/.test(
        normalizePhone(value),
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : String(error);
}

/**
 * GET /api/organization/current
 *
 * Returns the currently active Mizan organization.
 */
export async function GET() {
    try {
        const {
            user,
            headers,
        } = await requireApiSession();

        const session = await auth.api.getSession({
            headers,
        });

        if (!session?.session) {
            return apiError(
                401,
                "UNAUTHORIZED",
                "Your session is no longer valid.",
            );
        }

        const authOrganizationId =
            session.session.activeOrganizationId;

        if (!authOrganizationId) {
            return apiError(
                404,
                "NO_ACTIVE_ORGANIZATION",
                "You do not have an active organization.",
            );
        }

        const rows = await db
            .select({
                organization: organizations,
                role: members.role,
            })
            .from(members)
            .innerJoin(
                organizations,
                eq(
                    members.organizationId,
                    organizations.id,
                ),
            )
            .where(
                eq(
                    members.userId,
                    user.id,
                ),
            );

        const current = rows.find(
            (row) =>
                row.organization.authOrganizationId ===
                authOrganizationId &&
                row.organization.deletedAt === null,
        );

        if (!current) {
            return apiError(
                404,
                "ORGANIZATION_NOT_FOUND",
                "The active organization could not be found.",
            );
        }

        return apiSuccess({
            organization: current.organization,
            role: current.role,
            authOrganizationId,
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return apiError(
                error.status,
                error.status === 401
                    ? "UNAUTHORIZED"
                    : "FORBIDDEN",
                error.message,
            );
        }

        console.error(
            "[Mizan DZ] GET /api/organization/current failed:",
            error,
        );

        return apiError(
            500,
            "ORGANIZATION_FETCH_FAILED",
            "Unable to load the current organization.",
        );
    }
}

/**
 * PATCH /api/organization/current
 *
 * Updates the currently active organization.
 */
export async function PATCH(
    request: NextRequest,
) {
    try {
        const {
            user,
            headers,
        } = await requireApiSession();

        // =====================================================
        // 1. Resolve active organization
        // =====================================================

        const session = await auth.api.getSession({
            headers,
        });

        if (!session?.session) {
            return apiError(
                401,
                "UNAUTHORIZED",
                "Your session is no longer valid.",
            );
        }

        const authOrganizationId =
            session.session.activeOrganizationId;

        if (!authOrganizationId) {
            return apiError(
                404,
                "NO_ACTIVE_ORGANIZATION",
                "You do not have an active organization.",
            );
        }

        // =====================================================
        // 2. Find current Mizan organization + membership
        // =====================================================

        const rows = await db
            .select({
                organization: organizations,
                membership: members,
            })
            .from(members)
            .innerJoin(
                organizations,
                eq(
                    members.organizationId,
                    organizations.id,
                ),
            )
            .where(
                eq(
                    members.userId,
                    user.id,
                ),
            );

        const current = rows.find(
            (row) =>
                row.organization.authOrganizationId ===
                authOrganizationId &&
                row.organization.deletedAt === null,
        );

        if (!current) {
            return apiError(
                404,
                "ORGANIZATION_NOT_FOUND",
                "The active organization could not be found.",
            );
        }

        // =====================================================
        // 3. Permission check
        // =====================================================
        //
        // The current Mizan role type does not include "admin".
        // Only "owner" can update organization-level settings.
        //

        if (current.membership.role !== "owner") {
            return apiError(
                403,
                "ORGANIZATION_UPDATE_FORBIDDEN",
                "Only the organization owner can update organization settings.",
            );
        }

        // =====================================================
        // 4. Parse request body
        // =====================================================

        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return apiError(
                400,
                "INVALID_JSON",
                "Request body must be valid JSON.",
            );
        }

        if (!isRecord(body)) {
            return apiError(
                400,
                "INVALID_BODY",
                "Request body must be an object.",
            );
        }

        const data =
            body as OrganizationUpdateBody;

        const updateMizan: {
            name?: string;
            phone?: string;
            address?: string | null;
            wilaya?: string;
            currency?: string;
        } = {};

        const updateAuth: {
            name?: string;
            slug?: string;
            logo?: string | null;
        } = {};

        // =====================================================
        // 5. Validate name
        // =====================================================

        if ("name" in data) {
            if (
                typeof data.name !== "string" ||
                !data.name.trim()
            ) {
                return apiError(
                    422,
                    "INVALID_NAME",
                    "Organization name must be a non-empty string.",
                );
            }

            const name = data.name.trim();

            if (
                name.length < 2 ||
                name.length > 120
            ) {
                return apiError(
                    422,
                    "INVALID_NAME",
                    "Organization name must contain between 2 and 120 characters.",
                );
            }

            updateMizan.name = name;
            updateAuth.name = name;
        }

        // =====================================================
        // 6. Validate slug
        // =====================================================

        if ("slug" in data) {
            if (
                typeof data.slug !== "string" ||
                !data.slug.trim()
            ) {
                return apiError(
                    422,
                    "INVALID_SLUG",
                    "Organization slug must be a non-empty string.",
                );
            }

            const slug =
                data.slug.trim().toLowerCase();

            if (
                slug.length < 3 ||
                slug.length > 48
            ) {
                return apiError(
                    422,
                    "INVALID_SLUG",
                    "Slug must contain between 3 and 48 characters.",
                );
            }

            if (
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
                    slug,
                )
            ) {
                return apiError(
                    422,
                    "INVALID_SLUG",
                    "Slug may contain only lowercase letters, numbers, and single hyphens.",
                );
            }

            updateAuth.slug = slug;
        }

        // =====================================================
        // 7. Validate logo
        // =====================================================

        if ("logo" in data) {
            if (
                data.logo !== null &&
                typeof data.logo !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_LOGO",
                    "Logo must be a string or null.",
                );
            }

            const logo =
                data.logo === null
                    ? null
                    : data.logo.trim();

            if (
                logo &&
                logo.length > 2048
            ) {
                return apiError(
                    422,
                    "INVALID_LOGO",
                    "Logo URL is too long.",
                );
            }

            if (logo) {
                try {
                    new URL(logo);
                } catch {
                    return apiError(
                        422,
                        "INVALID_LOGO",
                        "Logo must be a valid URL.",
                    );
                }
            }

            updateAuth.logo = logo || null;
        }

        // =====================================================
        // 8. Validate phone
        // =====================================================

        if ("phone" in data) {
            if (typeof data.phone !== "string") {
                return apiError(
                    422,
                    "INVALID_PHONE",
                    "Phone must be a string.",
                );
            }

            const phone =
                normalizePhone(data.phone);

            if (!isValidPhone(phone)) {
                return apiError(
                    422,
                    "INVALID_PHONE",
                    "Phone must be a valid Algerian number.",
                );
            }

            updateMizan.phone = phone;
        }

        // =====================================================
        // 9. Validate address
        // =====================================================

        if ("address" in data) {
            if (
                data.address !== null &&
                typeof data.address !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_ADDRESS",
                    "Address must be a string or null.",
                );
            }

            updateMizan.address =
                data.address === null
                    ? null
                    : data.address.trim() || null;
        }

        // =====================================================
        // 10. Validate wilaya
        // =====================================================

        if ("wilaya" in data) {
            if (typeof data.wilaya !== "string") {
                return apiError(
                    422,
                    "INVALID_WILAYA",
                    "Wilaya must be a string.",
                );
            }

            const wilaya =
                data.wilaya.trim();

            if (!wilaya) {
                return apiError(
                    422,
                    "INVALID_WILAYA",
                    "Wilaya is required.",
                );
            }

            updateMizan.wilaya = wilaya;
        }

        // =====================================================
        // 11. Validate currency
        // =====================================================

        if ("currency" in data) {
            if (typeof data.currency !== "string") {
                return apiError(
                    422,
                    "INVALID_CURRENCY",
                    "Currency must be a string.",
                );
            }

            const currency =
                data.currency.trim().toUpperCase();

            if (!/^[A-Z]{3}$/.test(currency)) {
                return apiError(
                    422,
                    "INVALID_CURRENCY",
                    "Currency must be a valid 3-letter currency code.",
                );
            }

            updateMizan.currency = currency;
        }

        // =====================================================
        // 12. Ensure there are changes
        // =====================================================

        const hasMizanChanges =
            Object.keys(updateMizan).length > 0;

        const hasAuthChanges =
            Object.keys(updateAuth).length > 0;

        if (
            !hasMizanChanges &&
            !hasAuthChanges
        ) {
            return apiError(
                422,
                "NO_CHANGES",
                "No organization changes were provided.",
            );
        }

        // =====================================================
        // 13. Update Better Auth organization
        // =====================================================

        let authOrganization:
            Awaited<
                ReturnType<
                    typeof auth.api.updateOrganization
                >
            > | null = null;

        if (hasAuthChanges) {
            try {
                const result =
                    await auth.api.updateOrganization({
                        body: {
                            organizationId:
                            authOrganizationId,
                            data: updateAuth,
                        },
                        headers,
                    });

                if (!result) {
                    return apiError(
                        500,
                        "AUTH_ORGANIZATION_UPDATE_FAILED",
                        "The authentication organization could not be updated.",
                    );
                }

                authOrganization = result;
            } catch (error) {
                console.error(
                    "[Mizan DZ] Better Auth organization update failed:",
                    error,
                );

                const message =
                    getErrorMessage(error);

                if (
                    /slug/i.test(message) &&
                    /exist|unique|duplicate/i.test(
                        message,
                    )
                ) {
                    return apiError(
                        409,
                        "SLUG_ALREADY_EXISTS",
                        "This organization slug is already taken.",
                    );
                }

                return apiError(
                    400,
                    "AUTH_ORGANIZATION_UPDATE_FAILED",
                    "Unable to update the authentication organization.",
                    process.env.NODE_ENV ===
                    "development"
                        ? message
                        : undefined,
                );
            }
        }

        // =====================================================
        // 14. Update Mizan organization
        // =====================================================

        let mizanOrganization =
            current.organization;

        if (hasMizanChanges) {
            try {
                const [updated] =
                    await db
                        .update(organizations)
                        .set(updateMizan)
                        .where(
                            eq(
                                organizations.id,
                                current.organization.id,
                            ),
                        )
                        .returning();

                if (!updated) {
                    return apiError(
                        500,
                        "MIZAN_ORGANIZATION_UPDATE_FAILED",
                        "Unable to update the organization.",
                    );
                }

                mizanOrganization = updated;
            } catch (error) {
                console.error(
                    "[Mizan DZ] Mizan organization update failed:",
                    error,
                );

                return apiError(
                    500,
                    "MIZAN_ORGANIZATION_UPDATE_FAILED",
                    "Unable to update organization data.",
                    process.env.NODE_ENV ===
                    "development"
                        ? getErrorMessage(error)
                        : undefined,
                );
            }
        }

        // =====================================================
        // 15. Return updated organization
        // =====================================================

        return apiSuccess({
            organization: mizanOrganization,
            authOrganization,
            role: current.membership.role,
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return apiError(
                error.status,
                error.status === 401
                    ? "UNAUTHORIZED"
                    : "FORBIDDEN",
                error.message,
            );
        }

        console.error(
            "[Mizan DZ] PATCH /api/organization/current failed:",
            error,
        );

        return apiError(
            500,
            "ORGANIZATION_UPDATE_FAILED",
            "Unable to update the organization.",
        );
    }
}

/**
 * DELETE /api/organization/current
 *
 * Deletes the current organization.
 */
export async function DELETE() {
    try {
        const {
            user,
            headers,
        } = await requireApiSession();

        // =====================================================
        // 1. Resolve active organization
        // =====================================================

        const session = await auth.api.getSession({
            headers,
        });

        if (!session?.session) {
            return apiError(
                401,
                "UNAUTHORIZED",
                "Your session is no longer valid.",
            );
        }

        const authOrganizationId =
            session.session.activeOrganizationId;

        if (!authOrganizationId) {
            return apiError(
                404,
                "NO_ACTIVE_ORGANIZATION",
                "You do not have an active organization.",
            );
        }

        // =====================================================
        // 2. Find current organization
        // =====================================================

        const rows = await db
            .select({
                organization: organizations,
                membership: members,
            })
            .from(members)
            .innerJoin(
                organizations,
                eq(
                    members.organizationId,
                    organizations.id,
                ),
            )
            .where(
                eq(
                    members.userId,
                    user.id,
                ),
            );

        const current = rows.find(
            (row) =>
                row.organization.authOrganizationId ===
                authOrganizationId &&
                row.organization.deletedAt === null,
        );

        if (!current) {
            return apiError(
                404,
                "ORGANIZATION_NOT_FOUND",
                "The active organization could not be found.",
            );
        }

        // =====================================================
        // 3. Owner only
        // =====================================================

        if (current.membership.role !== "owner") {
            return apiError(
                403,
                "ORGANIZATION_DELETE_FORBIDDEN",
                "Only the organization owner can delete the organization.",
            );
        }

        // =====================================================
        // 4. Delete Better Auth organization
        // =====================================================

        try {
            await auth.api.deleteOrganization({
                body: {
                    organizationId:
                    authOrganizationId,
                },
                headers,
            });
        } catch (error) {
            console.error(
                "[Mizan DZ] Better Auth organization deletion failed:",
                error,
            );

            return apiError(
                400,
                "AUTH_ORGANIZATION_DELETE_FAILED",
                "Unable to delete the authentication organization.",
                process.env.NODE_ENV ===
                "development"
                    ? getErrorMessage(error)
                    : undefined,
            );
        }

        // =====================================================
        // 5. Soft delete Mizan organization
        // =====================================================

        try {
            await db
                .update(organizations)
                .set({
                    deletedAt: new Date(),
                })
                .where(
                    eq(
                        organizations.id,
                        current.organization.id,
                    ),
                );
        } catch (error) {
            console.error(
                "[Mizan DZ] Mizan organization soft-delete failed:",
                error,
            );

            return apiError(
                500,
                "MIZAN_ORGANIZATION_DELETE_FAILED",
                "The authentication organization was deleted, but the Mizan organization could not be archived.",
                process.env.NODE_ENV ===
                "development"
                    ? getErrorMessage(error)
                    : undefined,
            );
        }

        return apiSuccess({
            deleted: true,
            organizationId:
            current.organization.id,
            authOrganizationId,
        });
    } catch (error) {
        if (error instanceof ApiAuthError) {
            return apiError(
                error.status,
                error.status === 401
                    ? "UNAUTHORIZED"
                    : "FORBIDDEN",
                error.message,
            );
        }

        console.error(
            "[Mizan DZ] DELETE /api/organization/current failed:",
            error,
        );

        return apiError(
            500,
            "ORGANIZATION_DELETE_FAILED",
            "Unable to delete the organization.",
        );
    }
}