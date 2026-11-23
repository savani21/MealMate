import { AnimatedSection } from '../AnimatedSection';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, PieChart, TrendingUp, Package } from 'lucide-react';

export function AppPreviewSection() {
  return (
    <section className="overflow-hidden bg-gray-950 py-16 text-white md:py-20" id="marketplace">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <span className="mb-3 inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-green-300">
            See MealMate in action
          </span>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            A smarter kitchen, at a glance
          </h2>
          <p className="text-sm leading-6 text-gray-400 md:text-base">
            A clean view of your meal plans, nutrition and grocery spending — all in one place.
          </p>
        </AnimatedSection>

        <div className="relative mx-auto max-w-4xl pb-24 sm:pb-28">
          <AnimatedSection delay={0.15}>
            <div className="relative flex aspect-[16/9] w-full overflow-hidden rounded-2xl border-[6px] border-gray-800 bg-gray-800 shadow-2xl sm:rounded-3xl sm:border-[8px]">
              <aside className="hidden w-1/5 flex-col gap-3 border-r border-gray-700 bg-gray-900 p-3 sm:flex md:p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary" />
                </div>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className={`flex h-7 items-center rounded-md px-2 ${item === 2 ? 'bg-primary/20 text-primary' : 'text-gray-500'}`}>
                    <div className="mr-2 h-3 w-3 rounded-sm bg-current opacity-70" />
                    <div className="h-1.5 w-12 rounded bg-current opacity-40" />
                  </div>
                ))}
              </aside>

              <div className="flex min-w-0 flex-1 flex-col bg-gray-50">
                <div className="flex h-9 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:h-11 sm:px-4">
                  <div className="h-2.5 w-24 rounded bg-gray-200 sm:w-32" />
                  <div className="h-6 w-6 rounded-full bg-gray-200 sm:h-7 sm:w-7" />
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_0.8fr] gap-2 p-2 sm:gap-3 sm:p-3 md:gap-4 md:p-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
                    <h3 className="text-[9px] font-bold text-gray-800 sm:text-xs md:text-sm">Meal Plan Today</h3>
                    {[1, 2].map((item) => (
                      <div key={item} className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 sm:gap-3 sm:p-3">
                        <div className="h-7 w-7 shrink-0 rounded-md bg-green-100 sm:h-10 sm:w-10" />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 h-2 w-3/4 rounded bg-gray-700" />
                          <div className="h-1.5 w-1/2 rounded bg-gray-300" />
                        </div>
                        <ChevronRight className="h-3 w-3 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                      </div>
                    ))}
                  </div>

                  <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-2 sm:p-3">
                    <h3 className="mb-2 text-[9px] font-bold text-gray-800 sm:mb-3 sm:text-xs">Daily Macros</h3>
                    <div className="mb-2 flex justify-center sm:mb-3">
                      <div className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20">
                        <svg className="-rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="4" strokeDasharray="60, 100" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-900 sm:text-[10px]">60%</div>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {['Protein', 'Carbs', 'Fat'].map((label, index) => (
                        <div key={label} className="flex items-center justify-between gap-1 text-[7px] text-gray-500 sm:text-[9px]">
                          <span>{label}</span>
                          <div className="h-1 w-8 overflow-hidden rounded-full bg-gray-100 sm:w-12">
                            <div className={`h-full rounded-full ${index === 0 ? 'w-[70%] bg-primary' : index === 1 ? 'w-1/2 bg-amber-400' : 'w-2/5 bg-rose-400'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <div className="absolute -bottom-1 left-1/2 z-10 flex w-full -translate-x-1/2 justify-center gap-2 px-2 sm:gap-4">
            <motion.div
              className="flex aspect-[9/16] w-20 flex-col overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-white p-2 pt-3 shadow-xl sm:w-28 sm:rounded-3xl sm:border-4 sm:p-3 sm:pt-5"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <div className="mb-3 flex h-6 items-center justify-center rounded-md bg-green-100 sm:h-8">
                <Package className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
              </div>
              <div className="flex-1 space-y-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
                    <div className="h-1.5 flex-1 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="mt-5 flex aspect-[9/16] w-24 flex-col overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-gray-50 p-2.5 pt-4 shadow-xl sm:mt-7 sm:w-32 sm:rounded-3xl sm:border-4 sm:p-4 sm:pt-6"
              animate={{ y: [0, -9, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 }}
            >
              <div className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 sm:h-9 sm:w-9">
                <PieChart className="h-4 w-4 text-rose-500 sm:h-5 sm:w-5" />
              </div>
              <div className="mb-3 flex h-12 items-end justify-between gap-1 sm:h-16">
                {[40, 70, 45, 90, 60].map((height, index) => (
                  <div key={index} className="relative h-full w-full rounded-t-sm bg-rose-100">
                    <div className="absolute bottom-0 w-full rounded-t-sm bg-rose-400" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
              <div className="mx-auto h-2 w-3/4 rounded bg-gray-300" />
            </motion.div>

            <motion.div
              className="flex aspect-[9/16] w-20 flex-col overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-white p-2 pt-3 shadow-xl sm:w-28 sm:rounded-3xl sm:border-4 sm:p-3 sm:pt-5"
              animate={{ y: [0, -7, 0] }}
              transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', delay: 1 }}
            >
              <div className="mb-3 flex h-6 items-center justify-center rounded-md bg-amber-100 sm:h-8">
                <TrendingUp className="h-3 w-3 text-amber-600 sm:h-4 sm:w-4" />
              </div>
              <div className="mb-3 text-center">
                <div className="text-sm font-black text-gray-900 sm:text-lg">$124</div>
                <div className="text-[7px] text-gray-400 sm:text-[8px]">Weekly spend</div>
              </div>
              <div className="space-y-2">
                {[1, 2].map((item) => (
                  <div key={item} className="rounded border border-gray-100 bg-gray-50 p-1.5">
                    <div className="mb-1 h-1 w-1/2 rounded bg-gray-300" />
                    <div className="h-1 w-1/4 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
