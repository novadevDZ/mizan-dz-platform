"use client";

import { createAuthClient } from "better-auth/react";
import {
    inferAdditionalFields,
    organizationClient,
} from "better-auth/client/plugins";

import type { auth } from "@/src/lib/auth";

const baseURL =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

export const authClient = createAuthClient({
    baseURL,

    plugins: [
        inferAdditionalFields<typeof auth>(),

        organizationClient(),
    ],
});