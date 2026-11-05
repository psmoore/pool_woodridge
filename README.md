# Woodridge Swim Club — unofficial preview

A mock-up of [woodridgeswimclub.org](https://woodridgeswimclub.org) (Home, Calendar & Hours, Rentals, Water Polo) in the look of the
club's GoDaddy site, with the pool schedule on live [Pool Relay](https://www.poolrelay.com) calendars. Not operated by, endorsed by or
affiliated with Woodridge Swim Club. No logo or photos are used.

No schedule is typed into the pages: `finder.js` fills every `data-live` element from the Pool Relay views; `check.py` fails the build
on any time, weekday or date outside a script or a labeled quote. Build with `python3 build.py && python3 check.py`.

- Pool Relay views: `qDBViA6j1TooChUAy2r0jS` (pool, lane by lane) and `Nc7axAhzCRbiygA0GagJJG` (pool, week; feeds the live text).
- Data (read 2026-11-05): the club's public WSC Member Calendar and its Calendar & Hours page (fall lap swim, open swim weekends,
  private lessons, member events, the winter maintenance closure), and Northwest Water Polo Club's fall practices (renter).
  Six lanes, 25 yards (club FAQ). Lanes are estimates. The page and the calendar disagree on the lap swim end and closure start.
