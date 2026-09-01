import {
    pgTable,
    text,
    timestamp,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "@/src/db/schema/auth";
import { organizations } from "@/src/db/schema/organizations";
import {
    member as authMember,
} from "@/src/db/schema/auth-organization";
import {memberRoleEnum} from "@/src/db/schema/enums";

export const members = pgTable(
    "members",
    {
        id: uuid("id")
            .defaultRandom()
            .primaryKey(),

        userId: text("user_id")
            .notNull()
            .references(
                () => user.id,
                {
                    onDelete: "cascade",
                },
            ),

        organizationId: uuid(
            "organization_id",
        )
            .notNull()
            .references(
                () => organizations.id,
                {
                    onDelete: "cascade",
                },
            ),

        /**
         * Better Auth member ID.
         *
         * Nullable for the existing owner
         * records until they are backfilled.
         */
        authMemberId: text(
            "auth_member_id",
        ).references(
            () => authMember.id,
            {
                onDelete: "cascade",
            },
        ),

        role: memberRoleEnum("role")
            .notNull()
            .default("pre_employee"),

        createdAt: timestamp(
            "created_at",
        )
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex(
            "members_auth_member_id_unique",
        ).on(
            table.authMemberId,
        ),

        uniqueIndex(
            "members_user_organization_unique",
        ).on(
            table.userId,
            table.organizationId,
        ),
    ],
);