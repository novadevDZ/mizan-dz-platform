import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/src/lib/auth";
import { requirePermission } from "@/src/lib/require-permission";

const cancelInvitationSchema =
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
            cancelInvitationSchema.safeParse(
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

        await requirePermission(
            "invitation",
            "cancel",
        );

        await auth.api.cancelInvitation({
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
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] POST /api/invitations/cancel failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to cancel invitation.",
            },
            {
                status: 400,
            },
        );
    }
}