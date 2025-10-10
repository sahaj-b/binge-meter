export function Section({
  title,
  description,
  children,
  rightElement,
}: {
  title: string;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}) {
  if (!rightElement) {
    return (
      <div className="space-y-6 p-6 border rounded-lg bg-card/60">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/60">
      <div
        className="flex items-center justify-between"
        id="overlay-styles-header"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {rightElement}
      </div>
      {children}
    </div>
  );
}
