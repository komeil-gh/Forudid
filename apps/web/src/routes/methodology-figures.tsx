type Labels = readonly [string, string, string]

function Satellite() {
  return <g transform="translate(78 49) rotate(-18)" aria-hidden="true">
    <rect className="svg-fill-ink" x="-14" y="-11" width="28" height="22" rx="2" />
    <rect className="svg-line" x="-51" y="-10" width="31" height="20" />
    <rect className="svg-line" x="20" y="-10" width="31" height="20" />
    <path className="svg-faint" d="M-41-10v20M-30-10v20M30-10v20M41-10v20M-51 0h31M20 0h31" />
    <path className="svg-line" d="M0 11v13m-7 0h14" />
    <path className="svg-accent" d="M-8 29c4 5 12 5 16 0M-14 34c7 9 21 9 28 0" />
  </g>
}

function Target({ y, ghost = false }: { y: number, ghost?: boolean }) {
  return <g transform={`translate(171 ${y})`} aria-hidden="true" opacity={ghost ? .28 : 1}>
    <path className={ghost ? 'svg-faint svg-dash' : 'svg-line'} d="M-10 0v-14L0-23l10 9V0Z" />
    <path className={ghost ? 'svg-faint svg-dash' : 'svg-line'} d="M-3 0v-8h6V0" />
  </g>
}

function AcquisitionPanel({ second, label }: { second?: boolean, label: string }) {
  const suffix = second ? 'second' : 'first'
  const targetY = second ? 220 : 200
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 260 255" role="img" aria-label={label}>
      <defs><marker id={`${suffix}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path className="svg-fill-ink" d="M0 0 7 3.5 0 7Z" />
      </marker></defs>
      <path className="svg-faint svg-dash" d="M16 73Q93 9 244 47" />
      <Satellite />
      <text x="178" y="29">{second ? 't₀ + Δt' : 't₀'}</text>
      <path className="svg-line" d={`M91 77 167 ${targetY - 27}`} markerEnd={`url(#${suffix}-arrow)`} />
      <text x="118" y="130">{second ? 'R₂' : 'R₁'}</text>
      {second ? <>
        <path className="svg-faint svg-dash" d="M24 200H236" />
        <path className="svg-accent" d="M24 202c55 0 87 2 117 10s53 8 95 8" />
        <Target y={200} ghost /><Target y={220} />
        <path className="svg-warn" d="M208 198v23m-5-23h10m-10 23h10" />
        <text className="svg-text-warn" x="215" y="214">Δr</text>
      </> : <>
        <path className="svg-accent" d="M24 200H236" />
        <Target y={200} />
      </>}
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

function PhasePanel({ label }: { label: string }) {
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 260 255" role="img" aria-label={label}>
      <path className="svg-faint" d="M18 127H242" />
      <path className="svg-line" d="M24 127c13-38 26-38 39 0s26 38 39 0 26-38 39 0 26 38 39 0 26-38 39 0 25 34 35 8" />
      <path className="svg-accent" d="M24 151c13-38 26-38 39 0s26 38 39 0 26-38 39 0 26 38 39 0 26-38 39 0 25 34 35 8" />
      <path className="svg-faint svg-dash" d="M63 89v62" />
      <text x="29" y="82">R₁</text><text x="29" y="174">R₂</text>
      <path className="svg-warn" d="M218 122v24m-4-24h8m-8 24h8" />
      <text className="svg-text-warn" x="226" y="138">Δφ</text>
      <path className="svg-line" d="M63 66h39m-39-4v8m39-8v8" />
      <text x="79" y="57">λ</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

export function RepeatPassGeometry({ labels }: { labels: Labels }) {
  return <div className="method-figure-sequence">
    <AcquisitionPanel label={labels[0]} />
    <AcquisitionPanel second label={labels[1]} />
    <PhasePanel label={labels[2]} />
  </div>
}
