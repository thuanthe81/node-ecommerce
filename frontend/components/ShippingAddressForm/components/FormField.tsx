import React from 'react';
import { SvgExclamationCircle, SvgCheckCircleXXX } from '../../Svgs';

/**
 * Props for the FormField component
 */
interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Field name attribute */
  name: string;
  /** Field value */
  value: string;
  /** Validation error message */
  error?: string;
  /** Whether the field has been touched */
  touched: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Input type (text, tel, etc.) */
  type?: string;
  /** Maximum length for input */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional hint text */
  hint?: string;
  /** Custom styles for text transformation */
  style?: React.CSSProperties;
  /** Change event handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Blur event handler */
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * Reusable form field component with validation display
 *
 * Displays a labeled input field with real-time validation feedback,
 * including error messages and success indicators.
 */
export function FormField({
  label,
  name,
  value,
  error,
  touched,
  required = false,
  type = 'text',
  maxLength,
  placeholder,
  hint,
  style,
  onChange,
  onBlur,
}: FormFieldProps) {
  const getFieldClassName = () => {
    const baseClass =
      'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

    if (!touched) {
      return `${baseClass} border-gray-300`;
    }

    if (error) {
      return `${baseClass} border-red-500 bg-red-50`;
    }

    if (value?.trim()) {
      return `${baseClass} border-green-500 bg-green-50`;
    }

    return `${baseClass} border-gray-300`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className={getFieldClassName()}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        style={style}
      />
      {hint && !touched && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {touched && error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600 flex items-start"
          role="alert"
        >
          <SvgExclamationCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
          {error}
        </p>
      )}
      {touched && !error && value?.trim() && (
        <p className="mt-1 text-sm text-green-600 flex items-center">
          <SvgCheckCircleXXX className="w-4 h-4 mr-1" />
          {/* Translation key would be passed as prop in real usage */}
          Valid
        </p>
      )}
    </div>
  );
}