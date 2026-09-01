import { relations } from "drizzle-orm";

import {
    account,
    session,
    user,
} from "@/src/db/schema/auth";

import { organizations } from "@/src/db/schema/organizations";
import { members } from "@/src/db/schema/members";
import { customers } from "@/src/db/schema/customers";
import { products } from "@/src/db/schema/products";
import { sales } from "@/src/db/schema/sales";
import { saleItems } from "@/src/db/schema/saleItems";
import { payments } from "@/src/db/schema/payments";
import { expenses } from "@/src/db/schema/expenses";
import { invoices } from "@/src/db/schema/invoices";
import { invoiceItems } from "@/src/db/schema/invoiceItems";

/* =========================
   BETTER AUTH USER
========================= */

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    memberships: many(members),
}));

/* =========================
   AUTH SESSION
========================= */

export const sessionRelations = relations(
    session,
    ({ one }) => ({
        user: one(user, {
            fields: [session.userId],
            references: [user.id],
        }),
    }),
);

/* =========================
   AUTH ACCOUNT
========================= */

export const accountRelations = relations(
    account,
    ({ one }) => ({
        user: one(user, {
            fields: [account.userId],
            references: [user.id],
        }),
    }),
);

/* =========================
   ORGANIZATIONS
========================= */

export const organizationsRelations = relations(
    organizations,
    ({ many }) => ({
        members: many(members),
        customers: many(customers),
        products: many(products),
        sales: many(sales),
        payments: many(payments),
        expenses: many(expenses),
        invoices: many(invoices),
    }),
);

/* =========================
   MEMBERS
========================= */

export const membersRelations = relations(
    members,
    ({ one, many }) => ({
        user: one(user, {
            fields: [members.userId],
            references: [user.id],
        }),

        organization: one(organizations, {
            fields: [members.organizationId],
            references: [organizations.id],
        }),

        salesCreated: many(sales),
        expensesCreated: many(expenses),
    }),
);

/* =========================
   CUSTOMERS
========================= */

export const customersRelations = relations(
    customers,
    ({ one, many }) => ({
        organization: one(organizations, {
            fields: [customers.organizationId],
            references: [organizations.id],
        }),

        sales: many(sales),
        payments: many(payments),
    }),
);

/* =========================
   PRODUCTS
========================= */

export const productsRelations = relations(
    products,
    ({ one, many }) => ({
        organization: one(organizations, {
            fields: [products.organizationId],
            references: [organizations.id],
        }),

        saleItems: many(saleItems),
        invoiceItems: many(invoiceItems),
    }),
);

/* =========================
   SALES
========================= */

export const salesRelations = relations(
    sales,
    ({ one, many }) => ({
        organization: one(organizations, {
            fields: [sales.organizationId],
            references: [organizations.id],
        }),

        customer: one(customers, {
            fields: [sales.customerId],
            references: [customers.id],
        }),

        createdBy: one(members, {
            fields: [sales.createdBy],
            references: [members.id],
        }),

        items: many(saleItems),

        payments: many(payments),

        invoice: one(invoices),
    }),
);

/* =========================
   SALE ITEMS
========================= */

export const saleItemsRelations = relations(
    saleItems,
    ({ one }) => ({
        sale: one(sales, {
            fields: [saleItems.saleId],
            references: [sales.id],
        }),

        product: one(products, {
            fields: [saleItems.productId],
            references: [products.id],
        }),
    }),
);

/* =========================
   PAYMENTS
========================= */

export const paymentsRelations = relations(
    payments,
    ({ one }) => ({
        organization: one(organizations, {
            fields: [payments.organizationId],
            references: [organizations.id],
        }),

        customer: one(customers, {
            fields: [payments.customerId],
            references: [customers.id],
        }),

        sale: one(sales, {
            fields: [payments.saleId],
            references: [sales.id],
        }),
    }),
);

/* =========================
   EXPENSES
========================= */

export const expensesRelations = relations(
    expenses,
    ({ one }) => ({
        organization: one(organizations, {
            fields: [expenses.organizationId],
            references: [organizations.id],
        }),

        createdBy: one(members, {
            fields: [expenses.createdBy],
            references: [members.id],
        }),
    }),
);

/* =========================
   INVOICES
========================= */

export const invoicesRelations = relations(
    invoices,
    ({ one, many }) => ({
        organization: one(organizations, {
            fields: [invoices.organizationId],
            references: [organizations.id],
        }),

        sale: one(sales, {
            fields: [invoices.saleId],
            references: [sales.id],
        }),

        items: many(invoiceItems),
    }),
);

/* =========================
   INVOICE ITEMS
========================= */

export const invoiceItemsRelations = relations(
    invoiceItems,
    ({ one }) => ({
        invoice: one(invoices, {
            fields: [invoiceItems.invoiceId],
            references: [invoices.id],
        }),

        product: one(products, {
            fields: [invoiceItems.productId],
            references: [products.id],
        }),
    }),
);