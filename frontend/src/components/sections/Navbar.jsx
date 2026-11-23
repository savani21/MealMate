import { useState, useEffect } from 'react';
import { ChefHat, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Featured Recipes', href: '#featured-foods' },
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 py-3 shadow-sm backdrop-blur-lg'
          : 'bg-white/70 py-4 backdrop-blur-md md:bg-transparent md:py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <a href="#home" className="flex shrink-0 items-center gap-2" aria-label="MealMate home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ChefHat className="h-6 w-6 text-primary" />
            </span>
            <span className="text-xl font-black tracking-tight text-gray-900">MealMate</span>
          </a>

          <nav className="hidden items-center md:flex" aria-label="Main navigation">
            <ul className="flex items-center gap-5 lg:gap-7">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group relative whitespace-nowrap py-2 text-sm font-semibold text-gray-600 transition-colors hover:text-primary"
                  >
                    {link.label}
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button
              onClick={() => navigate('/login')}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
            >
              Get Started
            </button>
          </div>

          <button
            className="rounded-full bg-gray-100 p-2.5 text-gray-700 transition-colors hover:bg-gray-200 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-gray-100 bg-white p-4 shadow-xl md:hidden"
          >
            <nav aria-label="Mobile navigation">
              <ul className="mb-5 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="block rounded-xl px-3 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-orange-50 hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Get Started Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
