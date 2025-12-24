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
import { Loader2, Mail, Ban, CheckCircle, XCircle, Shield, User, Crown, UserMinus } from "lucide-react";
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

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      toast.success("Role do usuário atualizada com sucesso");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar role: ${error.message}`);
    },
  });

  const addUserMutation = trpc.admin.addUser.useMutation({
    onSuccess: (data) => {
      utils.admin.getAllUsers.invalidate();
      if (data.emailError) {
        toast.warning("Usuário adicionado, mas houve erro ao enviar email");
      } else {
        toast.success(data.message);
      }
      setNewUserName("");
      setNewUserEmail("");
      setShowAddUserDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar usuário: ${error.message}`);
    },
  });

  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null } | null>(null);
  const [action, setAction] = useState<"authorize" | "block" | "promoteAdmin" | "demoteAdmin" | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

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

  const handlePromoteAdmin = (user: typeof users[0]) => {
    setSelectedUser({ id: user.id, name: user.name });
    setAction("promoteAdmin");
    setShowConfirmDialog(true);
  };

  const handleDemoteAdmin = (user: typeof users[0]) => {
    setSelectedUser({ id: user.id, name: user.name });
    setAction("demoteAdmin");
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
    } else if (action === "promoteAdmin") {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: "admin",
      });
    } else if (action === "demoteAdmin") {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: "user",
      });
    }

    setShowConfirmDialog(false);
    setSelectedUser(null);
    setAction(null);
  };

  const handleAddUser = (sendInvite: boolean) => {
    if (!newUserName || newUserName.trim() === "") {
      toast.error("Por favor, insira o nome do usuário");
      return;
    }

    if (!newUserEmail || !newUserEmail.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    addUserMutation.mutate({
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      sendInvite: sendInvite,
    });
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
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <User className="w-4 h-4" />
                Incluir usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Incluir Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário à plataforma. Você pode optar por enviar um convite por email ou apenas adicionar o usuário.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nome completo"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddUserDialog(false);
                    setNewUserName("");
                    setNewUserEmail("");
                  }}
                  disabled={addUserMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAddUser(false)}
                  disabled={addUserMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {addUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    "Apenas adicionar"
                  )}
                </Button>
                <Button
                  onClick={() => handleAddUser(true)}
                  disabled={addUserMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {addUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar convite e adicionar
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
                        {user.role !== "admin" && user.firstAccess && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromoteAdmin(user)}
                            disabled={updateRoleMutation.isPending}
                            className="gap-1 text-primary hover:text-primary"
                          >
                            <Crown className="w-3 h-3" />
                            Tornar Admin
                          </Button>
                        )}
                        {user.role === "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDemoteAdmin(user)}
                            disabled={updateRoleMutation.isPending}
                            className="gap-1 text-orange-600 hover:text-orange-600"
                          >
                            <UserMinus className="w-3 h-3" />
                            Remover Admin
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
                {action === "authorize" && "Autorizar Usuário"}
                {action === "block" && "Bloquear Usuário"}
                {action === "promoteAdmin" && "Promover a Administrador"}
                {action === "demoteAdmin" && "Remover Permissões de Administrador"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {action === "authorize" && (
                  <>
                    Tem certeza que deseja autorizar o usuário <strong>{selectedUser?.name}</strong>?
                    Ele poderá acessar a plataforma.
                  </>
                )}
                {action === "block" && (
                  <>
                    Tem certeza que deseja bloquear o usuário <strong>{selectedUser?.name}</strong>?
                    Ele não poderá mais acessar a plataforma.
                  </>
                )}
                {action === "promoteAdmin" && (
                  <>
                    Tem certeza que deseja promover <strong>{selectedUser?.name}</strong> a administrador?
                    Ele terá acesso completo à área administrativa e poderá gerenciar outros usuários.
                  </>
                )}
                {action === "demoteAdmin" && (
                  <>
                    Tem certeza que deseja remover as permissões de administrador de <strong>{selectedUser?.name}</strong>?
                    Ele perderá o acesso à área administrativa.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                disabled={updateAuthMutation.isPending || updateRoleMutation.isPending}
                className={
                  action === "block" || action === "demoteAdmin"
                    ? "bg-destructive hover:bg-destructive/90 gap-2"
                    : "gap-2"
                }
              >
                {(updateAuthMutation.isPending || updateRoleMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : action === "authorize" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Autorizar
                  </>
                ) : action === "block" ? (
                  <>
                    <Ban className="w-4 h-4" />
                    Bloquear
                  </>
                ) : action === "promoteAdmin" ? (
                  <>
                    <Crown className="w-4 h-4" />
                    Promover
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Remover Admin
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

