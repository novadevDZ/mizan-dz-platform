import { headers } from "next/headers";

import { auth } from "@/src/lib/auth";
import { requireOrganization } from "./require-organization";

import type {
    Resource,
    Action,
} from "@/src/lib/permissions";

export async function requirePermission<
    R extends Resource,
>(
    resource: R,
    action: Action<R>,
) {
    const {
        session,
        organizationId,
        organization,
    } =
        await requireOrganization();

    const result =
        await auth.api.hasPermission({
            headers: await headers(),

            body: {
                permissions: {
                    [resource]: [action],
                },
            },
        });

    if (!result.success) {
        const error =
            new Error("Forbidden.");

        Object.assign(error, {
            status: 403,
        });

        throw error;
    }

    return {
        session,
        organizationId,
        organization,
    };
}