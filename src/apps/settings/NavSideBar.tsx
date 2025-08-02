export const NAV_ITEMS = [
  { id: "ai", title: "AI Classification" },
  { id: "site-tracking", title: "Site Tracking" },
  { id: "blocking", title: "Blocking" },
  { id: "overlay", title: "Overlay" },
  { id: "misc", title: "Misc" },
];

export default function NavSideBar({ activeId }: { activeId: string }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <nav className="sticky top-1/2 -translate-y-1/2 text-nowrap">
      <ul className="space-y-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollTo(item.id)}
              className={
                "w-full px-3 py-2 text-left text-sm font-medium " +
                (activeId === item.id
                  ? "text-primary hover:text-primary/80"
                  : "text-foreground/70 hover:text-foreground")
              }
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
