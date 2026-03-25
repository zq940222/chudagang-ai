import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <>
      <Nav />
      <main>
        <HeroSection t={(key) => t(key)} />
        <FeaturesSection t={(key) => t(key)} />
        <HowItWorksSection t={(key) => t(key)} />
      </main>
      <Footer />
    </>
  );
}
