import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ArrowLeft, ChevronRight, Check, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, getDay, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Step = "service" | "date" | "time" | "info" | "payment" | "confirm" | "confirmed";

const STEPS: Step[] = ["service", "date", "time", "info", "payment", "confirm"];

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const WHATSAPP_NUMBER = "5571988335001";

export default function Agendar() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro">("pix");

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: scheduleConfig } = useQuery({
    queryKey: ["schedule_config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_config").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments", selectedDate?.toISOString()],
    enabled: !!selectedDate,
    queryFn: async () => {
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("appointment_date", dateStr)
        .neq("status", "cancelado");
      if (error) throw error;
      return data;
    },
  });

  const { data: blockedSlots } = useQuery({
    queryKey: ["blocked_slots", selectedDate?.toISOString()],
    enabled: !!selectedDate,
    queryFn: async () => {
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .eq("blocked_date", dateStr);
      if (error) throw error;
      return data;
    },
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          client_name: clientName,
          client_phone: clientPhone,
          service_id: selectedService.id,
          appointment_date: format(selectedDate!, "yyyy-MM-dd"),
          appointment_time: selectedTime,
          payment_method: paymentMethod,
          price: selectedService.price,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setStep("confirmed");
      toast.success("Agendamento realizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao agendar. Tente novamente.");
    },
  });

  const bookedTimes = new Set(appointments?.map((a) => a.appointment_time.slice(0, 5)) || []);
  const isFullDayBlocked = blockedSlots?.some((b) => b.full_day);
  const blockedTimes = new Set(blockedSlots?.filter((b) => b.blocked_time).map((b) => b.blocked_time!.slice(0, 5)) || []);

  const disabledDays = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const dow = getDay(date);
    const config = scheduleConfig?.find((c) => c.day_of_week === dow);
    return !config?.is_open;
  };

  const currentStepIndex = STEPS.indexOf(step === "confirmed" ? "confirm" : step);

  const goBack = () => {
    if (step === "service") return navigate("/");
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev);
  };

  const canContinue = () => {
    switch (step) {
      case "service": return !!selectedService;
      case "date": return !!selectedDate;
      case "time": return !!selectedTime;
      case "info": return clientName.trim().length > 0 && clientPhone.trim().length > 0;
      case "payment": return !!paymentMethod;
      case "confirm": return true;
      default: return false;
    }
  };

  const handleContinue = () => {
    if (step === "confirm") {
      createAppointment.mutate();
      return;
    }
    const next = STEPS[currentStepIndex + 1];
    if (next) setStep(next);
  };

  const whatsappMessage = () => {
    const dateStr = selectedDate ? format(selectedDate, "dd/MM/yyyy") : "";
    const msg = `Olá! Agendei um horário na Barbearia do Fal:\n\n👤 Nome: ${clientName}\n✂️ Serviço: ${selectedService?.name}\n📅 Data: ${dateStr}\n🕐 Horário: ${selectedTime}\n💰 Pagamento: ${paymentMethod === "pix" ? "Pix" : "Dinheiro"}\n💵 Valor: R$ ${selectedService?.price.toFixed(2).replace(".", ",")}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const whatsappComprovante = () => {
    const msg = `Olá! Segue o comprovante do Pix para o agendamento:\n\n👤 Nome: ${clientName}\n✂️ Serviço: ${selectedService?.name}\n💵 Valor: R$ ${selectedService?.price.toFixed(2).replace(".", ",")}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={goBack} className="text-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider text-foreground">
          Agendar Horário
        </h1>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 pb-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= currentStepIndex ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      <div className="px-4 pb-24">
        {/* Step: Service */}
        {step === "service" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">Escolha o serviço</h2>
            <div className="space-y-2">
              {services?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-5 py-4 text-left transition-colors",
                    selectedService?.id === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary"
                  )}
                >
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="font-semibold text-primary">R$ {s.price.toFixed(2).replace(".", ",")}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Date */}
        {step === "date" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">Escolha a data</h2>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-primary">Escolha o horário</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
            {isFullDayBlocked ? (
              <p className="text-center text-muted-foreground">Este dia está bloqueado.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((t) => {
                  const taken = bookedTimes.has(t) || blockedTimes.has(t);
                  return (
                    <button
                      key={t}
                      disabled={taken}
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors",
                        taken
                          ? "cursor-not-allowed border-border bg-muted/20 text-muted-foreground line-through"
                          : selectedTime === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-foreground hover:border-primary"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step: Info */}
        {step === "info" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">Seus dados</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nome</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Seu nome"
                  className="border-border bg-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(71) 99999-9999"
                  className="border-border bg-secondary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">Forma de Pagamento</h2>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("pix")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-5 py-4 text-left transition-colors",
                  paymentMethod === "pix" ? "border-primary bg-primary/10" : "border-border bg-secondary"
                )}
              >
                <span>💎</span>
                <span className="font-medium text-foreground">Pix</span>
              </button>
              <button
                onClick={() => setPaymentMethod("dinheiro")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-5 py-4 text-left transition-colors",
                  paymentMethod === "dinheiro" ? "border-primary bg-primary/10" : "border-border bg-secondary"
                )}
              >
                <span>💵</span>
                <span className="font-medium text-foreground">Dinheiro (pagar no local)</span>
              </button>
            </div>

            {/* Pix info box */}
            {paymentMethod === "pix" && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-card p-5 text-center">
                <p className="text-sm text-muted-foreground">Chave Pix (Telefone):</p>
                <p className="my-1 text-lg font-bold text-primary">71 98833-5001</p>
                <p className="mb-3 text-sm text-muted-foreground">
                  Valor: <span className="text-primary">R$ {selectedService?.price.toFixed(2).replace(".", ",")}</span>
                </p>
                <a href={whatsappComprovante()} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-[hsl(142,70%,45%)] text-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,45%)]/10">
                    Enviar Comprovante via WhatsApp
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">Confirmar Agendamento</h2>
            <div className="space-y-1 rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Nome: </span>
                <strong>{clientName}</strong>
              </p>
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Telefone: </span>
                <strong>{clientPhone}</strong>
              </p>
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Data: </span>
                <strong>{selectedDate && format(selectedDate, "dd/MM/yyyy")}</strong>
              </p>
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Horário: </span>
                <strong>{selectedTime}</strong>
              </p>
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Serviço: </span>
                <strong>{selectedService?.name}</strong>
              </p>
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground">Pagamento: </span>
                <strong>{paymentMethod === "pix" ? "Pix" : "Dinheiro"}</strong>
              </p>
              <div className="border-t border-border pt-2 mt-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-primary">R$ {selectedService?.price.toFixed(2).replace(".", ",")}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirmed (success) */}
        {step === "confirmed" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(142,70%,45%)]/20">
              <Check className="h-8 w-8 text-[hsl(142,70%,45%)]" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-primary">Agendado!</h2>
            <div className="mb-6 space-y-1 rounded-lg border border-border bg-card p-5 text-left">
              <p className="text-sm"><span className="text-muted-foreground">Nome:</span> <strong>{clientName}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Serviço:</span> <strong>{selectedService?.name}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Data:</span> <strong>{selectedDate && format(selectedDate, "dd/MM/yyyy")}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Horário:</span> <strong>{selectedTime}</strong></p>
              <p className="text-sm"><span className="text-muted-foreground">Pagamento:</span> <strong>{paymentMethod === "pix" ? "Pix" : "Dinheiro"}</strong></p>
              <div className="border-t border-border pt-2 mt-2">
                <p className="text-sm"><span className="text-muted-foreground">Total:</span> <span className="font-bold text-primary">R$ {selectedService?.price.toFixed(2).replace(".", ",")}</span></p>
              </div>
            </div>
            <a href={whatsappMessage()} target="_blank" rel="noopener noreferrer" className="block mb-3">
              <Button className="w-full gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-foreground">
                <MessageCircle className="h-5 w-5" />
                Enviar confirmação via WhatsApp
              </Button>
            </a>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </div>
        )}
      </div>

      {/* Bottom continue button (fixed) */}
      {step !== "confirmed" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background p-4">
          <Button
            className="w-full gap-2 text-base"
            disabled={!canContinue() || createAppointment.isPending}
            onClick={handleContinue}
          >
            {step === "confirm"
              ? createAppointment.isPending ? "Agendando..." : "Confirmar Agendamento"
              : <>Continuar <ChevronRight className="h-4 w-4" /></>
            }
          </Button>
        </div>
      )}

      <WhatsAppButton />
    </main>
  );
}
