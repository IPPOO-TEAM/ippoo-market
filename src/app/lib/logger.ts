const isDev = typeof import.meta !== "undefined"
  && typeof import.meta.env !== "undefined"
  && import.meta.env.DEV === true;

export const logger = {
  debug: (...args: unknown[]) => { if (isDev) console.debug(...args); },
  info: (...args: unknown[]) => { if (isDev) console.info(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { console.error(...args); },
};
