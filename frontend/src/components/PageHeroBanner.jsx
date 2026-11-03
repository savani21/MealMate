import { useEffect, useState } from "react";
import { ChefHat, Sparkles } from "lucide-react";

export default function PageHeroBanner({ title, description, eyebrow = "MEALMATE", icon: Icon = ChefHat }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setCompact((current) => {
        if (!current && y > 170) return true;
        if (current && y < 65) return false;
        return current;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${compact ? "min-h-[190px]" : ""}`}>
      <section className={`${compact ? "fixed left-4 right-4 top-[88px] z-30 mx-auto max-w-[1120px] px-5 py-3 sm:px-7" : "relative mb-7 px-6 py-8 sm:px-10 sm:py-10"} overflow-hidden rounded-3xl bg-gradient-to-br from-[#173f2b] via-[#23633f] to-[#367c4e] text-white shadow-md transition-[padding] duration-200 ease-out`}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {!compact && <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold tracking-wide text-green-50"><Sparkles className="h-4 w-4" /> {eyebrow}</div>}
            <h1 className={`font-black tracking-tight transition-all duration-300 ${compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{title}</h1>
            {!compact && <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50/90 sm:text-base">{description}</p>}
          </div>
          {!compact && <Icon className="hidden h-24 w-24 shrink-0 text-white/15 sm:block" strokeWidth={1.4} />}
        </div>
        {!compact && <ChefHat className="absolute -bottom-8 -right-4 h-40 w-40 rotate-[-12deg] text-white/[0.06]" />}
      </section>
    </div>
  );
}
