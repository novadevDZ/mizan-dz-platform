import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/src/lib/auth";
import { db } from "@/src/db";
import { organizations } from "@/src/db/schema";

import { requirePermission } from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/organization-api";

type RouteContext = {
    params: Promise<{
        organizationId: string;
    }>;
};

type OrganizationUpdateData = {
    name?: string;
    slug?: string;
    logo?: string | null;
    metadata?: Record<string, any>;
};

type MizanOrganizationUpdate = {
    name?: string;
    phone?: string | null;
    address?: string | null;
    wilaya?: string;
    currency?: string;
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

/**
 * GET /api/organizations/:organizationId
 *
 * Requires:
 * organization:read
 */
export async function GET(
    _request: NextRequest,
    context: RouteContext,
) {
    try {
        const {
            organizationId: activeOrganizationId,
        } = await requirePermission(
            "organization",
            "read",
        );

        const { organizationId } =
            await context.params;

        if (!organizationId) {
            return apiError(
                400,
                "MISSING_ORGANIZATION_ID",
                "Organization ID is required.",
            );
        }

        /*
         * The requested organization must be
         * the user's active organization.
         */
        if (
            activeOrganizationId !== organizationId
        ) {
            return apiError(
                403,
                "ORGANIZATION_ACCESS_DENIED",
                "You cannot access this organization.",
            );
        }

        const requestHeaders =
            await headers();

        /*
         * Better Auth organization.
         */
        const authOrganization =
            await auth.api.getFullOrganization({
                query: {
                    organizationId,
                },
                headers: requestHeaders,
            });

        if (!authOrganization) {
            return apiError(
                404,
                "ORGANIZATION_NOT_FOUND",
                "Organization not found.",
            );
        }

        /*
         * Mizan organization.
         */
        const [mizanOrganization] =
            await db
                .select({
                    id: organizations.id,
                    authOrganizationId:
                    organizations.authOrganizationId,
                    name: organizations.name,
                    phone: organizations.phone,
                    address: organizations.address,
                    wilaya: organizations.wilaya,
                    currency: organizations.currency,
                    createdAt:
                    organizations.createdAt,
                    updatedAt:
                    organizations.updatedAt,
                })
                .from(organizations)
                .where(
                    and(
                        eq(
                            organizations.authOrganizationId,
                            organizationId,
                        ),
                        isNull(
                            organizations.deletedAt,
                        ),
                    ),
                )
                .limit(1);

        if (!mizanOrganization) {
            return apiError(
                404,
                "MIZAN_ORGANIZATION_NOT_FOUND",
                "Mizan organization not found.",
            );
        }

        return apiSuccess({
            authOrganization,
            mizanOrganization,
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] GET organization failed:",
            error,
        );

        return apiError(
            500,
            "ORGANIZATION_FETCH_FAILED",
            "Failed to fetch organization.",
        );
    }
}

/**
 * PATCH /api/organizations/:organizationId
 *
 * Requires:
 * organization:update
 */
export async function PATCH(
    request: NextRequest,
    context: RouteContext,
) {
    try {
        const {
            organizationId: activeOrganizationId,
        } = await requirePermission(
            "organization",
            "update",
        );

        const { organizationId } =
            await context.params;

        if (!organizationId) {
            return apiError(
                400,
                "MISSING_ORGANIZATION_ID",
                "Organization ID is required.",
            );
        }

        if (
            activeOrganizationId !== organizationId
        ) {
            return apiError(
                403,
                "ORGANIZATION_ACCESS_DENIED",
                "You cannot update this organization.",
            );
        }

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

        /*
         * ----------------------------------------
         * Better Auth fields
         * ----------------------------------------
         */

        const authData: OrganizationUpdateData = {};

        if (body.name !== undefined) {
            if (
                typeof body.name !== "string" ||
                body.name.trim().length < 2 ||
                body.name.trim().length > 120
            ) {
                return apiError(
                    422,
                    "INVALID_NAME",
                    "Organization name must contain between 2 and 120 characters.",
                );
            }

            authData.name =
                body.name.trim();
        }

        if (body.slug !== undefined) {
            if (
                typeof body.slug !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_SLUG",
                    "Slug must be a string.",
                );
            }

            const slug =
                body.slug.trim();

            if (
                slug.length < 3 ||
                slug.length > 48 ||
                !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
                    slug,
                )
            ) {
                return apiError(
                    422,
                    "INVALID_SLUG",
                    "Slug must contain 3-48 lowercase letters, numbers and single hyphens.",
                );
            }

            authData.slug = slug;
        }

        if (body.logo !== undefined) {
            if (
                body.logo !== null &&
                typeof body.logo !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_LOGO",
                    "Logo must be a string or null.",
                );
            }

            authData.logo =
                body.logo;
        }

        if (body.metadata !== undefined) {
            if (
                body.metadata !== null &&
                !isRecord(body.metadata)
            ) {
                return apiError(
                    422,
                    "INVALID_METADATA",
                    "Metadata must be an object or null.",
                );
            }

            authData.metadata =
                body.metadata as
                    | Record<string, any>;
        }

        /*
         * ----------------------------------------
         * Mizan fields
         * ----------------------------------------
         */

        const mizanData: MizanOrganizationUpdate = {};

        /*
         * Keep organization name synchronized
         * between Better Auth and Mizan.
         */
        if (body.name !== undefined) {
            mizanData.name = authData.name;
        }

        if (body.phone !== undefined) {
            if (
                body.phone !== null &&
                typeof body.phone !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_PHONE",
                    "Phone must be a string or null.",
                );
            }

            mizanData.phone =
                body.phone === null
                    ? null
                    : body.phone.trim();
        }

        if (body.address !== undefined) {
            if (
                body.address !== null &&
                typeof body.address !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_ADDRESS",
                    "Address must be a string or null.",
                );
            }

            mizanData.address =
                body.address === null
                    ? null
                    : body.address.trim();
        }

        if (body.wilaya !== undefined) {
            if (
                typeof body.wilaya !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_WILAYA",
                    "Wilaya must be a string.",
                );
            }

            const wilaya =
                body.wilaya.trim();

            if (
                wilaya.length < 2 ||
                wilaya.length > 100
            ) {
                return apiError(
                    422,
                    "INVALID_WILAYA",
                    "Wilaya must contain between 2 and 100 characters.",
                );
            }

            mizanData.wilaya =
                wilaya;
        }

        if (body.currency !== undefined) {
            if (
                typeof body.currency !== "string"
            ) {
                return apiError(
                    422,
                    "INVALID_CURRENCY",
                    "Currency must be a string.",
                );
            }

            const currency =
                body.currency
                    .trim()
                    .toUpperCase();

            if (
                !/^[A-Z]{3}$/.test(
                    currency,
                )
            ) {
                return apiError(
                    422,
                    "INVALID_CURRENCY",
                    "Currency must be a 3-letter currency code.",
                );
            }

            mizanData.currency =
                currency;
        }

        if (
            Object.keys(authData).length === 0 &&
            Object.keys(mizanData).length === 0
        ) {
            return apiError(
                422,
                "EMPTY_UPDATE",
                "At least one organization field must be provided.",
            );
        }

        const requestHeaders =
            await headers();

        /*
         * Verify Better Auth organization.
         */
        const authOrganization =
            await auth.api.getFullOrganization({
                query: {
                    organizationId,
                },
                headers: requestHeaders,
            });

        if (!authOrganization) {
            return apiError(
                404,
                "ORGANIZATION_NOT_FOUND",
                "Organization not found.",
            );
        }

        /*
         * Find Mizan organization.
         */
        const [mizanOrganization] =
            await db
                .select({
                    id: organizations.id,
                    authOrganizationId:
                    organizations.authOrganizationId,
                })
                .from(organizations)
                .where(
                    and(
                        eq(
                            organizations.authOrganizationId,
                            organizationId,
                        ),
                        isNull(
                            organizations.deletedAt,
                        ),
                    ),
                )
                .limit(1);

        if (!mizanOrganization) {
            return apiError(
                404,
                "MIZAN_ORGANIZATION_NOT_FOUND",
                "Mizan organization not found.",
            );
        }

        /*
         * Update Better Auth organization.
         *
         * IMPORTANT:
         * data must be authData, NOT { authData }.
         */
        if (
            Object.keys(authData).length > 0
        ) {
            await auth.api.updateOrganization({
                body: {
                    organizationId,
                    data: authData,
                },
                headers: requestHeaders,
            });
        }

        /*
         * Update Mizan organization.
         */
        if (
            Object.keys(mizanData).length > 0
        ) {
            await db
                .update(organizations)
                .set({
                    ...mizanData,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(
                            organizations.id,
                            mizanOrganization.id,
                        ),
                        eq(
                            organizations.authOrganizationId,
                            organizationId,
                        ),
                        isNull(
                            organizations.deletedAt,
                        ),
                    ),
                );
        }

        /*
         * Fetch synchronized state.
         */
        const updatedAuthOrganization =
            await auth.api.getFullOrganization({
                query: {
                    organizationId,
                },
                headers: requestHeaders,
            });

        const [
            updatedMizanOrganization,
        ] = await db
            .select({
                id: organizations.id,
                authOrganizationId:
                organizations.authOrganizationId,
                name: organizations.name,
                phone: organizations.phone,
                address: organizations.address,
                wilaya: organizations.wilaya,
                currency: organizations.currency,
                createdAt:
                organizations.createdAt,
                updatedAt:
                organizations.updatedAt,
            })
            .from(organizations)
            .where(
                and(
                    eq(
                        organizations.id,
                        mizanOrganization.id,
                    ),
                    isNull(
                        organizations.deletedAt,
                    ),
                ),
            )
            .limit(1);

        return apiSuccess({
            authOrganization:
            updatedAuthOrganization,
            mizanOrganization:
            updatedMizanOrganization,
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] PATCH organization failed:",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "";

        if (
            /slug/i.test(message) &&
            /exist|unique/i.test(message)
        ) {
            return apiError(
                409,
                "SLUG_ALREADY_EXISTS",
                "This organization slug is already taken.",
            );
        }

        if (
            /permission|forbidden|unauthorized/i.test(
                message,
            )
        ) {
            return apiError(
                403,
                "ORGANIZATION_UPDATE_FORBIDDEN",
                "You do not have permission to update this organization.",
            );
        }

        return apiError(
            500,
            "ORGANIZATION_UPDATE_FAILED",
            "Failed to update organization.",
        );
    }
}

