/** The number of Pomodoros completed on the user's local day. */
export function TodaySummary({ count }: { count: number }) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Today:{" "}
      <span className="font-medium text-foreground">
        {count} {count === 1 ? "pomodoro" : "pomodoros"}
      </span>
    </p>
  );
}
