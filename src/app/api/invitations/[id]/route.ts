import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(
    request: Request,
    context: RouteContext,
) {
    try {
        const { id } =
            await context.params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invitation ID is required.",
                },
                {
                    status: 400,
                },
            );
        }

        const invitation =
            await auth.api.getInvitation({
                headers:
                    await headers(),

                query: {
                    id,
                },
            });

        if (!invitation) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Invitation not found.",
                },
                {
                    status: 404,
                },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                invitation,
            },
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] GET /api/invitations/[id] failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to load invitation.",
            },
            {
                status: 400,
            },
        );
    }
}