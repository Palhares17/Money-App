export function Calendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date | undefined;
  onSelectDate: (d: Date | undefined) => void;
}) {
  return (
    <input
      type="date"
      value={selectedDate ? selectedDate.toISOString().substring(0, 10) : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : undefined;
        onSelectDate(date);
      }}
      className="rounded-md border shadow-sm p-2"
    />
  );
}
