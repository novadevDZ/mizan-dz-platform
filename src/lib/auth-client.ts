import { createAuthClient } from "better-auth/react";
import {inferAdditionalFields, organizationClient} from "better-auth/client/plugins";
import type {auth} from "@/src/lib/auth";


export const authClient = createAuthClient({
    baseURL: process.env.REACT_APP_AUTH_URL ?? "http://localhost:3000",
    plugins: [
        inferAdditionalFields<typeof auth>(),
        organizationClient()
    ]
});