import { redirect } from "next/navigation";
import { getOnboardingState } from "@/src/lib/get-onboarding-state";
import OwnerPrompt from "@/src/components/owner-prompt";

export default async function OnboardingPage() {
    const state = await getOnboardingState();

    if (!state.authenticated) {
        redirect("/login");
    }

    /*
     * The user already belongs to an organization.
     * Onboarding is no longer required.
     */
    if (state.hasOrganization) {
        redirect("/dashboard");
    }

    /*
     * No organization yet.
     * Keep the user in onboarding.
     */
    return (
        <OwnerPrompt
            userName={state.user.name}
        />
    );
}