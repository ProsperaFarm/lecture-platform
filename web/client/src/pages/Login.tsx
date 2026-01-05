import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const { data: authUrl, isLoading: isLoadingUrl, error: authUrlError } = trpc.auth.getGoogleAuthUrl.useQuery();

  // Log auth URL status for debugging
  useEffect(() => {
    console.log('[Login] Auth URL status:', {
      isLoading: isLoadingUrl,
      hasAuthUrl: !!authUrl,
      authUrl: authUrl?.url,
      error: authUrlError
    });
  }, [authUrl, isLoadingUrl, authUrlError]);

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleGoogleLogin = () => {
    console.log('[Login] Google login button clicked');
    if (authUrl?.url) {
      console.log('[Login] Redirecting to:', authUrl.url);
      window.location.href = authUrl.url;
    } else {
      console.error('[Login] No auth URL available');
      alert('Erro: Não foi possível obter a URL de autenticação do Google. Verifique os logs do console e as variáveis de ambiente.');
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Prospera Academy</h1>
            <p className="text-gray-600">
              Acesse os cursos da Prospera Farm e transforme a gestão da sua propriedade
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Faça login para continuar</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoadingUrl || !authUrl}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            variant="outline"
          >
            {isLoadingUrl ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continuar com Google</span>
              </>
            )}
          </Button>

          {/* Error message */}
          {authUrlError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Erro de configuração:</strong> Não foi possível carregar a autenticação do Google. 
                Verifique as variáveis de ambiente no Vercel (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).
              </p>
            </div>
          )}

          {!isLoadingUrl && !authUrl && !authUrlError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Aviso:</strong> A URL de autenticação não foi carregada. 
                Verifique os logs do servidor para mais detalhes.
              </p>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Ao fazer login, você concorda com nossos{" "}
            <a href="#" className="text-green-600 hover:underline">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="#" className="text-green-600 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Precisa de ajuda?{" "}
            <a href="mailto:contato@prospera.farm" className="text-green-600 hover:underline font-medium">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
