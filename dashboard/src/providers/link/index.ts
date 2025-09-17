import { LinkProvider } from "../types";
import { TemplateLinkProvider } from "./TemplateLinkProvider";
import { BackendLinkProvider } from "./BackendLinkProvider";
import { features } from "@/config/features";

export const getLinkProvider = (): LinkProvider => {
  // If any template is provided, use template-based link generation
  const hasTemplates = !!(
    features.grafanaUrlTemplate ||
    features.logsUrlTemplate ||
    features.rayDashboardUrlTemplate ||
    features.notebookUrlTemplate
  );

  if (hasTemplates) {
    return new TemplateLinkProvider();
  }

  // Default to backend-provided links
  return new BackendLinkProvider();
};
