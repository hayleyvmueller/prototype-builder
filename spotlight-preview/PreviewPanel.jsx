/* global React, Ic */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

const PIN_SVG = `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#D92228"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;

// ============================================================
// MapCard
// ============================================================
function MapCard({ street, city, state, zip }) {
  const elRef = useRefP(null);
  const mapRef = useRefP(null);
  const geocodeAddr = [street, city, state, zip].filter(Boolean).join(', ');

  useEffectP(() => {
    if (!elRef.current || typeof window.L === 'undefined') return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    const map = window.L.map(elRef.current, {
      zoomControl: false, scrollWheelZoom: false,
      dragging: false, attributionControl: false, keyboard: false,
    });
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    const placePin = (lat, lon) => {
      map.setView([lat, lon], 16);
      const icon = window.L.divIcon({ className: '', html: PIN_SVG, iconSize: [24, 32], iconAnchor: [12, 32] });
      window.L.marker([lat, lon], { icon }).addTo(map);
    };
    if (geocodeAddr) {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geocodeAddr)}&format=json&limit=1&countrycodes=us`)
        .then(r => r.json())
        .then(results => {
          if (results[0]) placePin(parseFloat(results[0].lat), parseFloat(results[0].lon));
          else placePin(30.267, -97.743);
        })
        .catch(() => placePin(30.267, -97.743));
    } else {
      placePin(30.267, -97.743);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [geocodeAddr]);

  return <div ref={elRef} className="map-card-real" />;
}

