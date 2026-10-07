import type { ActivityTotal } from "@/lib/data/pomodoro";
import { activityTotalRows } from "@/lib/pomodoro/stats";

/** All-time number of Pomodoros per activity, as a plain table (A-25). */
export function ActivityTotals({ totals }: { totals: ActivityTotal[] }) {
  const rows = activityTotalRows(totals);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Totals per activity</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pomodoros recorded yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">
                Activity
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Pomodoros
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <th scope="row" className="py-2 pr-4 text-left font-normal break-words">
                  {row.name}
                  {row.removed && (
                    <span className="text-muted-foreground"> (removed)</span>
                  )}
                </th>
                <td className="py-2 text-right tabular-nums">{row.count}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <th scope="row" className="py-2 pr-4 text-left">
                Total
              </th>
              <td className="py-2 text-right tabular-nums">{total}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
