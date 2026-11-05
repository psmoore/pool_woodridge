#!/usr/bin/env python3
"""Build the Woodridge Swim Club preview: Home, Calendar & Hours, Rentals and Water Polo, in the look of
woodridgeswimclub.org, with every session, rental and closure read live from Pool Relay by finder.js.

Nothing about WHEN the pool is open is typed here: only prices, ages, policies and facts about the water. The club's own
schedule text appears only as labeled quotes.
Run: python3 build.py   (then python3 check.py)"""
import hashlib, html

E = html.escape
LANES = "qDBViA6j1TooChUAy2r0jS"  # Pool Relay tab: Woodridge Swim Club pool, lane by lane (day)
WEEK = "Nc7axAhzCRbiygA0GagJJG"   # Pool Relay tab: Woodridge Swim Club pool, week (every booking; feeds the live text)
WR = "https://woodridgeswimclub.org"
NWPC_SITE = "https://psmoore.github.io/pool_nwwaterpolo/"
NWPC = "grp:northwest-water-polo-club"
LAP = "grp:lap-swim-44"
OPEN = "grp:open-swim-10"
VER = hashlib.sha1((open("finder.js").read() + open("style.css").read()).encode()).hexdigest()[:8]

NAV = [("Home", "index.html"), ("Calendar & Hours", "calendar-hours.html"), ("WSC Membership", WR + "/wsc-membership"),
       ("Rentals", "rentals.html"), ("Lessons", WR + "/lessons"), ("About Us", WR + "/about-us"), ("Swim Team", WR + "/swim-team"),
       ("Water Polo", "water-polo.html"), ("Dive Team", WR + "/dive-team"), ("FAQ", WR + "/faq")]


