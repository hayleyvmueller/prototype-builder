/* global React, ReactDOM, Ic, PreviewPanel */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ============================================================
// Defaults — pre-fill with the dashboard listing
// ============================================================
const DEFAULT_DATA = {
  street: "",
  city: "",
  state: "",
  zip: "",
  price: 0,
  beds: 0,
  baths: 0,
  sqft: 0,
  lotSqft: 6534,
  yearBuilt: 2018,
  propertyType: "single-family",
  daysOnSite: 7,
  features: ["Hardwood floors", "Open kitchen", "Backyard", "Modern", "Central AC", "Garage"],
  agentName: "",
  brokerage: "",
  photos: [],
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const PROPERTY_TYPES = [
  { value: "single-family", label: "Single family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multi-family", label: "Multi-family" },
];

// Guess room label from filename
function guessLabel(filename) {
  const f = filename.toLowerCase();
  const map = [
    ["kitchen", "Kitchen"], ["living", "Living room"], ["bedroom", "Bedroom"],
    ["bath", "Bathroom"], ["dining", "Dining room"], ["exterior", "Exterior"],
    ["front", "Exterior"], ["backyard", "Backyard"], ["yard", "Backyard"],
    ["garage", "Garage"], ["office", "Office"], ["pool", "Pool"],
    ["patio", "Patio"], ["closet", "Closet"],
  ];
  for (const [k, v] of map) if (f.includes(k)) return v;
  return "";
}

// ============================================================
// FormPage — full-page input form
// ============================================================
function FormPage({ data, set, onGenerate, onCopyLink, isCopied }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [photoDragIdx, setPhotoDragIdx] = useState(null);
  const [photoDragOverIdx, setPhotoDragOverIdx] = useState(null);

  const handleFiles = useCallback((files) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    const newPhotos = [];
    let pending = arr.length;
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPhotos.push({
          id: Math.random().toString(36).slice(2),
          name: file.name,
          label: guessLabel(file.name),
          url: e.target.result,
        });
        pending -= 1;
        if (pending === 0) set((d) => ({ ...d, photos: [...d.photos, ...newPhotos] }));
      };
      reader.readAsDataURL(file);
    });
  }, [set]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (id) => set((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== id) }));

  const reorderPhotos = (from, to) => {
    if (from === to || from == null || to == null) return;
    set((d) => {
      const photos = [...d.photos];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved);
      return { ...d, photos };
    });
  };
  const setPhotoLabel = (id, label) =>
    set((d) => ({ ...d, photos: d.photos.map((p) => (p.id === id ? { ...p, label } : p)) }));
  const promoteToHero = (id) =>
    set((d) => {
      const idx = d.photos.findIndex((p) => p.id === id);
      if (idx <= 0) return d;
      const reordered = [...d.photos];
      const [picked] = reordered.splice(idx, 1);
      reordered.unshift(picked);
      return { ...d, photos: reordered };
    });

  const update = (key) => (e) => set((d) => ({ ...d, [key]: e.target.value }));
  const updateNum = (key) => (e) => {
    const v = e.target.value.replace(/[^0-9.]/g, "");
    set((d) => ({ ...d, [key]: v === "" ? 0 : Number(v) }));
  };
  const updatePrice = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    set((d) => ({ ...d, price: v === "" ? 0 : Number(v) }));
  };

  const hasPhotos = data.photos.length > 0;

  return (
    <div className="form-page">
      <div className="form-page-inner">
        <div className="form-page-main">
          <div className="form-page-head">
            <div className="eyebrow"><Ic.Bolt s={11} /> Spotlight Listing</div>
            <h1>Preview your Spotlight Listing</h1>
            <p>Fill in the listing details and upload photos. We'll generate a private link you can share with your seller to show them exactly how the listing will appear on realtor.com.</p>
          </div>

          <div className="form-page-body">
            {/* Address */}
            <div className="form-section">
              <h3>Address</h3>
              <p className="section-hint">Where is the property located?</p>
              <div className="fields">
                <div className="field-group">
                  <div className="label">Street address</div>
                  <input className="input" type="text" placeholder="400 NW 16th Ave" value={data.street} onChange={update("street")} />
                </div>
                <div className="field-row col-4">
                  <div className="field-group" style={{ gridColumn: "span 2" }}>
                    <div className="label">City</div>
                    <input className="input" type="text" value={data.city} onChange={update("city")} />
                  </div>
                  <div className="field-group">
                    <div className="label">State</div>
                    <select className="select" value={data.state} onChange={update("state")}>
                      <option value="">—</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <div className="label">ZIP</div>
                    <input className="input" type="text" maxLength={5} value={data.zip} onChange={update("zip")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & specs */}
            <div className="form-section">
              <h3>Pricing & specs</h3>
              <p className="section-hint">The numbers buyers will see at the top of the listing.</p>
              <div className="fields">
                <div className="field-group">
                  <div className="label">Listing price</div>
                  <div className="input-wrap">
                    <span className="prefix">$</span>
                    <input
                      className="input with-prefix"
                      type="text" inputMode="numeric"
                      value={data.price > 0 ? data.price.toLocaleString("en-US") : ""}
                      onChange={updatePrice}
                      placeholder="865,000"
                    />
                  </div>
                </div>
                <div className="field-row col-3">
                  <div className="field-group">
                    <div className="label">Beds</div>
                    <input className="input" type="text" inputMode="numeric" value={data.beds || ""} onChange={updateNum("beds")} />
                  </div>
                  <div className="field-group">
                    <div className="label">Baths</div>
                    <input className="input" type="text" inputMode="decimal" value={data.baths || ""} onChange={updateNum("baths")} />
                  </div>
                  <div className="field-group">
                    <div className="label">Sqft</div>
                    <input className="input" type="text" inputMode="numeric" value={data.sqft || ""} onChange={updateNum("sqft")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Agent */}
            <div className="form-section">
              <h3>Agent & brokerage</h3>
              <p className="section-hint">Shown above the hero photo as the listing attribution.</p>
              <div className="fields">
                <div className="field-row col-2">
                  <div className="field-group">
                    <div className="label">Agent name</div>
                    <input className="input" type="text" value={data.agentName} onChange={update("agentName")} />
                  </div>
                  <div className="field-group">
                    <div className="label">Brokerage</div>
                    <input className="input" type="text" value={data.brokerage} onChange={update("brokerage")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="form-section">
              <h3>Photos</h3>
              <p className="section-hint">The first photo becomes the hero. Double-click a thumbnail to promote it. Add a room label to each — those labels show as pills on the hero.</p>
              <div className="fields">
                <div
                  className={"photos-dropzone" + (dragOver ? " dragover" : "")}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <Ic.Upload s={28} />
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                  <div><strong>Click to upload</strong> or drag photos here</div>
                  <div className="meta">JPG, PNG, HEIC · up to ~10MB each · upload multiple at once</div>
                </div>

                {data.photos.length > 0 && (
                  <div className="photos-grid">
                    {data.photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className={"photo-thumb" + (photoDragOverIdx === idx && photoDragIdx !== idx ? " drag-over" : "")}
                        draggable
                        onDragStart={() => setPhotoDragIdx(idx)}
                        onDragOver={(e) => { e.preventDefault(); setPhotoDragOverIdx(idx); }}
                        onDrop={() => { reorderPhotos(photoDragIdx, photoDragOverIdx); setPhotoDragIdx(null); setPhotoDragOverIdx(null); }}
                        onDragEnd={() => { setPhotoDragIdx(null); setPhotoDragOverIdx(null); }}
                        onDoubleClick={() => promoteToHero(p.id)}
                        title={idx === 0 ? "Hero photo" : "Drag to reorder · double-click to make hero"}
                        style={{ opacity: photoDragIdx === idx ? 0.4 : 1 }}
                      >
                        <img src={p.url} alt={p.name} />
                        {idx === 0 && <span className="hero-badge">Hero</span>}
                        <button className="remove" onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }} aria-label="Remove">
                          <Ic.X s={11} />
                        </button>
                        <input
                          className="label-input"
                          type="text"
                          placeholder="Room label"
                          value={p.label || ""}
                          onChange={(e) => setPhotoLabel(p.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-page-cta">
            <div className="left">
              {hasPhotos ? (
                <span><strong>Ready to share.</strong> Generate a link to send to your seller.</span>
              ) : (
                <span>Tip: photos make the biggest difference — add at least one to see the hero.</span>
              )}
            </div>
            <div className="actions">
              <button className="btn-secondary" onClick={onCopyLink} style={{ flex: "none", padding: "12px 24px" }}>
                {isCopied ? "Copied!" : "Copy share link"}
              </button>
              <button className="btn-primary" onClick={onGenerate} style={{ flex: "none", padding: "12px 24px" }}>
                Generate preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGES_BASE = "https://hayleyvmueller.github.io/prototype-builder/spotlight-preview";

// ============================================================
// App
// ============================================================
function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    // Store on window so the new tab can read it via window.opener — no size limits
    window.__previewData = data;
    window.open("preview.html", "_blank");
  };

  const copyShareLink = () => {
    const payload = { ...data, photos: [] };
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    const url = `${PAGES_BASE}/preview.html?d=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-logo">
          <img src="assets/realtor-logo.svg" alt="realtor.com" />
          <span className="for-pros">for Professionals</span>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-user">
          <div className="name">
            <span className="label">Welcome</span>
            <span>Samantha</span>
          </div>
          <div className="avatar">SR</div>
        </div>
      </div>

      <div className="body">
        <FormPage data={data} set={setData} onGenerate={generate} onCopyLink={copyShareLink} isCopied={copied} />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
