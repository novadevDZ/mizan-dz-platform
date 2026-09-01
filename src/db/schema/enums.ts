import {pgEnum} from "drizzle-orm/pg-core";
// User Roles
export const userStatusEnum = pgEnum("user_role", [
    "owner",
    "pre_employee",
    "employee",
]);
// Member Roles
export const memberRoleEnum = pgEnum("user_role", [
    "owner",
    "employee",
    "pre_employee",
]);
// Sales
export const saleStatusEnum = pgEnum("sale_status", [
    "draft",
    "confirmed",
    "canceled",
]);
// payments
export const paymentMethodEnum = pgEnum("payment_method", [
    "cash",
    "cheque",
    "bank transfer",
    "ccp transfer",
    "baridimob",
    "edahabia",
    "card",
    "other",
]);

// expenses categories
export const expenseCategoryEnum = pgEnum("expense_category", [
    "rent",
    "transport",
    "electricity",
    "internet",
    "salary",
    "maintenance",
    "supplies",
    "other",
]);

// invoice status
export const invoiceStatusEnum = pgEnum("invoice_status", [
    "draft",
    "issued",
    "canceled",
])