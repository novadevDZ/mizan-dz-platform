import {NextRequest} from "next/server";

import {auth} from "@/src/lib/auth";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/organization-api";

import {
    ApiAuthError,
    requireApiSession,
} from "@/src/lib/require-api-session";

export async function POST(
    request: NextRequest,
) {
    try {
        const {headers} =
            await requireApiSession();

        // =====================================================
        // 1. Parse JSON body
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

        // =====================================================
        // 2. Validate body
        // =====================================================

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            return apiError(
                400,
                "INVALID_BODY",
                "Request body must be an object.",
            );
        }

        const organizationId =
            (body as Record<string, unknown>)
                .organizationId;

        /**
         * organizationId must be explicitly provided.
         *
         * string → activate organization
         * null   → clear active organization
         */
        if (
            organizationId !== null &&
            typeof organizationId !== "string"
        ) {
            return apiError(
                422,
                "INVALID_ORGANIZATION_ID",
                "organizationId must be a string or null.",
            );
        }

        if (
            typeof organizationId === "string" &&
            !organizationId.trim()
        ) {
            return apiError(
                422,
                "INVALID_ORGANIZATION_ID",
                "organizationId cannot be an empty string.",
            );
        }

        // =====================================================
        // 3. Set active organization
        // =====================================================

        const result =
            await auth.api.setActiveOrganization({
                body: {
                    organizationId:
                        organizationId === null
                            ? null
                            : organizationId.trim(),
                },

                headers,

                returnHeaders: true,
            });

        // =====================================================
        // 4. Success
        // =====================================================

        return apiSuccess(
            {
                organization:
                result,

                activeOrganizationId:
                organizationId,
            },
            200,
            result.headers,
        );
    } catch (error) {
        if (
            error instanceof
            ApiAuthError
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
            "[Mizan DZ] Failed to set active organization:",
            error,
        );

        return apiError(
            403,
            "ACTIVE_ORGANIZATION_FORBIDDEN",
            "You cannot activate this organization.",
        );
    }
}