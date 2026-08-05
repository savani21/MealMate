import { Navbar } from '@/components/sections/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { AIFeaturesSection } from '@/components/sections/AIFeaturesSection';
import { AppPreviewSection } from '@/components/sections/AppPreviewSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';
import { Footer } from '@/components/sections/Footer';
export default function Home() {
    return (<div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AIFeaturesSection />
        <AppPreviewSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>);
}
