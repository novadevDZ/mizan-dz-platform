import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/src/lib/auth";
import { db } from "@/src/db";
import { user } from "@/src/db/schema";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        const body = await request.json();

        if (body.action !== "later") {
            return NextResponse.json(
                {
                    message: "Invalid action",
                },
                {
                    status: 400,
                },
            );
        }

        await db
            .update(user)
            .set({
                ownerPromptShown: true,
            })
            .where(eq(user.id, session.user.id));

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "POST /api/onboarding/owner-prompt failed:",
            error,
        );

        return NextResponse.json(
            {
                message: "Failed to update onboarding state",
            },
            {
                status: 500,
            },
        );
    }
}