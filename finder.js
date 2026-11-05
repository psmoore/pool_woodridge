// Live schedule text for the Pool Relay mock-ups (Phantom Lake Club, Woodridge Swim Club, Northwest Water Polo Club).
// No hours, days or dates are typed into these pages. Every element below fills in from a published Pool Relay view:
//
//   data-live="today"    what is in the water today (now / later), else the next day something is on
//   data-live="week"     the next seven days, day by day: time, what, where, how many lanes
//   data-live="when"     a program's weekly pattern ("Tue & Thu 7:30–9pm · Woodridge"), read from the coming weeks
//   data-live="next"     the next session ("Tonight, 8–9:30pm at Phantom Lake")
//   data-live="through"  how far the published schedule runs ("through Thu, Nov 19")
//   data-live="closures" all-day closures coming up; the element hides when there are none
//   (data-lookback on "when": how many days back to read the last pattern when nothing is ahead; default 35)
//
// Each takes data-view (the share token) and optional filters: data-fac ("Phantom Lake Club|…"), data-groups (group ids,
// a group matches its subgroups too) and data-title (a regular expression on the booking title).
// <form data-follow data-view=…> signs a parent up for one team's change emails and offers calendar-app links.
(function () {
  const TZ = "America/Los_Angeles";
  const BASE = "https://www.poolrelay.com";
  const API = BASE + "/api/public/views/";

  const parts = (d) => Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d).map((p) => [p.type, p.value]));
  const P = parts(new Date());
  const TODAY = `${P.year}-${P.month}-${P.day}`;
  const NOW = `${P.hour}:${P.minute}`;
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dow = (iso) => new Date(iso + "T12:00:00Z").getUTCDay();
  const clock = (t) => { let [h, m] = t.split(":").map(Number); const ap = h >= 12 && h < 24 ? "pm" : "am"; h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, "0")}${ap}` : `${h}${ap}`; };
  const span = (a, b) => { const ap = (t) => (+t.split(":")[0] >= 12 ? "pm" : "am"); return ap(a) === ap(b) ? `${clock(a).replace(/[ap]m$/, "")}–${clock(b)}` : `${clock(a)}–${clock(b)}`; };
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const md = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const dayName = (iso) => (iso === TODAY ? "Today" : iso === addDays(TODAY, 1) ? "Tomorrow" : `${LONG[dow(iso)]}, ${md(iso)}`);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const joinDays = (ds) => {
    const s = [...new Set(ds)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // Monday first
    if (s.length >= 3 && s.every((d, i) => i === 0 || (d + 6) % 7 === (s[i - 1] + 6) % 7 + 1)) return `${DAYS[s[0]]}–${DAYS[s[s.length - 1]]}`;
    return s.length === 2 ? `${DAYS[s[0]]} & ${DAYS[s[1]]}` : s.map((d) => DAYS[d]).join(", ");
  };

  // ── One fetch per view, shared by every element that reads it ───────────────
  const cache = {};
  function feed(token) {
    const from = addDays(TODAY, -75), to = addDays(TODAY, 150);
    return (cache[token] ||= fetch(`${API}${token}/project?from=${from}&to=${to}`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(shape));
  }
  function shape({ occurrences, facilities, groups }) {
    const fac = {}, facShort = {}, isLane = {}, lanesIn = {}, layout = {};
    const walk = (n, f, parent) => {
      fac[n.id] = f.longName; facShort[n.id] = f.shortName || f.longName;
      if (n.type === "lane") { isLane[n.id] = true; layout[n.id] = parent; lanesIn[parent] = (lanesIn[parent] || 0) + 1; }
      (n.children || []).forEach((c) => walk(c, f, n.id));
    };
    (facilities || []).forEach((f) => walk(f, f, null));
    const gName = {}, gUp = {};
    const gwalk = (g, up) => { gName[g.id] = g.longName; gUp[g.id] = up; (g.children || []).forEach((c) => gwalk(c, g.id)); };
    (groups || []).forEach((g) => gwalk(g, null));
    const ancestors = (id) => { const a = []; for (let g = id; g; g = gUp[g]) a.push(g); return a; };
    const seen = new Set();
    const list = [];
    for (const o of occurrences || []) {
      const a = o.areaIds?.[0];
      const lanes = (o.areaIds || []).filter((x) => isLane[x]);
      const total = lanes.length ? lanesIn[layout[lanes[0]]] || 0 : 0;
      const ev = {
        ...o, fac: fac[a] || "", facShort: facShort[a] || "",
        groupsAll: (o.groupIds || []).flatMap(ancestors),
        teams: (o.groupIds || []).map((g) => gName[g]).filter(Boolean),
        laneText: !total ? "" : lanes.length >= total ? `all ${total} lanes` : `${lanes.length} of ${total} lanes`,
      };
      const k = `${ev.date}|${ev.start}|${ev.end}|${ev.title}|${ev.fac}`;
      if (seen.has(k)) continue; seen.add(k); list.push(ev);
    }
    return list.sort((x, y) => (x.date + (x.start || "")).localeCompare(y.date + (y.start || "")));
  }
  function pick(list, el) {
    const facs = el.dataset.fac ? el.dataset.fac.split("|") : null;
    const grps = el.dataset.groups ? el.dataset.groups.split("|") : null;
    const re = el.dataset.title ? new RegExp(el.dataset.title, "i") : null;
    return list.filter((o) => (!facs || facs.includes(o.fac)) && (!grps || o.groupsAll.some((g) => grps.includes(g))) && (!re || re.test(o.title)));
  }
  const isClosure = (o) => o.allDay && /clos/i.test(o.title);
  const timed = (list) => list.filter((o) => !o.allDay);
  const where = (o, el) => (el.dataset.showFac !== undefined && o.facShort ? ` · <span class="where">${esc(o.facShort)}</span>` : "");

  // A weekly pattern: identical blocks (title, time, pool) folded across weekdays.
  function patterns(list, el) {
    const by = {};
    for (const o of list) {
      const k = `${o.start}|${o.end}|${o.fac}${el.dataset.byTitle !== undefined ? "|" + o.title : ""}`;
      (by[k] ||= { o, days: [] }).days.push(dow(o.date));
    }
    return Object.values(by).sort((a, b) => {
      const da = Math.min(...a.days.map((d) => (d + 6) % 7)), db = Math.min(...b.days.map((d) => (d + 6) % 7));
      return da - db || a.o.start.localeCompare(b.o.start);
    }).map(({ o, days }) => ({ days: joinDays(days), time: span(o.start, o.end), fac: o.facShort, title: o.title }));
  }

  const render = {
    today(list, el) {
      const t = timed(list).filter((o) => o.date === TODAY);
      const closed = list.find((o) => isClosure(o) && o.date <= TODAY && (o.endDate || o.date) >= TODAY);
      if (closed) return `<p class="closed"><b>${esc(closed.title)}</b> today.</p>`;
      if (!t.length) {
        const n = timed(list).find((o) => o.date > TODAY);
        return n ? `<p>Nothing on the schedule today. Next: <b>${esc(dayName(n.date))}</b>, ${esc(span(n.start, n.end))} ${esc(n.title)}${where(n, el)}.</p>`
          : `<p>${esc(el.dataset.empty || "Nothing on the published schedule.")}</p>`;
      }
      return `<ul class="sess">${t.map((o) => {
        const now = o.start <= NOW && NOW < o.end, past = o.end <= NOW;
        return `<li class="${now ? "now" : past ? "past" : ""}"><span class="t">${esc(span(o.start, o.end))}</span> <b>${esc(o.title)}</b>${where(o, el)}${o.laneText ? ` <span class="ln">${esc(o.laneText)}</span>` : ""}${now ? ' <span class="pill">Now</span>' : ""}</li>`;
      }).join("")}</ul>`;
    },
    week(list, el) {
      const days = +(el.dataset.days || 7);
      const end = addDays(TODAY, days - 1);
      const t = list.filter((o) => o.date >= TODAY && o.date <= end);
      if (!t.filter((o) => !o.allDay).length) {
        const n = timed(list).find((o) => o.date > end);
        const last = timed(list).filter((o) => o.date < TODAY).pop();
        return `<p class="muted">${esc(el.dataset.empty || "Nothing on the schedule this week.")}${n ? ` Next: <b>${esc(dayName(n.date))}</b>, ${esc(span(n.start, n.end))} ${esc(n.title)}.` : last ? ` The last session on the schedule was ${esc(LONG[dow(last.date)])}, ${esc(md(last.date))}; the next session's times have not been entered yet.` : ""}</p>`;
      }
      let html = "";
      for (let d = TODAY; d <= end; d = addDays(d, 1)) {
        const on = t.filter((o) => (o.date <= d && (o.endDate || o.date) >= d) && (!o.allDay || o.date <= d));
        if (!on.length && el.dataset.skipEmpty !== undefined) continue;
        html += `<div class="day${d === TODAY ? " is-today" : ""}"><h4>${esc(dayName(d))}</h4>` + (on.length ? `<ul class="sess">${on.map((o) => o.allDay
          ? `<li class="closed"><b>${esc(o.title)}</b></li>`
          : `<li><span class="t">${esc(span(o.start, o.end))}</span> <b>${esc(o.title)}</b>${where(o, el)}${o.laneText ? ` <span class="ln">${esc(o.laneText)}</span>` : ""}</li>`).join("")}</ul>` : `<p class="muted none">Nothing scheduled</p>`) + "</div>";
      }
      return html;
    },
    when(list, el) {
      const t = timed(list);
      const ahead = t.filter((o) => o.date >= TODAY && o.date <= addDays(TODAY, 34));
      if (ahead.length) {
        return `<ul class="when">${patterns(ahead, el).map((p) => `<li><b>${esc(p.days)}</b> ${esc(p.time)}${el.dataset.byTitle !== undefined ? ` ${esc(p.title)}` : ""}${el.dataset.showFac !== undefined ? ` · ${esc(p.fac)}` : ""}</li>`).join("")}</ul>`;
      }
      const past = t.filter((o) => o.date < TODAY && o.date >= addDays(TODAY, -(+(el.dataset.lookback || 35))));
      if (!past.length) return `<p class="muted">${esc(el.dataset.empty || "Nothing on the published schedule yet.")}</p>`;
      const last = past[past.length - 1];
      return `<p class="muted">The last session was ${esc(LONG[dow(last.date)])}, ${esc(md(last.date))}. ${esc(el.dataset.pastNote || "The next session's times have not been entered yet.")} Until then the weekly pattern was:</p>` +
        `<ul class="when past">${patterns(past, el).map((p) => `<li><b>${esc(p.days)}</b> ${esc(p.time)}${el.dataset.byTitle !== undefined ? ` ${esc(p.title)}` : ""}${el.dataset.showFac !== undefined ? ` · ${esc(p.fac)}` : ""}</li>`).join("")}</ul>`;
    },
    next(list, el) {
      const n = timed(list).find((o) => o.date > TODAY || (o.date === TODAY && o.end > NOW));
      if (!n) return esc(el.dataset.empty || "No session on the published schedule yet.");
      const live = n.date === TODAY && n.start <= NOW;
      const when = live ? "Now" : n.date === TODAY ? (n.start >= "17:00" ? "Tonight" : "Today") : dayName(n.date);
      return `<b>${esc(when)}</b>, ${esc(span(n.start, n.end))}${el.dataset.showTitle !== undefined ? ` ${esc(n.title)}` : ""}${n.facShort ? ` at ${esc(n.facShort)}` : ""}`;
    },
    through(list, el) {
      const t = timed(list).filter((o) => o.date >= TODAY);
      if (!t.length) return esc(el.dataset.empty || "");
      const last = t[t.length - 1];
      return `${esc(el.dataset.prefix || "through")} ${esc(DAYS[dow(last.date)])}, ${esc(md(last.date))}`;
    },
    closures(list, el) {
      const c = list.filter((o) => isClosure(o) && (o.endDate || o.date) >= TODAY && o.date <= addDays(TODAY, +(el.dataset.ahead || 90)));
      if (!c.length) { el.hidden = true; return ""; }
      el.hidden = false;
      return `<ul class="closures">${c.map((o) => `<li><b>${esc(md(o.date))}${o.endDate && o.endDate !== o.date ? `–${esc(md(o.endDate))}` : ""}</b> ${esc(o.title)}</li>`).join("")}</ul>`;
    },
  };

  document.querySelectorAll("[data-live]").forEach((el) => {
    const fn = render[el.dataset.live];
    if (!fn) return;
    feed(el.dataset.view).then((list) => { el.innerHTML = fn(pick(list, el), el); el.classList.add("ready"); })
      .catch(() => { el.innerHTML = `<span class="muted">The live schedule could not be loaded. See the calendar below.</span>`; });
  });

  // ── Follow a team: change emails (double opt-in) and calendar-app links ──────
  document.querySelectorAll("form[data-follow]").forEach((form) => {
    const token = form.dataset.view;
    const sel = form.querySelector("select");
    const links = form.querySelector(".cal-links");
    const msg = form.querySelector(".msg");
    const feedUrl = (g) => `${BASE}/api/public/feeds/${token}/${g.replace(/^grp:/, "")}.ics`;
    const drawLinks = () => {
      const g = sel.value, name = sel.options[sel.selectedIndex].text;
      const https = feedUrl(g), webcal = https.replace(/^https?:\/\//, "webcal://");
      const q = `url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`;
      links.innerHTML = `<span>Add to your calendar:</span>
        <a href="https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}" target="_blank" rel="noopener noreferrer">Google</a>
        <a href="${webcal}">Apple</a>
        <a href="https://outlook.live.com/calendar/0/addfromweb?${q}" target="_blank" rel="noopener noreferrer">Outlook.com</a>
        <a href="https://outlook.office.com/calendar/0/addfromweb?${q}" target="_blank" rel="noopener noreferrer">Outlook (work/school)</a>`;
    };
    sel.addEventListener("change", drawLinks); drawLinks();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.querySelector("input[type=email]").value.trim();
      msg.textContent = "Sending…";
      try {
        const r = await fetch(`${API}${token}/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId: sel.value, email }) });
        const j = await r.json().catch(() => ({}));
        msg.textContent = r.ok ? `Check ${email} for a confirmation email. Updates start once you press Confirm.` : (j.error || "That didn't go through. Please try again.");
      } catch { msg.textContent = "That didn't go through. Please try again."; }
    });
  });
})();
