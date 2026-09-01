import {NextRequest, NextResponse} from "next/server";
import {
    and,
    eq,
    isNull,
} from "drizzle-orm";

import {auth} from "@/src/lib/auth";
import {db} from "@/src/db";

import {organizations} from "@/src/db/schema/organizations";
import {members} from "@/src/db/schema/members";

import {
    ApiAuthError,
    requireApiSession,
} from "@/src/lib/require-api-session";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/organization-api";

const PHONE_REGEX =
    /^(0(5|6|7)\d{8}|\+213(5|6|7)\d{8})$/;

const SLUG_REGEX =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizePhone(value: string): string {
    return value
        .replace(/\s+/g, "")
        .trim();
}

function isValidPhone(value: string): boolean {
    return PHONE_REGEX.test(
        normalizePhone(value),
    );
}

function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        )
        .slice(0, 48);
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : String(error);
}

/**
 * Copy all Set-Cookie headers returned
 * by Better Auth to the final NextResponse.
 */
function appendSetCookies(
    response: NextResponse,
    headers: Headers,
): NextResponse {
    for (const cookie of headers.getSetCookie()) {
        response.headers.append(
            "Set-Cookie",
            cookie,
        );
    }

    return response;
}

/**
 * GET /api/organizations
 *
 * Returns all active Mizan organizations
 * belonging to the authenticated user.
 */
