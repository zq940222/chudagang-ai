import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { CategoriesBento } from "@/components/landing/categories-bento";
import { FeaturesSection } from "@/components/landing/features-section";
import { FeaturedExperts } from "@/components/landing/featured-experts";
import { VelocityCta } from "@/components/landing/velocity-cta";

async function getFeaturedExperts() {
  const profiles = await db.developerProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: { aiRating: "desc" },
    take: 4,
    include: {
      skills: { include: { skillTag: true }, take: 5 },
    },
  });

  return profiles.map((p) => ({
    id: p.id,
    userId: p.userId,
    displayName: p.displayName,
    title: p.title,
    hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
    currency: p.currency,
    aiRating: p.aiRating ? Number(p.aiRating) : null,
    skills: p.skills.map((s) => s.skillTag.name),
  }));
}

async function getLandingStats() {
  const [developerCount, projectCount, completedCount] = await Promise.all([
    db.developerProfile.count({ where: { status: "APPROVED" } }),
    db.project.count({ where: { status: "PUBLISHED" } }),
    db.contract.count({ where: { status: "COMPLETED" } }),
  ]);

  return { developerCount, projectCount, completedCount };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("landing");

  const [experts, stats] = await Promise.all([
    getFeaturedExperts(),
    getLandingStats(),
  ]);

  return (
    <>
      <Nav />
      <main className="relative overflow-hidden">
        <div className="liquid-orb left-[-10rem] top-20 h-80 w-80 bg-accent-cyan/22" />
        <div className="liquid-orb right-[-8rem] top-[28rem] h-96 w-96 bg-tertiary/16" />
        <div className="liquid-orb left-[35%] top-[65rem] h-96 w-96 bg-[color:rgba(207,180,137,0.18)]" />
        <HeroSection t={(key) => t(key)} stats={stats} />
<CategoriesBento t={(key) => t(key)} />
        <FeaturesSection t={(key) => t(key)} />
        <FeaturedExperts t={(key) => t(key)} experts={experts} locale={locale} />
        <VelocityCta t={(key) => t(key)} />
      </main>
      <Footer />
    </>
  );
}
