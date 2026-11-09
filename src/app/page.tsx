import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { ProductsSection } from "@/components/ProductsSection";
import { RulesSection } from "@/components/RulesSection";
import { LiquiditySection } from "@/components/LiquiditySection";
import { ComparisonSection } from "@/components/ComparisonSection";
import { ChainSection } from "@/components/ChainSection";
import { TransparencySection } from "@/components/TransparencySection";
import { DevelopersSection } from "@/components/DevelopersSection";
import { SecuritySection } from "@/components/SecuritySection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { Rails, Seam } from "@/components/atmosphere";

export default function Home() {
  return (
    <div className="relative isolate">
      <Rails />
      <Header />
      <main className="relative">
        <HeroSection />
        <Seam />
        <HowItWorksSection />
        <Seam />
        <ProductsSection />
        <Seam />
        <RulesSection />
        <Seam />
        <LiquiditySection />
        <Seam />
        <ComparisonSection />
        <Seam />
        <ChainSection />
        <Seam />
        <TransparencySection />
        <Seam />
        <DevelopersSection />
        <Seam />
        <SecuritySection />
        <Seam />
        <CTASection />
      </main>
      <Seam />
      <Footer />
    </div>
  );
}
