import { useEffect, useRef } from 'react';
import katex from 'katex';

interface FormulaDisplayProps {
  tex: string;
  displayMode?: boolean;
  className?: string;
}

export function FormulaDisplay({ tex, displayMode = false, className = '' }: FormulaDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, {
        displayMode,
        throwOnError: false,
        trust: true,
      });
    }
  }, [tex, displayMode]);

  return <div ref={ref} className={className} />;
}
