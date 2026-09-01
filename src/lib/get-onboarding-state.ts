import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";

export async function getOnboardingState() {
    const requestHeaders = await headers();

    const session = await auth.api.getSession({
        headers: requestHeaders,
        query: {
            disableCookieCache: true,
        },
    });

    if (!session) {
        return {
            authenticated: false as const,
        };
    }

    const organizations =
        await auth.api.listOrganizations({
            headers: requestHeaders,
        });

    const organizationCount =
        organizations?.length ?? 0;

    return {
        authenticated: true as const,
        user: session.user,

        hasOrganization:
            organizationCount > 0,

        organizationCount,

        hasActiveOrganization:
            Boolean(
                session.session
                    .activeOrganizationId,
            ),

        activeOrganizationId:
            session.session
                .activeOrganizationId ?? null,

        ownerPromptShown:
            session.user.ownerPromptShown ??
            false,
    };
}