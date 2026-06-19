/* Fallback affiché pendant l'hydratation initiale lorsque la route
   active est chargée en lazy. Requis par React Router v7 dès qu'une
   route enfant utilise `lazy`. */
export function RouteHydrateFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#FFF7ED]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-[3px] border-[#E11D2E]/20 border-t-[#E11D2E] animate-spin"
          aria-hidden
        />
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          Chargement…
        </p>
      </div>
    </div>
  );
}
