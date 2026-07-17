import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { LiveDemo } from '@/components/sections/LiveDemo';
import { Customization } from '@/components/sections/Customization';
import { Privacy } from '@/components/sections/Privacy';
import { Download } from '@/components/sections/Download';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@vercel/analytics/react';

import { DynamicPet } from '@/components/ui/DynamicPet';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <DynamicPet />
      <main id="main-content" className="pt-16">
        <Hero />
        <Features />
        <HowItWorks />
        <LiveDemo />
        <Customization />
        <Privacy />
        <Download />
      </main>
      <Footer />
      <Analytics />
    </>
  );
}