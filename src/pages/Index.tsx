import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Scissors, Clock, MapPin, Phone, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoFal from "@/assets/logo-fal.jpeg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Radial glow behind logo */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
          <img
            src={logoFal}
            alt="FAL Cortes Logo"
            className="h-40 w-40 rounded-full border-2 border-primary object-cover shadow-2xl shadow-primary/20 md:h-52 md:w-52"
          />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-5xl font-bold uppercase tracking-widest text-foreground md:text-7xl">
          Barbearia do <span className="text-primary">Fal</span>
        </h1>
        <p className="mb-8 text-lg tracking-[0.3em] uppercase text-muted-foreground md:text-xl">
          Estilo & Atitude
        </p>

        {/* CTA */}
        <Button
          size="lg"
          className="mb-12 gap-3 px-12 py-6 text-lg font-bold uppercase tracking-wider shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
          onClick={() => navigate("/agendar")}
        >
          <Scissors className="h-5 w-5" />
          Agendar Horário
        </Button>

        {/* Info cards */}
        <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-4 backdrop-blur-sm">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Ter a Sáb</span>
            <span className="text-sm font-semibold text-foreground">08h – 21h</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-4 backdrop-blur-sm">
            <Phone className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">WhatsApp</span>
            <span className="text-sm font-semibold text-foreground">(71) 98833-5001</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-4 backdrop-blur-sm">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Local</span>
            <span className="text-sm font-semibold text-foreground">Salvador - BA</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 z-10 flex flex-col items-center gap-2">
        <button
          onClick={() => navigate("/admin-login")}
          className="text-xs text-muted-foreground/40 transition-colors hover:text-primary"
        >
          Área do Barbeiro
        </button>
      </footer>

      <WhatsAppButton />
    </main>
  );
};

export default Index;