export async function GET() {
    try {
        const {user} =
            await requireApiSession();

        const userOrganizations =
            await db
                .select({
                    id: organizations.id,

                    authOrganizationId:
                    organizations.authOrganizationId,

                    name: organizations.name,

                    phone: organizations.phone,

                    address:
                    organizations.address,

                    wilaya:
                    organizations.wilaya,

                    currency:
                    organizations.currency,

                    role: members.role,

                    createdAt:
                    organizations.createdAt,

                    updatedAt:
                    organizations.updatedAt,
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
                    and(
                        eq(
                            members.userId,
                            user.id,
                        ),
                        isNull(
                            organizations.deletedAt,
                        ),
                    ),
                );

        return apiSuccess({
            organizations:
            userOrganizations,
        });
    } catch (error) {
        if (
            error instanceof ApiAuthError
        ) {
            return apiError(
                error.status,
                error.status === 401
                    ? "UNAUTHORIZED"
                    : "FORBIDDEN",
                error.message,
            );
        }

        console.error(
            "[Mizan DZ] GET /api/organizations failed:",
            error,
        );

        return apiError(
            500,
            "ORGANIZATIONS_LIST_FAILED",
            "Unable to load your organizations.",
        );
    }
}

/**
 * POST /api/organizations
 *
 * Creates:
 *
 * 1. Better Auth organization
 * 2. Mizan organization
 * 3. Mizan owner membership
 * 4. Active organization
 *
 * Better Auth Set-Cookie headers are forwarded
 * to the browser.
 */
export async function POST(
    request: NextRequest,
) {
    try {
        const {
            user,
            headers: requestHeaders,
        } = await requireApiSession();

        // =====================================================
        // 1. Parse body
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

        // =====================================================
        // 2. Read input
        // =====================================================

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const phone =
            typeof body.phone === "string"
                ? normalizePhone(body.phone)
                : "";

        const address =
            body.address === null
                ? null
                : typeof body.address === "string"
                    ? body.address.trim() || null
                    : undefined;

        const wilaya =
            typeof body.wilaya === "string"
                ? body.wilaya.trim()
                : "";

        const currency =
            typeof body.currency === "string" &&
            body.currency.trim()
                ? body.currency
                    .trim()
                    .toUpperCase()
                : "DZD";

        const providedSlug =
            typeof body.slug === "string"
                ? body.slug
                    .trim()
                    .toLowerCase()
                : "";

        const slug =
            providedSlug ||
            slugify(name);

        // =====================================================
        // 3. Validate
        // =====================================================

        if (
            name.length < 2 ||
            name.length > 120
        ) {
            return apiError(
                422,
                "INVALID_NAME",
                "Business name must contain between 2 and 120 characters.",
            );
        }

        if (!isValidPhone(phone)) {
            return apiError(
                422,
                "INVALID_PHONE",
                "Business phone must be a valid Algerian number, for example 0551234567.",
            );
        }

        if (!wilaya) {
            return apiError(
                422,
                "INVALID_WILAYA",
                "Wilaya is required.",
            );
        }

        if (!/^[A-Z]{3}$/.test(currency)) {
            return apiError(
                422,
                "INVALID_CURRENCY",
                "Currency must be a valid 3-letter currency code.",
            );
        }

        if (
            !slug ||
            slug.length < 3 ||
            slug.length > 48 ||
            !SLUG_REGEX.test(slug)
        ) {
            return apiError(
                422,
                "INVALID_SLUG",
                "Slug must contain 3-48 lowercase letters, numbers and single hyphens.",
            );
        }

        // =====================================================
        // 4. Create Better Auth organization
        // =====================================================

        let createdAuthOrganization:
            | Awaited<
            ReturnType<
                typeof auth.api.createOrganization
            >
        >
            | null = null;

        try {
            console.log(
                "[Mizan DZ] Creating Better Auth organization...",
                {
                    userId: user.id,
                    name,
                    slug,
                },
            );

            createdAuthOrganization =
                await auth.api.createOrganization({
                    body: {
                        name,
                        slug,
                        keepCurrentActiveOrganization:
                            false,
                    },

                    headers: requestHeaders,
                });

            if (!createdAuthOrganization) {
                return apiError(
                    500,
                    "AUTH_ORGANIZATION_CREATE_FAILED",
                    "Unable to create the authentication organization.",
                );
            }

            console.log(
                "[Mizan DZ] Better Auth organization created.",
                {
                    organizationId:
                    createdAuthOrganization.id,
                },
            );
        } catch (error) {
            console.error(
                "[Mizan DZ] Better Auth organization creation failed:",
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
                500,
                "AUTH_ORGANIZATION_CREATE_FAILED",
                "Unable to create the authentication organization.",
                process.env.NODE_ENV ===
                "development"
                    ? message
                    : undefined,
            );
        }

        /**
         * Important:
         *
         * Convert the nullable result into a stable,
         * non-null reference for the rest of the request.
         *
         * This avoids TS18047 errors when accessing
         * createdAuthOrganization.id later.
         */
        const authOrganization =
            createdAuthOrganization;

        // =====================================================
        // 5. Create Mizan organization + owner membership
        // =====================================================

        let mizanResult:
            | {
            organization:
                typeof organizations.$inferSelect;

            membership:
                typeof members.$inferSelect;
        }
            | null = null;

        try {
            console.log(
                "[Mizan DZ] Creating Mizan organization...",
                {
                    authOrganizationId:
                    authOrganization.id,
                },
            );

            mizanResult =
                await db.transaction(
                    async (tx) => {
                        const [
                            organization,
                        ] = await tx
                            .insert(organizations)
                            .values({
                                authOrganizationId:
                                authOrganization.id,

                                name,

                                phone,

                                address:
                                    address ?? null,

                                wilaya,

                                currency,
                            })
                            .returning();

                        if (!organization) {
                            throw new Error(
                                "MIZAN_ORGANIZATION_INSERT_FAILED",
                            );
                        }

                        const [
                            membership,
                        ] = await tx
                            .insert(members)
                            .values({
                                userId:
                                user.id,

                                organizationId:
                                organization.id,

                                role: "owner",
                            })
                            .returning();

                        if (!membership) {
                            throw new Error(
                                "MIZAN_MEMBER_INSERT_FAILED",
                            );
                        }

                        return {
                            organization,
                            membership,
                        };
                    },
                );

            console.log(
                "[Mizan DZ] Mizan organization created.",
                {
                    organizationId:
                    mizanResult.organization
                        .id,

                    membershipId:
                    mizanResult.membership
                        .id,
                },
            );
        } catch (error) {
            console.error(
                "[Mizan DZ] Mizan organization transaction failed:",
                error,
            );

            // =================================================
            // Cleanup Better Auth organization
            // =================================================

            try {
                await auth.api.deleteOrganization({
                    body: {
                        organizationId:
                        authOrganization.id,
                    },

                    headers:
                    requestHeaders,
                });
            } catch (
                cleanupError
                ) {
                console.error(
                    "[Mizan DZ] Failed to cleanup Better Auth organization:",
                    cleanupError,
                );
            }

            const message =
                getErrorMessage(error);

            if (
                /unique|duplicate/i.test(
                    message,
                )
            ) {
                return apiError(
                    409,
                    "ORGANIZATION_ALREADY_EXISTS",
                    "This organization already exists.",
                );
            }

            return apiError(
                500,
                "MIZAN_ORGANIZATION_CREATE_FAILED",
                "Unable to create your business workspace.",
                process.env.NODE_ENV ===
                "development"
                    ? message
                    : undefined,
            );
        }

        /**
         * At this point mizanResult is guaranteed
         * because the failure path above returns.
         */
        const createdMizanOrganization =
            mizanResult.organization;

        const createdMembership =
            mizanResult.membership;

        // =====================================================
        // 6. Set active organization
        // =====================================================

        let activeOrganizationHeaders:
            Headers;

        try {
            console.log(
                "[Mizan DZ] Setting active organization...",
                {
                    organizationId:
                    authOrganization.id,

                    userId:
                    user.id,
                },
            );

            const activeResult =
                await auth.api.setActiveOrganization(
                    {
                        body: {
                            organizationId:
                            authOrganization.id,
                        },

                        headers:
                        requestHeaders,

                        returnHeaders:
                            true,
                    },
                );

            activeOrganizationHeaders =
                activeResult.headers;

            const cookies =
                activeOrganizationHeaders
                    .getSetCookie();

            console.log(
                "[Mizan DZ] Active organization set.",
                {
                    organizationId:
                    authOrganization.id,

                    setCookieCount:
                    cookies.length,
                },
            );

            if (cookies.length === 0) {
                console.warn(
                    "[Mizan DZ] setActiveOrganization returned no Set-Cookie header.",
                );
            }
        } catch (error) {
            console.error(
                "[Mizan DZ] Failed to set active organization:",
                error,
            );

            // =================================================
            // Cleanup Mizan organization
            // =================================================

            try {
                await db
                    .delete(organizations)
                    .where(
                        eq(
                            organizations.id,
                            createdMizanOrganization.id,
                        ),
                    );
            } catch (
                cleanupError
                ) {
                console.error(
                    "[Mizan DZ] Failed to cleanup Mizan organization:",
                    cleanupError,
                );
            }

            // =================================================
            // Cleanup Better Auth organization
            // =================================================

            try {
                await auth.api.deleteOrganization({
                    body: {
                        organizationId:
                        authOrganization.id,
                    },

                    headers:
                    requestHeaders,
                });
            } catch (
                cleanupError
                ) {
                console.error(
                    "[Mizan DZ] Failed to cleanup Better Auth organization:",
                    cleanupError,
                );
            }

            const message =
                getErrorMessage(error);

            return apiError(
                500,
                "ACTIVE_ORGANIZATION_SET_FAILED",
                "Workspace was created, but we could not activate it for this session.",
                process.env.NODE_ENV ===
                "development"
                    ? message
                    : undefined,
            );
        }

        // =====================================================
        // 7. Build success response
        // =====================================================

        const response =
            NextResponse.json(
                {
                    success: true,

                    data: {
                        organization:
                        createdMizanOrganization,

                        membership:
                        createdMembership,

                        authOrganization,

                        activeOrganizationId:
                        authOrganization.id,
                    },
                },
                {
                    status: 201,
                },
            );

        // =====================================================
        // 8. Forward Better Auth cookies
        // =====================================================

        appendSetCookies(
            response,
            activeOrganizationHeaders,
        );

        return response;
    } catch (error) {
        console.error(
            "[Mizan DZ] POST /api/organizations unexpected failure:",
            error,
        );

        if (
            error instanceof ApiAuthError
        ) {
            return apiError(
                error.status,
                error.status === 401
                    ? "UNAUTHORIZED"
                    : "FORBIDDEN",
                error.message,
            );
        }

        const message =
            getErrorMessage(error);

        return apiError(
            500,
            "ORGANIZATION_CREATE_FAILED",
            "Unable to create your business workspace.",
            process.env.NODE_ENV ===
            "development"
                ? message
                : undefined,
        );
    }
}