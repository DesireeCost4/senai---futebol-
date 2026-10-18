import './RequestState.css';

type StateProps = {
  message?: string;
};

type ErrorStateProps = StateProps & {
  onRetry?: () => void;
};

export function LoadingState({ message = 'Carregando...' }: StateProps) {
  return (
    <div className="request-state" role="status" aria-live="polite">
      <span className="request-state__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'Nenhum registro encontrado.' }: StateProps) {
  return (
    <div className="request-state" role="status">
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="request-state request-state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="request-state__retry" type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}