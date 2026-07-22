import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, type, className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-lg font-semibold text-[var(--text-color)]">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`block w-full rounded-2xl border ${error ? 'border-[#D32F2F]' : 'border-gray-300 dark:border-gray-600'} px-5 py-4 min-h-[56px] text-lg bg-white dark:bg-gray-800/70 backdrop-blur-sm text-[var(--text-color)] placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#2E7D32]/50 focus:border-[#2E7D32] transition-colors shadow-sm`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none focus:ring-2 focus:ring-[#2E7D32] rounded-r-2xl"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200" />
            ) : (
              <Eye className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-base font-medium text-[#D32F2F] mt-1 flex items-center"><span className="mr-1">⚠</span> {error}</p>}
    </div>
  );
};
