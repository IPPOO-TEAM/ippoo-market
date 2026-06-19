import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type RefreshFn = () => Promise<void> | void;

type Ctx = {
  register: (fn: RefreshFn) => () => void;
  trigger: () => Promise<void>;
};

const RefreshCtx = createContext<Ctx | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const handlers = useRef(new Set<RefreshFn>());
  const [, force] = useState(0);

  const register = useCallback((fn: RefreshFn) => {
    handlers.current.add(fn);
    force((x) => x + 1);
    return () => { handlers.current.delete(fn); force((x) => x + 1); };
  }, []);

  const trigger = useCallback(async () => {
    const all = Array.from(handlers.current);
    await Promise.all(all.map((h) => Promise.resolve().then(h)));
  }, []);

  return <RefreshCtx.Provider value={{ register, trigger }}>{children}</RefreshCtx.Provider>;
}

export function useRefreshContext() {
  const c = useContext(RefreshCtx);
  if (!c) throw new Error("useRefreshContext must be inside RefreshProvider");
  return c;
}

export function useOnPullRefresh(fn: RefreshFn) {
  const { register } = useRefreshContext();
  useEffect(() => register(fn), [register, fn]);
}
