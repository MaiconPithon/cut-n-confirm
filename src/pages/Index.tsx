import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Scissors, Clock, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-12 pb-6">
        <img
          src="/logo-fal.jpeg"
          alt="FAL Cortes Logo"
          className="mb-6 h-28 w-28 rounded-full border-4 border-primary object-cover shadow-xl"
        />
        <h1 className="mb-2 text-4xl font-bold uppercase tracking-wider text-foreground md:text-5xl">
          Barbearia do <span className="text-primary">Fal</span>
        </h1>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Terça a Sábado — 08:00 às 21:00</span>
        </div>
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>(71) 98833-5001</span>
        </div>
        <Button
          size="lg"
          className="gap-2 px-10 text-lg font-semibold uppercase tracking-wide"
          onClick={() => navigate("/agendar")}
        >
          <Scissors className="h-5 w-5" />
          Agendar Horário
        </Button>
      </section>

      {/* Serviços & Preços */}
      <section className="mx-auto w-full max-w-lg px-4 py-8">
        <h2 className="mb-6 text-center text-2xl font-bold uppercase tracking-wide text-primary">
          Serviços & Preços
        </h2>
        <div className="space-y-2">
          {services?.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4"
            >
              <span className="font-medium text-foreground">{s.name}</span>
              <span className="font-bold text-primary">
                R$ {s.price.toFixed(2).replace(".", ",")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Área do Barbeiro link */}
      <footer className="pb-20 pt-8 text-center">
        <button
          onClick={() => navigate("/admin-login")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Área do Barbeiro
        </button>
      </footer>

      <WhatsAppButton />
    </main>
  );
};

export default Index;
