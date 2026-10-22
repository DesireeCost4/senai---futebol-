import './RequestState.css';
import type { ReactNode } from 'react';

type StateProps = {
  message?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  skeleton?: boolean;
};

type ErrorStateProps = StateProps & {
  onRetry?: () => void;
};

export function LoadingState({
  message = 'Carregando...',
  title,
  description,
  icon,
  skeleton = false,
}: StateProps) {
  if (skeleton) {
    return (
      <div className="request-state request-state--skeleton" role="status" aria-live="polite">
        <span className="request-state__skeleton-line request-state__skeleton-line--wide" />
        <span className="request-state__skeleton-line request-state__skeleton-line--medium" />
        <span className="request-state__skeleton-line request-state__skeleton-line--short" />
        <p>{description ?? message}</p>
      </div>
    );
  }

  return (
    <div className="request-state" role="status" aria-live="polite">
      {icon ?? <span className="request-state__spinner" aria-hidden="true" />}
      {title ? <strong>{title}</strong> : null}
      <p>{description ?? message}</p>
    </div>
  );
}

export function EmptyState({
  message = 'Nenhum registro encontrado.',
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: StateProps) {
  return (
    <div className="request-state" role="status">
      {icon ? <span className="request-state__icon">{icon}</span> : null}
      {title ? <strong>{title}</strong> : null}
      <p>{description ?? message}</p>
      {actionLabel && onAction ? (
        <button className="request-state__retry" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  title,
  description,
  icon,
  actionLabel = 'Tentar novamente',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="request-state request-state--error" role="alert">
      {icon ? <span className="request-state__icon">{icon}</span> : null}
      {title ? <strong>{title}</strong> : null}
      <p>{description ?? message}</p>
      {onRetry && (
        <button className="request-state__retry" type="button" onClick={onRetry}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
