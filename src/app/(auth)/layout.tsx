import type { ReactNode } from "react";
import { Building2, Check, FileText, ShieldCheck, TrendingUp, Users } from "lucide-react";

const highlights = [
    { icon: Users, text: "Clients, équipes & relations" },
    { icon: FileText, text: "Factures, commandes & paiements" },
    { icon: TrendingUp, text: "Suivi du chiffre d'affaires" },
];

export default function AuthLayout({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    return (
        <main className="min-h-screen bg-[var(--background)]">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
                <section className="relative hidden min-h-screen overflow-hidden bg-[#071a33] text-white lg:flex">
                    <div
                        aria-hidden="true"
                        className="absolute inset-0"
                    >
                        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
                        <div className="absolute right-[-7rem] top-[18%] h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
                        <div className="absolute bottom-[-9rem] left-[20%] h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
                    </div>

                    <div
                        aria-hidden="true"
                        className="absolute inset-y-0 right-0 w-px bg-white/8"
                    />

                    <div className="relative z-10 flex w-full flex-col justify-between p-8 sm:p-10 xl:p-14">
                        <div className="mizan-animate-fade">
                            <div className="flex items-center gap-3">
                                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-[var(--primary)] shadow-lg shadow-black/10">
                                    M
                                </div>

                                <div>
                                    <p className="text-[0.95rem] font-semibold tracking-tight text-white">
                                        Mizan DZ
                                    </p>
                                    <p className="text-xs text-white/45">
                                        Gestion commerciale
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-2xl">
                            <div className="mizan-stagger">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Conçu pour les entreprises algériennes
                                </div>

                                <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white xl:text-6xl xl:leading-[1.02]">
                                    Votre entreprise,
                                    <br />
                                    enfin sous contrôle.
                                </h1>

                                <p className="mt-6 max-w-xl text-sm leading-7 text-white/62 sm:text-base">
                                    Mizan DZ centralise vos clients, ventes, paiements,
                                    dettes, stock et facturation dans un espace simple,
                                    rapide et pensé pour le quotidien des entreprises en Algérie.
                                </p>

                                <div className="mt-8 grid gap-3 sm:max-w-md">
                                    {highlights.map(({ icon: Icon, text }) => (
                                        <div
                                            key={text}
                                            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm"
                                        >
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-200">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="text-sm font-medium text-white/78">
                                                {text}
                                            </span>
                                            <Check className="ml-auto h-4 w-4 text-blue-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-xs text-white/35">
                            <span>© {new Date().getFullYear()} Mizan DZ</span>
                            <span className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5" />
                                Algerian Business SaaS
                            </span>
                        </div>
                    </div>
                </section>

                <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/6 blur-3xl lg:hidden"
                    />

                    <div className="relative z-10 w-full max-w-md">
                        {children}
                    </div>
                </section>
            </div>
        </main>
    );
}
