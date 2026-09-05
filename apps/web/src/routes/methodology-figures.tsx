type Labels = readonly [string, string, string]
type QualityLabels = readonly [string, string, string, string]

function Satellite({ x, y, rotate = 0 }: { x: number, y: number, rotate?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate})`} aria-hidden="true">
    <rect className="svg-fill-ink" x="-17" y="-14" width="34" height="28" rx="3" />
    <rect className="svg-line" x="-63" y="-13" width="40" height="26" />
    <rect className="svg-line" x="23" y="-13" width="40" height="26" />
    <path className="svg-faint" d="M-50-13v26M-36-13v26M36-13v26M50-13v26M-63 0h40M23 0h40" />
    <path className="svg-line" d="M0 14v15m-10 0h20M-6 20h12" />
    <path className="svg-accent" d="M-11 35c6 7 16 7 22 0M-18 41c10 12 26 12 36 0" />
  </g>
}

export function RepeatPassGeometry() {
  return <svg className="science-svg" viewBox="0 0 880 410" role="img" aria-labelledby="repeat-title repeat-desc">
    <title id="repeat-title">Repeat-pass InSAR geometry</title>
    <desc id="repeat-desc">Two coded satellites observe a moving ground point from repeated positions. Lines show the look direction, perpendicular baseline, and ground displacement.</desc>
    <defs>
      <marker id="repeat-arrow-navy" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path className="svg-fill-ink" d="M0 0 8 4 0 8z" /></marker>
      <marker id="repeat-arrow-rust" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path className="svg-fill-warn" d="M0 0 8 4 0 8z" /></marker>
    </defs>
    <path className="svg-faint svg-dash" d="M55 100Q440-55 825 100" markerEnd="url(#repeat-arrow-navy)" />
    <Satellite x={245} y={73} rotate={-13} />
    <Satellite x={535} y={46} rotate={-13} />
    <text x="209" y="30">t₀</text><text x="529" y="18">t₁</text>
    <path className="svg-accent" d="M245 116 515 305M535 89 548 327" />
    <path className="svg-faint svg-dash" d="M245 73 535 46" />
    <path className="svg-line" d="M245 73 513 302" markerEnd="url(#repeat-arrow-navy)" />
    <text x="388" y="172">R₀</text><text x="525" y="201">R₁</text><text x="382" y="43">B⊥</text>
    <path className="svg-fill-accent" d="M10 309C146 286 248 290 354 319S582 354 870 310V410H10Z" />
    <path className="svg-line" d="M10 309C146 286 248 290 354 319S582 354 870 310" />
    <path className="svg-faint svg-dash" d="M10 322C146 299 248 303 354 332S582 367 870 323" />
    <circle className="svg-fill-ink" cx="515" cy="305" r="6" />
    <circle className="svg-fill-warn" cx="548" cy="327" r="6" />
    <path className="svg-warn" d="M520 309 543 323" markerEnd="url(#repeat-arrow-rust)" />
    <text className="svg-text-warn" x="555" y="313">u</text>
    <path className="svg-faint svg-dash" d="M515 305 548 327" />
  </svg>
}

function SignalPanel({ label }: { label: string }) {
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 190" role="img" aria-label={label}>
      <path className="svg-faint" d="M18 95H235M18 28V164" />
      <path className="svg-line" d="M20 96C35 42 50 42 65 96s30 54 45 0 30-54 45 0 30 54 45 0 23-47 35-11" />
      <path className="svg-warn" d="M20 123C35 69 50 69 65 123s30 54 45 0 30-54 45 0 30 54 45 0 23-47 35-11" />
      <path className="svg-faint svg-dash" d="M65 43V123" />
      <text x="205" y="46">s₁</text><text className="svg-text-warn" x="205" y="138">s₂</text>
      <text x="108" y="181">Δφ</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

function PhasePanel({ label }: { label: string }) {
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 190" role="img" aria-label={label}>
      {[22, 36, 51, 67, 84].map((radius, index) => <ellipse key={radius} className={index % 2 ? 'svg-accent' : 'svg-line'} cx="124" cy="94" rx={radius} ry={Math.round(radius * .62)} />)}
      <path className="svg-faint svg-dash" d="M22 37 228 153M30 155 218 31" />
      <circle className="svg-fill-warn" cx="124" cy="94" r="5" />
      <path className="svg-warn" d="M124 94 170 58" />
      <text className="svg-text-warn" x="176" y="56">φ</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

function SeriesPanel({ label }: { label: string }) {
  const points = [[28, 51], [52, 61], [77, 72], [103, 88], [128, 97], [154, 116], [180, 128], [207, 145]]
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 190" role="img" aria-label={label}>
      <path className="svg-faint" d="M20 18V160H232M20 53H232M20 106H232" />
      <path className="svg-fill-accent" d="M27 42 210 132 210 155 27 63Z" />
      <path className="svg-accent" d="M27 52 210 144" />
      {points.map(([x, y], index) => <g key={x}>
        <path className="svg-line" d={`M${x} ${y - 10}V${y + 10}M${x - 3} ${y - 10}h6M${x - 3} ${y + 10}h6`} />
        <circle className={index === 6 ? 'svg-fill-warn' : 'svg-fill-ink'} cx={x} cy={y} r="3.5" />
      </g>)}
      <text x="222" y="176">t</text><text x="5" y="18">d</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

export function InterferometrySequence({ labels }: { labels: Labels }) {
  return <div className="method-figure-sequence">
    <SignalPanel label={labels[0]} /><span className="figure-flow" aria-hidden="true">→</span>
    <PhasePanel label={labels[1]} /><span className="figure-flow" aria-hidden="true">→</span>
    <SeriesPanel label={labels[2]} />
  </div>
}

function NetworkPanel({ label }: { label: string }) {
  const nodes = [24, 58, 92, 126, 160, 194, 228]
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 165" role="img" aria-label={label}>
      {nodes.slice(0, -1).map((x, index) => <path key={x} className="svg-accent" d={`M${x} 106Q${(x + nodes[index + 1]) / 2} ${78 - index * 4} ${nodes[index + 1]} 106`} />)}
      <path className="svg-line" d="M24 106Q75 22 126 106M58 106Q143 8 228 106M92 106Q160 38 228 106" />
      {nodes.map(x => <circle key={x} className="svg-fill-ink" cx={x} cy="106" r="4.5" />)}
      <path className="svg-warn svg-dash" d="M74 142H166" />
      <circle className="svg-fill-warn" cx="74" cy="142" r="4.5" /><circle className="svg-fill-warn" cx="166" cy="142" r="4.5" />
      <path className="svg-faint" d="M20 120H232" />
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

function CoherencePanel({ label }: { label: string }) {
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 165" role="img" aria-label={label}>
      <path className="svg-fill-accent" d="M20 133C34 68 78 25 132 29s92 29 98 89c-45 17-96 20-142 16Z" />
      <path className="svg-accent" d="M20 133C34 68 78 25 132 29s92 29 98 89c-45 17-96 20-142 16ZM43 119C58 69 91 47 132 49s70 22 77 57c-48 17-109 17-166 13ZM69 106c15-29 38-42 67-39s43 12 54 29c-34 15-76 18-121 10Z" />
      <path className="svg-warn svg-dash" d="M84 41 118 41 129 69 108 88 77 70Z" />
      <path className="svg-faint" d="M28 145H222M28 145V22" />
      <text x="216" y="159">x</text><text x="12" y="25">y</text><text x="199" y="30">γ</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

function ResidualPanel({ label }: { label: string }) {
  const residuals = [-8, 5, -3, 7, 12, -16, 8, 4, -5, 3, 10, -7, 5, 4, 22, -4, 6, -19, 4, 2, 7, -5]
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 165" role="img" aria-label={label}>
      <path className="svg-faint" d="M20 82H232M20 22V145" />
      <path className="svg-faint svg-dash" d="M20 48H232M20 116H232" />
      {residuals.map((value, index) => {
        const height = Math.abs(value) * 2.2
        const y = value >= 0 ? 82 - height : 82
        const outlier = Math.abs(value) > 17
        return <rect key={index} className={outlier ? 'svg-fill-warn' : 'svg-fill-ink'} x={27 + index * 9} y={y} width="4" height={height} />
      })}
      <text x="216" y="159">t</text><text x="4" y="22">ε</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

function UncertaintyPanel({ label }: { label: string }) {
  return <figure className="method-subfigure">
    <svg className="science-svg" viewBox="0 0 250 165" role="img" aria-label={label}>
      <path className="svg-fill-accent" d="M19 132C35 60 72 31 122 28s94 31 110 91c-49 27-155 27-213 13Z" />
      <path className="svg-accent" d="M32 124C51 69 82 47 125 46s73 24 91 65c-49 25-132 28-184 13ZM58 112c15-31 39-46 69-46s52 16 66 36c-37 25-94 29-135 10ZM88 101c12-14 25-20 42-19s26 8 34 16c-22 15-51 18-76 3Z" />
      <path className="svg-warn" d="M198 31 231 48 231 126 215 133M202 45l28 15M199 59l31 16M197 74l33 17M195 90l35 17M194 106l30 15" />
      <path className="svg-faint" d="M20 145H232M20 145V22" />
      <text x="213" y="25">σᵥ</text>
    </svg>
    <figcaption>{label}</figcaption>
  </figure>
}

export function QualityControlPanels({ labels }: { labels: QualityLabels }) {
  return <div className="method-qc-grid">
    <NetworkPanel label={labels[0]} />
    <CoherencePanel label={labels[1]} />
    <ResidualPanel label={labels[2]} />
    <UncertaintyPanel label={labels[3]} />
  </div>
}
