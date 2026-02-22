import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center justify-center px-4 pt-12 pb-8">
      <img
        src="/logo-fal.jpeg"
        alt="FAL Cortes Logo"
        className="mb-6 h-36 w-36 rounded-full border-4 border-primary object-cover shadow-xl"
      />
      <h1 className="mb-2 text-4xl font-bold uppercase tracking-wider text-foreground md:text-5xl">
        Barbearia do Fal
      </h1>
      <p className="mb-1 text-lg text-muted-foreground">Estilo & Atitude</p>
      <p className="mb-8 text-sm text-muted-foreground">
        Terça a Sábado • 08h às 21h
      </p>
      <Button
        size="lg"
        className="gap-2 text-lg font-semibold uppercase tracking-wide"
        onClick={() => navigate("/agendar")}
      >
        <Scissors className="h-5 w-5" />
        Agendar Horário
      </Button>
    </section>
  );
}
