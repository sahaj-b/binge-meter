import { useEffect, useRef, useState } from "react";
import { TrackedSites } from "./TrackedSites";
import { OverlaySettings } from "./OverlaySettings";
import { OverlayStyles } from "./OverlayStyles";
import { Exceptions } from "./Exceptions";
import { OverlayUI } from "@/core/content/overlay";
import { useStore } from "./state";
import { AIClassification } from "./AIClassification";

const NAV_ITEMS = [
  { id: "ai", title: "AI Classification" },
  { id: "site-tracking", title: "Site Tracking" },
  { id: "overlay", title: "Overlay" },
];

function SettingsNav({ activeId }: { activeId: string }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <nav className="text-nowrap sticky top-1/2 -translate-y-1/2">
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

export default function Settings() {
  const fetchSettings = useStore((state) => state.fetchSettings);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const updateConfig = useStore((state) => state.updateConfig);
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);
  const observer = useRef<IntersectionObserver | null>(null);
  console.log("loading", loading);

  useEffect(() => {
    const hostname = window.location.hostname;
    const overlay = new OverlayUI(
      document.body,
      hostname,
      // callback functions to keep the state in sync after drag/resize actions
      // took me hours to debug. AAAAAAAAAAA
      (pos) => updateConfig({ positions: { [hostname]: pos } }),
      (size) => updateConfig({ sizes: { [hostname]: size } }),
    );
    window.addEventListener("focus", fetchSettings);
    fetchSettings();

    const handleStateChange = (state: ReturnType<typeof useStore.getState>) => {
      if (!state.overlayConfig) return;
      overlay.create(state.overlayConfig).then(() => {
        overlay.update(state.dummyTime, true, state.overlayConfig!);
      });
    };

    handleStateChange(useStore.getState());
    const unsubscribe = useStore.subscribe(handleStateChange);

    return () => {
      unsubscribe();
      overlay.destroy();
      window.removeEventListener("focus", fetchSettings);
    };
  }, [fetchSettings, updateConfig]);

  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      }
    };

    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: "-30% 0% -70% 0%",
    });

    const elements = NAV_ITEMS.map(({ id }) =>
      document.getElementById(id),
    ).filter((el) => el);
    for (const el of elements) {
      observer.current?.observe(el!);
    }

    return () => observer.current?.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-10">
      <div className="flex justify-start space-x-24">
        <div className="relative hidden lg:block">
          <SettingsNav activeId={activeId} />
        </div>
        <div className="space-y-8 w-full max-w-[60rem]">
          <div className="mb-8 flex items-center justify-between ">
            <h1 className="text-2xl font-bold">Binge Meter Settings</h1>
          </div>
          <div id="ai" className="scroll-mt-20 space-y-8">
            <AIClassification />
          </div>
          <div id="site-tracking" className="scroll-mt-20 space-y-8">
            <TrackedSites />
            <Exceptions />
          </div>
          <div id="overlay" className="scroll-mt-20 space-y-8">
            <OverlaySettings />
            <OverlayStyles />
          </div>
        </div>
      </div>
    </div>
  );
}
