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
      <main>
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
