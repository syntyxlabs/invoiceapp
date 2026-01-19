export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Syntyx Labs Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voice-powered invoicing for tradies
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
