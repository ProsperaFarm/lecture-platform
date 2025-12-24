import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Ban, CheckCircle, XCircle, Shield, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleLayout } from "@/components/SimpleLayout";
import { toast } from "sonner";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Nunca";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Check if user is admin
  const { data: currentUser, isLoading: authLoading } = trpc.auth.me.useQuery();

  const { data: users = [], isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery(
    undefined,
    { enabled: !!currentUser && currentUser.role === "admin" }
  );

  const updateAuthMutation = trpc.admin.updateUserAuthorization.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      toast.success("Usuário atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  const sendInviteMutation = trpc.admin.sendInvite.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      toast.success("Convite enviado com sucesso");
      setInviteEmail("");
      setShowInviteDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar convite: ${error.message}`);
    },
  });

  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null } | null>(null);
  const [action, setAction] = useState<"authorize" | "block" | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Redirect if not admin
  if (!authLoading && (!currentUser || currentUser.role !== "admin")) {
    setLocation("/");
    return null;
  }

  if (authLoading || usersLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SimpleLayout>
    );
  }

  const handleAuthorize = (user: typeof users[0]) => {
    setSelectedUser({ id: user.id, name: user.name });
    setAction("authorize");
    setShowConfirmDialog(true);
  };

  const handleBlock = (user: typeof users[0]) => {
    setSelectedUser({ id: user.id, name: user.name });
    setAction("block");
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (!selectedUser) return;

    if (action === "authorize") {
      updateAuthMutation.mutate({
        userId: selectedUser.id,
        authorized: true,
        blocked: false,
      });
    } else if (action === "block") {
      updateAuthMutation.mutate({
        userId: selectedUser.id,
        blocked: true,
        authorized: false,
      });
    }

    setShowConfirmDialog(false);
    setSelectedUser(null);
    setAction(null);
  };

  const handleSendInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    sendInviteMutation.mutate({ email: inviteEmail });
  };

  return (
    <SimpleLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Área Administrativa
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie usuários, autorizações e convites da plataforma
            </p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="w-4 h-4" />
                Enviar Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Convite</DialogTitle>
                <DialogDescription>
                  Envie um convite por email para autorizar um novo usuário a acessar a plataforma.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSendInvite} disabled={sendInviteMutation.isPending}>
                  {sendInviteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primeiro Acesso</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === "admin" ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">{user.name || "Sem nome"}</div>
                          {user.role === "admin" && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.blocked ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="w-3 h-3" />
                            Bloqueado
                          </Badge>
                        ) : user.authorized ? (
                          <Badge variant="default" className="gap-1 bg-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Autorizado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.firstAccess)}</TableCell>
                    <TableCell>{formatDate(user.lastSignedIn)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!user.authorized && !user.blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAuthorize(user)}
                            disabled={updateAuthMutation.isPending || user.role === "admin"}
                            className="gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Autorizar
                          </Button>
                        )}
                        {user.authorized && !user.blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlock(user)}
                            disabled={updateAuthMutation.isPending}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Ban className="w-3 h-3" />
                            Bloquear
                          </Button>
                        )}
                        {user.blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAuthorize(user)}
                            disabled={updateAuthMutation.isPending}
                            className="gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Desbloquear
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {action === "authorize" ? "Autorizar Usuário" : "Bloquear Usuário"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {action === "authorize" ? (
                  <>
                    Tem certeza que deseja autorizar o usuário <strong>{selectedUser?.name}</strong>?
                    Ele poderá acessar a plataforma.
                  </>
                ) : (
                  <>
                    Tem certeza que deseja bloquear o usuário <strong>{selectedUser?.name}</strong>?
                    Ele não poderá mais acessar a plataforma.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAction} className="gap-2">
                {action === "authorize" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Autorizar
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Bloquear
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SimpleLayout>
  );
}

