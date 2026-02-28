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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, Calendar as CalendarIcon, DollarSign, UserPlus, Home, Settings, Clock, Ban, Trash2, KeyRound, X, Shield, MessageCircle, Pencil } from "lucide-react";
import { EditAppointmentModal } from "@/components/EditAppointmentModal";
import { cn } from "@/lib/utils";
import { useBusinessName } from "@/hooks/useBusinessName";
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");
  const { businessName } = useBusinessName();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (!roles || roles.length === 0) {
        toast.error("Sem permissão de administrador.");
        navigate("/admin-login");
        return;
      }
      const userRole = roles[0].role;
      if (userRole === "super_admin") {
        setIsSuperAdmin(true);
      }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (businessName) setBusinessNameInput(businessName);
  }, [businessName]);

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

  const { data: adminUsers, refetch: refetchAdminUsers } = useQuery({
    queryKey: ["admin-users"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-admin-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "list" }),
        }
      );
      const result = await res.json();
      return result.users || [];
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
      refetchAdminUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    }
    setCreatingUser(false);
  };

  const handleUpdatePassword = async (userId: string) => {
    if (!newUserPassword || newUserPassword.length < 6) {
      toast.error("Senha mínima de 6 caracteres.");
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-admin-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "update_password", user_id: userId, password: newUserPassword }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Senha atualizada!");
      setEditingPasswordId(null);
      setNewUserPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Excluir a conta de ${email}? Esta ação não pode ser desfeita.`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-admin-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "delete", user_id: userId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Usuário excluído!");
      refetchAdminUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveBusinessName = async () => {
    if (!businessNameInput.trim()) {
      toast.error("Nome do estabelecimento não pode ser vazio.");
      return;
    }
    try {
      const { error } = await supabase
        .from("business_settings" as any)
        .update({ value: businessNameInput.trim() } as any)
        .eq("key", "business_name");
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["business-name"] });
      toast.success("Nome atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filtered appointments by date
  const filteredAppointments = filterDate
    ? appointments?.filter((a) => a.appointment_date === format(filterDate, "yyyy-MM-dd"))
    : appointments;

  const formatPhoneForWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const buildReminderUrl = (a: Appointment) => {
    const phone = formatPhoneForWhatsApp(a.client_phone);
    const time = a.appointment_time.slice(0, 5);
    const service = a.services?.name || "corte";
    const msg = `_Olá, ${a.client_name}! Passando para lembrar do seu agendamento de 💇🏽‍♂️ ${service}_ *hoje às ${time}*⌚ -> 💈 _${businessName}_ 💈. *Te aguardamos* !`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTotal = appointments?.filter((a) => a.appointment_date === todayStr && a.status !== "cancelado").reduce((sum, a) => sum + Number(a.price), 0) || 0;
  const todayCount = appointments?.filter((a) => a.appointment_date === todayStr && a.status !== "cancelado").length || 0;
  const monthTotal = appointments?.filter((a) => a.appointment_date.startsWith(format(new Date(), "yyyy-MM")) && a.status !== "cancelado").reduce((sum, a) => sum + Number(a.price), 0) || 0;
  const totalGeral = appointments?.filter((a) => a.status !== "cancelado").reduce((sum, a) => sum + Number(a.price), 0) || 0;

  if (isAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Verificando acesso...</div>;
  }

  const tabCount = isSuperAdmin ? 5 : 4;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">{businessName}</p>
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
          <TabsList className={cn("mb-6 grid w-full", tabCount === 5 ? "grid-cols-5" : "grid-cols-4")}>
            <TabsTrigger value="dashboard">Agendamentos</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="team">Equipe</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="settings">Configurações</TabsTrigger>}
            {!isSuperAdmin && <TabsTrigger value="team" disabled>Equipe</TabsTrigger>}
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
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-primary">Agendamentos</CardTitle>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("gap-2", filterDate && "border-primary text-primary")}>
                          <CalendarIcon className="h-4 w-4" />
                          {filterDate ? format(filterDate, "dd/MM/yyyy") : "Filtrar por data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={filterDate}
                          onSelect={setFilterDate}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {filterDate && (
                      <Button variant="ghost" size="sm" onClick={() => setFilterDate(undefined)} className="gap-1 text-muted-foreground">
                        <X className="h-4 w-4" /> Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : filteredAppointments && filteredAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum agendamento {filterDate ? "nesta data" : "encontrado"}.</p>
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
                          <TableHead className="text-primary w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments?.map((a) => (
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
                            <TableCell className="flex gap-1">
                              <a
                                href={buildReminderUrl(a)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Enviar lembrete via WhatsApp"
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingAppointment(a)}
                                className="h-8 w-8 text-primary hover:text-primary/80"
                                title="Editar serviços"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
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
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Settings className="h-5 w-5" /> Turnos de Trabalho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scheduleConfig?.map((day) => (
                    <div key={day.id} className="rounded-lg border border-border bg-secondary p-3 space-y-2">
                      <div className="flex items-center gap-3">
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
                      {day.is_open && (
                        <div className="flex items-center gap-2 pl-12">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Pausa:</span>
                          <Input
                            type="time"
                            value={(day as any).break_start?.slice(0, 5) || ""}
                            onChange={(e) =>
                              updateSchedule.mutate({ id: day.id, updates: { break_start: e.target.value || null } })
                            }
                            placeholder="Início"
                            className="w-28 border-border bg-background text-sm"
                          />
                          <span className="text-muted-foreground text-xs">até</span>
                          <Input
                            type="time"
                            value={(day as any).break_end?.slice(0, 5) || ""}
                            onChange={(e) =>
                              updateSchedule.mutate({ id: day.id, updates: { break_end: e.target.value || null } })
                            }
                            placeholder="Fim"
                            className="w-28 border-border bg-background text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

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

          {/* ─── TAB: Team (Super Admin only) ─── */}
          <TabsContent value="team">
            {!isSuperAdmin ? (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Apenas o Super Admin pode gerenciar a equipe.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Create user form */}
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

                {/* List admin users */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Settings className="h-5 w-5" /> Barbeiros Cadastrados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!adminUsers || adminUsers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhum barbeiro cadastrado ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {adminUsers.map((u: any) => (
                          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary p-4">
                            <div className="flex-1 min-w-[150px]">
                              <p className="font-medium text-foreground">{u.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Criado em {format(new Date(u.created_at), "dd/MM/yyyy")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {editingPasswordId === u.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="password"
                                    placeholder="Nova senha"
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    className="w-36"
                                    minLength={6}
                                  />
                                  <Button size="sm" onClick={() => handleUpdatePassword(u.id)}>Salvar</Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingPasswordId(null); setNewUserPassword(""); }}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => setEditingPasswordId(u.id)} className="gap-1">
                                  <KeyRound className="h-3 w-3" /> Senha
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ─── TAB: Settings (Super Admin only) ─── */}
          {isSuperAdmin && (
            <TabsContent value="settings">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Shield className="h-5 w-5" /> Configurações Globais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Altere o nome do estabelecimento. Ele será exibido em todo o site e no painel.
                  </p>
                  <div className="max-w-sm space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Nome do Estabelecimento</label>
                      <Input
                        value={businessNameInput}
                        onChange={(e) => setBusinessNameInput(e.target.value)}
                        placeholder="Ex: Barbearia Premium"
                      />
                    </div>
                    <Button onClick={handleSaveBusinessName} className="gap-2">
                      <Settings className="h-4 w-4" />
                      Salvar Nome
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <EditAppointmentModal
        open={!!editingAppointment}
        onOpenChange={(open) => { if (!open) setEditingAppointment(null); }}
        appointment={editingAppointment}
      />
    </main>
  );
}
