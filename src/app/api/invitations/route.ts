import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/src/lib/auth";
import { requirePermission } from "@/src/lib/require-permission";

const createInvitationSchema =
    z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .email(
                "Invalid email address.",
            ),
    });

function getErrorStatus(
    error: unknown,
) {
    if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof error.status ===
        "number"
    ) {
        return error.status;
    }

    return 500;
}

function getErrorMessage(
    error: unknown,
) {
    return error instanceof Error
        ? error.message
        : "Unable to create invitation.";
}

export async function POST(
    request: Request,
) {
    try {
        const body =
            await request.json();

        const parsed =
            createInvitationSchema.safeParse(
                body,
            );

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid request.",
                    issues:
                        parsed.error.flatten(),
                },
                {
                    status: 400,
                },
            );
        }

        const {
            organization,
        } =
            await requirePermission(
                "invitation",
                "create",
            );

        if (
            !organization
                .authOrganizationId
        ) {
            const error =
                new Error(
                    "Organization is not connected to Better Auth.",
                );

            Object.assign(error, {
                status: 500,
            });

            throw error;
        }

        /*
         * Do NOT accept role from the client.
         *
         * Mizan currently has one employee role
         * for invited users.
         */
        const invitation =
            await auth.api.createInvitation({
                headers:
                    await headers(),

                body: {
                    organizationId:
                    organization.authOrganizationId,

                    email:
                    parsed.data.email,

                    role:
                        "employee",

                    resend: true,
                },
            });

        return NextResponse.json(
            {
                success: true,

                data: {
                    invitation,
                },
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        console.error(
            "[Mizan DZ] POST /api/invitations failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    getErrorMessage(
                        error,
                    ),
            },
            {
                status:
                    getErrorStatus(
                        error,
                    ),
            },
        );
    }
}

export async function GET() {
    try {
        const {
            organization,
        } =
            await requirePermission(
                "invitation",
                "create",
            );

        const invitations =
            await auth.api.listInvitations({
                headers:
                    await headers(),

                query: {
                    organizationId:
                    organization.authOrganizationId,
                },
            });

        return NextResponse.json({
            success: true,
            data: {
                invitations,
            },
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] GET /api/invitations failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    getErrorMessage(
                        error,
                    ),
            },
            {
                status:
                    getErrorStatus(
                        error,
                    ),
            },
        );
    }
}