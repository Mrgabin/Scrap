import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    return window.innerWidth < breakpoint || userAgentMobile;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(window.innerWidth < breakpoint || userAgentMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
