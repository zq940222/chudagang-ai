import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { TrustedBySection } from "@/components/landing/trusted-by-section";
import { CategoriesBento } from "@/components/landing/categories-bento";
import { FeaturesSection } from "@/components/landing/features-section";
import { FeaturedExperts } from "@/components/landing/featured-experts";
import { VelocityCta } from "@/components/landing/velocity-cta";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <>
      <Nav />
      <main className="relative overflow-hidden">
        <div className="liquid-orb left-[-10rem] top-20 h-80 w-80 bg-accent-cyan/30" />
        <div className="liquid-orb right-[-8rem] top-[28rem] h-96 w-96 bg-tertiary/20" />
        <HeroSection t={(key) => t(key)} />
        <TrustedBySection t={(key) => t(key)} />
        <CategoriesBento t={(key) => t(key)} />
        <FeaturesSection t={(key) => t(key)} />
        <FeaturedExperts t={(key) => t(key)} />
        <VelocityCta t={(key) => t(key)} />
      </main>
      <Footer />
    </>
  );
}
