import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightElement, className = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = props.value !== undefined ? String(props.value).length > 0 : false;
    const lifted = focused || hasValue;

    return (
      <div className="relative">
        <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
          focused
            ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'ring-1 ring-white/10'
        } ${error ? 'ring-2 ring-red-500/50' : ''}`}>
          {/* Floating label */}
          <label className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
            lifted
              ? 'top-2 text-xs text-emerald-400'
              : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
          }`}>
            {label}
          </label>

          <input
            ref={ref}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`
              w-full bg-white/5 text-slate-100 pt-6 pb-2 px-4
              focus:outline-none placeholder-transparent
              text-sm ${rightElement ? 'pr-12' : ''} ${className}
            `}
            placeholder={label}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1 text-xs text-red-400 px-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
