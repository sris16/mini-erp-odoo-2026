import { useState, useEffect, useRef } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

type DebouncedTextFieldProps = Omit<TextFieldProps, 'onChange'> & {
  onChange: (value: string) => void;
  debounceTime?: number;
  value: string;
};

export default function DebouncedTextField({
  value,
  onChange,
  debounceTime = 200,
  ...props
}: DebouncedTextFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external value changes (e.g., reset or clear from parent)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChangeRef.current(localValue);
      }
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [localValue, value, debounceTime]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}
