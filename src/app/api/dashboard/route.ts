import {headers} from "next/headers";
import {NextResponse} from "next/server";

import {auth} from "@/src/lib/auth";
import {
    getDashboardData,
} from "@/src/lib/dashboard/dashboard.service";

export async function GET() {
    try {
        const session =
            await auth.api.getSession({
                headers:
                    await headers(),
            });

        if (!session) {
            return NextResponse.json(
                {
                    message:
                        "Unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        const dashboard =
            await getDashboardData(
                session,
            );

        if (!dashboard) {
            return NextResponse.json(
                {
                    message:
                        "No active organization found.",
                },
                {
                    status: 404,
                },
            );
        }

        /*
         * Normalize chart values before
         * sending them to the client.
         *
         * This prevents PostgreSQL/Drizzle
         * numeric/decimal values from
         * breaking CSS height calculations.
         */
        const normalizedDashboard = {
            ...dashboard,

            salesTrend:
                dashboard.salesTrend.map(
                    (item) => ({
                        ...item,
                        sales:
                            Number(
                                item.sales,
                            ) || 0,
                        payments:
                            Number(
                                item.payments,
                            ) || 0,
                    }),
                ),

            recentSales:
                dashboard.recentSales.map(
                    (sale) => ({
                        ...sale,
                        total:
                            Number(
                                sale.total,
                            ) || 0,
                    }),
                ),

            topDebtors:
                dashboard.topDebtors.map(
                    (debtor) => ({
                        ...debtor,
                        outstanding:
                            Number(
                                debtor.outstanding,
                            ) || 0,
                    }),
                ),

            kpis: {
                ...dashboard.kpis,
                todaySales:
                    Number(
                        dashboard.kpis
                            .todaySales,
                    ) || 0,
                todayCollected:
                    Number(
                        dashboard.kpis
                            .todayCollected,
                    ) || 0,
                outstandingDebts:
                    Number(
                        dashboard.kpis
                            .outstandingDebts,
                    ) || 0,
                todayExpenses:
                    Number(
                        dashboard.kpis
                            .todayExpenses,
                    ) || 0,
                monthSales:
                    Number(
                        dashboard.kpis
                            .monthSales,
                    ) || 0,
                monthCollected:
                    Number(
                        dashboard.kpis
                            .monthCollected,
                    ) || 0,
                monthExpenses:
                    Number(
                        dashboard.kpis
                            .monthExpenses,
                    ) || 0,
                monthNet:
                    Number(
                        dashboard.kpis
                            .monthNet,
                    ) || 0,
            },
        };

        console.log(
            "[Mizan Dashboard] salesTrend:",
            normalizedDashboard.salesTrend,
        );

        return NextResponse.json(
            normalizedDashboard,
            {
                status: 200,
                headers: {
                    "Cache-Control":
                        "no-store",
                },
            },
        );
    } catch (error) {
        console.error(
            "[Mizan Dashboard API]",
            error,
        );

        return NextResponse.json(
            {
                message:
                    "Unable to load dashboard data.",
            },
            {
                status: 500,
            },
        );
    }
}