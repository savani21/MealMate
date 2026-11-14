import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedSection } from '../AnimatedSection';
import { ChefHat, Users, ShoppingBasket, Star } from 'lucide-react';

// Set VITE_API_URL in the frontend deployment to the deployed backend origin.
// Local development continues to use the local Express server by default.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const emptyStats = {
    recipes: null,
    registeredUsers: null,
    groceryProducts: null,
    averageRecipeRating: null,
    recipeRatingCount: 0,
};

function StatCard({ icon: Icon, value, suffix = '', label, note }) {
    const displayValue = value === null || value === undefined
        ? '—'
        : (typeof value === 'number' ? value.toLocaleString() : value) + suffix;

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
                {displayValue}
            </div>
            <div className="text-sm font-semibold text-gray-800">{label}</div>
            {note && <div className="mt-1 text-xs text-gray-400">{note}</div>}
        </motion.div>
    );
}

export function StatsSection() {
    const [stats, setStats] = useState(emptyStats);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const controller = new AbortController();

        fetch(`${API_BASE_URL}/api/stats`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`Statistics API returned ${response.status}`);
                return response.json();
            })
            .then((data) => {
                const numericFields = ['recipes', 'registeredUsers', 'groceryProducts', 'recipeRatingCount'];
                const valid = numericFields.every((field) =>
                    Number.isFinite(Number(data[field])) && Number(data[field]) >= 0
                );
                if (!valid) throw new Error('Statistics API returned an invalid response');

                setStats({
                    recipes: Number(data.recipes),
                    registeredUsers: Number(data.registeredUsers),
                    groceryProducts: Number(data.groceryProducts),
                    averageRecipeRating: data.averageRecipeRating == null
                        ? null
                        : Number(data.averageRecipeRating),
                    recipeRatingCount: Number(data.recipeRatingCount),
                });
                setStatus('loaded');
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('MealMate statistics:', error);
                    setStatus('error');
                }
            });

        return () => controller.abort();
    }, []);

    const unavailableNote = status === 'error'
        ? 'Statistics temporarily unavailable'
        : status === 'loading'
            ? 'Loading live statistics'
            : undefined;

    return (
        <section className="py-12 md:py-14 bg-white border-y border-gray-100" id="about">
            <div className="container mx-auto px-4 md:px-6">
                <AnimatedSection>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        <StatCard icon={ChefHat} value={status === 'loaded' ? stats.recipes : null} label="Recipes Available" note={status === 'loaded' ? 'Recipes in MealMate' : unavailableNote} />
                        <StatCard icon={Users} value={status === 'loaded' ? stats.registeredUsers : null} label="Registered Users" note={status === 'loaded' ? 'Member accounts' : unavailableNote} />
                        <StatCard icon={ShoppingBasket} value={status === 'loaded' ? stats.groceryProducts : null} label="Grocery Products" note={status === 'loaded' ? 'Active marketplace products' : unavailableNote} />
                        <StatCard
                            icon={Star}
                            value={status === 'loaded' && stats.recipeRatingCount > 0 ? stats.averageRecipeRating : null}
                            suffix={status === 'loaded' && stats.recipeRatingCount > 0 ? '/5' : ''}
                            label="Average Recipe Rating"
                            note={status !== 'loaded'
                                ? unavailableNote
                                : stats.recipeRatingCount > 0
                                    ? `Based on ${stats.recipeRatingCount.toLocaleString()} ratings`
                                    : 'No ratings submitted yet'}
                        />
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}
