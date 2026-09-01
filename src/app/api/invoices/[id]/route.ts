import {NextRequest} from "next/server";
import {and, asc, eq} from "drizzle-orm";

import {db} from "@/src/db";

import {invoices} from "@/src/db/schema/invoices";
import {invoiceItems} from "@/src/db/schema";
import {customers} from "@/src/db/schema/customers";

import {
    requirePermission,
} from "@/src/lib/require-permission";

import {
    apiError,
    apiSuccess,
} from "@/src/lib/api-response";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

/**
 * GET /api/invoices/:id
 *
 * Returns a single invoice with:
 * - invoice information
 * - customer information
 * - invoice items
 *
 * Invoices are automatically created
 * when a sale is created, therefore this
 * route is read-only.
 */
export async function GET(
    _request: NextRequest,
    {params}: RouteContext,
) {
    try {
        const {id} = await params;

        const {organizationId} =
            await requirePermission(
                "invoices",
                "read",
            );

        /*
         * ---------------------------------------------------------
         * Get invoice
         * ---------------------------------------------------------
         */

        const [invoice] = await db
            .select({
                id:
                invoices.id,

                organizationId:
                invoices.organizationId,

                saleId:
                invoices.saleId,

                customerId:
                invoices.customerId,

                invoiceNumber:
                invoices.invoiceNumber,

                status:
                invoices.status,

                issuedAt:
                invoices.issuedAt,

                dueAt:
                invoices.dueAt,

                subtotal:
                invoices.subtotal,

                discount:
                invoices.discount,

                total:
                invoices.total,

                notes:
                invoices.notes,

                createdAt:
                invoices.createdAt,

                updatedAt:
                invoices.updatedAt,

                customer: {
                    id:
                    customers.id,

                    name:
                    customers.name,

                    phone:
                    customers.phone,

                    address:
                    customers.address,

                    notes:
                    customers.notes,
                },
            })
            .from(invoices)
            .leftJoin(
                customers,
                eq(
                    invoices.customerId,
                    customers.id,
                ),
            )
            .where(
                and(
                    eq(
                        invoices.id,
                        id,
                    ),

                    eq(
                        invoices.organizationId,
                        organizationId,
                    ),
                ),
            )
            .limit(1);

        if (!invoice) {
            return apiError(
                "Invoice not found.",
                404,
            );
        }

        /*
         * ---------------------------------------------------------
         * Get invoice items
         * ---------------------------------------------------------
         */

        const items =
            await db
                .select({
                    id:
                    invoiceItems.id,

                    invoiceId:
                    invoiceItems.invoiceId,

                    productId:
                    invoiceItems.productId,

                    productName:
                    invoiceItems.productName,

                    description:
                    invoiceItems.description,

                    quantity:
                    invoiceItems.quantity,

                    unitPrice:
                    invoiceItems.unitPrice,

                    subtotal:
                    invoiceItems.subtotal,
                })
                .from(invoiceItems)
                .where(
                    eq(
                        invoiceItems.invoiceId,
                        invoice.id,
                    ),
                )
                .orderBy(
                    asc(
                        invoiceItems.id,
                    ),
                );

        /*
         * ---------------------------------------------------------
         * Normalize numeric fields
         * ---------------------------------------------------------
         */

        const normalizedInvoice = {
            ...invoice,

            subtotal:
                Number(
                    invoice.subtotal,
                ),

            discount:
                Number(
                    invoice.discount,
                ),

            total:
                Number(
                    invoice.total,
                ),

            items:
                items.map(
                    (item) => ({
                        ...item,

                        quantity:
                            Number(
                                item.quantity,
                            ),

                        unitPrice:
                            Number(
                                item.unitPrice,
                            ),

                        subtotal:
                            Number(
                                item.subtotal,
                            ),
                    }),
                ),
        };

        return apiSuccess(
            normalizedInvoice,
        );
    } catch (error) {
        console.error(
            "[GET /api/invoices/:id]",
            error,
        );

        return apiError(
            "Internal server error.",
            500,
        );
    }
}