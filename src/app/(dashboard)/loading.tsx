export default function DashboardGroupLoading() {
    return (
        <div
            className="mizan-app"
            aria-busy="true"
            aria-label="Loading workspace"
        >
            <div className="mizan-main">
                <header className="mizan-header">
                    <div className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--surface-tertiary)]"/>

                            <div className="hidden space-y-2 md:block">
                                <div className="h-3 w-28 animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                                <div className="h-2.5 w-20 animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--surface-tertiary)]"/>
                            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--surface-tertiary)]"/>
                        </div>
                    </div>
                </header>

                <main className="mizan-content">
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                            <div className="h-8 w-72 max-w-full animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                        </section>

                        <section className="mizan-dashboard-grid">
                            {Array.from({length: 4}).map(
                                (_, index) => (
                                    <div
                                        key={index}
                                        className="mizan-stat min-h-[150px] p-5"
                                    >
                                        <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                                        <div
                                            className="mt-5 h-8 w-28 animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                                        <div
                                            className="mt-3 h-3 w-24 animate-pulse rounded bg-[var(--surface-tertiary)]"/>
                                    </div>
                                ),
                            )}
                        </section>

                        <section className="mizan-dashboard-main-grid">
                            <div className="mizan-dashboard-section min-h-[330px]"/>

                            <div className="mizan-dashboard-section min-h-[330px]"/>
                        </section>

                        <section className="mizan-dashboard-section min-h-[220px]"/>
                    </div>
                </main>
            </div>
        </div>
    );
}