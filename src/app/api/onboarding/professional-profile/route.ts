import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth";
import { db } from "@/src/db";
import {
    professionalProfiles,
} from "@/src/db/schema";

import {
    professionalProfileSchema,
} from "@/src/lib/validators/professional-profile";

async function getCurrentUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return null;
    }

    return session.user;
}

async function getCurrentProfile(
    userId: string,
) {
    return db.query.professionalProfiles.findFirst({
        where: eq(
            professionalProfiles.userId,
            userId,
        ),
    });
}

/**
 * GET /api/onboarding/professional-profile
 */
export async function GET() {
    try {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        const profile =
            await getCurrentProfile(
                currentUser.id,
            );

        return NextResponse.json({
            profile: profile ?? null,
        });
    } catch (error) {
        console.error(
            "GET professional profile failed:",
            error,
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load professional profile",
            },
            {
                status: 500,
            },
        );
    }
}

/**
 * POST /api/onboarding/professional-profile
 */
export async function POST(
    request: Request,
) {
    try {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        const existingProfile =
            await getCurrentProfile(
                currentUser.id,
            );

        if (existingProfile) {
            return NextResponse.json(
                {
                    message:
                        "Professional profile already exists",
                    profile: existingProfile,
                },
                {
                    status: 409,
                },
            );
        }

        const body = await request.json();

        const result =
            professionalProfileSchema.safeParse(
                body,
            );

        if (!result.success) {
            return NextResponse.json(
                {
                    message:
                        "Invalid professional profile data",
                    errors:
                        result.error.flatten(),
                },
                {
                    status: 400,
                },
            );
        }

        const [profile] =
            await db
                .insert(professionalProfiles)
                .values({
                    id: crypto.randomUUID(),
                    userId: currentUser.id,
                    ...result.data,
                })
                .returning();

        return NextResponse.json(
            {
                success: true,
                profile,
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        console.error(
            "POST professional profile failed:",
            error,
        );

        return NextResponse.json(
            {
                message:
                    "Failed to create professional profile",
            },
            {
                status: 500,
            },
        );
    }
}

/**
 * PATCH /api/onboarding/professional-profile
 */
export async function PATCH(
    request: Request,
) {
    try {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        const existingProfile =
            await getCurrentProfile(
                currentUser.id,
            );

        if (!existingProfile) {
            return NextResponse.json(
                {
                    message:
                        "Professional profile not found",
                },
                {
                    status: 404,
                },
            );
        }

        const body = await request.json();

        const result =
            professionalProfileSchema.safeParse(
                body,
            );

        if (!result.success) {
            return NextResponse.json(
                {
                    message:
                        "Invalid professional profile data",
                    errors:
                        result.error.flatten(),
                },
                {
                    status: 400,
                },
            );
        }

        const [profile] =
            await db
                .update(professionalProfiles)
                .set({
                    ...result.data,
                    updatedAt: new Date(),
                })
                .where(
                    eq(
                        professionalProfiles.id,
                        existingProfile.id,
                    ),
                )
                .returning();

        return NextResponse.json({
            success: true,
            profile,
        });
    } catch (error) {
        console.error(
            "PATCH professional profile failed:",
            error,
        );

        return NextResponse.json(
            {
                message:
                    "Failed to update professional profile",
            },
            {
                status: 500,
            },
        );
    }
}

/**
 * DELETE /api/onboarding/professional-profile
 */
export async function DELETE() {
    try {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        const existingProfile =
            await getCurrentProfile(
                currentUser.id,
            );

        if (!existingProfile) {
            return NextResponse.json(
                {
                    message:
                        "Professional profile not found",
                },
                {
                    status: 404,
                },
            );
        }

        await db
            .delete(professionalProfiles)
            .where(
                eq(
                    professionalProfiles.id,
                    existingProfile.id,
                ),
            );

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "DELETE professional profile failed:",
            error,
        );

        return NextResponse.json(
            {
                message:
                    "Failed to delete professional profile",
            },
            {
                status: 500,
            },
        );
    }
}