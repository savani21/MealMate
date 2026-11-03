import { ChefHat, Sparkles } from "lucide-react";

export default function PageHeroBanner({ title, description, eyebrow = "MEALMATE", icon: Icon = ChefHat }) {
  return (
    <div className="relative mx-auto mb-7 max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173f2b] via-[#23633f] to-[#367c4e] px-6 py-8 text-white shadow-md sm:px-10 sm:py-10">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-green-50"><Sparkles className="h-4 w-4" /> {eyebrow}</div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50/90 sm:text-base">{description}</p>}
          </div>
          <Icon className="hidden h-24 w-24 shrink-0 text-white/15 sm:block" strokeWidth={1.4} />
        </div>
        <ChefHat className="absolute -bottom-8 -right-4 h-40 w-40 rotate-[-12deg] text-white/[0.06]" />
      </section>
    </div>
  );
}
