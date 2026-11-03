import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedSection } from '../AnimatedSection';
import { ChefHat, Users, ShoppingBasket, Star } from 'lucide-react';

const initialStats = {
    recipes: 0,
    registeredUsers: 0,
    groceryProducts: 0,
    averageRecipeRating: null,
    recipeRatingCount: 0,
};

function StatCard({ icon: Icon, value, suffix = "", label, note }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="mb-1 text-3xl font-black tracking-tight text-primary">
                {value === null ? "—" : (typeof value === "number" ? value.toLocaleString() : value) + suffix}
            </div>
            <div className="text-sm font-semibold text-gray-800">{label}</div>
            {note && <div className="mt-1 text-xs text-gray-400">{note}</div>}
        </motion.div>
    );
}

export function StatsSection() {
    const [stats, setStats] = useState(initialStats);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        fetch("http://localhost:5000/api/stats")
            .then((response) => {
                if (!response.ok) throw new Error("Unable to load live statistics");
                return response.json();
            })
            .then((data) => {
                if (active) setStats({ ...initialStats, ...data });
            })
            .catch((error) => console.error("MealMate statistics:", error))
            .finally(() => { if (active) setLoaded(true); });
        return () => { active = false; };
    }, []);

    return (
        <section className="py-12 md:py-14 bg-white border-y border-gray-100" id="about">
            <div className="container mx-auto px-4 md:px-6">
                <AnimatedSection>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        <StatCard icon={ChefHat} value={loaded ? stats.recipes : "…"} label="Recipes Available" note="Recipes in MealMate" />
                        <StatCard icon={Users} value={loaded ? stats.registeredUsers : "…"} label="Registered Users" note="Member accounts" />
                        <StatCard icon={ShoppingBasket} value={loaded ? stats.groceryProducts : "…"} label="Grocery Products" note="Active marketplace products" />
                        <StatCard icon={Star} value={loaded && stats.recipeRatingCount > 0 ? stats.averageRecipeRating : (loaded ? null : "…")} suffix={loaded && stats.recipeRatingCount > 0 ? "/5" : ""} label="Average Recipe Rating" note={loaded ? (stats.recipeRatingCount > 0 ? `Based on ${stats.recipeRatingCount.toLocaleString()} ratings` : "No ratings submitted yet") : "Loading live rating"} />
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}
