import { useState, useEffect } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Recipes', href: '#recipes' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              MealMate <span className="text-primary">AI</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6 text-sm font-medium text-gray-600">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="relative group hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-primary/90 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 p-4 md:hidden"
          >
            <ul className="flex flex-col gap-4 mb-6">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="block text-base font-medium text-gray-700 hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
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
