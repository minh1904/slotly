export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:flex-none lg:px-16">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
      <div className="relative hidden flex-1 bg-gradient-to-br from-primary/20 via-primary/10 to-background lg:block" />
    </div>
  );
}
