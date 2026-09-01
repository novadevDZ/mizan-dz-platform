import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const organization = pgTable("organization", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    metadata: text("metadata"),
});

export const member = pgTable("member", {
    id: text("id").primaryKey(),

    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, {
            onDelete: "cascade",
        }),

    userId: text("user_id")
        .notNull()
        .references(() => user.id, {
            onDelete: "cascade",
        }),

    role: text("role").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invitation = pgTable("invitation", {
    id: text("id").primaryKey(),

    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, {
            onDelete: "cascade",
        }),

    email: text("email").notNull(),

    role: text("role").notNull(),

    status: text("status").notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    inviterId: text("inviter_id")
        .notNull()
        .references(() => user.id, {
            onDelete: "cascade",
        }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});