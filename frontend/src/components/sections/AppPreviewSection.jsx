import { AnimatedSection } from '../AnimatedSection';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, PieChart, TrendingUp, Package } from 'lucide-react';
export function AppPreviewSection() {
    return (<section className="py-20 md:py-28 bg-gray-900 text-white overflow-hidden" id="marketplace">
      <div className="container mx-auto px-4 md:px-6">
        
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">
            See It In Action
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-6">
            A beautiful app, inside and out
          </h3>
          <p className="text-lg text-gray-400">
            Designed for speed and clarity. Every screen is thoughtfully crafted to give you the information you need, instantly.
          </p>
        </AnimatedSection>

        <div className="relative max-w-5xl mx-auto">
          {/* Laptop Mockup (CSS) */}
          <AnimatedSection delay={0.2}>
            <div className="relative aspect-[16/10] w-full bg-gray-800 rounded-t-2xl rounded-b-xl border-[12px] border-gray-800 shadow-2xl overflow-hidden flex">
              
              {/* Sidebar */}
              <div className="w-1/4 bg-gray-900 border-r border-gray-700 p-4 flex flex-col gap-4">
                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center mb-4">
                  <div className="w-4 h-4 bg-primary rounded-full"/>
                </div>
                {[1, 2, 3, 4, 5].map(i => (<div key={i} className={`h-8 rounded-md flex items-center px-3 ${i === 2 ? 'bg-primary/20 text-primary' : 'text-gray-400'}`}>
                    <div className="w-4 h-4 rounded-sm bg-current opacity-70 mr-3"/>
                    <div className="h-2 w-16 bg-current opacity-40 rounded"/>
                  </div>))}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-gray-50 flex flex-col">
                {/* Topbar */}
                <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded"/>
                  <div className="w-8 h-8 rounded-full bg-gray-300"/>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 grid grid-cols-3 gap-6">
                  {/* Left Col */}
                  <div className="col-span-2 flex flex-col gap-6">
                    <div>
                      <h4 className="text-gray-900 font-bold mb-4">Meal Plan Today</h4>
                      <div className="flex flex-col gap-3">
                        {[1, 2].map(i => (<div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-green-100"/>
                            <div className="flex-1">
                              <div className="h-4 w-32 bg-gray-800 rounded mb-2"/>
                              <div className="h-3 w-20 bg-gray-400 rounded"/>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4 text-gray-400"/>
                            </div>
                          </div>))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Col */}
                  <div className="col-span-1">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 h-full">
                      <h4 className="text-gray-900 font-bold mb-6 text-sm">Daily Macros</h4>
                      
                      <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4"/>
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="4" strokeDasharray="60, 100"/>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-gray-900 font-bold text-xl">60%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {['Protein', 'Carbs', 'Fat'].map((label, i) => (<div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{label}</span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${i === 0 ? 'bg-primary w-[70%]' : i === 1 ? 'bg-amber-400 w-[50%]' : 'bg-rose-400 w-[40%]'}`}/>
                            </div>
                          </div>))}
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* Laptop Base */}
            <div className="w-full h-4 bg-gray-600 rounded-b-3xl -mt-1 mx-auto relative z-10"/>
          </AnimatedSection>

          {/* Floating Mobile Mockups */}
          <div className="absolute -bottom-24 w-full flex justify-center gap-4 md:gap-8 z-20 px-4">
            
            <motion.div className="w-32 md:w-48 aspect-[9/19] bg-white rounded-3xl border-4 border-gray-900 shadow-2xl overflow-hidden p-3 pt-6 flex flex-col" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0 }}>
              <div className="w-full h-8 bg-green-100 rounded-lg mb-4 flex items-center justify-center">
                <Package className="w-4 h-4 text-green-600"/>
              </div>
              <div className="space-y-2 flex-1">
                {[1, 2, 3, 4].map(i => (<div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary"/>
                    <div className="h-2 flex-1 bg-gray-200 rounded"/>
                  </div>))}
              </div>
            </motion.div>

            <motion.div className="w-36 md:w-52 aspect-[9/19] bg-gray-50 rounded-3xl border-4 border-gray-900 shadow-2xl overflow-hidden p-4 pt-8 flex flex-col mt-8" animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}>
              <div className="w-10 h-10 bg-rose-100 rounded-full mb-4 mx-auto flex items-center justify-center">
                <PieChart className="w-5 h-5 text-rose-500"/>
              </div>
              <div className="flex items-end justify-between h-20 gap-2 mb-4">
                {[40, 70, 45, 90, 60].map((h, i) => (<div key={i} className="w-full bg-rose-200 rounded-t-sm relative">
                    <div className="absolute bottom-0 w-full bg-rose-500 rounded-t-sm" style={{ height: `${h}%` }}/>
                  </div>))}
              </div>
              <div className="h-3 w-3/4 mx-auto bg-gray-300 rounded"/>
            </motion.div>

            <motion.div className="w-32 md:w-48 aspect-[9/19] bg-white rounded-3xl border-4 border-gray-900 shadow-2xl overflow-hidden p-3 pt-6 flex flex-col" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.5 }}>
              <div className="w-full h-8 bg-amber-100 rounded-lg mb-4 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-600"/>
              </div>
              <div className="text-center mb-4">
                <div className="text-lg font-black text-gray-900">$124</div>
                <div className="text-[8px] text-gray-400">Weekly spend</div>
              </div>
              <div className="space-y-3">
                {[1, 2].map(i => (<div key={i} className="bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="h-1.5 w-1/2 bg-gray-300 rounded mb-1"/>
                    <div className="h-1.5 w-1/4 bg-gray-200 rounded"/>
                  </div>))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
      
      {/* Add spacing at the bottom to account for the absolute positioned phones */}
      <div className="h-40 md:h-48"/>
    </section>);
}
