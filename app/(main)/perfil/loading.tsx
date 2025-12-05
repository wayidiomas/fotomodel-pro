import { Loader2 } from 'lucide-react';

export default function PerfilLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#fff] to-[#f7f4ef]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#20202a]" />
        <p className="font-inter text-sm text-gray-500">Carregando perfil...</p>
      </div>
    </div>
  );
}
