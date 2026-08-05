import { CalendarCheck, Package, ShoppingCart, Bot, DollarSign, BarChart3, Users, Bell } from 'lucide-react';
import { AnimatedSection } from '../AnimatedSection';
const FEATURES = [
    {
        icon: CalendarCheck,
        title: "AI Meal Planner",
        desc: "Generate weekly meal schedules tailored to you.",
        color: "from-green-400 to-emerald-600"
    },
    {
        icon: Package,
        title: "Pantry Management",
        desc: "Track what you have and reduce food waste.",
        color: "from-emerald-400 to-teal-600"
    },
    {
        icon: ShoppingCart,
        title: "Grocery Marketplace",
        desc: "Auto-generate lists and order from partners.",
        color: "from-blue-400 to-indigo-600"
    },
    {
        icon: Bot,
        title: "Recipe Generator",
        desc: "Get instant recipes based on ingredients.",
        color: "from-purple-400 to-fuchsia-600"
    },
    {
        icon: DollarSign,
        title: "Budget Tracking",
        desc: "Monitor your grocery spending easily.",
        color: "from-amber-400 to-orange-500"
    },
    {
        icon: BarChart3,
        title: "Nutrition Dashboard",
        desc: "Track macros, calories, and health goals.",
        color: "from-rose-400 to-pink-600"
    },
    {
        icon: Users,
        title: "Family Management",
        desc: "Share plans and lists with your household.",
        color: "from-indigo-400 to-violet-600"
    },
    {
        icon: Bell,
        title: "Smart Notifications",
        desc: "Alerts for expiring food and meal prep.",
        color: "from-orange-400 to-red-500"
    }
];
export function FeaturesSection() {
    return (<section id="features" className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">
            Everything You Need
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Powerful Features for Healthy Living
          </h3>
          <p className="text-lg text-muted-foreground">
            MealMate AI combines all your food-related tasks into one intelligent platform, helping you eat better with zero stress.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (<AnimatedSection key={i} delay={i * 0.08}>
              <div className="group h-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100" data-testid={`feature-card-${i}`}>
                <div className={`w-12 h-12 rounded-xl mb-5 flex items-center justify-center bg-gradient-to-br ${feature.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white"/>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </AnimatedSection>))}
        </div>

      </div>
    </section>);
}
