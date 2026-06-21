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
  const [prevValue, setPrevValue] = useState(value);
  const onChangeRef = useRef(onChange);

  // Sync external value changes during render (recommended React pattern)
  if (value !== prevValue) {
    setLocalValue(value);
    setPrevValue(value);
  }

  // Update onChange ref inside useEffect
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
