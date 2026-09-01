import {headers} from "next/headers";
import {auth} from "@/src/lib/auth";

export class ApiAuthError extends Error {
    constructor(
        public readonly status: 401 | 403,
        message: string,
    ) {
        super(message);
        this.name = "ApiAuthError";
    }
}

export async function requireApiAuth() {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });
    if (!session) {
        throw new ApiAuthError(
            401,
            "Authentication required.",
        )
    }
    const organizationId = session.session.activeOrganizationId;
    if (!organizationId) {
        throw new ApiAuthError(
            403,
            "No Active Organization.",
        )
    }
    return {
        session,
        organizationId,
        headers: requestHeaders,
    }
}