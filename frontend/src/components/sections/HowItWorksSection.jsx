import { UserPlus, ClipboardList, Package, Bot, ShoppingCart, Activity } from 'lucide-react';
import { AnimatedSection } from '../AnimatedSection';
const STEPS = [
    { icon: UserPlus, title: "Create Account", desc: "Sign up for free in seconds" },
    { icon: ClipboardList, title: "Health Profile", desc: "Set your goals & preferences" },
    { icon: Package, title: "Add Pantry", desc: "Scan what you already have" },
    { icon: Bot, title: "AI Generation", desc: "Get smart meal plans instantly" },
    { icon: ShoppingCart, title: "Grocery List", desc: "Buy only what you need" },
    { icon: Activity, title: "Track Nutrition", desc: "Monitor your health progress" },
];
export function HowItWorksSection() {
    return (<section className="py-20 md:py-28 bg-green-50/50 relative overflow-hidden" id="how-it-works">
      {/* Decorative BG element */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white rounded-full opacity-40 blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"/>
      
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">
            How It Works
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Get started in minutes
          </h3>
          <p className="text-lg text-muted-foreground">
            From your first login to your first healthy meal, we've designed a seamless experience.
          </p>
        </AnimatedSection>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-[45px] left-[5%] right-[5%] h-[2px] bg-gradient-to-r from-green-200 via-green-400 to-emerald-200 z-0"/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-4">
            {STEPS.map((step, i) => (<AnimatedSection key={i} delay={i * 0.12} className="relative z-10">
                <div className="flex flex-col items-center text-center group">
                  {/* Step Number Circle */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-md mb-4 border-2 border-white absolute -top-4 group-hover:-translate-y-1 transition-transform">
                    {i + 1}
                  </div>
                  
                  {/* Icon Card */}
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:shadow-md transition-all">
                    <step.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform"/>
                  </div>
                  
                  {/* Text */}
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-gray-500 px-2">{step.desc}</p>
                </div>
              </AnimatedSection>))}
          </div>
        </div>
      </div>
    </section>);
}
