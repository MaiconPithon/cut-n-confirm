import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, Calendar as CalendarIcon, DollarSign, UserPlus, Home, Settings, Clock, Ban, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments"> & { services: { name: string } | null };

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  confirmado: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  finalizado: "bg-green-600/20 text-green-400 border-green-600/30",
  cancelado: "bg-red-600/20 text-red-400 border-red-600/30",
};

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (!roles || roles.length === 0) {
        toast.error("Sem permissão de administrador.");
        navigate("/admin-login");
        return;
      }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [navigate]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name)")
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const { data: scheduleConfig } = useQuery({
    queryKey: ["admin-schedule-config"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_config").select("*").order("day_of_week");
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: blockedSlots } = useQuery({
    queryKey: ["admin-blocked-slots"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .gte("blocked_date", format(new Date(), "yyyy-MM-dd"))
        .order("blocked_date");
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Status atualizado!");
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Agendamento excluído!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("schedule_config").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedule-config"] });
      toast.success("Agenda atualizada!");
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success("Serviço atualizado!");
    },
  });

  const blockDateMutation = useMutation({
    mutationFn: async () => {
      if (!blockDate) throw new Error("Selecione uma data");
      const { error } = await supabase.from("blocked_slots").insert({
        blocked_date: format(blockDate, "yyyy-MM-dd"),
        full_day: true,
        reason: blockReason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] });
      setBlockDate(undefined);
      setBlockReason("");
      toast.success("Data bloqueada!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-slots"] });
      toast.success("Bloqueio removido!");
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || newPassword.length < 6) {
      toast.error("Email e senha (mín. 6 caracteres) são obrigatórios.");
      return;
    }
    setCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email: newEmail, password: newPassword }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.message);
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    }
    setCreatingUser(false);
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTotal = appointments?.filter((a) => a.appointment_date === todayStr && a.status !== "cancelado").reduce((sum, a) => sum + Number(a.price), 0) || 0;
  const todayCount = appointments?.filter((a) => a.appointment_date === todayStr && a.status !== "cancelado").length || 0;
  const monthTotal = appointments?.filter((a) => a.appointment_date.startsWith(format(new Date(), "yyyy-MM")) && a.status !== "cancelado").reduce((sum, a) => sum + Number(a.price), 0) || 0;
  const totalGeral = appointments?.filter((a) => a.status !== "cancelado").reduce((sum, a) => sum + Number(a.price), 0) || 0;

  if (isAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Verificando acesso...</div>;
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Barbearia do Fal</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" /> Página Inicial
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Agendamentos</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
          </TabsList>

          {/* ─── TAB: Dashboard ─── */}
          <TabsContent value="dashboard">
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 pt-6">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{todayCount}</p>
                    <p className="text-xs text-muted-foreground">Agendamentos hoje</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 pt-6">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">R$ {todayTotal.toFixed(2).replace(".", ",")}</p>
                    <p className="text-xs text-muted-foreground">Faturamento hoje</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 pt-6">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">R$ {monthTotal.toFixed(2).replace(".", ",")}</p>
                    <p className="text-xs text-muted-foreground">Este mês</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 pt-6">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">R$ {totalGeral.toFixed(2).replace(".", ",")}</p>
                    <p className="text-xs text-muted-foreground">Total geral</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-primary">Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-primary">Data</TableHead>
                          <TableHead className="text-primary">Hora</TableHead>
                          <TableHead className="text-primary">Cliente</TableHead>
                          <TableHead className="text-primary">Telefone</TableHead>
                          <TableHead className="text-primary">Serviço</TableHead>
                          <TableHead className="text-primary">Valor</TableHead>
                          <TableHead className="text-primary">Pgto</TableHead>
                          <TableHead className="text-primary">Status</TableHead>
                          <TableHead className="text-primary w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments?.map((a) => (
                          <TableRow key={a.id} className="border-border">
                            <TableCell className="text-foreground">{format(new Date(a.appointment_date + "T12:00:00"), "dd/MM")}</TableCell>
                            <TableCell className="text-foreground">{a.appointment_time.slice(0, 5)}</TableCell>
                            <TableCell className="text-foreground">{a.client_name}</TableCell>
                            <TableCell className="text-foreground">{a.client_phone}</TableCell>
                            <TableCell className="text-foreground">{a.services?.name}</TableCell>
                            <TableCell className="text-primary font-semibold">R$ {Number(a.price).toFixed(2).replace(".", ",")}</TableCell>
                            <TableCell className="text-foreground capitalize">{a.payment_method}</TableCell>
                            <TableCell>
                              <Select value={a.status} onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}>
                                <SelectTrigger className="w-32 border-border">
                                  <SelectValue>
                                    <Badge className={statusColors[a.status] || ""}>{a.status}</Badge>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="confirmado">Confirmado</SelectItem>
                                  <SelectItem value="finalizado">Finalizado</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Excluir este agendamento?")) {
                                    deleteAppointment.mutate(a.id);
                                  }
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Schedule ─── */}
          <TabsContent value="schedule">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Turnos por dia */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Settings className="h-5 w-5" /> Turnos de Trabalho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scheduleConfig?.map((day) => (
                    <div key={day.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                      <Switch
                        checked={day.is_open}
                        onCheckedChange={(checked) =>
                          updateSchedule.mutate({ id: day.id, updates: { is_open: checked } })
                        }
                      />
                      <span className="w-24 text-sm font-medium text-foreground">{DAY_NAMES[day.day_of_week]}</span>
                      {day.is_open && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={day.open_time.slice(0, 5)}
                            onChange={(e) =>
                              updateSchedule.mutate({ id: day.id, updates: { open_time: e.target.value } })
                            }
                            className="w-28 border-border bg-background text-sm"
                          />
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={day.close_time.slice(0, 5)}
                            onChange={(e) =>
                              updateSchedule.mutate({ id: day.id, updates: { close_time: e.target.value } })
                            }
                            className="w-28 border-border bg-background text-sm"
                          />
                        </div>
                      )}
                      {!day.is_open && <span className="text-sm text-muted-foreground">Fechado</span>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Bloquear datas */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Ban className="h-5 w-5" /> Bloquear Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">Bloqueie datas para imprevistos, feriados ou folgas.</p>
                  <div className="flex justify-center mb-4">
                    <Calendar
                      mode="single"
                      selected={blockDate}
                      onSelect={setBlockDate}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </div>
                  {blockDate && (
                    <div className="space-y-3">
                      <Input
                        placeholder="Motivo (opcional)"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                      />
                      <Button
                        className="w-full gap-2"
                        onClick={() => blockDateMutation.mutate()}
                        disabled={blockDateMutation.isPending}
                      >
                        <Ban className="h-4 w-4" />
                        Bloquear {format(blockDate, "dd/MM/yyyy")}
                      </Button>
                    </div>
                  )}

                  {/* Blocked dates list */}
                  {blockedSlots && blockedSlots.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">Datas bloqueadas:</p>
                      {blockedSlots.map((b) => (
                        <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {format(new Date(b.blocked_date + "T12:00:00"), "dd/MM/yyyy")}
                            </span>
                            {b.reason && <span className="ml-2 text-xs text-muted-foreground">({b.reason})</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBlock.mutate(b.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── TAB: Services ─── */}
          <TabsContent value="services">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Clock className="h-5 w-5" /> Serviços, Duração e Intervalo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Defina o tempo de cada serviço e o intervalo (buffer) entre atendimentos.
                </p>
                <div className="space-y-3">
                  {services?.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary p-4">
                      <div className="flex-1 min-w-[120px]">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-sm text-primary font-semibold">
                          R$ {Number(s.price).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Duração:</label>
                        <Select
                          value={String((s as any).duration_minutes ?? 30)}
                          onValueChange={(v) =>
                            updateService.mutate({ id: s.id, updates: { duration_minutes: Number(v) } })
                          }
                        >
                          <SelectTrigger className="w-24 border-border bg-background text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[15, 20, 30, 40, 45, 60, 90, 120].map((m) => (
                              <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Intervalo:</label>
                        <Select
                          value={String((s as any).buffer_minutes ?? 5)}
                          onValueChange={(v) =>
                            updateService.mutate({ id: s.id, updates: { buffer_minutes: Number(v) } })
                          }
                        >
                          <SelectTrigger className="w-24 border-border bg-background text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 5, 10, 15, 20].map((m) => (
                              <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={s.active}
                          onCheckedChange={(checked) =>
                            updateService.mutate({ id: s.id, updates: { active: checked } })
                          }
                        />
                        <span className="text-xs text-muted-foreground">{s.active ? "Ativo" : "Inativo"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Team ─── */}
          <TabsContent value="team">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserPlus className="h-5 w-5" /> Cadastrar Barbeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Cadastre um novo barbeiro que terá acesso ao painel administrativo.
                </p>
                <form onSubmit={handleCreateUser} className="space-y-4 max-w-sm">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Email do barbeiro</label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="barbeiro@email.com" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Senha provisória (mín. 6 caracteres)</label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" required minLength={6} />
                  </div>
                  <Button type="submit" disabled={creatingUser} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {creatingUser ? "Criando..." : "Criar Conta de Barbeiro"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
