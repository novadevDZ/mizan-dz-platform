import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import InvoiceDetails from "@/src/components/invoices/invoice-details";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function InvoicePage({
                                              params,
                                          }: PageProps) {
    const { id } = await params;

    const requestHeaders =
        await headers();

    const session =
        await auth.api.getSession({
            headers: requestHeaders,
        });

    if (!session) {
        redirect("/login");
    }

    const invoicePermission =
        await auth.api.hasPermission({
            headers: requestHeaders,
            body: {
                permissions: {
                    invoices: ["read"],
                },
            },
        });

    return (
        <InvoiceDetails
            id={id}
            canRead={invoicePermission.success}
        />
    );
}