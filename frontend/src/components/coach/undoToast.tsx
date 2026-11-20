import toast from 'react-hot-toast';

/** Confirms something was removed and gives a few seconds to put it back. */
export function undoToast(message: string, onUndo: () => void) {
  toast.success(
    (t) => (
      <span className="flex items-center gap-3">
        <span>{message}</span>
        <button
          type="button"
          className="text-sm font-bold underline"
          onClick={() => {
            toast.dismiss(t.id);
            onUndo();
          }}
        >
          Deshacer
        </button>
      </span>
    ),
    { duration: 8000 },
  );
}
