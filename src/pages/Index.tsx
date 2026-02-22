import { HeroSection } from "@/components/HeroSection";
import { PriceTable } from "@/components/PriceTable";
import { PixSection } from "@/components/PixSection";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <PriceTable />
      <PixSection />
      <WhatsAppButton />
      <footer className="py-8 text-center text-xs text-muted-foreground">
        © 2026 Barbearia do Fal — Todos os direitos reservados
      </footer>
    </main>
  );
};

export default Index;
