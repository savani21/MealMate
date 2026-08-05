import { ChefHat, Calendar, Heart, TrendingUp, PiggyBank, Leaf } from 'lucide-react';
import { AnimatedSection } from '../AnimatedSection';
const AI_FEATURES = [
    {
        icon: ChefHat,
        title: "AI Recipe Recommendation",
        desc: "Upload available ingredients and receive delicious, step-by-step recipes instantly."
    },
    {
        icon: Calendar,
        title: "AI Weekly Meal Planner",
        desc: "Generate personalized breakfast, lunch and dinner schedules based on your macros."
    },
    {
        icon: Heart,
        title: "AI Nutrition Advisor",
        desc: "Receive proactive health suggestions and alternatives based on calories and protein targets."
    },
    {
        icon: TrendingUp,
        title: "AI Grocery Prediction",
        desc: "Smart algorithms predict next week's grocery requirements so you never run out of staples."
    },
    {
        icon: PiggyBank,
        title: "AI Budget Optimizer",
        desc: "Reduce grocery spending using smart alternatives and in-season produce suggestions."
    },
    {
        icon: Leaf,
        title: "AI Food Waste Reduction",
        desc: "Get alerts and recipe suggestions to use ingredients right before they expire."
    }
];
export function AIFeaturesSection() {
    return (<section className="py-20 md:py-28 relative" id="recipes">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white -z-10"/>

      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">
            Powered by AI
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Intelligence at every step
          </h3>
          <p className="text-lg text-muted-foreground">
            Our proprietary AI engine learns your habits, tastes, and budget to become your ultimate kitchen assistant.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {AI_FEATURES.map((feature, i) => (<AnimatedSection key={i} delay={i * 0.1}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 border-l-4 border-l-primary hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col" data-testid={`ai-card-${i}`}>
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6 shrink-0">
                  <feature.icon className="w-8 h-8 text-primary"/>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h4>
                <p className="text-gray-500 leading-relaxed mt-auto text-sm md:text-base">
                  {feature.desc}
                </p>
              </div>
            </AnimatedSection>))}
        </div>
      </div>
    </section>);
}
