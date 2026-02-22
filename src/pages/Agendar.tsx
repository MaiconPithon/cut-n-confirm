import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, getDay, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Step = "service" | "date" | "time" | "info" | "payment" | "confirmed";

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
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro">("dinheiro");
  const [appointmentId, setAppointmentId] = useState<string>("");

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
    onSuccess: (data) => {
      setAppointmentId(data.id);
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

  const availableSlots = TIME_SLOTS.filter(
    (t) => !bookedTimes.has(t) && !blockedTimes.has(t) && !isFullDayBlocked
  );

  const whatsappMessage = () => {
    const dateStr = selectedDate ? format(selectedDate, "dd/MM/yyyy") : "";
    const msg = `Olá! Agendei um horário na Barbearia do Fal:\n\n👤 Nome: ${clientName}\n✂️ Serviço: ${selectedService?.name}\n📅 Data: ${dateStr}\n🕐 Horário: ${selectedTime}\n💰 Pagamento: ${paymentMethod === "pix" ? "Pix" : "Dinheiro"}\n💵 Valor: R$ ${selectedService?.price.toFixed(2).replace(".", ",")}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md">
        <Button variant="ghost" className="mb-4 gap-2 text-muted-foreground" onClick={() => step === "service" ? navigate("/") : setStep(step === "date" ? "service" : step === "time" ? "date" : step === "info" ? "time" : step === "payment" ? "info" : "service")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {step === "service" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Escolha o Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {services?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep("date"); }}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary p-4 text-left transition-colors hover:border-primary"
                >
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="font-semibold text-primary">R$ {s.price.toFixed(2).replace(".", ",")}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {step === "date" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Escolha a Data</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); if (d) setStep("time"); }}
                disabled={disabledDays}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </CardContent>
          </Card>
        )}

        {step === "time" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                Horários — {selectedDate && format(selectedDate, "dd/MM")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isFullDayBlocked ? (
                <p className="text-center text-muted-foreground">Este dia está bloqueado.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((t) => {
                    const taken = bookedTimes.has(t) || blockedTimes.has(t);
                    return (
                      <button
                        key={t}
                        disabled={taken}
                        onClick={() => { setSelectedTime(t); setStep("info"); }}
                        className={cn(
                          "rounded-md border border-border px-2 py-3 text-sm font-medium transition-colors",
                          taken
                            ? "cursor-not-allowed bg-muted/30 text-muted-foreground line-through"
                            : selectedTime === t
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:border-primary"
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "info" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Seus Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Nome</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Telefone</label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(71) 99999-9999" />
              </div>
              <Button
                className="w-full"
                disabled={!clientName.trim() || !clientPhone.trim()}
                onClick={() => setStep("payment")}
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "payment" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary p-4 text-sm">
                <p><strong>Serviço:</strong> {selectedService?.name}</p>
                <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy")}</p>
                <p><strong>Horário:</strong> {selectedTime}</p>
                <p><strong>Valor:</strong> R$ {selectedService?.price.toFixed(2).replace(".", ",")}</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={cn("flex w-full items-center gap-3 rounded-lg border p-4 transition-colors", paymentMethod === "pix" ? "border-primary bg-primary/10" : "border-border bg-secondary")}
                >
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Pix</p>
                    <p className="text-xs text-muted-foreground">Chave: 71 98833-5001</p>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod("dinheiro")}
                  className={cn("flex w-full items-center gap-3 rounded-lg border p-4 transition-colors", paymentMethod === "dinheiro" ? "border-primary bg-primary/10" : "border-border bg-secondary")}
                >
                  <span className="text-2xl">💵</span>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Dinheiro</p>
                    <p className="text-xs text-muted-foreground">Pagar no local</p>
                  </div>
                </button>
              </div>

              <Button
                className="w-full"
                onClick={() => createAppointment.mutate()}
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "confirmed" && (
          <Card className="border-border bg-card text-center">
            <CardContent className="space-y-4 pt-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-primary">Agendado!</h2>
              <div className="rounded-lg border border-border bg-secondary p-4 text-left text-sm">
                <p><strong>Nome:</strong> {clientName}</p>
                <p><strong>Serviço:</strong> {selectedService?.name}</p>
                <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy")}</p>
                <p><strong>Horário:</strong> {selectedTime}</p>
                <p><strong>Valor:</strong> R$ {selectedService?.price.toFixed(2).replace(".", ",")}</p>
                <p><strong>Pagamento:</strong> {paymentMethod === "pix" ? "Pix" : "Dinheiro"}</p>
              </div>
              <a href={whatsappMessage()} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-5 w-5" />
                  Enviar confirmação via WhatsApp
                </Button>
              </a>
              <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <WhatsAppButton />
    </main>
  );
}
