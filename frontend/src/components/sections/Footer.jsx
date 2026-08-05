import { Leaf, Github, Linkedin, Instagram, Twitter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
export function Footer() {
    const notifyComingSoon = (e, label) => {
        e.preventDefault();
        toast({ title: 'Coming soon', description: `${label} isn't ready yet, but it's on the way!` });
    };
    return (<footer className="bg-gray-900 text-white pt-20 pb-10" id="contact">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-2 mb-6 inline-flex" data-testid="footer-logo">
              <div className="bg-primary/20 p-2 rounded-xl">
                <Leaf className="w-6 h-6 text-primary"/>
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                MealMate <span className="text-primary">AI</span>
              </span>
            </a>
            <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
              The intelligent kitchen companion for health-conscious people who want to eat better, waste less, and spend smarter.
            </p>
          </div>

          {/* Links Cols */}
          <div>
            <h4 className="font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#home" className="hover:text-primary transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#recipes" className="hover:text-primary transition-colors">Recipes</a></li>
              <li><a href="#marketplace" className="hover:text-primary transition-colors">Marketplace</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Features</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-primary transition-colors">Meal Planner</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Pantry</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Grocery</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Nutrition</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" onClick={(e) => notifyComingSoon(e, 'Blog')} className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" onClick={(e) => notifyComingSoon(e, 'Careers')} className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" onClick={(e) => notifyComingSoon(e, 'Press')} className="hover:text-primary transition-colors">Press</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center md:text-left">
            © 2025 MealMate AI. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6 text-gray-400">
            <a href="#" onClick={(e) => notifyComingSoon(e, 'Our Twitter page')} className="hover:text-green-400 transition-colors" aria-label="Twitter" data-testid="social-twitter">
              <Twitter className="w-5 h-5"/>
            </a>
            <a href="#" onClick={(e) => notifyComingSoon(e, 'Our Instagram page')} className="hover:text-green-400 transition-colors" aria-label="Instagram" data-testid="social-instagram">
              <Instagram className="w-5 h-5"/>
            </a>
            <a href="#" onClick={(e) => notifyComingSoon(e, 'Our LinkedIn page')} className="hover:text-green-400 transition-colors" aria-label="LinkedIn" data-testid="social-linkedin">
              <Linkedin className="w-5 h-5"/>
            </a>
            <a href="#" onClick={(e) => notifyComingSoon(e, 'Our GitHub page')} className="hover:text-green-400 transition-colors" aria-label="GitHub" data-testid="social-github">
              <Github className="w-5 h-5"/>
            </a>
          </div>
        </div>
      </div>
    </footer>);
}
