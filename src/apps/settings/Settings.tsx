import { useEffect, useState } from "react";
import { TrackedSites } from "./TrackedSites";
import { OverlaySettings } from "./OverlaySettings";
import { OverlayStyles } from "./OverlayStyles";
import { Exceptions } from "./Exceptions";
import { OverlayUI } from "@/core/content/overlay";
import { useStore } from "./store";
import { AIClassification } from "./AIClassification";
import { SettingsIcon } from "lucide-react";
import { MiscSettings } from "./MiscSettings";
import { BlockingSettings } from "./BlockingSection";
import { Underline } from "@lib/utils";

const NAV_ITEMS = [
  { id: "ai", title: "AI Classification" },
  { id: "site-tracking", title: "Site Tracking" },
  { id: "blocking", title: "Blocking" },
  { id: "overlay", title: "Overlay" },
  { id: "misc", title: "Misc" },
];

function SettingsNav({ activeId }: { activeId: string }) {
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

export default function Settings() {
  const fetchSettings = useStore((state) => state.fetchSettings);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const updateConfig = useStore((state) => state.updateConfig);
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);
  // const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let overlay: OverlayUI | null = null;
    const hostname = window.location.hostname;

    const getOverlayPosition = () => {
      const headerElement = document.getElementById("overlay-styles-header");
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        return { left: "50%", top: `${rect.top + window.scrollY}px` };
      }
      return { left: "50%", top: "20px" };
    };

    setTimeout(() => {
      overlay = new OverlayUI(
        document.body,
        hostname,
        // callback functions to keep the state in sync after drag/resize actions
        // took me hours to debug. AAAAAAAAAAA
        (pos) => updateConfig({ positions: { [hostname]: pos } }),
        (size) => updateConfig({ sizes: { [hostname]: size } }),
        true,
        getOverlayPosition(),
      );
      handleOverlayStateChange(useStore.getState());
    }, 500);

    const handleOverlayStateChange = (
      state: ReturnType<typeof useStore.getState>,
    ) => {
      if (!state.overlayConfig) return;
      overlay?.create(state.overlayConfig).then(() => {
        overlay?.update(state.dummyTime, true, state.overlayConfig!);
      });
    };

    handleOverlayStateChange(useStore.getState());
    const unsubscribe = useStore.subscribe(handleOverlayStateChange);

    window.addEventListener("focus", fetchSettings);
    fetchSettings();

    return () => {
      unsubscribe();
      overlay?.destroy();
      window.removeEventListener("focus", fetchSettings);
    };
  }, [fetchSettings, updateConfig]);

  useEffect(() => {
    if (loading) return;

    const sections = NAV_ITEMS.map(({ id }) =>
      document.getElementById(id),
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const isAtBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 50;
        if (isAtBottom) {
          const lastSectionId = NAV_ITEMS[NAV_ITEMS.length - 1].id;
          setActiveId(lastSectionId);
          return;
        }

        const screenTop = window.innerHeight * 0.3;
        const screenBottom = window.innerHeight * 0.7;
        let currentSectionId: string | null = null;

        for (const section of sections) {
          const rect = section.getBoundingClientRect();
          if (rect.top < screenBottom && rect.bottom > screenTop) {
            currentSectionId = section.id;
            break;
          }
        }

        if (currentSectionId) {
          setActiveId((prevId) => {
            if (currentSectionId && currentSectionId !== prevId) {
              return currentSectionId;
            }
            return prevId;
          });
        }
      }, 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loading]);

  // not using IntersectionObserver coz FUCK YOU FIREFOX. doesnt work on FF no matter what I try
  // useEffect(() => {
  //   const handleObserver = (entries: IntersectionObserverEntry[]) => {
  //     console.log("--- Observer Fired ---");
  //     for (const entry of entries) {
  //       console.log({
  //         id: entry.target.id,
  //         isIntersecting: entry.isIntersecting,
  //         ratio: entry.intersectionRatio,
  //       });
  //
  //       if (entry.isIntersecting) {
  //         setActiveId(entry.target.id);
  //       }
  //     }
  //   };
  //
  //   observer.current = new IntersectionObserver(handleObserver, {
  //     // rootMargin: "-30% 0% -70% 0%",
  //     root: null,
  //     rootMargin: "0px",
  //     threshold: 0,
  //   });
  //
  //   const elements = NAV_ITEMS.map(({ id }) =>
  //     document.getElementById(id),
  //   ).filter((el) => el);
  //   for (const el of elements) {
  //     observer.current?.observe(el!);
  //   }
  //
  //   return () => observer.current?.disconnect();
  // }, []);

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
        <div className="w-full max-w-[60rem] space-y-8">
          <h1 className="flex items-center justify-center text-center text-3xl font-bold tracking-wide">
            <SettingsIcon className="mr-2 text-muted-foreground" /> Binge Meter
            <Underline text="Settings" />
          </h1>
          <div id="ai" className="scroll-mt-20 space-y-8">
            <AIClassification />
          </div>
          <div id="site-tracking" className="scroll-mt-20 space-y-8">
            <TrackedSites />
            <Exceptions />
          </div>
          <div id="blocking" className="scroll-mt-20 space-y-8">
            <BlockingSettings />
          </div>
          <div id="overlay" className="scroll-mt-20 space-y-8">
            <OverlaySettings />
            <OverlayStyles />
          </div>
          <div id="misc" className="scroll-mt-20 space-y-8">
            <MiscSettings />
          </div>
        </div>
      </div>
    </div>
  );
}
