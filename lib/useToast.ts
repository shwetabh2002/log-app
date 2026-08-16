import { useCallback, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastState = { text: string; tone: ToastTone };

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((text: string, tone: ToastTone = 'info') => {
    setToast({ text, tone });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, notify, dismiss };
}
