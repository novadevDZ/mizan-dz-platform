import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";

export class ApiAuthError extends Error {
    constructor(
        public readonly status: 401 | 403,
        message: string,
    ) {
        super(message);
        this.name = "ApiAuthError";
    }
}

export async function requireApiSession() {
    const requestHeaders = await headers();

    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session) {
        throw new ApiAuthError(
            401,
            "Authentication required.",
        );
    }

    return {
        session,
        user: session.user,
        headers: requestHeaders,
    };
}