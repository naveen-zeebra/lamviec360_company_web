import Icon from "./Icon";
import Button from "./Button";

export default function ErrorState({ title, desc, onRetry, retryLabel = "Try again" }) {
  return (
    <div
      className="rounded-lg border border-dashed border-line bg-card px-6 py-14 text-center text-muted"
      role="alert"
    >
      <Icon name="alert-triangle" size={28} style={{ color: "var(--color-danger)", margin: "0 auto 12px" }} />
      <h3 className="mb-2 text-lg">{title}</h3>
      {desc && <p>{desc}</p>}
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
