export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f9f4ea] via-[#f8f5ef] to-white">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_12%_18%,rgba(214,192,150,0.12),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(190,170,130,0.08),transparent_30%),radial-gradient(circle_at_28%_80%,rgba(200,180,140,0.08),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-40%] h-[52%] bg-gradient-to-t from-[#d6c19a]/18 via-transparent to-transparent blur-3xl" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
