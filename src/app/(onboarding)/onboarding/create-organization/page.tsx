import CreateOrganizationForm from "@/src/components/onboarding/create-organization-form";

export default function CreateOrganizationPage() {
    return (
        <main className="min-h-dvh bg-[var(--background)]">
            <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="w-full">
                    <CreateOrganizationForm />
                </div>
            </div>
        </main>
    );
}