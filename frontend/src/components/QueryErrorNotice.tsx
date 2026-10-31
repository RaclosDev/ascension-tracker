export function QueryErrorNotice({ retry, pending }: { retry: () => void; pending: boolean }) {
  return (
    <div role="alert" className="p-4 mb-4 border rounded-lg">
      <p>No se han podido actualizar los datos. Comprueba tu conexión y vuelve a intentarlo.</p>
      <button type="button" className="btn btn-secondary mt-2" onClick={retry} disabled={pending}>
        {pending ? 'Reintentando…' : 'Reintentar'}
      </button>
    </div>
  );
}
