import { formatHeight } from "@/lib/format";

interface TelemetryBarProps {
  height: number;
  blocksRemaining: number;
  status: string;
}

export function TelemetryBar({ height, blocksRemaining, status }: TelemetryBarProps) {
  return (
    <div className="mt-auto grid grid-cols-3 gap-6 border-t border-border pt-8 font-mono">
      <Stat label="CURRENT_BLOCK" value={formatHeight(height)} />
      <Stat label="BLOCKS_REMAINING" value={formatHeight(blocksRemaining)} />
      <Stat label="NETWORK_STATUS" value={status} accent />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="cursor-default">
      <div className="text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div
        className={`text-lg font-bold ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
