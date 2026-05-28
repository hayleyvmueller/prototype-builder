/* global React, Ic */
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP } = React;

const PIN_SVG = `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#D92228"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;

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
    window.L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);
    mapRef.current = map;

    const placePin = (lat, lon) => {
      map.setView([lat, lon], 16);
      const icon = window.L.divIcon({
        className: '', html: PIN_SVG,
        iconSize: [24, 32], iconAnchor: [12, 32],
      });
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
// PreviewPanel — pixel-faithful spotlight detail page
// ============================================================
function PreviewPanel({ data }) {
  const [activePhoto, setActivePhoto] = useStateP(0);
  const [isPlaying, setIsPlaying] = useStateP(true);

  // reset when photos change drastically
  useEffectP(() => {
    if (activePhoto >= data.photos.length) setActivePhoto(0);
  }, [data.photos.length]);

  // auto-advance carousel
  useEffectP(() => {
    if (!isPlaying || data.photos.length <= 1) return;
    const id = setInterval(() => {
      setActivePhoto((i) => (i + 1) % data.photos.length);
    }, 3000);
    return () => clearInterval(id);
  }, [isPlaying, data.photos.length]);

  const hero = data.photos[activePhoto] || null;
  const photoCount = data.photos.length || 1;
  const counterText = `${activePhoto + 1}/${photoCount}`;

  // Mortgage estimate
  const monthly = data.price > 0 ? Math.round(data.price * 0.006) : 0;

  // Price per sqft
  const pricePerSqft = data.price > 0 && data.sqft > 0
    ? Math.round(data.price / data.sqft)
    : 0;

  // Address split
  const fullAddr = `${data.street || "123 Main St"}, ${data.city || "Austin"}, ${data.state || "TX"} ${data.zip || "78704"}`;

  // Room labels (up to 3 from photo labels, with sensible defaults)
  const roomLabels = (() => {
    const fromPhotos = data.photos
      .map((p) => p.label && p.label.trim())
      .filter(Boolean);
    if (fromPhotos.length >= 3) return fromPhotos.slice(0, 3);
    const defaults = ["Living room", "Kitchen", "Exterior"];
    const out = [...fromPhotos];
    for (let i = 0; out.length < 3 && i < defaults.length; i++) {
      if (!out.includes(defaults[i])) out.push(defaults[i]);
    }
    return out.slice(0, 3);
  })();

  const next = () => setActivePhoto((i) => (i + 1) % photoCount);
  const prev = () => setActivePhoto((i) => (i - 1 + photoCount) % photoCount);

  // Formatters
  const fmtPrice = (n) =>
    n > 0 ? `$${Number(n).toLocaleString("en-US")}` : "$—";
  const fmtNumber = (n) => (n > 0 ? Number(n).toLocaleString("en-US") : "—");
  const fmtMortgage = (n) => `$${Number(n).toLocaleString("en-US")}/mo`;

  const propertyTypeLabel = ({
    "single-family": "House for sale",
    townhouse: "Townhouse for sale",
    condo: "Condo for sale",
    "multi-family": "Multi-family home for sale",
  })[data.propertyType] || "House for sale";

  const propertyTypeShort = ({
    "single-family": "Single family",
    townhouse: "Townhouse",
    condo: "Condo",
    "multi-family": "Multi-family",
  })[data.propertyType] || "Single family";

  return (
    <div className="preview-frame">
      {/* Header */}
      <div className="preview-header">
        <div className="back">
          <Ic.ChevronLeft s={16} />
          <span>Search</span>
        </div>
        <div className="center">
          <img src="assets/realtor-logo.svg" alt="realtor.com" />
        </div>
        <div className="actions">
          <button title="Save"><Ic.Heart s={18} /></button>
          <button title="Share"><Ic.Share s={18} /></button>
        </div>
      </div>

      {/* Listed/Brokered */}
      <div className="preview-attr">
        <div>
          Listed by <strong>{data.agentName || "Agent Name"}</strong>
        </div>
        <div>
          Brokered by <strong>{data.brokerage || "Brokerage Name"}</strong>
        </div>
      </div>

      {/* Hero */}
      <div className="hero">
        {hero ? (
          <React.Fragment>
            <div
              className="hero-blur-left"
              style={{ backgroundImage: `url(${hero.url})` }}
            />
            <div
              className="hero-blur-right"
              style={{ backgroundImage: `url(${hero.url})` }}
            />
            <div
              className="hero-image"
              style={{ backgroundImage: `url(${hero.url})` }}
            />
          </React.Fragment>
        ) : (
          <div className="hero-placeholder">
            <div className="ph-icon"><Ic.Image s={24} /></div>
            <div>upload photos to see hero image</div>
          </div>
        )}

        <div className="hero-topleft">
          <div className="badge-spotlight">
            <Ic.Bolt s={13} /> <span>Spotlight</span>
          </div>
          <div className="badge-new">New</div>
          {data.propertyType === "single-family" && data.yearBuilt >= 2024 && (
            <div className="badge-neutral">New construction</div>
          )}
        </div>

        <div className="hero-topright">{counterText}</div>

        {photoCount > 1 && (
          <React.Fragment>
            <button className="hero-nav left" onClick={prev} aria-label="Previous photo">
              <Ic.ChevronLeft s={20} />
            </button>
            <button className="hero-nav right" onClick={next} aria-label="Next photo">
              <Ic.ChevronRight s={20} />
            </button>
          </React.Fragment>
        )}

        <div className="hero-bottomleft">
          <button className="btn-flyaround">
            <Ic.Sparkle s={14} /> <span>Fly around</span>
          </button>
        </div>

        {photoCount > 1 && (
          <div className="hero-bottomcenter">
            <span className="pause" onClick={() => setIsPlaying((p) => !p)} style={{ cursor: "pointer" }}>
              {isPlaying ? <Ic.Pause s={11} /> : <Ic.Play s={11} />}
            </span>
            <span className="dots">
              {data.photos.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={"dot" + (i === activePhoto % 5 ? " active" : "")}
                />
              ))}
            </span>
          </div>
        )}

        <div className="hero-bottomright">
          {roomLabels.map((label, i) => (
            <button key={i} className="btn-room">
              <Ic.Image s={13} /> <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail body */}
      <div className="detail-body">
        <div className="detail-main">
          <div className="detail-toolbar">
            <a href="#" onClick={(e) => e.preventDefault()}>Veterans: Check 2026 VA Loan Requirements</a>
            <span className="sep">|</span>
            <a href="#" onClick={(e) => e.preventDefault()}>$5,000 Closing Guarantee if you qualify</a>
          </div>

          <div className="status-pill">
            <span className="status-dot" />
            <span>{propertyTypeLabel}</span>
          </div>

          <div className="price-block">
            <div className="price">{fmtPrice(data.price)}</div>
          </div>

          <div className="meta-row">
            <span>
              <span className="meta-val">{fmtNumber(data.beds)}</span>
              <span className="meta-lbl"> bed</span>
            </span>
            <span className="dot">·</span>
            <span>
              <span className="meta-val">{data.baths > 0 ? data.baths : "—"}</span>
              <span className="meta-lbl"> bath</span>
            </span>
            <span className="dot">·</span>
            <span>
              <span className="meta-val">{fmtNumber(data.sqft)}</span>
              <span className="meta-lbl"> sqft</span>
            </span>
            <span className="dot">·</span>
            <span>
              <span className="meta-val">{fmtNumber(data.lotSqft)}</span>
              <span className="meta-lbl"> sqft lot</span>
            </span>
          </div>

          <div className="addr-line">{fullAddr}</div>

          <div className="mortgage-row">
            <span className="mortgage-est">
              Est. {fmtMortgage(monthly)}
              <Ic.Edit s={13} />
            </span>
            <button className="btn-ghost">Get pre-approved</button>
          </div>

          <div className="feature-tags">
            {(data.features.length > 0
              ? data.features
              : ["Refrigerator", "City skyline view", "Luxury", "Scenic view", "City view", "Contemporary"]
            ).map((f, i) => (
              <span key={i} className="feature-tag">{f}</span>
            ))}
          </div>

          <div className="stat-blocks">
            <div className="stat-block">
              <div className="ic"><Ic.House s={24} /></div>
              <div>
                <div className="val">{propertyTypeShort}</div>
                <div className="lbl">Property type</div>
              </div>
            </div>
            <div className="stat-block">
              <div className="ic"><Ic.Calendar s={24} /></div>
              <div>
                <div className="val">{data.daysOnSite} days</div>
                <div className="lbl">On Realtor.com</div>
              </div>
            </div>
            <div className="stat-block">
              <div className="ic"><Ic.Ruler s={24} /></div>
              <div>
                <div className="val">${fmtNumber(pricePerSqft)}</div>
                <div className="lbl">Price per sqft</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="detail-aside">
          <MapCard street={data.street} city={data.city} state={data.state} zip={data.zip} />
          <div className="commute">
            <Ic.Car s={16} /> <span>Add a commute</span>
          </div>

          <div className="contact-card">
            <h3>More about this property</h3>
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
            <div className="field">
              <label>How can an agent help?</label>
              <textarea defaultValue={`I'm interested in ${data.street || "this home"}.`} />
            </div>
            <button className="btn-email-agent">Email agent</button>
            <div className="contact-disclaimer">
              By submitting, you agree to be contacted about real estate services. Privacy policy applies.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.PreviewPanel = PreviewPanel;
