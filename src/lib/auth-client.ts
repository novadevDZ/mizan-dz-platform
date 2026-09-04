import {createAuthClient} from "better-auth/react";
import {
    inferAdditionalFields,
    organizationClient,
} from "better-auth/client/plugins";

import type {auth} from "@/src/lib/auth";

export const authClient = createAuthClient({
    baseURL:
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000",

    plugins: [
        inferAdditionalFields<typeof auth>(),
        organizationClient(),
    ],
});