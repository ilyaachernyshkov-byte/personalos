import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="action-menu">
      <summary aria-label={label}>
        Действия <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div className="row-actions">{children}</div>
    </details>
  );
}
