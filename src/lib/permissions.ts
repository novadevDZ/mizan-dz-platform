import { createAccessControl } from "better-auth/plugins/access";

const statement = {
    organization: [
        "read",
        "update",
        "delete",
    ],

    members: [
        "read",
        "create",
        "update",
        "delete",
    ],

    invitation: [
        "create",
        "cancel",
    ],

    customers: [
        "read",
        "create",
        "update",
        "delete",
    ],

    products: [
        "read",
        "create",
        "update",
        "delete",
    ],

    sales: [
        "read",
        "create",
        "update",
        "cancel",
    ],

    payments: [
        "read",
        "create",
    ],

    expenses: [
        "read",
        "create",
        "update",
        "delete",
    ],

    invoices: [
        "read",
        "create",
    ],
} as const;

export type Resource =
    keyof typeof statement;

export type Action<
    R extends Resource,
> = (typeof statement)[R][number];

export const ac =
    createAccessControl(statement);

export const owner = ac.newRole({
    organization: [
        "read",
        "update",
        "delete",
    ],

    members: [
        "read",
        "create",
        "update",
        "delete",
    ],

    invitation: [
        "create",
        "cancel",
    ],

    customers: [
        "read",
        "create",
        "update",
        "delete",
    ],

    products: [
        "read",
        "create",
        "update",
        "delete",
    ],

    sales: [
        "read",
        "create",
        "update",
        "cancel",
    ],

    payments: [
        "read",
        "create",
    ],

    expenses: [
        "read",
        "create",
        "update",
        "delete",
    ],

    invoices: [
        "read",
        "create",
    ],
});

export const employee = ac.newRole({
    customers: [
        "read",
        "create",
        "update",
    ],

    products: [
        "read",
        "create",
        "update",
    ],

    sales: [
        "read",
        "create",
    ],

    payments: [
        "read",
        "create",
    ],

    invoices: [
        "read",
        "create",
    ],
});