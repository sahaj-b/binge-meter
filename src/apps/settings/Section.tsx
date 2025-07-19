export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card/30">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