// ============================================================
// SplitViewer — draggable before/after reveal
// ============================================================
function SplitViewer({ beforeUrl, afterUrl }) {
  const [pct, setPct] = useStateP(50);
  const dragging = useRefP(false);
  const ref = useRefP(null);

  const move = (clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const p = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPct(p);
  };

  return (
    <div
      ref={ref}
      className="split-viewer"
      onMouseDown={e => { dragging.current = true; move(e.clientX); }}
      onMouseMove={e => { if (dragging.current) move(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
    >
      <div className="sv-before" style={{ backgroundImage: `url(${beforeUrl})` }} />
      <div className="sv-after" style={{ backgroundImage: `url(${afterUrl})`, clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
      <div className="sv-handle" style={{ left: `${pct}%` }}>
        <div className="sv-line" />
        <div className="sv-knob">
          <Ic.ChevronLeft s={11} />
          <Ic.ChevronRight s={11} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AISelect — labeled select for AI controls
// ============================================================
function AISelect({ label, options, defaultVal }) {
  const [val, setVal] = useStateP(defaultVal || options[0]);
  return (
    <div className="ai-select-group">
      <div className="ai-select-label">{label} <span className="ai-info">ⓘ</span></div>
      <select className="select ai-select-input" value={val} onChange={e => setVal(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ============================================================
// PreviewPanel — updated Spotlight detail page
// ============================================================
function PreviewPanel({ data }) {
  const [activePhoto, setActivePhoto] = useStateP(0);
  const [isPlaying, setIsPlaying] = useStateP(true);
  const [showFullDesc, setShowFullDesc] = useStateP(false);
  const [detailsExpanded, setDetailsExpanded] = useStateP(true);
  const [renovateStyle, setRenovateStyle] = useStateP("Modern minimal");
  const [season, setSeason] = useStateP("Summer");

  const SEASON_IMAGE_MAP = {
    "Summer": "assets/preview-photos/front-of-house.png",
    "Spring": "assets/preview-photos/front-of-house.png",
    "Fall":   "assets/preview-photos/front-of-house.png",
    "Winter": "assets/preview-photos/Modern-Mid-Century/winter-house.png",
  };

  const RENOVATE_AFTER_MAP = {
    "Modern minimal":     "assets/preview-photos/bathroom.png",
    "Mid-century modern": "assets/preview-photos/bathroom.png",
    "Coastal warm":       "assets/preview-photos/bathroom.png",
  };

  useEffectP(() => {
    if (activePhoto >= data.photos.length) setActivePhoto(0);
  }, [data.photos.length]);

  useEffectP(() => {
    if (!isPlaying || data.photos.length <= 1) return;
    const id = setInterval(() => setActivePhoto(i => (i + 1) % data.photos.length), 3000);
    return () => clearInterval(id);
  }, [isPlaying, data.photos.length]);

  const hero = data.photos[activePhoto] || null;
  const photoCount = data.photos.length || 1;
  const hasPhotos = data.photos.length > 0;

  const fmtPrice = n => n > 0 ? `$${Number(n).toLocaleString("en-US")}` : "$—";
  const fmtNumber = n => n > 0 ? Number(n).toLocaleString("en-US") : "—";
  const monthly = data.price > 0 ? Math.round(data.price * 0.006) : 0;
  const pricePerSqft = data.price > 0 && data.sqft > 0 ? Math.round(data.price / data.sqft) : 0;
  const fullAddr = `${data.street || "123 Main St"}, ${data.city || "Austin"}, ${data.state || "TX"} ${data.zip || "78704"}`;

  const propertyTypeLabel = ({ "single-family": "For sale", townhouse: "For sale", condo: "For sale", "multi-family": "For sale" })[data.propertyType] || "For sale";
  const propertyTypeShort = ({ "single-family": "Single family", townhouse: "Townhouse", condo: "Condo", "multi-family": "Multi-family" })[data.propertyType] || "Single family";

  const agentInitials = (data.agentName || "AN").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const brokerageInitials = (data.brokerage || "B").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Pick a consistent headshot based on agent name
  const HEADSHOTS = [
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
    "https://randomuser.me/api/portraits/men/75.jpg",
    "https://randomuser.me/api/portraits/women/26.jpg",
    "https://randomuser.me/api/portraits/men/46.jpg",
  ];
  const nameHash = (data.agentName || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const headshot = HEADSHOTS[nameHash % HEADSHOTS.length];

  // Brokerage brand color (hash-based)
  const BROKERAGE_COLORS = ["#D92228", "#b91c1c", "#1d4ed8", "#0f766e", "#7c3aed", "#c2410c"];
  const brkHash = (data.brokerage || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const brokerageColor = BROKERAGE_COLORS[brkHash % BROKERAGE_COLORS.length];

  const thumbLabels = ["Kitchen", "Bedrooms", "Bathrooms", "FlyAround"];
  const FLYAROUND_URL = "assets/flyaround.png";
  // Fill first 3 slots from uploaded photos (cycling if not enough), FlyAround always hardcoded
  const thumbPhotos = [1, 2, 3].map(i => {
    if (data.photos.length === 0) return null;
    return data.photos[i] || data.photos[i % data.photos.length];
  }).concat([{ url: FLYAROUND_URL, label: "FlyAround" }]);

  // Renovate split viewer: hardcoded kitchen before/after
  const KITCHEN_BEFORE = "assets/preview-photos/bathroom.png";

  const aiPhoto1 = data.photos[0] ? data.photos[0].url : null;
  const aiPhoto2 = data.photos[1] ? data.photos[1].url : (data.photos[0] ? data.photos[0].url : null);

  const openHouses = [
    { day: "Friday, Jan 16", time: "11:00 AM to 2:30 PM" },
    { day: "Saturday, Jan 17", time: "9:00 AM to 3:30 PM" },
    { day: "Sunday, Jan 18", time: "11:00 AM to 1:30 PM" },
  ];

  const desc = data.features.length > 0
    ? `This stunning ${propertyTypeShort.toLowerCase()} features ${data.features.slice(0, 3).join(", ").toLowerCase()}, and much more. Situated in a prime location with ${data.sqft > 0 ? `${fmtNumber(data.sqft)} sq. ft.` : "generous"} of thoughtfully designed living space. Meticulously maintained with modern upgrades throughout — a must-see property that won't last long on the market.`
    : "Wonderful property situated on a prime lot. This stunning home features exceptional finishes, spacious rooms, and a welcoming atmosphere. Meticulously maintained with modern upgrades throughout. A must-see property in a sought-after location with everything you've been looking for.";

  const next = () => setActivePhoto(i => (i + 1) % photoCount);
  const prev = () => setActivePhoto(i => (i - 1 + photoCount) % photoCount);

  return (
    <div className="preview-frame">

      {/* ── Header ── */}
      <div className="preview-header-new">
        <div />
        <div className="ph-center">
          <img src="assets/realtor-logo.svg" alt="realtor.com" />
        </div>
        <div className="ph-right">
          <button className="ph-icon-btn" title="Saved"><Ic.Heart s={18} /></button>
          <button className="ph-icon-btn" title="Notifications"><Ic.Bell s={18} /></button>
        </div>
      </div>

      {/* ── Hero grid ── */}
      <div className="hero-grid">
        <div className="hero-main">
          <div className="hm-video" style={{ backgroundImage: `url('assets/New Preview photos/video-walkthrough.gif')` }} />

          <div className="hm-topleft">
            <div className="badge-spotlight"><Ic.Bolt s={13} /> <span>Spotlight</span></div>
          </div>

          <div className="hm-bottom">
            <div className="hm-bottom-left" />
            <div className="hm-bottom-right">
              <button className="btn-tour-pill"><Ic.Sparkle s={12} /> Virtual tour</button>
              <button className="btn-tour-pill">3D tour</button>
            </div>
          </div>
        </div>

        {/* Thumbnails 2x2 */}
        <div className="hero-thumbs">
          {thumbPhotos.map((p, i) => {
            const label = thumbLabels[i];
            const isFlyAround = label === "FlyAround";
            const photoIdx = p ? data.photos.findIndex(ph => ph === p) : -1;
            return (
              <div key={i} className={"hero-thumb" + (isFlyAround ? " flyaround" : "")}
                onClick={() => photoIdx >= 0 && setActivePhoto(photoIdx)}>
                {p
                  ? <div className="ht-img" style={{ backgroundImage: `url(${p.url})` }} />
                  : <div className="ht-empty"><Ic.Image s={16} /></div>
                }
                <span className="ht-label">
                  {isFlyAround && <Ic.Sparkle s={10} />}{label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Agent bar ── */}
      <div className="agent-attr-bar">
        <div className="aa-avatar-wrap">
          <img className="aa-headshot" src={headshot} alt={data.agentName || "Agent"} />
          <div className="aa-brokerage-badge" style={{ background: brokerageColor }}>
            {brokerageInitials}
          </div>
        </div>
        <div className="aa-text">
          Listed by <strong>{data.agentName || "Agent Name"}</strong>
          <span className="aa-sep"> | </span>
          Brokered by <strong>{data.brokerage || "Brokerage Name"}</strong>
        </div>
      </div>

      {/* ── Detail body ── */}
      <div className="detail-body">
        <div className="detail-main">

          <div className="detail-toolbar">
            <a href="#" onClick={e => e.preventDefault()}>Veterans: Check 2026 VA Loan Requirements</a>
            <span className="sep">|</span>
            <a href="#" onClick={e => e.preventDefault()}>$5,000 Closing Guarantee if you qualify</a>
          </div>

          <div className="status-pill">
            <span className="status-dot" />
            <span>{propertyTypeLabel}</span>
          </div>

          <div className="price-block">
            <div className="price">{fmtPrice(data.price)}</div>
          </div>

          <div className="meta-row">
            <span><span className="meta-val">{fmtNumber(data.beds)}</span><span className="meta-lbl"> bed</span></span>
            <span className="dot">·</span>
            <span><span className="meta-val">{data.baths > 0 ? data.baths : "—"}</span><span className="meta-lbl"> bath</span></span>
            <span className="dot">·</span>
            <span><span className="meta-val">{fmtNumber(data.sqft)}</span><span className="meta-lbl"> sqft</span></span>
            <span className="dot">·</span>
            <span><span className="meta-val">{fmtNumber(data.lotSqft)}</span><span className="meta-lbl"> sqft lot</span></span>
          </div>

          <div className="addr-line">{fullAddr}</div>

          <div className="mortgage-row">
            <span className="mortgage-est">Est. ${Number(monthly).toLocaleString("en-US")}/mo <Ic.Edit s={13} /></span>
            <button className="btn-ghost">Get pre-approved</button>
          </div>

          {/* About this home */}
          <div className="about-section">
            <h3 className="section-title">About this home</h3>
            <div className="stat-blocks-6">
              <div className="stat-block">
                <div className="ic"><Ic.House s={22} /></div>
                <div><div className="val">{propertyTypeShort}</div><div className="lbl">Property type</div></div>
              </div>
              <div className="stat-block">
                <div className="ic"><Ic.Car s={22} /></div>
                <div><div className="val">2 cars</div><div className="lbl">Garage</div></div>
              </div>
              <div className="stat-block">
                <div className="ic"><Ic.Calendar s={22} /></div>
                <div><div className="val">{data.daysOnSite} days</div><div className="lbl">On Realtor.com</div></div>
              </div>
              <div className="stat-block">
                <div className="ic"><Ic.Ruler s={22} /></div>
                <div><div className="val">${fmtNumber(pricePerSqft)}</div><div className="lbl">Price per sqft</div></div>
              </div>
              <div className="stat-block">
                <div className="ic"><Ic.House s={22} /></div>
                <div><div className="val">—</div><div className="lbl">HOA fees</div></div>
              </div>
              <div className="stat-block">
                <div className="ic"><Ic.Calendar s={22} /></div>
                <div><div className="val">{data.yearBuilt}</div><div className="lbl">Year built</div></div>
              </div>
            </div>
            <p className={"about-desc" + (showFullDesc ? " expanded" : "")}>{desc}</p>
            <button className="btn-show-more" onClick={() => setShowFullDesc(s => !s)}>
              {showFullDesc ? "Show less" : "Show more"}
            </button>
          </div>

          {/* Action pills */}
          <div className="action-row">
            <button className="btn-action-pill">What's nearby?</button>
            <button className="btn-action-pill">Recent renovations &amp; improvements</button>
            <button className="btn-action-pill">Compare this home</button>
            <button className="btn-action-pill">Ask a question</button>
          </div>

          {/* Agent card */}
          <div className="agent-card">
            <div className="ac-left">
              <div className="ac-avatar-wrap">
                <img className="ac-headshot" src={headshot} alt={data.agentName || "Agent"} />
              </div>
              <div className="ac-info">
                <div className="ac-listed-by">Listed by</div>
                <div className="ac-name">{data.agentName || "Agent Name"}</div>
                <div className="ac-brokerage">{data.brokerage || "Brokerage Name"}</div>
              </div>
            </div>
            <div className="ac-actions">
              <button className="ac-btn-outline">View profile</button>
              <button className="ac-btn-dark">Email {(data.agentName || "Agent").split(" ")[0]}</button>
            </div>
          </div>

          {/* See yourself in this home */}
          {hasPhotos && (
            <div className="see-yourself">
              <h3 className="section-title">See yourself in this home</h3>

              <div className="sy-subsection">
                <h4 className="sy-subtitle">Renovate this space</h4>
                <div className="sy-card">
                  <SplitViewer beforeUrl="assets/New-Preview-photos/Mid-century-bath.png" afterUrl="assets/New-Preview-photos/Bathroom.png" />
                  <div className="sy-controls">
                    <AISelect label="Select an option" options={["Kitchen", "Living room", "Bathroom", "Bedroom"]} defaultVal="Kitchen" />
                    <div className="ai-select-group">
                      <div className="ai-select-label">Select an option <span className="ai-info">ⓘ</span></div>
                      <select className="select ai-select-input" value={renovateStyle} onChange={e => setRenovateStyle(e.target.value)}>
                        <option>Modern minimal</option>
                        <option>Mid-century modern</option>
                        <option>Coastal warm</option>
                      </select>
                    </div>
                    <AISelect label="Select an option" options={["$10,000", "$25,000", "$50,000", "$100,000"]} defaultVal="$50,000" />
                    <button className="btn-ai-update">Update</button>
                  </div>
                </div>
              </div>

              <div className="sy-subsection">
                <h4 className="sy-subtitle">Stage this space</h4>
                <div className="sy-card">
                  <SplitViewer beforeUrl="assets/preview-photos/Modern-Mid-Century/coastal-bedroom.png" afterUrl="assets/preview-photos/bedroom.png" />
                  <div className="sy-controls">
                    <AISelect label="Select an option" options={["Bedroom", "Bathroom", "Foyer", "Living room", "Dining room"]} defaultVal="Bedroom" />
                    <AISelect label="Select an option" options={["Coastal warm", "Modern minimal", "Mid-century modern"]} defaultVal="Coastal warm" />
                    <button className="btn-ai-update">Update</button>
                  </div>
                </div>
              </div>

              <div className="sy-subsection">
                <h4 className="sy-subtitle">See this home in different seasons</h4>
                <div className="sy-card">
                  <div className="sy-season-wrap">
                    <div className="sy-season-img" style={{ backgroundImage: `url(${SEASON_IMAGE_MAP[season]})` }}>
                    </div>
                  </div>
                  <div className="sy-controls">
                    <div className="ai-select-group">
                      <div className="ai-select-label">Select an option <span className="ai-info">ⓘ</span></div>
                      <select className="select ai-select-input" value={season} onChange={e => setSeason(e.target.value)}>
                        <option>Summer</option>
                        <option>Spring</option>
                        <option>Fall</option>
                        <option>Winter</option>
                      </select>
                    </div>
                    <button className="btn-ai-update">Update</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Open houses */}
          <div className="open-houses">
            <h3 className="section-title">Open houses</h3>
            <div className="oh-grid">
              {openHouses.map((oh, i) => (
                <div key={i} className="oh-item">
                  <div className="oh-day">{oh.day}</div>
                  <div className="oh-time">{oh.time}</div>
                  <button className="oh-cal-btn"><Ic.Calendar s={12} /> Add to calendar</button>
                </div>
              ))}
            </div>
          </div>

          {/* Tour CTA */}
          <div className="tour-when">
            <span className="tw-label">Tour when works for you</span>
            <button className="btn-schedule-tour">Schedule tour</button>
          </div>

          {/* Property details */}
          <div className="property-details">
            <div className="pd-header">
              <h3 className="section-title" style={{ margin: 0 }}>Property details</h3>
              <button className="btn-collapse" onClick={() => setDetailsExpanded(e => !e)}>
                {detailsExpanded ? "Collapse ▲" : "Expand ▼"}
              </button>
            </div>
            {detailsExpanded && (
              <div className="pd-tags">
                {(data.features.length > 0 ? data.features : [
                  "Open floor plan", "High ceilings", "Crown molding",
                  "Kitchen with quartz countertops", "Remodeled kitchen",
                  "Remodeled primary bath", "Mid-renovation", "Refinished attic",
                ]).map((f, i) => (
                  <span key={i} className="pd-tag">{f}</span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Aside */}
        <aside className="detail-aside">
          <MapCard street={data.street} city={data.city} state={data.state} zip={data.zip} />
          <div className="commute"><Ic.Car s={16} /> <span>Add a commute</span></div>
          <div className="contact-card">
            <div className="field">
              <label>Full name *</label>
              <input type="text" placeholder="Your name" defaultValue="" />
            </div>
            <div className="field">
              <label>Email *</label>
              <input type="email" placeholder="you@example.com" defaultValue="" />
            </div>
            <div className="field">
              <label>Phone *</label>
              <input type="tel" placeholder="(555) 555-5555" defaultValue="" />
            </div>
            <label className="military-check">
              <input type="checkbox" />
              <span>I've served in the U.S. military</span>
              <Ic.Info s={14} />
            </label>
            <button className="btn-ask-question">Ask a question</button>
            <button className="btn-schedule-tour-outline">Schedule a tour</button>
            <div className="contact-disclaimer">
              By proceeding, you consent to receive calls and texts at the number you provided, including marketing by autodialer and prerecorded and artificial voice, and email, from realtor.com and others about your inquiry and other home-related matters, but not as a condition of any purchase. <a href="#">More</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.PreviewPanel = PreviewPanel;
