import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Scissors, Clock, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoFal from "@/assets/logo-fal.jpeg";
import siteBg from "@/assets/site-background.png";
import { useBusinessName } from "@/hooks/useBusinessName";

const Index = () => {
  const navigate = useNavigate();
  const { businessName } = useBusinessName();

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background">
      {/* Premium background image */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={siteBg}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Sharp logo on top */}
        <div className="mb-6 relative">
          <div className="absolute -inset-3 rounded-full border border-primary/30" />
          <div className="absolute -inset-6 rounded-full border border-primary/10" />
          <img
            src={logoFal}
            alt={`${businessName} Logo`}
            className="h-32 w-32 rounded-full border-2 border-primary object-cover shadow-2xl shadow-primary/25 sm:h-40 sm:w-40"
          />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-4xl font-bold uppercase tracking-widest text-foreground sm:text-5xl md:text-6xl">
          {businessName.split(" ").map((word, i, arr) => 
            i === arr.length - 1 ? <span key={i} className="text-primary">{word}</span> : <span key={i}>{word} </span>
          )}
        </h1>
        <p className="mb-1 text-base tracking-[0.25em] uppercase text-muted-foreground sm:text-lg">
          Estilo & Atitude
        </p>
        <div className="mb-8 h-px w-24 bg-primary/40" />

        {/* CTA */}
        <Button
          size="lg"
          className="mb-10 gap-3 rounded-full px-10 py-6 text-base font-bold uppercase tracking-wider shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105 sm:text-lg sm:px-14"
          onClick={() => navigate("/agendar")}
        >
          <Scissors className="h-5 w-5" />
          Agendar Horário
        </Button>

        {/* Info row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm">Ter–Sáb · 08h às 21h</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm">(71) 98833-5001</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm">Salvador – BA</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 z-10">
        <button
          onClick={() => navigate("/admin-login")}
          className="text-[10px] text-muted-foreground/30 transition-colors hover:text-primary"
        >
          Área do Barbeiro
        </button>
      </footer>

      <WhatsAppButton />
    </main>
  );
};

export default Index;
