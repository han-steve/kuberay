import { FilterProvider } from "../types";
import { StandardFilterProvider } from "./StandardFilterProvider";
import { ExtendedFilterProvider } from "./ExtendedFilterProvider";
import { features } from "@/config/features";

export const getFilterProvider = (): FilterProvider => {
  // Check for custom filter provider via environment variable
  const customProvider = process.env.NEXT_FILTER_PROVIDER;

  if (customProvider === "extended") {
    return new ExtendedFilterProvider();
  }

  return new StandardFilterProvider();
};
