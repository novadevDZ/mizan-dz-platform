import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { members } from "@/src/db/schema/members";
import { organizations } from "@/src/db/schema/organizations";

type ProvisionMizanMemberInput = {
    authMemberId: string;
    userId: string;
    authOrganizationId: string;
};

export async function provisionMizanMember({
                                               authMemberId,
                                               userId,
                                               authOrganizationId,
                                           }: ProvisionMizanMemberInput) {
    const [organization] =
        await db
            .select({
                id: organizations.id,
            })
            .from(organizations)
            .where(
                eq(
                    organizations.authOrganizationId,
                    authOrganizationId,
                ),
            )
            .limit(1);

    if (!organization) {
        throw new Error(
            "MIZAN_ORGANIZATION_NOT_FOUND",
        );
    }

    const [existingByAuthMember] =
        await db
            .select()
            .from(members)
            .where(
                eq(
                    members.authMemberId,
                    authMemberId,
                ),
            )
            .limit(1);

    if (existingByAuthMember) {
        return existingByAuthMember;
    }

    const [existingMembership] =
        await db
            .select()
            .from(members)
            .where(
                and(
                    eq(
                        members.userId,
                        userId,
                    ),
                    eq(
                        members.organizationId,
                        organization.id,
                    ),
                ),
            )
            .limit(1);

    if (existingMembership) {
        const [updated] =
            await db
                .update(members)
                .set({
                    authMemberId,
                })
                .where(
                    eq(
                        members.id,
                        existingMembership.id,
                    ),
                )
                .returning();

        return updated;
    }

    const [created] =
        await db
            .insert(members)
            .values({
                userId,

                organizationId:
                organization.id,

                authMemberId,

                role: "employee",
            })
            .returning();

    if (!created) {
        throw new Error(
            "MIZAN_MEMBER_CREATE_FAILED",
        );
    }

    return created;
}