import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth";
import { db } from "@/src/db";
import { organizations } from "@/src/db/schema/organizations";

function createError(
    message: string,
    status: number,
    code: string,
) {
    const error = new Error(message);

    Object.assign(error, {
        status,
        code,
    });

    return error;
}

export async function requireOrganization() {
    const requestHeaders = await headers();

    const session = await auth.api.getSession({
        headers: requestHeaders,
        query: {
            disableCookieCache: true,
        },
    });

    if (!session) {
        throw createError(
            "Unauthorized.",
            401,
            "UNAUTHORIZED",
        );
    }

    let activeAuthOrganizationId =
        session.session.activeOrganizationId;

    /*
     * No active organization yet.
     *
     * This does NOT mean the user has no organization.
     * Check Better Auth memberships first.
     */
    if (!activeAuthOrganizationId) {
        const userOrganizations =
            await auth.api.listOrganizations({
                headers: requestHeaders,
            });

        if (!userOrganizations?.length) {
            throw createError(
                "Your account is not associated with an organization.",
                409,
                "NO_ORGANIZATION",
            );
        }

        /*
         * One organization only:
         * make it active automatically.
         */
        if (userOrganizations.length === 1) {
            const organization =
                userOrganizations[0];

            await auth.api.setActiveOrganization({
                headers: requestHeaders,
                body: {
                    organizationId: organization.id,
                },
            });

            activeAuthOrganizationId =
                organization.id;
        } else {
            /*
             * User belongs to multiple organizations
             * but has not selected one.
             */
            throw createError(
                "Multiple organizations found. Select an active organization.",
                409,
                "ORGANIZATION_SELECTION_REQUIRED",
            );
        }
    }

    /*
     * Map Better Auth organization → Mizan organization
     */
    const [organization] =
        await db
            .select({
                id: organizations.id,
                authOrganizationId:
                organizations.authOrganizationId,
                name: organizations.name,
            })
            .from(organizations)
            .where(
                eq(
                    organizations.authOrganizationId,
                    activeAuthOrganizationId,
                ),
            )
            .limit(1);

    if (!organization) {
        throw createError(
            "Organization not found in Mizan.",
            404,
            "ORGANIZATION_NOT_FOUND",
        );
    }

    return {
        session,
        organizationId: organization.id,
        organization,
        authOrganizationId:
        activeAuthOrganizationId,
    };
}