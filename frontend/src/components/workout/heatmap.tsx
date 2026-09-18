import { useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import type { CompletedWorkout } from "@/lib/workout/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, getDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export function ActivityHeatmap({ history }: { history: CompletedWorkout[] }) {
  const mounted = useMounted();
  const [monthOffset, setMonthOffset] = useState(0);

  if (!mounted) return <div className="h-[200px]" />;

  const now = new Date();
  
  // We show 2 months: (offset) and (offset - 1)
  const monthsToDisplay = [
    startOfMonth(addMonths(now, monthOffset)),
    startOfMonth(addMonths(now, monthOffset - 1))
  ];

  // Prepare a fast lookup for volume per day
  const volumeByDay = new Map<string, number>();
  let maxVolume = 1;

  for (const w of history) {
    const d = new Date(w.finishedAt);
    const dateStr = format(d, "yyyy-MM-dd");
    const vol = w.exercises.reduce((sum, ex) => {
      return sum + ex.sets.filter(s => s.completed).reduce((sSum, s) => {
        const wt = Number(s.weight);
        const rp = Number(s.reps);
        return sSum + (Number.isFinite(wt) && Number.isFinite(rp) ? wt * rp : 0);
      }, 0);
    }, 0);
    
    const existing = volumeByDay.get(dateStr) || 0;
    volumeByDay.set(dateStr, existing + vol);
    if (existing + vol > maxVolume) maxVolume = existing + vol;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <button 
          onClick={() => setMonthOffset(prev => prev - 1)}
          style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span>{format(monthsToDisplay[1], "MMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}</span>
          <span style={{ color: "var(--text-muted)" }}>-</span>
          <span>{format(monthsToDisplay[0], "MMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}</span>
        </h4>
        <button 
          onClick={() => setMonthOffset(prev => prev + 1)}
          disabled={monthOffset >= 0}
          style={{ background: "transparent", border: "none", color: monthOffset >= 0 ? "var(--bg-glass-strong)" : "var(--text-secondary)", cursor: monthOffset >= 0 ? "not-allowed" : "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem" }}>
        {monthsToDisplay.map((displayMonth, index) => {
          const days = eachDayOfInterval({ start: displayMonth, end: endOfMonth(displayMonth) });
          const startOffset = (getDay(displayMonth) + 6) % 7; 
          
          return (
            <div key={index} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ textAlign: "center", fontSize: "0.65rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "capitalize" }}>
                {format(displayMonth, "MMMM yyyy", { locale: es })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "2px" }}>
                {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                  <div key={i} style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textAlign: "center", fontWeight: 600, marginBottom: "0.15rem" }}>
                    {d}
                  </div>
                ))}
                
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                
                {days.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const vol = volumeByDay.get(dateStr) || 0;
                  const t = vol / maxVolume;
                  
                  let opacity = 0.05;
                  if (vol > 0) {
                    if (t > 0.75) opacity = 1;
                    else if (t > 0.45) opacity = 0.75;
                    else if (t > 0.2) opacity = 0.5;
                    else opacity = 0.25;
                  }

                  const isTodayLocal = isSameDay(day, now);

                  return (
                    <div
                      key={dateStr}
                      title={`${format(day, "d MMM yyyy", { locale: es })}${vol ? ` · ${Math.round(vol)} kg` : ""}`}
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: "6px",
                        background: vol === 0 ? "var(--bg-secondary)" : `rgba(16, 185, 129, ${opacity})`,
                        border: isTodayLocal ? "1.5px solid var(--text-primary)" : "1px solid rgba(255,255,255,0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "default",
                        transition: "transform 0.1s"
                      }}
                      className="hover:scale-110"
                    >
                      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: vol > 0 ? (opacity > 0.5 ? "#fff" : "var(--text-primary)") : "var(--text-muted)" }}>
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
        <span>Menos</span>
        <div style={{ display: "flex", gap: "4px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--bg-secondary)" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.25)" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.5)" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.75)" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 1)" }} />
        </div>
        <span>Más</span>
      </div>
    </div>
  );
}
