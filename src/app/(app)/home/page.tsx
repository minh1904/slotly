export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2">
      <h1 className="font-semibold text-2xl">Welcome to Slotly</h1>
      <p className="text-muted-foreground">
        Your availability and bookings will show up here.
      </p>
    </div>
  );
}
