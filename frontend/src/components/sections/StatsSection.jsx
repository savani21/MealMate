import { motion } from 'framer-motion';
import { AnimatedSection } from '../AnimatedSection';
import { ChefHat, CalendarDays, ShoppingBasket, Star } from 'lucide-react';

export function StatsSection() {
    const highlights = [
        {
            icon: CalendarDays,
            title: "Personalized Meal Planning",
            description: "Build meal plans around your food preferences and daily goals."
        },
        {
            icon: ChefHat,
            title: "Recipes for Your Kitchen",
            description: "Discover recipes and make better use of ingredients you have."
        },
        {
            icon: ShoppingBasket,
            title: "Smarter Grocery Lists",
            description: "Organize the ingredients you need for your planned meals."
        },
        {
            icon: Star,
            title: "Community Recipe Ratings",
            description: "Share cooking feedback and help others choose what to cook."
        }
    ];

    return (
        <section className="py-12 md:py-14 bg-white border-y border-gray-100" id="about">
            <div className="container mx-auto px-4 md:px-6">
                <AnimatedSection>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {highlights.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.08 }}
                                    className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 text-base font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-sm leading-relaxed text-gray-500">{item.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}
