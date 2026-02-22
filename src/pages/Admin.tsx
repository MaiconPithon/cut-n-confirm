import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, Calendar, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments"> & { services: { name: string } | null };

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      toast.success("Status atualizado!");
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const todayTotal = appointments
    ?.filter((a) => a.appointment_date === format(new Date(), "yyyy-MM-dd") && a.status !== "cancelado")
    .reduce((sum, a) => sum + Number(a.price), 0) || 0;

  const todayCount = appointments
    ?.filter((a) => a.appointment_date === format(new Date(), "yyyy-MM-dd") && a.status !== "cancelado")
    .length || 0;

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
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 pt-6">
              <Calendar className="h-8 w-8 text-primary" />
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
                          <Select
                            value={a.status}
                            onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}
                          >
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
