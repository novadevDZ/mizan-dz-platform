import {betterAuth} from "better-auth/minimal";
import {drizzleAdapter} from "@better-auth/drizzle-adapter";
import {organization} from "better-auth/plugins";

import {db} from "@/src/db";

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

export const auth = betterAuth({
    /*
     * =========================================================
     * BETTER AUTH CONFIGURATION
     * =========================================================
     *
     * Explicitly define the production secret and base URL.
     *
     * Local:
     * BETTER_AUTH_URL=http://localhost:3000
     *
     * Production:
     * BETTER_AUTH_URL=https://mizan-dz.vercel.app
     */
    secret: process.env.BETTER_AUTH_SECRET,

    baseURL: process.env.BETTER_AUTH_URL,

    /*
     * =========================================================
     * DATABASE
     * =========================================================
     */
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

    /*
     * =========================================================
     * EMAIL + PASSWORD
     * =========================================================
     */
    emailAndPassword: {
        enabled: true,
    },

    /*
     * =========================================================
     * ORGANIZATION
     * =========================================================
     */
    plugins: [
        organization({
            /*
             * Access control
             */
            ac,

            /*
             * Organization roles
             */
            roles: {
                owner,
                employee,
            },

            /*
             * Role automatically assigned to
             * the organization creator.
             */
            creatorRole: "owner",

            /*
             * Invitation validity:
             * 7 days.
             */
            invitationExpiresIn: 60 * 60 * 24 * 7,

            /*
             * Users must verify their email
             * before viewing/accepting invitations.
             */
            requireEmailVerificationOnInvitation: true,

            /*
             * =================================================
             * INVITATION EMAIL
             * =================================================
             *
             * Email provider can be connected later.
             *
             * During development, the invitation URL is
             * printed to the server console.
             */
            async sendInvitationEmail(data) {
                const appUrl =
                    process.env.NEXT_PUBLIC_APP_URL ??
                    process.env.BETTER_AUTH_URL ??
                    "";

                const inviteUrl =
                    `${appUrl}/invite/${data.id}`;

                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "[Mizan DZ] Invitation URL:",
                        inviteUrl,
                    );

                    console.log(
                        "[Mizan DZ] Invitation recipient:",
                        data.email,
                    );

                    console.log(
                        "[Mizan DZ] Organization:",
                        data.organization.name,
                    );
                }

                /*
                 * Production email implementation goes here.
                 *
                 * Example:
                 *
                 * await sendInvitationEmail({
                 *     to: data.email,
                 *     inviteUrl,
                 *     organizationName:
                 *         data.organization.name,
                 *     inviterName:
                 *         data.inviter.user.name,
                 * });
                 */
            },

            /*
             * =================================================
             * ORGANIZATION HOOKS
             * =================================================
             */
            organizationHooks: {
                /*
                 * When an invitation is accepted:
                 *
                 * Better Auth member
                 *        ↓
                 * Mizan member
                 */
                afterAcceptInvitation: async ({
                                                  member,
                                                  user,
                                                  organization,
                                              }) => {
                    await provisionMizanMember({
                        authMemberId: member.id,

                        userId: user.id,

                        authOrganizationId:
                        organization.id,
                    });
                },
            },
        }),
    ],

    /*
     * =========================================================
     * USER
     * =========================================================
     */
    user: {
        additionalFields: {
            /*
             * Phone number
             */
            phone: {
                type: "string",

                required: true,

                input: true,

                returned: true,
            },

            /*
             * Used by the onboarding flow to determine
             * whether the owner prompt has already been shown.
             */
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