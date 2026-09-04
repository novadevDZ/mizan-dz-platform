import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { organization } from "better-auth/plugins";

import { db } from "@/src/db";

import {
    user,
    session,
    account,
    verification,
} from "@/src/db/schema/auth";

import {
    organization as authOrganization,
    member as authMember,
    invitation as authInvitation,
} from "@/src/db/schema/auth-organization";

import {
    ac,
    owner,
    employee,
} from "@/src/lib/permissions";

import {
    provisionMizanMember,
} from "@/src/lib/members/provision-mizan-member";

const baseURL =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,

    baseURL,

    trustedOrigins: [
        baseURL,
        "https://mizan-six-psi.vercel.app",
    ],

    database: drizzleAdapter(db, {
        provider: "pg",

        schema: {
            user,
            session,
            account,
            verification,

            organization: authOrganization,
            member: authMember,
            invitation: authInvitation,
        },
    }),

    emailAndPassword: {
        enabled: true,
    },

    plugins: [
        organization({
            ac,

            roles: {
                owner,
                employee,
            },

            creatorRole: "owner",

            invitationExpiresIn: 60 * 60 * 24 * 7,

            requireEmailVerificationOnInvitation: true,

            async sendInvitationEmail(data) {
                const appUrl =
                    process.env.NEXT_PUBLIC_APP_URL ??
                    process.env.BETTER_AUTH_URL ??
                    "";

                const inviteUrl = `${appUrl}/invite/${data.id}`;

                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "[Mizan DZ] Invitation URL:",
                        inviteUrl
                    );

                    console.log(
                        "[Mizan DZ] Invitation recipient:",
                        data.email
                    );

                    console.log(
                        "[Mizan DZ] Organization:",
                        data.organization.name
                    );
                }
            },

            organizationHooks: {
                afterAcceptInvitation: async ({
                                                  member,
                                                  user,
                                                  organization,
                                              }) => {
                    await provisionMizanMember({
                        authMemberId: member.id,
                        userId: user.id,
                        authOrganizationId: organization.id,
                    });
                },
            },
        }),
    ],

    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: true,
                input: true,
                returned: true,
            },

            ownerPromptShown: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false,
                returned: true,
            },
        },
    },
});