/**
 * DELETE /api/organizations/:organizationId
 *
 * Requires:
 * organization:delete
 *
 * Soft-deletes the Mizan organization.
 *
 * We DO NOT call Better Auth deleteOrganization()
 * here because that would permanently delete the
 * Better Auth organization.
 */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext,
) {
    try {
        const {
            organizationId: activeOrganizationId,
        } = await requirePermission(
            "organization",
            "delete",
        );

        const { organizationId } =
            await context.params;

        if (!organizationId) {
            return apiError(
                400,
                "MISSING_ORGANIZATION_ID",
                "Organization ID is required.",
            );
        }

        if (
            activeOrganizationId !== organizationId
        ) {
            return apiError(
                403,
                "ORGANIZATION_ACCESS_DENIED",
                "You cannot delete this organization.",
            );
        }

        const [
            mizanOrganization,
        ] = await db
            .select({
                id: organizations.id,
                authOrganizationId:
                organizations.authOrganizationId,
            })
            .from(organizations)
            .where(
                and(
                    eq(
                        organizations.authOrganizationId,
                        organizationId,
                    ),
                    isNull(
                        organizations.deletedAt,
                    ),
                ),
            )
            .limit(1);

        if (!mizanOrganization) {
            return apiError(
                404,
                "MIZAN_ORGANIZATION_NOT_FOUND",
                "Organization not found.",
            );
        }

        /*
         * Soft delete only.
         */
        await db
            .update(organizations)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(
                        organizations.id,
                        mizanOrganization.id,
                    ),
                    eq(
                        organizations.authOrganizationId,
                        organizationId,
                    ),
                    isNull(
                        organizations.deletedAt,
                    ),
                ),
            );

        return apiSuccess({
            organizationId,
            deleted: true,
            softDeleted: true,
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] DELETE organization failed:",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "";

        if (
            /permission|forbidden|unauthorized/i.test(
                message,
            )
        ) {
            return apiError(
                403,
                "ORGANIZATION_DELETE_FORBIDDEN",
                "You do not have permission to delete this organization.",
            );
        }

        return apiError(
            500,
            "ORGANIZATION_DELETE_FAILED",
            "Failed to delete organization.",
        );
    }
}