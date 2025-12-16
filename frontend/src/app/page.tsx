"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "wisekey_token";

type AnyObj = Record<string, any>;

function toNumberOrNull(v: string) {
  const s = (v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function toBool(v: string) {
  return v === "true";
}

function inp(): React.CSSProperties {
  return {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #555",
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
  };
}

export default function Home() {
  // ✅ hydration fix: render-ის დროს localStorage არ ვკითხულობთ
  const [hydrated, setHydrated] = useState(false);

  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState<string>("");
  const [me, setMe] = useState<any>(null);

  // ui state
  const [msg, setMsg] = useState<string>("");

  // list/search
  const [properties, setProperties] = useState<any[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("has_balcony=true");
  const [searchLoading, setSearchLoading] = useState(false);

  // inline edits
  const [priceEdits, setPriceEdits] = useState<Record<number, string>>({});
  const [updating, setUpdating] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});

  // details cache
  const [detailsOpen, setDetailsOpen] = useState<Record<number, boolean>>({});
  const [detailsLoading, setDetailsLoading] = useState<Record<number, boolean>>({});
  const [detailsData, setDetailsData] = useState<Record<number, any>>({});

  // create form
  const [createLoading, setCreateLoading] = useState(false);
  const [cTitle, setCTitle] = useState("New listing");
  const [cTransactionType, setCTransactionType] = useState("buy");
  const [cCity, setCCity] = useState("Tbilisi");
  const [cDistrict, setCDistrict] = useState("Vake");
  const [cStreet, setCStreet] = useState("Chavchavadze Ave");
  const [cCurrency, setCCurrency] = useState("USD");
  const [cPrice, setCPrice] = useState("100000");

  const [cAreaSqm, setCAreaSqm] = useState("80");
  const [cRooms, setCRooms] = useState("3");
  const [cBedrooms, setCBedrooms] = useState("2");
  const [cBathrooms, setCBathrooms] = useState("1");
  const [cFloor, setCFloor] = useState("8");
  const [cTotalFloors, setCTotalFloors] = useState("12");

  const [cNotFirstFloor, setCNotFirstFloor] = useState("true");
  const [cCondition, setCCondition] = useState("new_renov");
  const [cBuildingType, setCBuildingType] = useState("new_building");
  const [cHeatingType, setCHeatingType] = useState("central");

  const [cHasAC, setCHasAC] = useState("true");
  const [cParkingType, setCParkingType] = useState("underground");
  const [cHasBalcony, setCHasBalcony] = useState("true");
  const [cPetsAllowed, setCPetsAllowed] = useState("false");
  const [cFurnished, setCFurnished] = useState("full");

  const [cDescription, setCDescription] = useState("Created from UI");

  // ---------- localStorage helpers (only after mount) ----------
  useEffect(() => {
    setHydrated(true);
    try {
      const saved = window.localStorage.getItem(TOKEN_KEY) || "";
      if (saved) setToken(saved);
    } catch {
      // ignore
    }
  }, []);

  function saveToken(tkn: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, tkn);
    } catch {}
    setToken(tkn);
  }

  function clearToken() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken("");
  }

  // ---------- common ----------
  const btnBase: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #222",
    background: "#fff",
    color: "#000",
    fontWeight: 800,
    cursor: "pointer",
  };

  async function pingBackend() {
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setMsg(`✅ Backend OK: ${JSON.stringify(data)}`);
    } catch (e: any) {
      setMsg(`❌ Backend error: ${e?.message ?? String(e)}`);
    }
  }

  async function loadMe(tkn: string) {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMe(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (token) loadMe(token);
  }, [token]);

  async function login() {
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg(`❌ Login failed (${res.status}): ${t}`);
        return;
      }

      const data = await res.json();
      const tkn = data.access_token ?? data.token;

      if (!tkn) {
        setMsg("❌ Login ok, მაგრამ token ვერ ვიპოვე response-ში.");
        return;
      }

      saveToken(tkn);
      setMsg("✅ Logged in.");
      await loadMe(tkn);
    } catch (e: any) {
      setMsg(`❌ Login error: ${e?.message ?? String(e)}`);
    }
  }

  function logout() {
    clearToken();
    setMe(null);
    setProperties([]);
    setMsg("✅ Logged out.");
  }

  function seedEditsFromList(list: any[]) {
    const next: Record<number, string> = {};
    for (const p of list) {
      if (p?.id != null) next[p.id] = String(p.price ?? "");
    }
    setPriceEdits(next);
  }

  // ---------- properties list/search ----------
  async function loadProperties() {
    setMsg("");
    setPropsLoading(true);
    try {
      if (!token) {
        setMsg("❌ ჯერ Login გააკეთე (token არ მაქვს).");
        return;
      }

      const res = await fetch(`${API_BASE}/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg(`❌ Properties error (${res.status}): ${t}`);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProperties(list);
      seedEditsFromList(list);
      setMsg(`✅ Loaded ${list.length} properties.`);
    } catch (e: any) {
      setMsg(`❌ Properties fetch error: ${e?.message ?? String(e)}`);
    } finally {
      setPropsLoading(false);
    }
  }

  async function searchProperties() {
    setMsg("");
    setSearchLoading(true);
    try {
      if (!token) {
        setMsg("❌ ჯერ Login გააკეთე (token არ მაქვს).");
        return;
      }

      const qs = (searchQuery || "").trim();
      const url = qs ? `${API_BASE}/properties/search?${qs}` : `${API_BASE}/properties/search`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg(`❌ Search error (${res.status}): ${t}`);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setProperties(list);
      seedEditsFromList(list);
      setMsg(`✅ Search returned ${list.length} properties.`);
    } catch (e: any) {
      setMsg(`❌ Search fetch error: ${e?.message ?? String(e)}`);
    } finally {
      setSearchLoading(false);
    }
  }

  // ---------- update (PUT) ----------
  function buildPutPayloadFromProperty(p: AnyObj, newPrice: number | null) {
    // server-managed ველები ამოვიღოთ
    const { id, owner_id, created_at, updated_at, ...rest } = p || {};
    const title = (p?.title ?? "").toString().trim();

    // ✅ Backend-ს შენთან title required აქვს → ყოველთვის ვაგზავნით
    return {
      ...rest,
      title: title || "(untitled)",
      price: newPrice,
    };
  }

  async function updatePrice(propertyId: number) {
    setMsg("");

    if (!token) {
      setMsg("❌ ჯერ Login გააკეთე (token არ მაქვს).");
      return;
    }

    const current = properties.find((x) => x.id === propertyId);
    if (!current) {
      setMsg("❌ Property ვერ ვიპოვე სიაში (Load Properties ხელახლა).");
      return;
    }

    const raw = (priceEdits[propertyId] ?? "").trim();
    const price = raw === "" ? null : Number(raw);

    if (raw !== "" && Number.isNaN(price)) {
      setMsg("❌ Price უნდა იყოს რიცხვი.");
      return;
    }

    const payload = buildPutPayloadFromProperty(current, price);

    setUpdating((p) => ({ ...p, [propertyId]: true }));
    try {
      const res = await fetch(`${API_BASE}/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg(`❌ Update error (${res.status}): ${t}`);
        return;
      }

      const updated = await res.json();
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, ...updated } : p)));
      setPriceEdits((prev) => ({ ...prev, [propertyId]: String(updated.price ?? "") }));

      setMsg(`✅ Updated property #${propertyId} price to ${updated.price}.`);
    } catch (e: any) {
      setMsg(`❌ Update fetch error: ${e?.message ?? String(e)}`);
    } finally {
      setUpdating((p) => ({ ...p, [propertyId]: false }));
    }
  }

  // ---------- DELETE ----------
  async function deleteProperty(propertyId: number) {
    setMsg("");

    if (!token) {
      setMsg("❌ ჯერ Login გააკეთე (token არ მაქვს).");
      return;
    }

    const ok = window.confirm(`ნამდვილად გინდა წაშალო property #${propertyId}?`);
    if (!ok) return;

    setDeleting((p) => ({ ...p, [propertyId]: true }));
    try {
      const res = await fetch(`${API_BASE}/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg(`❌ Delete error (${res.status}): ${t}`);
        return;
      }

      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setPriceEdits((prev) => {
        const copy = { ...prev };
        delete copy[propertyId];
        return copy;
      });
      setMsg(`✅ Deleted property #${propertyId}.`);
    } catch (e: any) {
      setMsg(`❌ Delete fetch error: ${e?.message ?? String(e)}`);
    } finally {
      setDeleting((p) => ({ ...p, [propertyId]: false }));
    }
  }

  // ---------- DETAILS ----------
  async function toggleDetails(propertyId: number) {
    const isOpen = !!detailsOpen[propertyId];
    const nextOpen = !isOpen;

    setDetailsOpen((prev) => ({ ...prev, [propertyId]: nextOpen }));
    setMsg("");

    if (nextOpen && detailsData[propertyId] == null) {
      if (!token) {
        setMsg("❌ ჯერ Login გააკეთე (token არ მაქვს).");
        return;
      }

      setDetailsLoading((p) => ({ ...p, [propertyId]: true }));
      try {
        const res = await fetch(`${API_BASE}/properties/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const t = await res.text();
          setMsg(`❌ Details error (${res.status}): ${t}`);
          return;
        }
        const data = await res.json();
        setDetailsData((prev) => ({ ...prev, [propertyId]: data }));
      } catch (e: any) {
        setMsg(`❌ Details fetch error: ${e?.message ?? String(e)}`);
      } finally {
        setDetailsLoading((p) => ({ ...p, [propertyId]: false }));
      }
    }
  }

  // ---------- CREATE ----------
  function buildCreatePayload() {
    return {
      title: (cTitle || "").trim() || "New listing",
      transaction_type: cTransactionType,
      city: cCity,
      district: cDistrict,
      street: cStreet,
      currency: cCurrency,

      price: toNumberOrNull(cPrice),
      area_sqm: toNumberOrNull(cAreaSqm),
      rooms: toNumberOrNull(cRooms),
      bedrooms: toNumberOrNull(cBedrooms),
      bathrooms: toNumberOrNull(cBathrooms),
      floor: toNumberOrNull(cFloor),
      total_floors: toNumberOrNull(cTotalFloors),

      not_first_floor: toBool(cNotFirstFloor),
      condition: cCondition,
      building_type: cBuildingType,
      heating_type: cHeatingType,

      has_air_conditioning: toBool(cHasAC),
      parking_type: cParkingType,
      has_balcony: toBool(cHasBalcony),
      pets_allowed: toBool(cPetsAllowed),
      furnished: cFurnished,

      description: cDescription,
    };
  }

  async function createProperty() {
    setMsg("");

    if (!token) {
      setMsg("❌ ჯერ Login გააკეთე (token არ მაქვს).");
      return;
    }

    const payload = buildCreatePayload();
    if (!payload.title) {
      setMsg("❌ Title ცარიელია.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch(`${API_BASE}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg(`❌ Create error (${res.status}): ${t}`);
        return;
      }

      const created = await res.json();
      setProperties((prev) => [created, ...prev]);
      setPriceEdits((prev) => ({ ...prev, [created.id]: String(created.price ?? "") }));
      setMsg(`✅ Created property #${created.id}.`);
    } catch (e: any) {
      setMsg(`❌ Create fetch error: ${e?.message ?? String(e)}`);
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, Arial", maxWidth: 1200, color: "#fff" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>WiseKey MVP</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={pingBackend} style={btnBase}>
          Ping Backend
        </button>

        {/* ✅ hydration-safe: Logout ღილაკი მხოლოდ mount-ის მერე გამოჩნდება */}
        {hydrated && token ? (
          <button onClick={logout} style={btnBase}>
            Logout
          </button>
        ) : null}
      </div>

      {/* LOGIN */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #333",
          background: "rgba(255,255,255,0.04)",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10 }}>Login</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" style={{ ...inp(), minWidth: 260 }} />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
            style={{ ...inp(), minWidth: 260 }}
          />
          <button onClick={login} style={btnBase}>
            Login
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
          Token: {hydrated ? (token ? "✅ saved" : "❌ not set") : "…"}
        </div>

        {me ? (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            Me: <b>{me.full_name ?? me.email ?? "user"}</b> (id: {me.id})
          </div>
        ) : null}
      </section>

      {/* CREATE */}
      <section
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #333",
          background: "rgba(255,255,255,0.04)",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 10 }}>Create Property</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="title" style={inp()} />
          <input value={cTransactionType} onChange={(e) => setCTransactionType(e.target.value)} placeholder="transaction_type (buy/rent)" style={inp()} />
          <input value={cCity} onChange={(e) => setCCity(e.target.value)} placeholder="city" style={inp()} />

          <input value={cDistrict} onChange={(e) => setCDistrict(e.target.value)} placeholder="district" style={inp()} />
          <input value={cStreet} onChange={(e) => setCStreet(e.target.value)} placeholder="street" style={inp()} />
          <input value={cCurrency} onChange={(e) => setCCurrency(e.target.value)} placeholder="currency" style={inp()} />

          <input value={cPrice} onChange={(e) => setCPrice(e.target.value)} placeholder="price" style={inp()} />
          <input value={cAreaSqm} onChange={(e) => setCAreaSqm(e.target.value)} placeholder="area_sqm" style={inp()} />
          <input value={cRooms} onChange={(e) => setCRooms(e.target.value)} placeholder="rooms" style={inp()} />

          <input value={cBedrooms} onChange={(e) => setCBedrooms(e.target.value)} placeholder="bedrooms" style={inp()} />
          <input value={cBathrooms} onChange={(e) => setCBathrooms(e.target.value)} placeholder="bathrooms" style={inp()} />
          <input value={cFloor} onChange={(e) => setCFloor(e.target.value)} placeholder="floor" style={inp()} />

          <input value={cTotalFloors} onChange={(e) => setCTotalFloors(e.target.value)} placeholder="total_floors" style={inp()} />
          <select value={cNotFirstFloor} onChange={(e) => setCNotFirstFloor(e.target.value)} style={inp()}>
            <option value="true">not_first_floor: true</option>
            <option value="false">not_first_floor: false</option>
          </select>
          <input value={cCondition} onChange={(e) => setCCondition(e.target.value)} placeholder="condition" style={inp()} />

          <input value={cBuildingType} onChange={(e) => setCBuildingType(e.target.value)} placeholder="building_type" style={inp()} />
          <input value={cHeatingType} onChange={(e) => setCHeatingType(e.target.value)} placeholder="heating_type" style={inp()} />
          <select value={cHasAC} onChange={(e) => setCHasAC(e.target.value)} style={inp()}>
            <option value="true">has_air_conditioning: true</option>
            <option value="false">has_air_conditioning: false</option>
          </select>

          <input value={cParkingType} onChange={(e) => setCParkingType(e.target.value)} placeholder="parking_type" style={inp()} />
          <select value={cHasBalcony} onChange={(e) => setCHasBalcony(e.target.value)} style={inp()}>
            <option value="true">has_balcony: true</option>
            <option value="false">has_balcony: false</option>
          </select>
          <select value={cPetsAllowed} onChange={(e) => setCPetsAllowed(e.target.value)} style={inp()}>
            <option value="false">pets_allowed: false</option>
            <option value="true">pets_allowed: true</option>
          </select>

          <input value={cFurnished} onChange={(e) => setCFurnished(e.target.value)} placeholder="furnished" style={inp()} />
          <input value={cDescription} onChange={(e) => setCDescription(e.target.value)} placeholder="description" style={inp()} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={createProperty}
            disabled={createLoading}
            style={{
              ...btnBase,
              opacity: createLoading ? 0.7 : 1,
              cursor: createLoading ? "not-allowed" : "pointer",
            }}
          >
            {createLoading ? "Creating..." : "Create Property"}
          </button>
        </div>
      </section>

      {/* PROPERTIES */}
      <section style={{ padding: 16, borderRadius: 12, border: "1px solid #333", background: "rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Properties</h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={loadProperties}
              disabled={propsLoading}
              style={{ ...btnBase, opacity: propsLoading ? 0.7 : 1, cursor: propsLoading ? "not-allowed" : "pointer" }}
            >
              {propsLoading ? "Loading..." : "Load Properties"}
            </button>

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='e.g. has_balcony=true&district=Vake'
              style={{ ...inp(), minWidth: 320 }}
            />

            <button
              onClick={searchProperties}
              disabled={searchLoading}
              style={{ ...btnBase, opacity: searchLoading ? 0.7 : 1, cursor: searchLoading ? "not-allowed" : "pointer" }}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {properties.length === 0 ? (
            <div style={{ opacity: 0.9 }}>No properties loaded yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {properties.map((p) => (
                <div key={p.id} style={{ padding: 12, borderRadius: 12, border: "1px solid #444", background: "rgba(0,0,0,0.25)" }}>
                  <div style={{ fontWeight: 800 }}>
                    #{p.id} — {p.title ?? "(no title)"}
                  </div>

                  <div style={{ opacity: 0.9, marginTop: 4 }}>
                    {p.city ?? ""} {p.district ? `• ${p.district}` : ""} {p.street ? `• ${p.street}` : ""}
                  </div>

                  <div style={{ opacity: 0.9, marginTop: 4 }}>
                    Price: <b>{p.price ?? "—"}</b> {p.currency ?? ""}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                    <input
                      value={priceEdits[p.id] ?? ""}
                      onChange={(e) => setPriceEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="new price (number)"
                      style={{ ...inp(), width: 220 }}
                    />

                    <button
                      onClick={() => updatePrice(p.id)}
                      disabled={!!updating[p.id]}
                      style={{ ...btnBase, opacity: updating[p.id] ? 0.7 : 1, cursor: updating[p.id] ? "not-allowed" : "pointer" }}
                    >
                      {updating[p.id] ? "Updating..." : "Update Price"}
                    </button>

                    <button
                      onClick={() => deleteProperty(p.id)}
                      disabled={!!deleting[p.id]}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #a00",
                        background: "#fff",
                        color: "#a00",
                        fontWeight: 900,
                        cursor: deleting[p.id] ? "not-allowed" : "pointer",
                        opacity: deleting[p.id] ? 0.7 : 1,
                      }}
                    >
                      {deleting[p.id] ? "Deleting..." : "Delete"}
                    </button>

                    <button
                      onClick={() => toggleDetails(p.id)}
                      style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #444", background: "#fff", color: "#000", fontWeight: 900 }}
                    >
                      {detailsOpen[p.id] ? "Hide Details" : "View Details"}
                    </button>
                  </div>

                  {detailsOpen[p.id] ? (
                    <div style={{ marginTop: 10 }}>
                      {detailsLoading[p.id] ? (
                        <div style={{ opacity: 0.9 }}>Loading details...</div>
                      ) : (
                        <pre
                          style={{
                            marginTop: 8,
                            padding: 12,
                            borderRadius: 10,
                            border: "1px solid #555",
                            background: "rgba(255,255,255,0.06)",
                            whiteSpace: "pre-wrap",
                            overflowX: "auto",
                            color: "#fff",
                          }}
                        >
                          {JSON.stringify(detailsData[p.id] ?? p, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {msg ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#f7f7f7",
            color: "#000",
            whiteSpace: "pre-wrap",
          }}
        >
          {msg}
        </pre>
      ) : null}
    </main>
  );
}
