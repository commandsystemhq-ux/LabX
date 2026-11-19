import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { SubjectPreview } from "@/components/landing/SubjectPreview";
import { WhyStrip } from "@/components/landing/WhyStrip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScienceVerse — محاكاة علوم تفاعلية ثلاثية الأبعاد لمنهج الوزارة" },
      {
        name: "description",
        content:
          "ScienceVerse: interactive 3D biology, physics and chemistry simulations for the Egyptian secondary curriculum, with a context-aware AI tutor.",
      },
      { property: "og:title", content: "ScienceVerse — العلوم بتتشاف مش بتتحفظ" },
      {
        property: "og:description",
        content: "Interactive 3D science simulations for the Egyptian curriculum with an AI tutor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SubjectPreview />
        <WhyStrip />
      </main>
      <Footer />
    </div>
  );
}
