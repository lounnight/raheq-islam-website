export function BasmalaSvg({ color = '#ffffff' }: { color?: string }) {
  return (
    <img
      src="/bismillah.svg"
      alt="بسم الله الرحمن الرحيم"
      className="mushaf-basmala-image inline-block h-[1.35em] w-auto align-middle opacity-[0.92]"
      style={{ color, marginBottom: '20px' }}
      width={220}
      height={45}
      loading="lazy"
      decoding="async"
    />
  )
}
