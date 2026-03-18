interface InterpretationBoxProps {
  variant: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
}

const VARIANT_STYLES = {
  info: 'bg-primary-50 border-primary-200 text-primary-900',
  warning: 'bg-warn-bg border-warn/30 text-amber-900',
  danger: 'bg-danger-bg border-danger/30 text-red-900',
  success: 'bg-safe-bg border-safe/30 text-green-900',
};

export function InterpretationBox({ variant, title, children }: InterpretationBoxProps) {
  return (
    <div className={`rounded-lg border p-4 ${VARIANT_STYLES[variant]}`}>
      {title && (
        <div className="font-semibold text-sm mb-1">{title}</div>
      )}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
