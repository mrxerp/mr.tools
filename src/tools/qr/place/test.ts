import { strictEqual } from "node:assert";
import { buildGeoUrl, buildMapsUrl, generatePlaceQrDataUrl, parseCoordinate } from "./tool.ts";

export async function runTest() {
  strictEqual(parseCoordinate("51.5"), 51.5);
  strictEqual(parseCoordinate(" 37,422 "), 37.422);
  strictEqual(parseCoordinate("abc"), null);
  strictEqual(parseCoordinate(""), null);

  strictEqual(buildGeoUrl({ lat: "51.5", lng: "-0.12" }), "geo:51.5,-0.12");
  strictEqual(buildGeoUrl({ lat: "200", lng: "0" }), "");
  strictEqual(buildGeoUrl({ lat: "51", lng: "0" }), "geo:51,0");
  strictEqual(buildGeoUrl({ address: "x" }), "");

  strictEqual(
    buildMapsUrl({ address: "Main Street" }),
    "https://www.google.com/maps/search/?api=1&query=Main%20Street",
  );
  strictEqual(
    buildMapsUrl({ lat: "51.5", lng: "-0.12" }),
    "https://www.google.com/maps/search/?api=1&query=51.5,-0.12",
  );
  strictEqual(
    buildMapsUrl({ lat: "51.5", lng: "-0.12", label: "Office" }),
    "https://www.google.com/maps/search/?api=1&query=Office&center=51.5,-0.12&zoom=16",
  );
  strictEqual(
    buildMapsUrl({ lat: "51.5", lng: "-0.12", address: "Main Street" }),
    "https://www.google.com/maps/search/?api=1&query=Main%20Street&center=51.5,-0.12&zoom=16",
  );
  strictEqual(buildMapsUrl({}), "");

  const src = await generatePlaceQrDataUrl({ lat: "51.5", lng: "-0.12" }, "geo");
  strictEqual(src.startsWith("data:image/png;base64,"), true);
}
