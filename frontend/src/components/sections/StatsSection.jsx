import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AnimatedSection } from '../AnimatedSection';
import { Star } from 'lucide-react';
function Counter({ from, to, delay = 0, suffix = "" }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const [hasStarted, setHasStarted] = useState(false);
    const spring = useSpring(from, {
        stiffness: 50,
        damping: 20,
        bounce: 0,
        duration: 2000
    });
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString() + suffix);
    useEffect(() => {
        if (isInView && !hasStarted) {
            setTimeout(() => {
                spring.set(to);
                setHasStarted(true);
            }, delay * 1000);
        }
    }, [isInView, spring, to, delay, hasStarted]);
    return <motion.span ref={ref}>{display}</motion.span>;
}
export function StatsSection() {
    const stats = [
        { value: 50000, suffix: "+", label: "Recipes Available" },
        { value: 20000, suffix: "+", label: "Healthy Users" },
        { value: 200, suffix: "+", label: "Partner Stores" },
    ];
    return (<section className="py-16 bg-white border-y border-gray-100" id="about">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {stats.map((stat, i) => (<div key={i} className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl md:text-5xl font-black text-primary mb-2 tracking-tight">
                  <Counter from={0} to={stat.value} suffix={stat.suffix} delay={0.1 * i}/>
                </div>
                <div className="text-sm md:text-base font-medium text-gray-500">
                  {stat.label}
                </div>
              </div>))}

            {/* Rating Card */}
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (<Star key={star} className="w-6 h-6 fill-amber-400 text-amber-400"/>))}
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">
                4.9<span className="text-xl text-gray-400 font-bold ml-1">/ 5</span>
              </div>
              <div className="text-sm md:text-base font-medium text-gray-500">
                Average Rating
              </div>
            </div>

          </div>
        </AnimatedSection>
      </div>
    </section>);
}
