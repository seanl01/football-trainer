import { useEffect, useMemo, useState } from "react"

interface Breakpoints<T = React.ReactNode> {
  xs: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  xxl?: T
}

type BreakpointNames = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

// --breakpoint - sm: 40rem;
// --breakpoint - md: 48rem;
// --breakpoint - lg: 64rem;
// --breakpoint - xl: 80rem;
// --breakpoint - 2xl: 96rem;

export function Responsive(elements: Breakpoints<React.ReactNode>) {
  const [curBreakpoint, setCurBreakPoint] = useState<BreakpointNames>("xs")
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0);

  // We want to test each query that is presented, but resolve in order.
  const breakpoints = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const breakpointMap = new Map<BreakpointNames, string>([
      ["xxl", styles.getPropertyValue("--breakpoint-2xl")],
      ["xl", styles.getPropertyValue("--breakpoint-xl")],
      ["lg", styles.getPropertyValue("--breakpoint-lg")],
      ["md", styles.getPropertyValue("--breakpoint-md")],
      ["sm", styles.getPropertyValue("--breakpoint-sm")],
    ]);
    console.log(breakpointMap)

    return breakpointMap
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // start with smallest breakpoint
    let cur: BreakpointNames = "xs";

    for (const [breakpoint, value] of breakpoints.entries()) {
      // If smaller than breakpoint or element not even provided for that breakpoint, fall to previous
      if (window.matchMedia(`(min-width: ${value})`).matches && elements[breakpoint] !== undefined) {
        cur = breakpoint
        break
      }
    }
    setCurBreakPoint(cur)

  }, [width]);

  return elements[curBreakpoint]
}
