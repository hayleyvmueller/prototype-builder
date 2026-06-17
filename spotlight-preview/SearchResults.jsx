/* global React, Ic */
const { useState: useSt } = React;

// ── Placeholder listings to fill the grid ──────────────────────────────────
const PLACEHOLDERS = [
  { price: 425000,  beds: 4, baths: 2,   sqft: 1860, lot: "6,673 sqft lot", addr: "2214 Ridgewood Terrace",  city: "Austin, TX 78745", label: "House for sale",     badge: "New",  img: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&q=80",  brokerage: "Lone Star Realty Group" },
  { price: 312000,  beds: 2, baths: 1.5, sqft: 1136, lot: "4,430 sqft lot", addr: "408 Cedarbrook Lane",     city: "Austin, TX 78758", label: "Condo for sale",      badge: null,   img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&q=80", brokerage: "Capital City Properties" },
  { price: 1150000, beds: 4, baths: 3.5, sqft: 3240, lot: "5,227 sqft lot", addr: "1837 Sunflower Blvd",     city: "Austin, TX 78703", label: "House for sale",      badge: null,   img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80", brokerage: "Bluebonnet Real Estate" },
  { price: 879000,  beds: 4, baths: 3,   sqft: 2840, lot: "7,100 sqft lot", addr: "5504 Maverick Hills Dr",  city: "Austin, TX 78752", label: "House for sale",      badge: null,   img: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80", brokerage: "Hill Country Home Co." },
  { price: 1475000, beds: 4, baths: 4,   sqft: 3890, lot: "2,614 sqft lot", addr: "312 Barton Cove Unit 7",  city: "Austin, TX 78702", label: "House for sale",      badge: "New",  img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", brokerage: "Westlake Premier Realty" },
  { price: 498000,  beds: 3, baths: 2,   sqft: 1820, lot: "6,098 sqft lot", addr: "910 Mockingbird Hollow",  city: "Austin, TX 78751", label: "House for sale",      badge: null,   img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&q=80",  brokerage: "Texan Nest Realty" },
  { price: 2100000, beds: 5, baths: 5,   sqft: 4820, lot: "9,450 sqft lot", addr: "7701 Lakeview Summit",    city: "Austin, TX 78746", label: "House for sale",      badge: null,   img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", brokerage: "Presidio Luxury Homes" },
];

function fmtPrice(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}
function fmtFull(n) {
  if (typeof n === "string") return n.startsWith("$") ? n : `$${n}`;
  return `$${Number(n).toLocaleString("en-US")}`;
}
function hasPrice(p) { return p != null && p !== 0 && p !== ""; }

// ── Placeholder card ────────────────────────────────────────────────────────
function PlaceholderCard({ p }) {
  return (
    <div className="sr-card">
      <div className="sr-card-brokerage">Brokered by {p.brokerage}</div>
      <div className="sr-card-inner">
        <div className="sr-card-img-wrap">
          <div className="sr-card-img" style={{ backgroundImage: `url(${p.img})` }} />
          {p.badge === "New" && <span className="sr-badge sr-badge-new">New</span>}
          {p.badge === "Spotlight" && (
            <span className="sr-badge sr-badge-spotlight"><Ic.Bolt s={10} /> Spotlight</span>
          )}
          <button className="sr-heart"><Ic.Heart s={16} /></button>
        </div>
        <div className="sr-card-body">
          <div className="sr-card-label"><span className="sr-card-label-dot" />{p.label}</div>
          <div className="sr-card-price">{fmtFull(p.price)}</div>
          <div className="sr-card-meta">
            <span>{p.beds} bed</span>
            <span className="dot">·</span>
            <span>{p.baths} bath</span>
            <span className="dot">·</span>
            <span>{p.sqft.toLocaleString()} sqft</span>
            <span className="dot">·</span>
            <span>{p.lot}</span>
          </div>
          <div className="sr-card-addr-row">
            <div>
              <div className="sr-card-addr">{p.addr}</div>
              <div className="sr-card-city">{p.city}</div>
            </div>
            <button className="sr-email-btn">Email agent</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Spotlight (user's listing) card ─────────────────────────────────────────
function SpotlightCard({ data }) {
  const heroUrl = data && data.photos && data.photos[0] ? data.photos[0].url : "assets/preview-photos/front-of-house.png";
  const price = data && hasPrice(data.price) ? fmtFull(data.price) : "$—";
  const addr = data ? `${data.street || "Your listing"}` : "Your listing";
  const city = data ? `${data.city || "Austin"}, ${data.state || "TX"} ${data.zip || ""}`.trim() : "Austin, TX";
  const beds = data && data.beds > 0 ? data.beds : "—";
  const baths = data && data.baths > 0 ? data.baths : "—";
  const sqft = data && data.sqft > 0 ? data.sqft.toLocaleString() : "—";
  const lot = data && data.lotSqft > 0 ? `${data.lotSqft.toLocaleString()} sqft lot` : "";
  const label = "House for sale · Spotlight";
  const brokerage = data && data.brokerage ? data.brokerage : "Brokerage Name";

  const openPreview = () => {
    window.__previewData = window.opener ? window.opener.__previewData : data;
    window.open("preview.html", "_blank");
  };

  return (
    <div className="sr-card sr-card-spotlight" onClick={openPreview} style={{ cursor: "pointer" }}>
      <div className="sr-card-brokerage">Brokered by {brokerage}</div>
      <div className="sr-card-inner">
        <div className="sr-card-img-wrap">
          <div className="sr-card-img" style={{ backgroundImage: `url(${heroUrl})` }} />
          <span className="sr-badge sr-badge-spotlight"><Ic.Bolt s={10} /> Spotlight</span>
          <button className="sr-heart" onClick={e => e.stopPropagation()}><Ic.Heart s={16} /></button>
          {data && data.photos && data.photos.length > 1 && (
            <button className="sr-next-arrow"><Ic.ChevronRight s={16} /></button>
          )}
        </div>
        <div className="sr-card-body">
          <div className="sr-card-label"><span className="sr-card-label-dot" />{label}</div>
          <div className="sr-card-price">{price}</div>
          <div className="sr-card-meta">
            <span>{beds} bed</span>
            <span className="dot">·</span>
            <span>{baths} bath</span>
            <span className="dot">·</span>
            <span>{sqft} sqft</span>
            {lot && <React.Fragment><span className="dot">·</span><span>{lot}</span></React.Fragment>}
          </div>
          <div className="sr-card-addr-row">
            <div>
              <div className="sr-card-addr">{addr}</div>
              <div className="sr-card-city">{city}</div>
            </div>
            <button className="sr-email-btn" onClick={e => { e.stopPropagation(); openPreview(); }}>Email agent</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main SearchResults component ─────────────────────────────────────────────
function SearchResults({ data }) {
  const city = data && data.city ? `${data.city}, ${data.state || "TX"}` : "Austin, TX";

  const FILTERS = ["Price", "Rooms", "Home type", "New construction", "Min $100K", "Hide pending / contingent", "Hide foreclosures", "Hide land", "Hide mobile homes"];

  return (
    <div className="sr-page">

      {/* ── Top nav ── */}
      <div className="sr-nav">
        <div className="sr-nav-left">
          <img src="assets/realtor-logo.svg" alt="realtor.com" className="sr-nav-logo" />
          <nav className="sr-nav-links">
            {["Buy","Sell","Rent","Mortgage","Find an Agent","My Home","News & Insights"].map(l => (
              <a key={l} href="#" onClick={e => e.preventDefault()}>{l}</a>
            ))}
          </nav>
        </div>
        <div className="sr-nav-right">
          <a href="#" onClick={e => e.preventDefault()}>Manage rentals</a>
          <a href="#" onClick={e => e.preventDefault()}>Advertise</a>
          <button className="sr-nav-icon"><Ic.Heart s={18} /></button>
          <button className="sr-nav-icon"><Ic.Bell s={18} /></button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="sr-search-bar">
        <div className="sr-search-input">
          <Ic.Search s={16} />
          <span>Try "House with a chef's kitchen under 1m in {city.split(",")[1]?.trim() || "78277"}"</span>
        </div>
        <button className="sr-save-search"><Ic.Heart s={14} /> Save search</button>
        <div className="sr-view-toggle">
          <button className="sr-view-btn active">List</button>
          <button className="sr-view-btn">Map</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sr-filters">
        <button className="sr-filter-btn sr-filter-icon"><Ic.Search s={13} /> Filters</button>
        {FILTERS.map(f => (
          <button key={f} className="sr-filter-btn">{f} {f === "Price" || f === "Rooms" || f === "Home type" ? "▾" : ""}</button>
        ))}
      </div>

      {/* ── Results header ── */}
      <div className="sr-results-header">
        <div className="sr-results-left">
          <h1>{city} homes for sale &amp; real estate</h1>
          <div className="sr-count">7,459 Homes &nbsp; Sort by <a href="#" onClick={e => e.preventDefault()}>Relevant listings ▾</a></div>
        </div>
        <div className="sr-results-right">
          <a href="#" onClick={e => e.preventDefault()}>ⓘ How much home can I afford?</a>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="sr-grid">
        <SpotlightCard data={data} />
        {PLACEHOLDERS.map((p, i) => <PlaceholderCard key={i} p={p} />)}
        {/* Ad slot */}
        <div className="sr-ad-slot">
          <div className="sr-ad-inner">Advertisement</div>
        </div>
      </div>

    </div>
  );
}

window.SearchResults = SearchResults;
