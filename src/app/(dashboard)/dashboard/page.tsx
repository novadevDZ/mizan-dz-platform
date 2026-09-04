import {headers} from "next/headers";
import {notFound, redirect} from "next/navigation";

import {auth} from "@/src/lib/auth";

import {
    getDashboardData,
} from "@/src/lib/dashboard/dashboard.service";

import DashboardClient, {
    type DashboardPermissions,
} from "@/src/components/dashboard/dashboard-client";

export default async function DashboardPage() {
    const requestHeaders =
        await headers();

    const session =
        await auth.api.getSession({
            headers: requestHeaders,
        });

    if (!session) {
        redirect("/login");
    }


    const dashboard =
        await getDashboardData(session);

    if (!dashboard) {
        notFound();
    }

    /*
     * ========================================================
     * UI PERMISSIONS
     * ========================================================
     *
     * These values are used only to control visibility.
     *
     * Real authorization must remain in the
     * server/API layer.
     */

    const [
        customersRead,
        customersCreate,

        productsRead,

        salesRead,
        salesCreate,

        paymentsRead,
        paymentsCreate,

        expensesRead,
        expensesCreate,

        invoicesRead,

        membersRead,
    ] = await Promise.all([
        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    customers: ["read"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    customers: ["create"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    products: ["read"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    sales: ["read"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    sales: ["create"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    payments: ["read"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    payments: ["create"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    expenses: ["read"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    expenses: ["create"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    invoices: ["read"],
                },
            },
        }),

        auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    members: ["read"],
                },
            },
        }),
    ]);

    const permissions: DashboardPermissions = {
        customers: {
            read: customersRead.success,
            create: customersCreate.success,
        },

        products: {
            read: productsRead.success,
        },

        sales: {
            read: salesRead.success,
            create: salesCreate.success,
        },

        payments: {
            read: paymentsRead.success,
            create: paymentsCreate.success,
        },

        expenses: {
            read: expensesRead.success,
            create: expensesCreate.success,
        },

        invoices: {
            read: invoicesRead.success,
        },

        members: {
            read: membersRead.success,
        },
    };

    return (
        <DashboardClient
            initialData={dashboard}
            permissions={permissions}
        />
    );
}