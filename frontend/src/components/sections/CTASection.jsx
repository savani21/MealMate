import { motion } from 'framer-motion';
import { AnimatedSection } from '../AnimatedSection';
import { toast } from '@/hooks/use-toast';
export function CTASection() {
    return (<section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-700">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-white opacity-5 blur-3xl"/>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-black opacity-10 blur-3xl"/>
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (<motion.div key={i} className="absolute w-2 h-2 rounded-full bg-white opacity-20" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
            }} animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.4, 0.1],
            }} transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
            }}/>))}
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <AnimatedSection>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              Start Your Healthy Journey Today
            </h2>
            <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto opacity-90">
              Join 20,000+ people who are eating healthier, spending smarter, and wasting less food.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-white text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 hover:scale-105 transition-all duration-300 shadow-xl" data-testid="cta-button-primary" onClick={() => toast({ title: "You're on the list! 🎉", description: "Thanks for your interest — we'll email you the moment MealMate AI opens up." })}>
                Create Free Account
              </button>
              <button className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300" data-testid="cta-button-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </button>
            </div>
            
            <p className="mt-8 text-sm text-green-100 opacity-80">
              No credit card required • Free 14-day premium trial
            </p>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>);
}
