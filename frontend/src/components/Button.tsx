import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative w-full flex justify-center items-center py-4 px-6 border text-lg font-bold rounded-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all min-h-[56px]";
  
  const variants = {
    primary: "border-transparent text-white bg-[#2E7D32] hover:bg-[#1B5E20] focus:ring-[#2E7D32] shadow-md",
    secondary: "border-transparent text-gray-900 dark:text-gray-100 bg-[#81C784] hover:bg-[#66BB6A] focus:ring-[#81C784] shadow-md",
    danger: "border-transparent text-white bg-[#D32F2F] hover:bg-[#C62828] focus:ring-[#D32F2F] shadow-md",
    outline: "border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800/50 backdrop-blur-md hover:bg-white dark:bg-gray-800/80 focus:ring-gray-500 font-semibold"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
