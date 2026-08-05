import { Star } from 'lucide-react';
import { AnimatedSection } from '../AnimatedSection';
const TESTIMONIALS = [
    {
        initials: "SJ",
        quote: "MealMate AI completely transformed how I plan meals for my family. We waste 60% less food now and actually enjoy cooking again!",
        name: "Sarah Johnson",
        role: "Home Chef & Mom",
        bg: "from-green-400 to-emerald-600"
    },
    {
        initials: "MC",
        quote: "As a fitness coach, I recommend MealMate AI to all my clients. The nutrition tracking and AI meal plans are incredibly accurate.",
        name: "Michael Chen",
        role: "Fitness Coach",
        bg: "from-blue-400 to-indigo-600"
    },
    {
        initials: "EP",
        quote: "I've tried every meal planning app out there. MealMate AI is in a league of its own — intuitive, smart, and actually fun to use.",
        name: "Emma Parker",
        role: "Nutritionist",
        bg: "from-rose-400 to-orange-500"
    }
];
export function TestimonialsSection() {
    return (<section className="py-20 md:py-28 bg-gray-50" id="testimonials">
      <div className="container mx-auto px-4 md:px-6">
        
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900">
            Loved by thousands
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, i) => (<AnimatedSection key={i} delay={i * 0.15}>
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col" data-testid={`testimonial-${i}`}>
                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400"/>))}
                </div>
                
                <p className="text-gray-700 italic text-lg leading-relaxed mb-8 flex-1">
                  "{t.quote}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.bg} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                    {t.initials}
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">{t.name}</h5>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>))}
        </div>
      </div>
    </section>);
}
