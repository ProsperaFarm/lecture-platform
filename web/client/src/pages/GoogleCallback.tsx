import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GoogleCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const googleCallback = trpc.auth.googleCallback.useMutation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      // Get code from URL query params
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        setError(`Erro de autenticação: ${errorParam}`);
        setTimeout(() => setLocation("/login"), 3000);
        return;
      }

      if (!code) {
        setError("Código de autorização não encontrado");
        setTimeout(() => setLocation("/login"), 3000);
        return;
      }

      try {
        // Call backend to exchange code for session
        await googleCallback.mutateAsync({ code });
        
        // Redirect to home on success
        setLocation("/");
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setError(err.message || "Erro ao processar autenticação");
        setTimeout(() => setLocation("/login"), 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Autenticação</AlertTitle>
            <AlertDescription>
              {error}
              <br />
              <span className="text-sm">Redirecionando para o login...</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Autenticando...</h2>
        <p className="text-gray-600">
          Processando seu login com Google
        </p>
      </div>
    </div>
  );
}
