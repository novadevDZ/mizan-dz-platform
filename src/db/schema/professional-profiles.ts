import {
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

import {user} from "./auth";

export const professionalProfiles = pgTable(
    "professional_profiles",
    {
        id: text("id").primaryKey(),

        userId: text("user_id")
            .notNull()
            .references(() => user.id, {
                onDelete: "cascade",
            }),

        firstName: text("first_name"),

        lastName: text("last_name"),

        jobTitle: text("job_title"),

        department: text("department"),

        bio: text("bio"),

        phone: text("phone"),

        avatarUrl: text("avatar_url"),

        skills: text("skills"),

        createdAt: timestamp("created_at")
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at")
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        userIdUnique: uniqueIndex(
            "professional_profiles_user_id_unique",
        ).on(table.userId),

        jobTitleIdx: index(
            "professional_profiles_job_title_idx",
        ).on(table.jobTitle),

        departmentIdx: index(
            "professional_profiles_department_idx",
        ).on(table.department),
    }),
);