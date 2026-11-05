import { LEVEL_LABELS, signalText, type ClientStatus } from '../../lib/coach/clientStatus';

const COLORS = {
  RED: 'var(--color-danger)',
  AMBER: 'var(--color-warning)',
  GREEN: 'var(--color-success)',
} as const;

/** The traffic light for one client: a coloured dot with its label, the reasons and pending replies. */
export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const details = status.signals.map(signalText);
  if (status.pendingReplies > 0) {
    details.push(
      status.pendingReplies === 1
        ? '1 check-in por responder'
        : `${status.pendingReplies} check-ins por responder`,
    );
  }
  return (
    <div className="text-sm">
      <span
        className="inline-flex items-center gap-1.5 font-semibold"
        style={{ color: COLORS[status.level] }}
      >
        <span
          aria-hidden
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: COLORS[status.level] }}
        />
        {LEVEL_LABELS[status.level]}
      </span>
      {details.length > 0 && (
        <span style={{ color: 'var(--text-secondary)' }}> · {details.join(' · ')}</span>
      )}
    </div>
  );
}
