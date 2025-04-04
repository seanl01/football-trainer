import { cva } from "class-variance-authority";
import { CircleCheck, CircleX } from "lucide-react";

const connectedCVA = cva("rounded-full p-2 ps-3 text-sm font-medium border mb-2 transition-all flex justify-between items-center", {
  variants: {
    state: {
      connected: ["text-accent-content", "dark:text-accent", "bg-accent", "dark:bg-accent/50", "border-accent-content/50", "dark:border-accent/50"],
      disconnected: ["text-error-content", "dark:text-error", "bg-error/50", "dark:bg-error-content", "border-error-content/50", "dark:border-error/50"]
    }
  }
})

export function Connected({ isConnected, className }: { isConnected: boolean, className?: string }) {
  return (
    <figure
      className={connectedCVA({ state: (isConnected ? "connected" : "disconnected"), className })}
    >
      {isConnected ? "Connected" : "Disconnected"}
      {isConnected ? <CircleCheck /> : <CircleX />}
    </figure>
  );
}
