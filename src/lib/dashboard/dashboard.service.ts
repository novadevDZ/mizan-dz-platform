import {
    and,
    desc,
    eq,
    gte,
    sql,
} from "drizzle-orm";

import {db} from "@/src/db";

import {
    customers,
    expenses,
    invoices,
    members,
    organizations,
    payments,
    products,
    sales,
} from "@/src/db/schema";

import type {
    DashboardAlert,
    DashboardData,
    DashboardRecentSale,
    DashboardSalesTrendItem,
    DashboardTopDebtor,
} from "./dashboard.types";

type SessionLike = {
    user: {
        id: string;
        name?: string | null;
        email: string;
        image?: string | null;
    };
    session?: {
        activeOrganizationId?: string | null;
    };
};

/* ============================================================
   DATE HELPERS
============================================================ */

function startOfDay(date = new Date()) {
    const value = new Date(date);

    value.setHours(0, 0, 0, 0);

    return value;
}

function startOfMonth(date = new Date()) {
    const value = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
    );

    value.setHours(0, 0, 0, 0);

    return value;
}

function startOfDaysAgo(days: number) {
    const value = startOfDay();

    value.setDate(
        value.getDate() - days,
    );

    return value;
}

function formatDayLabel(date: Date) {
    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            weekday: "short",
        },
    ).format(date);
}

function diffInDays(
    from: Date,
    to: Date,
) {
    return Math.max(
        0,
        Math.floor(
            (to.getTime() - from.getTime()) /
            86_400_000,
        ),
    );
}

/* ============================================================
   GENERAL HELPERS
============================================================ */

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    }

    if (hour < 18) {
        return "Good afternoon";
    }

    return "Good evening";
}

