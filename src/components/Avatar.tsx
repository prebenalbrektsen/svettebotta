/** A person's round picture, or their initial on their colour when they have none. */
export function Avatar({ p, size = 32 }: { p: { id: number; name: string; color: string; avatar_v?: number | null }; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.44) };
  if (p.avatar_v) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/avatar/${p.id}?v=${p.avatar_v}`} alt="" className="shrink-0 rounded-full object-cover" style={style} />;
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ ...style, background: p.color }} aria-hidden="true">
      {p.name[0]}
    </span>
  );
}

