import {notFound} from "next/navigation";

import CustomerDetails from "@/src/components/customers/customer-details";
import {requirePermission} from "@/src/lib/require-permission";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export type CustomerPermissions = {
    update: boolean;
    delete: boolean;
};

async function hasPermission(
    action: "update" | "delete",
): Promise<boolean> {
    try {
        await requirePermission(
            "customers",
            action,
        );

        return true;
    } catch (error: unknown) {
        /*
         * Permission denied.
         *
         * requirePermission() throws an error
         * with status = 403 when the user does not
         * have the requested permission.
         */
        if (
            error &&
            typeof error === "object" &&
            "status" in error &&
            error.status === 403
        ) {
            return false;
        }

        /*
         * Any error other than a permission denial
         * should not be silently ignored.
         */
        throw error;
    }
}

export default async function CustomerPage({
                                               params,
                                           }: PageProps) {
    const {id} = await params;

    /*
     * The user must have read permission to access
     * this customer page.
     *
     * This also establishes the active organization
     * through requireOrganization().
     */
    try {
        await requirePermission(
            "customers",
            "read",
        );
    } catch (error: unknown) {
        /*
         * User is authenticated but does not have
         * permission to read customers.
         */
        if (
            error &&
            typeof error === "object" &&
            "status" in error &&
            error.status === 403
        ) {
            notFound();
        }

        throw error;
    }

    /*
     * Resolve UI permissions.
     *
     * These values are passed to the client component
     * so it can hide actions the current user cannot use.
     */
    const permissions: CustomerPermissions = {
        update: await hasPermission("update"),
        delete: await hasPermission("delete"),
    };

    return (
        <CustomerDetails
            id={id}
            permissions={permissions}
        />
    );
}