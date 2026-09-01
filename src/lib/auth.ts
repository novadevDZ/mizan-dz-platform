import {betterAuth} from "better-auth/minimal";
import {drizzleAdapter} from "@better-auth/drizzle-adapter";
import {organization} from "better-auth/plugins";

import {db} from "@/src/db";

import { sendEmail } from "@/src/lib/email";
import {
    verifyEmailTemplate,
} from "@/src/lib/email/templates/verify-email";

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
    database: drizzleAdapter(db, {
        provider: "pg",

        schema: {
            user,
            session,
            account,
            verification,

            organization:
            authOrganization,

            member:
            authMember,

            invitation:
            authInvitation,
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
     * EMAIL VERIFICATION
     * =========================================================
     *
     * Development implementation:
     * print the verification URL in the terminal.
     *
     * Replace this with a real email provider later.
     */
    emailVerification: {
        sendOnSignUp: false,

        sendVerificationEmail: async ({
                                          user,
                                          url,
                                      }) => {
            const {
                html,
                text,
            } = verifyEmailTemplate({
                userName: user.name,
                verificationUrl: url,
            });

            void sendEmail({
                to: user.email,
                subject:
                    "Verify your Mizan DZ email",
                html,
                text,
            });
        },
    },
    /*
     * =========================================================
     * ORGANIZATION
     * =========================================================
     */
    plugins: [
        organization({
            ac,

            roles: {
                owner,
                employee,
            },

            creatorRole:
                "owner",

            invitationExpiresIn:
                60 * 60 * 24 * 7,

            /*
             * Users must verify their email before
             * viewing/accepting organization invitations.
             */
            requireEmailVerificationOnInvitation:
                true,

            async sendInvitationEmail(
                data,
            ) {
                const inviteUrl =
                    `${process.env.NEXT_PUBLIC_APP_URL}` +
                    `/invite/${data.id}`;

                if (
                    process.env.NODE_ENV ===
                    "development"
                ) {
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
                 * Production:
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

            organizationHooks: {
                afterAcceptInvitation:
                    async ({
                               member,
                               user,
                               organization,
                           }) => {
                        await provisionMizanMember({
                            authMemberId:
                            member.id,

                            userId:
                            user.id,

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