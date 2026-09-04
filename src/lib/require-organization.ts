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

    if (!session?.user) {
        throw createError(
            "Unauthorized.",
            401,
            "UNAUTHORIZED",
        );
    }

    const activeAuthOrganizationId =
        session.session.activeOrganizationId;

    /*
     * The dashboard must only run with an active organization.
     *
     * Do not attempt to activate an organization here.
     * Server-side activation cannot reliably persist the
     * resulting auth cookie into the browser request.
     */
    if (!activeAuthOrganizationId) {
        throw createError(
            "No active organization.",
            409,
            "NO_ACTIVE_ORGANIZATION",
        );
    }

    /*
     * Map Better Auth organization → Mizan organization.
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