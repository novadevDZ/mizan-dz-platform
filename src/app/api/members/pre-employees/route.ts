import { NextResponse } from "next/server";
import { and, eq, notInArray } from "drizzle-orm";

import { db } from "@/src/db";
import { members } from "@/src/db/schema/members";
import { user } from "@/src/db/schema/auth";
import { requirePermission } from "@/src/lib/require-permission";

function getErrorStatus(error: unknown) {
    if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof error.status === "number"
    ) {
        return error.status;
    }

    return 500;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Unable to load pre-employees.";
}

export async function GET() {
    try {
        const {
            organizationId,
            session,
        } = await requirePermission(
            "members",
            "read",
        );

        const userId =
            session.session.userId;

        if (!organizationId) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "No active organization found.",
                },
                {
                    status: 400,
                },
            );
        }

        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Current user could not be identified.",
                },
                {
                    status: 401,
                },
            );
        }

        const preEmployees =
            await db
                .select({
                    id: members.id,
                    userId: members.userId,
                    organizationId:
                    members.organizationId,
                    authMemberId:
                    members.authMemberId,
                    role: members.role,
                    createdAt:
                    members.createdAt,

                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        phone: user.phone,
                        ownerPromptShown:
                        user.ownerPromptShown,
                    },
                })
                .from(members)
                .leftJoin(
                    user,
                    eq(
                        members.userId,
                        user.id,
                    ),
                )
                .where(
                    and(
                        eq(
                            members.organizationId,
                            organizationId,
                        ),

                        notInArray(
                            members.role,
                            [
                                "owner",
                                "employee",
                            ],
                        ),
                    ),
                );

        return NextResponse.json({
            success: true,
            data: {
                members: preEmployees,
            },
        });
    } catch (error) {
        console.error(
            "[Mizan DZ] GET /api/members/pre-employees failed:",
            error,
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    getErrorMessage(error),
            },
            {
                status:
                    getErrorStatus(error),
            },
        );
    }
}