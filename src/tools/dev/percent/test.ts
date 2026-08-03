import { strictEqual, throws } from "node:assert";
import {
  percentageOf,
  valueOf,
  change,
  percentToReach,
  round2,
} from "./tool.ts";

export async function runTest() {
  strictEqual(percentageOf(25, 200), 12.5, "25 of 200 is 12.5%");
  strictEqual(valueOf(15, 80), 12, "15% of 80 is 12");
  strictEqual(change(80, 100), 25, "80 to 100 is +25%");
  strictEqual(change(100, 80), -20, "100 to 80 is -20%");
  strictEqual(percentToReach(50, 75), 50, "50 to 75 needs +50%");
  strictEqual(round2(1.005), 1.01, "round2 rounds halves up");
  strictEqual(round2(33.333), 33.33, "round2 keeps two decimals");
  throws(() => percentageOf(1, 0), /zero/, "zero whole throws");
  throws(() => change(0, 5), /zero/, "zero from throws");
  throws(() => valueOf(Number.NaN, 5), /finite/, "NaN input throws");
}
