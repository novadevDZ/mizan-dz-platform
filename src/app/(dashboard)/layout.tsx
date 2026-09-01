    import {headers} from "next/headers";
    import {redirect} from "next/navigation";

    import {auth} from "@/src/lib/auth";
    import {
        getDashboardData,
    } from "@/src/lib/dashboard/dashboard.service";

    import DashboardShell from "@/src/components/dashboard/dashboard-shell";
    import React from "react";

    export default async function DashboardLayout({
                                                      children,
                                                  }: Readonly<{
        children: React.ReactNode;
    }>) {
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
            redirect("/onboarding");
        }

        return (
            <DashboardShell data={dashboard}>
                {children}
            </DashboardShell>
        );
    }