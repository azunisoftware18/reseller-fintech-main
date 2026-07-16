import { useEffect } from "react";

let lockCount = 0;

export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return;

    lockCount += 1;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      lockCount -= 1;

      if (lockCount === 0) {
        html.style.overflow = "";
        body.style.overflow = "";
        body.style.paddingRight = "";
      }
    };
  }, [active]);
}
