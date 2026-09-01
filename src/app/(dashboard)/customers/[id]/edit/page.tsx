import CustomerEditPage from "@/src/components/customers/customer-edit-page";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditCustomerRoute({
                                                    params,
                                                }: PageProps) {
    const { id } = await params;

    return (
        <CustomerEditPage id={id} />
    );
}