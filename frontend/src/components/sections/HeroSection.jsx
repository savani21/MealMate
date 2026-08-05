import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Salad, Carrot, Apple, Fish } from 'lucide-react';
import { staggerContainer } from '../AnimatedSection';
import { toast } from '@/hooks/use-toast';
export function HeroSection() {
    const words = ['Plan', 'Better.', 'Eat', 'Healthier.', 'Waste', 'Less.'];
    return (<section id="home" className="relative min-h-[100dvh] pt-32 pb-20 flex items-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-green-50 to-transparent -z-10 blur-3xl opacity-60"/>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10"/>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Content */}
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 mb-8" data-testid="hero-badge">
              <Sparkles className="w-4 h-4 text-primary"/>
              <span className="text-sm font-medium text-green-800">AI-Powered Meal Planning</span>
            </motion.div>

            <motion.h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6 text-gray-900" variants={staggerContainer} initial="hidden" animate="visible">
              <span className="block">Plan Better.</span>
              <span className="block text-primary">Eat Healthier.</span>
              <span className="block relative">
                Waste Less.
                <svg className="absolute w-full h-4 -bottom-1 left-0 text-primary opacity-30" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.00034 6.78693C29.1769 -0.063277 58.7497 -1.69668 86.8523 4.29891C94.4981 5.93043 101.996 8.3516 109.689 9.38887C118.995 10.6436 128.51 9.77121 137.842 9.07186C153.256 7.91605 168.796 5.86776 184.225 3.33235C189.479 2.46914 195.431 1.77708 198.815 6.78693" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </motion.h1>

            <motion.p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
              MealMate AI helps you create personalized meal plans, manage your pantry, generate grocery lists, monitor nutrition, reduce food waste, and receive AI-powered recipe recommendations.
            </motion.p>

            <motion.div className="flex flex-wrap items-center gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
              <button className="bg-primary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" data-testid="hero-cta-primary" onClick={() => toast({ title: "You're on the list! 🎉", description: "Thanks for your interest — we'll email you the moment MealMate AI opens up." })}>
                Get Started Free
              </button>
              <button className="group flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-300" data-testid="hero-cta-secondary" onClick={() => document.getElementById('recipes')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Recipes
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div className="mt-12 flex items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (<div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm ${i === 1 ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
                i === 2 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                    i === 3 ? 'bg-gradient-to-br from-blue-400 to-indigo-600' :
                        'bg-gradient-to-br from-rose-400 to-pink-600'}`}>
                    {['SJ', 'MC', 'EP', 'AL'][i - 1]}
                  </div>))}
              </div>
              <p className="text-sm font-medium text-gray-600">
                Trusted by <span className="text-gray-900 font-bold">50,000+</span> users
              </p>
            </motion.div>
          </div>

          {/* Right Side: CSS Mockup */}
          <div className="relative h-[600px] w-full flex items-center justify-center lg:justify-end perspective-1000">
            <motion.div className="relative w-72 md:w-80 h-[580px] bg-white border-[8px] border-gray-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col" initial={{ opacity: 0, rotateY: 20, scale: 0.9, x: 20 }} animate={{ opacity: 1, rotateY: 0, scale: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}>
              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-20"/>
              
              {/* App UI (CSS only) */}
              <div className="flex-1 bg-gray-50 pt-10 pb-6 px-5 flex flex-col gap-6 relative">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Hello, Alex 👋</h3>
                    <p className="text-xs text-gray-500">Your daily summary</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-0.5">
                    <div className="w-full h-full bg-white rounded-full border-2 border-white overflow-hidden">
                      <div className="w-full h-full bg-gray-200"/>
                    </div>
                  </div>
                </div>

                {/* Nutrition Ring */}
                <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4"/>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray="75, 100"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-[10px] font-bold text-gray-900 leading-none">1.8k</span>
                      <span className="text-[8px] text-gray-400">kcal</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">On Track!</h4>
                    <p className="text-xs text-gray-500 mt-1">45g Protein • 30g Carbs</p>
                  </div>
                </div>

                {/* Meals */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Today's Meals</h4>
                  <div className="flex flex-col gap-3">
                    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Salad className="w-6 h-6 text-green-600"/>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-gray-900">Avocado Toast</h5>
                        <p className="text-xs text-gray-500">Breakfast • 320 kcal</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Fish className="w-6 h-6 text-orange-600"/>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-gray-900">Grilled Salmon</h5>
                        <p className="text-xs text-gray-500">Lunch • 450 kcal</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Button Placeholder */}
                <div className="mt-auto pt-4">
                  <div className="w-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold py-3 rounded-xl text-center flex justify-center items-center gap-2">
                    <Sparkles className="w-4 h-4"/>
                    Generate Tomorrow
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Food Icons */}
            <motion.div className="absolute top-1/4 -left-12 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 z-30" animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <div className="bg-green-100 p-2 rounded-lg"><Salad className="w-5 h-5 text-green-600"/></div>
              <span className="text-sm font-semibold text-gray-800 pr-2">Salad</span>
            </motion.div>

            <motion.div className="absolute bottom-1/4 -right-8 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 z-30" animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}>
              <div className="bg-orange-100 p-2 rounded-lg"><Carrot className="w-5 h-5 text-orange-600"/></div>
              <span className="text-sm font-semibold text-gray-800 pr-2">Carrot</span>
            </motion.div>

            <motion.div className="absolute top-1/2 -right-16 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2 z-30 hidden md:flex" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}>
              <div className="bg-red-100 p-2 rounded-lg"><Apple className="w-5 h-5 text-red-600"/></div>
              <span className="text-sm font-semibold text-gray-800 pr-2">Apple</span>
            </motion.div>

          </div>
        </div>
      </div>
    </section>);
}
