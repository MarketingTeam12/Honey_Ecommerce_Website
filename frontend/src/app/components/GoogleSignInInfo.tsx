import { Info } from 'lucide-react';

export function GoogleSignInInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 mb-1">
            Sign up with Google
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            Click "Continue with Google" to choose your Google account. Your profile will be automatically created using your Google account information.
          </p>
        </div>
      </div>
    </div>
  );
}
