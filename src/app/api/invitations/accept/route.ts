import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/src/lib/auth";

const acceptInvitationSchema =
    z.object({
        invitationId: z
            .string()
            .min(
                1,
                "Invitation ID is required.",
            ),
    });

export async function POST(
    request: Request,
) {
    try {
        const body =
            await request.json();

        const parsed =
            acceptInvitationSchema.safeParse(
                body,
            );

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invalid invitation ID.",
                },
                {
                    status: 400,
                },
            );
        }

        const session =
            await auth.api.getSession({
                headers:
                    await headers(),

                query: {
                    disableCookieCache:
                        true,
                },
            });

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Unauthorized.",
                },
                {
                    status: 401,
                },
            );
        }

        const result =
            await auth.api.acceptInvitation({
                headers:
                    await headers(),

                body: {
                    invitationId:
                    parsed.data
                        .invitationId,
                },
            });

        return NextResponse.json({
            success: true,

            data: {
                result,
            },
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] POST /api/invitations/accept failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to accept invitation.",
            },
            {
                status: 400,
            },
        );
    }
}