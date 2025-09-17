// Feature flags for configuring dashboard behavior through environment variables
export interface FeatureFlags {
  // Namespace management
  kubeflowMode: boolean;

  // Filtering and typing
  enableJobTypeFiltering: boolean;
  enableClusterTypeFiltering: boolean;

  // UI customization
  customBranding: boolean;
}

export class FeatureConfig implements FeatureFlags {
  get kubeflowMode(): boolean {
    return process.env.NEXT_KUBEFLOW_MODE === "true";
  }

  get enableJobTypeFiltering(): boolean {
    return process.env.NEXT_JOB_TYPE_FILTERING === "true";
  }

  get enableClusterTypeFiltering(): boolean {
    return process.env.NEXT_CLUSTER_TYPE_FILTERING === "true";
  }

  get customBranding(): boolean {
    return !!process.env.NEXT_DASHBOARD_TITLE || !!process.env.NEXT_LOGO_URL;
  }

  // Configuration getters
  get defaultNamespace(): string {
    return process.env.NEXT_DEFAULT_NAMESPACE || "default";
  }

  get defaultNamespaces(): string[] {
    const namespaces = process.env.NEXT_DEFAULT_NAMESPACES;
    return namespaces
      ? namespaces.split(",").map((ns) => ns.trim())
      : [this.defaultNamespace];
  }

  get dashboardTitle(): string {
    return process.env.NEXT_DASHBOARD_TITLE || "KubeRay Dashboard";
  }

  get logoUrl(): string | undefined {
    return process.env.NEXT_LOGO_URL;
  }

  get documentationUrl(): string | undefined {
    return process.env.NEXT_DOCUMENTATION_URL;
  }

  // Link templates
  get grafanaUrlTemplate(): string | undefined {
    return process.env.NEXT_GRAFANA_URL_TEMPLATE;
  }

  get logsUrlTemplate(): string | undefined {
    return process.env.NEXT_LOGS_URL_TEMPLATE;
  }

  get rayDashboardUrlTemplate(): string | undefined {
    return process.env.NEXT_RAY_DASHBOARD_URL_TEMPLATE;
  }

  get notebookUrlTemplate(): string | undefined {
    return process.env.NEXT_NOTEBOOK_URL_TEMPLATE;
  }
}

export const features = new FeatureConfig();
