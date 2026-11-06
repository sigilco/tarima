import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-overture-"));
process.env.DATABASE_URL = join(dir, "test.db");

const { db } = await import("../db");
const { venueCatalog } = await import("../db/schema");
const { backfillOvertureCsv, overtureRowsToHits, parseOvertureCsv } =
  await import("./overture-backfill");

const CSV = `id,name,city,lat,lon,phone,email,website,operating_status
o1,Triple Rock Brewery,Berkeley,37.873419,-122.268746,+15108432739,,https://triplerock.com/,open
o2,Caffe Strada,Berkeley,37.8691109,-122.2548636,+15108435282,,https://strada.example,open
o3,Press Coffee,Berkeley,37.872778,-122.260411,,,,,,open
o4,The Faculty Club,Berkeley,37.87186,-122.255922,,,,,,open
o5,FSM Cafe,Berkeley,37.87242,-122.261014,,,https://www.lib.berkeley.edu/about/fsm-cafe/,open
o6,Gold Bean Cafe,Berkeley,37.87526,-122.25978,+19172444797,,,open
o7,Hinodeya,Berkeley,37.86842,-122.25896,,,https://hinodeyaramen.com/,open
o8,House of Three,Berkeley,37.87538,-122.25970,,,https://www.ho3berkeley.com/,open
o9,Thai Basil,Berkeley,37.86831,-122.25811,,,,,,open
o10,Chengdu Style,Berkeley,37.86868,-122.25667,,,,,,open
o11,Ladle and Leaf,Berkeley,37.87230,-122.25414,,,https://ladleandleaf.com,open
o12,Equator Coffee,Berkeley,37.86904,-122.25949,,,,,,open
o13,Yali's Cafe,Berkeley,37.87392,-122.25647,,,,,,open
o14,Micro Yali's,Berkeley,37.87166,-122.26179,,,,,,open
o15,Qualcomm Cafe,Berkeley,37.87479,-122.25870,,,,,,open
o16,Yi Fang Tea,Berkeley,37.86862,-122.25859,,,,,,open
o17,Take Eat Easy,Berkeley,37.86872,-122.26020,,,,,,open
o18,Momo Masala,Berkeley,37.87533,-122.25979,,,,,,open
o19,Steve's Korean B.B.Q.,Berkeley,37.86831,-122.25807,,,,,,open
o20,Berkeley Thai House,Berkeley,37.86800,-122.26000,,,,permanently_closed
`;

describe("overture backfill", () => {
  it("loads 20 fixture rows and excludes permanently_closed", () => {
    const rows = parseOvertureCsv(CSV);
    expect(rows).toHaveLength(20);
    const hits = overtureRowsToHits(rows);
    expect(hits).toHaveLength(19);
    expect(hits.some((h) => h.name.includes("Thai House"))).toBe(false);
    const { inserted } = backfillOvertureCsv(CSV);
    expect(inserted).toBe(19);
    const stored = db.select().from(venueCatalog).all();
    expect(stored).toHaveLength(19);
    expect(stored.every((r) => r.provider === "overture")).toBe(true);
    const withContact = stored.filter((r) => r.contactPhone || r.website);
    expect(withContact.every((r) => r.contactSource === "overture")).toBe(true);
  });
});
