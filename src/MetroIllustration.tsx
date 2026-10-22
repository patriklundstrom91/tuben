export default function MetroIllustration() {
  return <svg className="metro-illustration" viewBox="0 0 380 230" role="img" aria-label="Illustration av ett tunnelbanetåg vid en T-banestation">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e4f3fb"/><stop offset="1" stopColor="#c9e4f2"/></linearGradient>
      <linearGradient id="c30body" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#236284"/><stop offset="1" stopColor="#123d5a"/></linearGradient>
      <linearGradient id="c30glass" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#163447"/><stop offset="1" stopColor="#315d70"/></linearGradient>
      <linearGradient id="c30front" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f2f7f8"/><stop offset="1" stopColor="#a9cbd7"/></linearGradient>
      <radialGradient id="headlight"><stop stopColor="#fff9d9"/><stop offset="1" stopColor="#ffd27f"/></radialGradient>
      <radialGradient id="panelFade"><stop offset="22%" stopColor="white"/><stop offset="78%" stopColor="black"/></radialGradient>
      <mask id="softPanel"><rect width="380" height="230" fill="url(#panelFade)"/></mask>
    </defs>
    <rect x="12" y="10" width="356" height="210" rx="34" fill="url(#sky)" mask="url(#softPanel)"/>
    <path d="M24 157c55-25 108-24 164 0s109 25 168 1v39H24z" fill="#b5d4e2" opacity=".55"/>
    <path d="M22 175h337M43 187h290M66 198h246" stroke="#7899a8" strokeWidth="2.5" strokeLinecap="round" opacity=".45"/>
    <path d="M28 168c54 1 87-48 137-48" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".8"/>
    <circle cx="43" cy="168" r="7" fill="#fff" stroke="#4984a0" strokeWidth="3"/>
    <path d="M166 120V71" stroke="#234c65" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="166" cy="56" r="19" fill="#fff" stroke="#d0e3ea" strokeWidth="2"/>
    <path d="M158 47h16v4h-6v15h-4V51h-6z" fill="#234c65"/>
    <circle cx="166" cy="120" r="8" fill="#fff" stroke="#4984a0" strokeWidth="3"/>
    <g transform="translate(246 102)">
      <ellipse cx="0" cy="78" rx="45" ry="8" fill="#31576a" opacity=".18"/>
      <path d="M-39 15c0-13 9-22 22-22h34c13 0 22 9 22 22v53c0 7-6 12-13 12h-52c-7 0-13-5-13-12z" fill="url(#c30body)"/>
      <path d="M-30 15c0-8 5-14 13-14h34c8 0 13 6 13 14v24h-60z" fill="url(#c30glass)" stroke="#8eb5c2" strokeWidth="1.5"/>
      <path d="M0 2v37" stroke="#8cb7c5" strokeWidth="2" opacity=".9"/>
      <path d="M-26 7h52" stroke="#a6c5cf" strokeWidth="1" opacity=".22"/>
      <rect x="-12" y="-12" width="24" height="9" rx="3" fill="#16384c"/>
      <text x="0" y="-5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="700" fill="#f4b56a">C30</text>
      <path d="M-36 45c18 3 54 3 72 0v12c-20 4-52 4-72 0z" fill="url(#c30front)"/>
      <path d="M-36 48c19 4 53 4 72 0" fill="none" stroke="#7ea8b8" strokeWidth="1.5"/>
      <rect x="-31" y="45" width="8" height="6" rx="3" fill="url(#headlight)"/><rect x="23" y="45" width="8" height="6" rx="3" fill="url(#headlight)"/>
      <path d="M-34 61h68" stroke="#17394d" strokeWidth="3"/>
      <path d="M-20 68v8m40-8v8" stroke="#d2e3e9" strokeWidth="3" strokeLinecap="round"/>
      <path d="M-13 82v5m26-5v5" stroke="#17394d" strokeWidth="4" strokeLinecap="round"/>
    </g>
    <rect x="257" y="187" width="91" height="20" rx="10" fill="#fff" stroke="#d4e4eb" strokeWidth="1"/>
    <circle cx="272" cy="197" r="4" fill="#29976c"/>
    <text x="283" y="200" fontFamily="monospace" fontSize="8" fontWeight="700" letterSpacing="1.1" fill="#31566b">STOCKHOLM</text>
  </svg>;
}