function asNumber(value: unknown) {
    if (
        value === null ||
        value === undefined
    ) {
        return 0;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function getOrganizationProfilePercentage(
    organization: {
        name?: string | null;
        wilaya?: string | null;
        currency?: string | null;
    },
) {
    const fields = [
        organization.name,
        organization.wilaya,
        organization.currency,
    ];

    const total = fields.length;

    const completed =
        fields.filter(Boolean).length;

    return {
        total,
        completed,
        percentage:
            total === 0
                ? 0
                : Math.round(
                    (completed / total) *
                    100,
                ),
    };
}

/* ============================================================
   DASHBOARD SERVICE
============================================================ */

export async function getDashboardData(
    session: SessionLike,
): Promise<DashboardData | null> {
    /*
     * --------------------------------------------------------
     * ACTIVE BETTER AUTH ORGANIZATION
     * --------------------------------------------------------
     *
     * The dashboard must always operate inside the active
     * Better Auth organization.
     *
     * We intentionally DO NOT fall back to the first local
     * membership because that would bypass the active
     * organization context used by Better Auth permissions.
     */

    const authOrganizationId =
        session.session?.activeOrganizationId ?? null;

    if (!authOrganizationId) {
        return null;
    }

    /*
     * --------------------------------------------------------
     * MAP BETTER AUTH ORGANIZATION → MIZAN ORGANIZATION
     * --------------------------------------------------------
     */

    const organizationRows =
        await db
            .select({
                id: organizations.id,
                authOrganizationId:
                organizations.authOrganizationId,
                name: organizations.name,
                wilaya: organizations.wilaya,
                currency: organizations.currency,
                createdAt: organizations.createdAt,
            })
            .from(organizations)
            .where(
                eq(
                    organizations.authOrganizationId,
                    authOrganizationId,
                ),
            )
            .limit(1);

    const organization =
        organizationRows[0];

    if (!organization) {
        return null;
    }

    const organizationId =
        organization.id;

    /*
     * --------------------------------------------------------
     * DATES
     * --------------------------------------------------------
     */

    const now = new Date();

    const todayStart =
        startOfDay(now);

    const monthStart =
        startOfMonth(now);

    const trendStart =
        startOfDaysAgo(6);

    /*
     * --------------------------------------------------------
     * SALES
     * --------------------------------------------------------
     */

    const [
        salesTodayRows,
        salesMonthRows,
    ] = await Promise.all([
        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${sales.totalAmount}
                    ),
                    0
                    )
                `,
            })
            .from(sales)
            .where(
                and(
                    eq(
                        sales.organizationId,
                        organizationId,
                    ),
                    gte(
                        sales.createdAt,
                        todayStart,
                    ),
                ),
            ),

        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${sales.totalAmount}
                    ),
                    0
                    )
                `,
            })
            .from(sales)
            .where(
                and(
                    eq(
                        sales.organizationId,
                        organizationId,
                    ),
                    gte(
                        sales.createdAt,
                        monthStart,
                    ),
                ),
            ),
    ]);

    /*
     * --------------------------------------------------------
     * PAYMENTS
     * --------------------------------------------------------
     */

    const [
        collectedTodayRows,
        collectedMonthRows,
    ] = await Promise.all([
        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${payments.amount}
                    ),
                    0
                    )
                `,
            })
            .from(payments)
            .where(
                and(
                    eq(
                        payments.organizationId,
                        organizationId,
                    ),
                    gte(
                        payments.createdAt,
                        todayStart,
                    ),
                ),
            ),

        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${payments.amount}
                    ),
                    0
                    )
                `,
            })
            .from(payments)
            .where(
                and(
                    eq(
                        payments.organizationId,
                        organizationId,
                    ),
                    gte(
                        payments.createdAt,
                        monthStart,
                    ),
                ),
            ),
    ]);

    /*
     * --------------------------------------------------------
     * EXPENSES
     * --------------------------------------------------------
     */

    const [
        expensesTodayRows,
        expensesMonthRows,
    ] = await Promise.all([
        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${expenses.amount}
                    ),
                    0
                    )
                `,
            })
            .from(expenses)
            .where(
                and(
                    eq(
                        expenses.organizationId,
                        organizationId,
                    ),
                    gte(
                        expenses.createdAt,
                        todayStart,
                    ),
                ),
            ),

        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${expenses.amount}
                    ),
                    0
                    )
                `,
            })
            .from(expenses)
            .where(
                and(
                    eq(
                        expenses.organizationId,
                        organizationId,
                    ),
                    gte(
                        expenses.createdAt,
                        monthStart,
                    ),
                ),
            ),
    ]);

    /*
     * --------------------------------------------------------
     * ORGANIZATION TOTALS
     * --------------------------------------------------------
     */

    const [
        overallSalesRows,
        overallPaymentsRows,
    ] = await Promise.all([
        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${sales.totalAmount}
                    ),
                    0
                    )
                `,
            })
            .from(sales)
            .where(
                eq(
                    sales.organizationId,
                    organizationId,
                ),
            ),

        db
            .select({
                total: sql<number>`
                    coalesce(
                        sum(
                    ${payments.amount}
                    ),
                    0
                    )
                `,
            })
            .from(payments)
            .where(
                eq(
                    payments.organizationId,
                    organizationId,
                ),
            ),
    ]);

    const totalSales =
        asNumber(
            overallSalesRows[0]?.total,
        );

    const totalPayments =
        asNumber(
            overallPaymentsRows[0]?.total,
        );

    const outstandingDebt =
        Math.max(
            totalSales -
            totalPayments,
            0,
        );

    /*
     * --------------------------------------------------------
     * COUNTS
     * --------------------------------------------------------
     */

    const [
        customerCountRows,
        productCountRows,
        invoiceCountRows,
        saleCountRows,
        memberCountRows,
    ] = await Promise.all([
        db
            .select({
                count:
                    sql<number>`count(*)`,
            })
            .from(customers)
            .where(
                eq(
                    customers.organizationId,
                    organizationId,
                ),
            ),

        db
            .select({
                count:
                    sql<number>`count(*)`,
            })
            .from(products)
            .where(
                eq(
                    products.organizationId,
                    organizationId,
                ),
            ),

        db
            .select({
                count:
                    sql<number>`count(*)`,
            })
            .from(invoices)
            .where(
                eq(
                    invoices.organizationId,
                    organizationId,
                ),
            ),

        db
            .select({
                count:
                    sql<number>`count(*)`,
            })
            .from(sales)
            .where(
                eq(
                    sales.organizationId,
                    organizationId,
                ),
            ),

        db
            .select({
                count:
                    sql<number>`count(*)`,
            })
            .from(members)
            .where(
                eq(
                    members.organizationId,
                    organizationId,
                ),
            ),
    ]);

    /*
     * --------------------------------------------------------
     * SALES TREND — LAST 7 DAYS
     * --------------------------------------------------------
     */

    const [
        trendSales,
        trendPayments,
    ] = await Promise.all([
        db
            .select({
                total:
                sales.totalAmount,
                createdAt:
                sales.createdAt,
            })
            .from(sales)
            .where(
                and(
                    eq(
                        sales.organizationId,
                        organizationId,
                    ),
                    gte(
                        sales.createdAt,
                        trendStart,
                    ),
                ),
            ),

        db
            .select({
                amount:
                payments.amount,
                createdAt:
                payments.createdAt,
            })
            .from(payments)
            .where(
                and(
                    eq(
                        payments.organizationId,
                        organizationId,
                    ),
                    gte(
                        payments.createdAt,
                        trendStart,
                    ),
                ),
            ),
    ]);

    const salesTrendMap =
        new Map<
            string,
            {
                sales: number;
                payments: number;
                date: Date;
            }
        >();

    for (
        let i = 0;
        i < 7;
        i += 1
    ) {
        const date =
            new Date(
                trendStart,
            );

        date.setDate(
            trendStart.getDate() + i,
        );

        const key =
            date
                .toISOString()
                .slice(0, 10);

        salesTrendMap.set(
            key,
            {
                sales: 0,
                payments: 0,
                date,
            },
        );
    }

    for (const row of trendSales) {
        const date =
            new Date(
                row.createdAt,
            );

        const key =
            date
                .toISOString()
                .slice(0, 10);

        const current =
            salesTrendMap.get(
                key,
            );

        if (current) {
            current.sales +=
                asNumber(
                    row.total,
                );
        }
    }

    for (
        const row of trendPayments
        ) {
        const date =
            new Date(
                row.createdAt,
            );

        const key =
            date
                .toISOString()
                .slice(0, 10);

        const current =
            salesTrendMap.get(
                key,
            );

        if (current) {
            current.payments +=
                asNumber(
                    row.amount,
                );
        }
    }

    const salesTrend:
        DashboardSalesTrendItem[] =
        Array.from(
            salesTrendMap.values(),
        ).map(
            (item) => ({
                date:
                    item.date
                        .toISOString()
                        .slice(
                            0,
                            10,
                        ),

                label:
                    formatDayLabel(
                        item.date,
                    ),

                sales:
                item.sales,

                payments:
                item.payments,
            }),
        );

    /*
     * --------------------------------------------------------
     * RECENT SALES
     * --------------------------------------------------------
     */

    const recentSalesRows =
        await db
            .select({
                id:
                sales.id,

                total:
                sales.totalAmount,

                createdAt:
                sales.createdAt,

                customerName:
                customers.name,
            })
            .from(sales)
            .leftJoin(
                customers,
                eq(
                    sales.customerId,
                    customers.id,
                ),
            )
            .where(
                eq(
                    sales.organizationId,
                    organizationId,
                ),
            )
            .orderBy(
                desc(
                    sales.createdAt,
                ),
            )
            .limit(8);

    const recentSales:
        DashboardRecentSale[] =
        recentSalesRows.map(
            (row) => {
                const total =
                    asNumber(
                        row.total,
                    );

                return {
                    id:
                    row.id,

                    customerName:
                        row.customerName ??
                        "Walk-in customer",

                    total,

                    paid: 0,

                    outstanding:
                    total,

                    createdAt:
                        new Date(
                            row.createdAt,
                        ).toISOString(),
                };
            },
        );

    /*
     * --------------------------------------------------------
     * TOP DEBTORS
     * --------------------------------------------------------
     *
     * Payment allocation is not inferred without an exact
     * payment -> sale/customer relation.
     */

    const topDebtors:
        DashboardTopDebtor[] =
        [];

    /*
     * --------------------------------------------------------
     * ROLE DISTRIBUTION
     * --------------------------------------------------------
     */

    const roleRows =
        await db
            .select({
                role:
                members.role,

                count:
                    sql<number>`count(*)`,
            })
            .from(members)
            .where(
                eq(
                    members.organizationId,
                    organizationId,
                ),
            )
            .groupBy(
                members.role,
            );

    /*
     * --------------------------------------------------------
     * PROFILE
     * --------------------------------------------------------
     */

    const profile =
        getOrganizationProfilePercentage(
            organization,
        );

    /*
     * --------------------------------------------------------
     * ORGANIZATION AGE
     * --------------------------------------------------------
     */

    const createdAt =
        new Date(
            organization.createdAt,
        );

    const ageDays =
        diffInDays(
            createdAt,
            now,
        );

    const organizationAge =
        ageDays < 1
            ? "Today"
            : ageDays === 1
                ? "1 day"
                : ageDays < 30
                    ? `${ageDays} days`
                    : `${Math.floor(
                        ageDays / 30,
                    )} months`;

    /*
     * --------------------------------------------------------
     * ALERTS
     * --------------------------------------------------------
     */

    const alerts:
        DashboardAlert[] =
        [];

    if (outstandingDebt > 0) {
        alerts.push({
            id:
                "debts",

            type:
                "debt",

            title:
                "Outstanding customer balances",

            description:
                `${outstandingDebt.toLocaleString(
                    "fr-DZ",
                )} ${
                    organization.currency
                } remains to be collected.`,

            href:
                "/customers",

            priority:
                "high",
        });
    }

    const invoiceCount =
        asNumber(
            invoiceCountRows[0]
                ?.count,
        );

    if (invoiceCount === 0) {
        alerts.push({
            id:
                "invoices-empty",

            type:
                "invoice",

            title:
                "No invoices recorded",

            description:
                "Your workspace has no invoices yet.",

            href:
                "/invoices",

            priority:
                "low",
        });
    }

    const customerCount =
        asNumber(
            customerCountRows[0]
                ?.count,
        );

    if (customerCount === 0) {
        alerts.push({
            id:
                "customers-empty",

            type:
                "info",

            title:
                "Add your first customer",

            description:
                "Customer records make sales tracking useful.",

            href:
                "/customers",

            priority:
                "medium",
        });
    }

    /*
     * --------------------------------------------------------
     * FINAL VALUES
     * --------------------------------------------------------
     */

    const todaySales =
        asNumber(
            salesTodayRows[0]
                ?.total,
        );

    const todayCollected =
        asNumber(
            collectedTodayRows[0]
                ?.total,
        );

    const todayExpenses =
        asNumber(
            expensesTodayRows[0]
                ?.total,
        );

    const monthSales =
        asNumber(
            salesMonthRows[0]
                ?.total,
        );

    const monthCollected =
        asNumber(
            collectedMonthRows[0]
                ?.total,
        );

    const monthExpenses =
        asNumber(
            expensesMonthRows[0]
                ?.total,
        );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return {
        greeting:
            getGreeting(),

        user: {
            id:
            session.user.id,

            name:
                session.user.name ??
                null,

            email:
            session.user.email,

            image:
                session.user.image ??
                null,
        },

        organization: {
            id:
            organization.id,

            name:
            organization.name,

            wilaya:
                organization.wilaya ??
                "Not set",

            currency:
                organization.currency ??
                "DZD",

            createdAt:
                new Date(
                    organization.createdAt,
                ).toISOString(),
        },

        organizationAge,

        memberCount:
            asNumber(
                memberCountRows[0]
                    ?.count,
            ),

        profile,

        roleChart:
            roleRows.map(
                (row) => ({
                    role:
                    row.role,

                    count:
                        asNumber(
                            row.count,
                        ),
                }),
            ),

        kpis: {
            todaySales,

            todayCollected,

            outstandingDebts:
            outstandingDebt,

            todayExpenses,

            monthSales,

            monthCollected,

            monthExpenses,

            monthNet:
                monthCollected -
                monthExpenses,
        },

        counts: {
            customers:
            customerCount,

            products:
                asNumber(
                    productCountRows[0]
                        ?.count,
                ),

            invoices:
            invoiceCount,

            sales:
                asNumber(
                    saleCountRows[0]
                        ?.count,
                ),
        },

        salesTrend,

        recentSales,

        topDebtors,

        alerts,
    };
}