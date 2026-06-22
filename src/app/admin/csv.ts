type Cell = string | number | boolean | null | undefined;

export function downloadCSV(filename: string, rows: (Cell[] | Record<string, Cell>)[]) {
  let normalised: Cell[][];
  if (rows.length > 0 && !Array.isArray(rows[0])) {
    const keys = Object.keys(rows[0] as Record<string, Cell>);
    normalised = [keys, ...(rows as Record<string, Cell>[]).map((row) => keys.map((k) => row[k]))];
  } else {
    normalised = rows as Cell[][];
  }
  const csv = normalised
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
