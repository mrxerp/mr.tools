import { strictEqual } from "node:assert";
import { buildWifiString, escapeWifiValue, generateWifiQrDataUrl } from "./tool.ts";

export async function runTest() {
  strictEqual(escapeWifiValue('My;Net"work:1,2\\'), "My\\;Net\\\"work\\:1\\,2\\\\");

  strictEqual(
    buildWifiString({ ssid: "MyCoffee", password: "p@ss", security: "WPA", hidden: false }),
    "WIFI:S:MyCoffee;T:WPA;P:p@ss;;",
  );
  strictEqual(
    buildWifiString({ ssid: "Wep", password: "k", security: "WEP", hidden: false }),
    "WIFI:S:Wep;T:WEP;P:k;;",
  );
  strictEqual(
    buildWifiString({ ssid: "OpenNet", password: "", security: "nopass", hidden: false }),
    "WIFI:S:OpenNet;T:nopass;;",
  );
  strictEqual(
    buildWifiString({ ssid: "Hidden", password: "x", security: "WPA", hidden: true }),
    "WIFI:S:Hidden;T:WPA;P:x;H:true;;",
  );
  strictEqual(
    buildWifiString({ ssid: "  ", password: "x", security: "WPA", hidden: false }),
    "",
  );
  strictEqual(
    buildWifiString({ ssid: "Net", password: "", security: "WPA", hidden: false }),
    "",
  );
  strictEqual(
    buildWifiString({ ssid: "A;B", password: "p", security: "WPA", hidden: false }),
    "WIFI:S:A\\;B;T:WPA;P:p;;",
  );

  const src = await generateWifiQrDataUrl({ ssid: "Test", password: "pw", security: "WPA", hidden: false });
  strictEqual(src.startsWith("data:image/png;base64,"), true);
}