def out(href, label, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<a{c} href="{E(href)}" target="_blank" rel="noopener noreferrer">{label}</a>'


def live(mode, token=WEEK, **kw):
    attrs = "".join(f' data-{k.replace("_", "-")}="{E(str(v))}"' if v is not True else f' data-{k.replace("_", "-")}' for k, v in kw.items())
    return f'data-live="{mode}" data-view="{token}"{attrs}'


def frame(token, title, height=760):
    return (f'<div class="frame"><iframe src="https://www.poolrelay.com/embed/{token}" height="{height}" title="{E(title)}" '
            f'loading="lazy"></iframe></div><p class="credit">Schedule by {out("https://www.poolrelay.com/", "Pool Relay")}</p>')


def quote(lines, src, label, who="Woodridge Swim Club's own text"):
    return (f'<blockquote class="quote"><span class="qh">{E(who)}, quoted from {out(src, label)}</span>'
            + "".join(f"<p>{E(l)}</p>" for l in lines) + "</blockquote>")


def link(label, href, here):
    if href.startswith("http"):
        return out(href, E(label))
    cls = ' class="here"' if href == here else ""
    return f'<a href="{href}"{cls}>{E(label)}</a>'


LIVE = '<span class="live-tag">Live</span>'
WAVE = '<svg class="wave" viewBox="0 0 60 8" aria-hidden="true"><path d="M0 5 Q15 0 30 5 T60 5" fill="none" stroke="#1f3a5f" stroke-width="2"/></svg>'


def page(file, title, body):
    nav = "".join(link(l, h, file) for l, h in NAV)
    doc = f"""<!doctype html>
<!-- UNOFFICIAL PREVIEW. Not a Woodridge Swim Club website. A mock-up of {WR}
     with the pool schedule on live Pool Relay calendars. Built to demonstrate Pool Relay; not affiliated with Woodridge Swim Club. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{E(title)} | Woodridge Swim Club (unofficial preview)</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@400;600;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css?v={VER}">
</head>
<body>
<div class="preview-note"><b>Unofficial preview — not a Woodridge Swim Club website.</b> A mock-up of {out(WR, "woodridgeswimclub.org")} with its pool schedule on live {out("https://www.poolrelay.com/", "Pool Relay")} calendars.</div>
<header class="site">
  <div class="top"><div class="social">{out("https://www.facebook.com/223320237696365", '<span class="sr" hidden>Facebook</span>', "fb")}{out("https://www.instagram.com/woodridgeswimclub12320/", '<span class="sr" hidden>Instagram</span>', "ig")}</div>
    <a class="brand" href="index.html"><span class="w">W</span>{WAVE}<span class="nm">Woodridge Swim Club</span></a>
    <div class="tools">{out(WR + "/m/account", "Sign In")}</div></div>
  <nav class="main" aria-label="Main">{nav}</nav>
  <details class="mnav"><summary>Menu ▾</summary><div class="mpanel">{nav}</div></details>
</header>
<main>
{body}
</main>
<footer>
  <p class="big">Woodridge Swim Club: an amazing swim community located at 12320 SE 14th Street in Bellevue, WA</p>
  <nav>{link("Rentals", "rentals.html", file)} {out(WR + "/about-us", "About Us")} {out(WR + "/jobs", "Jobs")} {out(WR + "/faq", "FAQ")} {out(WR + "/for-members", "For Members")}</nav>
  <p class="disc"><b>Unofficial preview.</b> Built to demonstrate embedded {out("https://www.poolrelay.com/", "Pool Relay")} schedules. Not operated by,
    endorsed by or affiliated with Woodridge Swim Club or Northwest Water Polo Club. The club's sessions were entered from its public WSC
    Member Calendar and its {out(WR + "/calendar-%26-hours", "Calendar &amp; Hours")} page; Northwest Water Polo Club's practices from that club's
    published schedule. Neither publishes lanes, so lane assignments are Pool Relay's estimate. Prices and policies are copied from
    {out(WR, "woodridgeswimclub.org")}, which remains the official source. No Woodridge Swim Club logo or photos are used.</p>
</footer>
<script src="finder.js?v={VER}"></script>
</body>
</html>
"""
    open(file, "w").write(doc)


BA = f"""<div class="ba">
  <div><h3>Today on woodridgeswimclub.org</h3><ul>
    <li>A Google Calendar in month view, plus off-season and summer hours typed into the page by hand.</li>
    <li>The two can disagree: the page and the calendar give different end dates for fall lap swim and the winter closure.</li>
    <li>Renters' practices are not on the calendar, so members can't see who has the pool in the evenings.</li></ul></div>
  <div class="a"><h3>In this preview</h3><ul>
    <li>One schedule for the pool, lane by lane: lap swim, lessons, member events and renters together.</li>
    <li>Every hour on every page is read from it, so the page and the calendar can no longer disagree.</li>
    <li>Renters keep their own bookings in the same calendar; see the {out(NWPC_SITE, "Northwest Water Polo Club preview")}.</li>
    <li>Members can follow lap swim from the calendar's filter row and get an email when it changes.</li></ul></div>
</div>"""

# ── Home ─────────────────────────────────────────────────────────────────────
page("index.html", "Home", f"""
<section class="hero"><div class="box"><h1>Welcome to<br>Woodridge Swim Club</h1>
  <a class="btn" href="rentals.html">Rent WSC for your club or organization</a></div></section>
<section class="band"><div class="wrap">
  <p class="lead">A thriving community bringing members together for summer fun, connection, and lasting memories. What started as a
    neighborhood pool has grown into a welcoming space where friends and family gather year after year.</p>
</div></section>
<section class="band tint"><div class="wrap">
  <h2 class="rule">At the pool {LIVE}</h2>
  <div class="cols">
    <div class="card"><h3>Today</h3><div {live("today", empty="Nothing on the schedule.")}>…</div></div>
    <div class="card"><h3>Fall Lap Swim</h3><div {live("when", groups=LAP, by_title=True)}>…</div>
      <p class="small" style="margin:0">Free for WSC members. Non-members: Fall Lap Swim Wave Pass $50, or $10 per session.</p>
      <div {live("closures", ahead=75)} style="margin-top:8px"></div></div>
  </div>
  <h3 style="margin-top:26px">This week</h3>
  <div class="week" {live("week", skip_empty=True, empty="Nothing in the pool this week.")}><p class="muted">Loading the week…</p></div>
</div></section>
<section class="band"><div class="wrap">
  <h2 class="rule">The pool, lane by lane {LIVE}</h2>
  <p class="small muted" style="text-align:center">Six lanes, 25 yards. Pick a day; use the filter row to show one program, and its
    <b>Subscribe</b> button to get an email when that program changes.</p>
  {frame(LANES, "Woodridge Swim Club pool, lane by lane", 760)}
</div></section>
<section class="band tint"><div class="wrap">
  <h2 class="rule">What's different</h2>
  {BA}
</div></section>
""")

# ── Calendar & Hours ─────────────────────────────────────────────────────────
page("calendar-hours.html", "Calendar & Hours", f"""
<section class="band"><div class="wrap">
  <h2 class="rule">Member Calendar {LIVE}</h2>
  {frame(WEEK, "Woodridge Swim Club pool, week", 800)}
</div></section>
<section class="band tint"><div class="wrap">
  <h2 class="rule">Off Season Hours {LIVE}</h2>
  <div class="cols">
    <div class="card"><h3>Fall Lap Swim</h3><div {live("when", groups=LAP, by_title=True)}>…</div>
      <p class="small">Runs <span {live("through", groups=LAP)}>…</span>. Free for WSC members; non-members can buy an unlimited Fall Lap Swim
        Wave Pass for $50, or pay $10 per session. Ages 12–17 swim with a guardian; the adults-only session says so.</p></div>
    <div class="card"><h3>Pool closures</h3><div {live("closures", ahead=120)}></div>
      <p class="small muted">Closures apply to renters and lap swim alike, and clear those hours from every list here.</p>
      <h3>Today</h3><div {live("today", empty="Nothing on the schedule.")}>…</div></div>
  </div>
  <h3>The coming week</h3>
  <div class="week" {live("week", empty="Nothing in the pool this week.")}><p class="muted">Loading…</p></div>
</div></section>
<section class="band"><div class="wrap">
  <h2 class="rule">Summer Season</h2>
  <p>Daily open swim through the summer, with two lanes roped for lap swimming early in the afternoon and one after. The summer schedule
    will read from the pool calendar once it is entered; the end of this season is below.</p>
  <div {live("when", groups=OPEN, lookback=60, past_note="Open swim is over for the year.")}>…</div>
  <ul class="facts"><li><b>Guests:</b> all guests sign the Guest Waiver before entering. More than 10 guests: contact
    <a href="mailto:manager@woodridgeswimclub.org">manager@woodridgeswimclub.org</a> for a reservation ($10 per guest per hour).</li>
    <li><b>Private lessons:</b> available by appointment.</li></ul>
  <h3>As published on the club's page today</h3>
  {quote(["Fall Lap Swim (September 16-December 12)", "Wednesdays 2:00-4:00PM and Sundays 12:00-2:00PM", "Adults 18+ only on Sundays.",
          "Full Closure to all Renters and Lap Swim between December 20th-31st for routine maintenance."], WR + "/calendar-%26-hours", "Calendar & Hours")}
  <p class="small muted">The club's Google Calendar runs the weekday lap swim to a later date than the page, and starts the winter closure a day
    later. Pool Relay holds the calendar's lap swim dates and the page's closure dates; the club should confirm both.</p>
</div></section>
""")

# ── Rentals ──────────────────────────────────────────────────────────────────
page("rentals.html", "Rentals", f"""
<section class="band"><div class="wrap">
  <h2 class="rule">Pool Rentals and Parties</h2>
  <div class="cols">
    <div><h3>Full-Pool Rentals to Schools and Private Clubs</h3>
      <p>Seasonal rentals to schools, swim teams, water polo teams, triathlon training groups, and private swim clubs, in spring, summer,
        fall or winter, at a fixed hourly rate. Contact the Pool President to discuss.</p>
      <p>{out(WR + "/rentals", "Ask about a rental", "btn")}</p></div>
    <div><h3>After-hours Pool Rental</h3>
      <p>Requires a pool membership and booking a week in advance for parties larger than 10. For smaller parties the pool deck gazebo may
        be reserved with early notice. The pool and deck stay open to members during regular hours.</p></div>
  </div>
</div></section>
<section class="band tint"><div class="wrap">
  <h2 class="rule">Our Renters {LIVE}</h2>
  <p style="text-align:center">The Woodridge Swim Club is proud to host these groups. Their bookings come from the same calendar as the club's own.</p>
  <div class="renter"><h3>Northwest Water Polo Club</h3>
    <div {live("when", groups=NWPC, by_title=True, past_note="Its next session has not been entered yet.")}>…</div>
    <p class="small" style="margin:0">Next: <span {live("next", groups=NWPC, show_title=True)}>…</span> · Published practices run
      <span {live("through", groups=NWPC)}>…</span> · {out(NWPC_SITE, "Club site (preview)")}</p></div>
  <h3>Open water for a new renter {LIVE}</h3>
  <p class="small">Every booking this week, so a school or club can see which hours are already taken:</p>
  <div class="week" {live("week")}><p class="muted">Loading…</p></div>
</div></section>
""")

# ── Water Polo ───────────────────────────────────────────────────────────────
page("water-polo.html", "Water Polo", f"""
<section class="band"><div class="wrap">
  <h2 class="rule">Woodridge Water Polo</h2>
  <p>WSC hosts the combined "Troverwood" Midlakes Water Polo Team for summer water polo fun: a great way to extend swimming skills in a
    team-oriented, supportive environment. Open to all members, no tryouts; coed teams for 10 and under, 12 and under, 14 and under,
    and 15 and up.</p>
  <ul class="facts"><li><b>Who:</b> athletes ages 8–17 with any Midlakes membership, or non-Midlakes members with a Junior Water Polo membership</li>
    <li><b>Before the first practice:</b> Midlakes Hold Harmless form, concussion information sheet, athlete safety certificate (parents and athletes)</li>
    <li><b>Contact:</b> <a href="mailto:waterpolo@woodridgeswimclub.org">waterpolo@woodridgeswimclub.org</a></li></ul>
  <p class="small muted">Next summer's practice and game times will read from the pool calendar once entered.</p>
</div></section>
<section class="band tint"><div class="wrap">
  <h2 class="rule">Year-round water polo at WSC {LIVE}</h2>
  <p>Players who want more than the summer league can train here with Northwest Water Polo Club, which rents the pool in the off-season:</p>
  <div class="card"><div {live("when", groups=NWPC, by_title=True, past_note="Its next session has not been entered yet.")}>…</div>
    <p class="small" style="margin:0">{out(NWPC_SITE, "Northwest Water Polo Club (preview)")}</p></div>
  {frame(WEEK, "Woodridge Swim Club pool, week", 760)}
</div></section>
""")
print("built 4 pages")
