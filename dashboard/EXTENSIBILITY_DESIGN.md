# KubeRay Dashboard Extensibility Design

## Overview

This document outlines the extensibility design for the KubeRay dashboard to enable Roblox and other organizations to
migrate company-specific customizations behind feature flags or extensions, rather than maintaining separate forks.
The goal is to support both standalone open-source deployments and enterprise integrations through a clean,
configurable architecture.

## Current State Analysis

Based on comparison between the current dashboard and `roblox-ray-frontend-reference`, the key differences that need
to be made extensible are:

1. **Namespace Management**: Roblox version assumes Kubeflow integration (no namespace dropdown), while open-source
   needs standalone namespace selection
2. **Job/Cluster Type Filtering**: Roblox has custom filtering for "Batch API" jobs and notebook vs. job cluster
   types based on `mlp.rbx.com` labels
3. **Link Generation**: Dashboard links are hardcoded vs. configurable
4. **Custom Labels**: Roblox-specific labels like `mlp.rbx.com/component` and `mlp.rbx.com/notebook-type`
5. **Boolean Feature Flag**: Current `roblox = false` flag controls multiple behaviors

## Extensibility Architecture

### 1. Feature Flag System

Replace the single `roblox` boolean with granular environment-based feature flags:

```typescript
// src/config/features.ts
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
```

### 2. Provider-Based Extensions

Create a provider system for different deployment contexts:

```typescript
// src/providers/types.ts
export interface NamespaceProvider {
  useNamespace(): string;
  NamespaceComponent: React.ComponentType<{ children: React.ReactNode }>;
  showDropdown: boolean;
}

export interface FilterProvider {
  getJobTypes(): string[];
  getClusterTypes(): string[];
  filterJobs(
    jobs: Job[],
    search: string,
    statusFilter: Status | null,
    typeFilter: number,
  ): Job[];
  filterClusters(
    clusters: Cluster[],
    search: string,
    statusFilter: ClusterStatus | null,
    typeFilter: number,
  ): Cluster[];
}

export interface LinkProvider {
  generateJobLinks(job: Job): JobLinks;
  generateClusterLinks(cluster: Cluster): ClusterLinks;
}
```

### 3. Namespace Provider Implementation

```typescript
// src/providers/namespace/StandaloneNamespaceProvider.tsx
export const StandaloneNamespaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [namespace, setNamespace] = useState(features.defaultNamespace);
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available namespaces from K8s API
    fetchNamespaces().then(setNamespaces);
  }, []);

  return (
    <NamespaceContext.Provider value={{ namespace, setNamespace, namespaces }}>
      {children}
    </NamespaceContext.Provider>
  );
};

// src/providers/namespace/KubeflowNamespaceProvider.tsx
export const KubeflowNamespaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [namespace, setNamespace] = useState('');

  useEffect(() => {
    // @ts-ignore - Kubeflow centraldashboard integration
    if (window.centraldashboard?.CentralDashboardEventHandler) {
      // @ts-ignore
      window.centraldashboard.CentralDashboardEventHandler.init((cdeh: any) => {
        cdeh.onNamespaceSelected = (namespace: string) => {
          setNamespace(namespace);
        };
      });
    }
  }, []);

  return (
    <NamespaceContext.Provider value={{ namespace, setNamespace: () => {}, namespaces: [namespace] }}>
      {children}
    </NamespaceContext.Provider>
  );
};

// src/providers/namespace/index.ts
export const getNamespaceProvider = (): NamespaceProvider => {
  if (features.kubeflowMode) {
    return {
      useNamespace: () => useContext(NamespaceContext).namespace,
      NamespaceComponent: KubeflowNamespaceProvider,
      showDropdown: false,
    };
  }

  return {
    useNamespace: () => useContext(NamespaceContext).namespace,
    NamespaceComponent: StandaloneNamespaceProvider,
    showDropdown: true,
  };
};
```

### 4. Filter Provider Implementation

```typescript
// src/providers/filter/StandardFilterProvider.ts
export class StandardFilterProvider implements FilterProvider {
  getJobTypes(): string[] {
    return ["All"];
  }

  getClusterTypes(): string[] {
    return ["All"];
  }

  filterJobs(
    jobs: Job[],
    search: string,
    statusFilter: Status | null,
    typeFilter: number,
  ): Job[] {
    return jobs.filter((job) => {
      if (
        statusFilter &&
        job.jobStatus.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (search && !job.name.toUpperCase().includes(search.toUpperCase())) {
        return false;
      }
      return true;
    });
  }

  filterClusters(
    clusters: Cluster[],
    search: string,
    statusFilter: ClusterStatus | null,
    typeFilter: number,
  ): Cluster[] {
    return clusters.filter((cluster) => {
      if (
        statusFilter &&
        cluster.clusterState.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (
        search &&
        !cluster.name.toUpperCase().includes(search.toUpperCase())
      ) {
        return false;
      }
      return true;
    });
  }
}

// src/providers/filter/ExtendedFilterProvider.ts
export class ExtendedFilterProvider implements FilterProvider {
  getJobTypes(): string[] {
    return ["All", "Batch API"];
  }

  getClusterTypes(): string[] {
    return ["All", "Jobs", "Notebooks"];
  }

  filterJobs(
    jobs: Job[],
    search: string,
    statusFilter: Status | null,
    typeFilter: number,
  ): Job[] {
    return jobs.filter((job) => {
      // Standard filtering
      if (
        statusFilter &&
        job.jobStatus.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (search && !job.name.toUpperCase().includes(search.toUpperCase())) {
        return false;
      }

      // Enterprise-specific type filtering
      if (typeFilter === 1) {
        // Batch API jobs
        const component =
          job.clusterSpec.headGroupSpec.labels?.["mlp.rbx.com/component"];
        return component === "rayllmbatchinference";
      }

      return true;
    });
  }

  filterClusters(
    clusters: Cluster[],
    search: string,
    statusFilter: ClusterStatus | null,
    typeFilter: number,
  ): Cluster[] {
    return clusters.filter((cluster) => {
      // Standard filtering
      if (
        statusFilter &&
        cluster.clusterState.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (
        search &&
        !cluster.name.toUpperCase().includes(search.toUpperCase())
      ) {
        return false;
      }

      // Enterprise-specific type filtering
      const isRayJob = this.clusterIsRayJob(cluster);
      if (typeFilter === 1 && isRayJob) return false; // Notebooks only
      if (typeFilter === 2 && !isRayJob) return false; // Jobs only

      return true;
    });
  }

  private clusterIsRayJob(cluster: Cluster): boolean {
    const jobType =
      cluster.clusterSpec.headGroupSpec.labels?.["mlp.rbx.com/component"];
    return jobType === "rayjob" || jobType === "rayllmbatchinference";
  }
}

// src/providers/filter/index.ts
export const getFilterProvider = (): FilterProvider => {
  // Check for custom filter provider via environment variable
  const customProvider = process.env.NEXT_FILTER_PROVIDER;

  if (customProvider === "extended") {
    return new ExtendedFilterProvider();
  }

  return new StandardFilterProvider();
};
```

### 5. Link Provider Implementation

```typescript
// src/providers/link/TemplateLinkProvider.ts
export class TemplateLinkProvider implements LinkProvider {
  generateJobLinks(job: Job): JobLinks {
    return {
      rayGrafanaDashboardLink: this.renderTemplate(
        features.grafanaUrlTemplate,
        job,
      ),
      logsLink: this.renderTemplate(features.logsUrlTemplate, job),
      rayHeadDashboardLink: this.renderTemplate(
        features.rayDashboardUrlTemplate,
        job,
      ),
    };
  }

  generateClusterLinks(cluster: Cluster): ClusterLinks {
    return {
      rayGrafanaDashboardLink: this.renderTemplate(
        features.grafanaUrlTemplate,
        cluster,
      ),
      rayHeadDashboardLink: this.renderTemplate(
        features.rayDashboardUrlTemplate,
        cluster,
      ),
      notebookLink: this.renderTemplate(features.notebookUrlTemplate, cluster),
    };
  }

  private renderTemplate(
    template: string | undefined,
    resource: Job | Cluster,
  ): string {
    if (!template) return "";

    let result = template;

    // Replace {{field}} and {{nested.field}} patterns
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, fieldPath) => {
      const value = this.getNestedValue(resource, fieldPath.trim());
      return value !== undefined ? String(value) : match;
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

// src/providers/link/BackendLinkProvider.ts
export class BackendLinkProvider implements LinkProvider {
  generateJobLinks(job: Job): JobLinks {
    // Use links provided by backend API
    return {
      rayGrafanaDashboardLink: job.rayGrafanaDashboardLink || "",
      logsLink: job.logsLink || "",
      rayHeadDashboardLink: job.rayHeadDashboardLink || "",
    };
  }

  generateClusterLinks(cluster: Cluster): ClusterLinks {
    return {
      rayGrafanaDashboardLink: cluster.rayGrafanaDashboardLink || "",
      rayHeadDashboardLink: cluster.rayHeadDashboardLink || "",
      notebookLink: cluster.notebookLink || "",
    };
  }
}

// src/providers/link/index.ts
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
```

### 6. Updated Table Components

```typescript
// src/components/JobsTable/JobsTable.tsx
export const JobsTable: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState(0);
  const filterProvider = getFilterProvider();
  const linkProvider = getLinkProvider();

  const filteredItems = useMemo(() => {
    return filterProvider.filterJobs(jobs, search, statusFilter, typeFilter)
      .map(job => ({
        ...transformJob(job),
        links: linkProvider.generateJobLinks(job),
      }));
  }, [jobs, search, statusFilter, typeFilter, filterProvider, linkProvider]);

  return (
    <>
      <FrontendTableToolbar
        // ... other props
        {...(features.enableJobTypeFiltering && {
          typeFilter,
          setTypeFilter,
          types: filterProvider.getJobTypes(),
        })}
      />
      <FrontendTable<JobRow>
        // ... other props
        renderRow={(row) => (
          <JobRowComponent
            row={row}
            enableGrafanaLink={!!features.grafanaUrlTemplate}
            enableLogsLink={!!features.logsUrlTemplate}
            enableRayDashboardLink={!!features.rayDashboardUrlTemplate}
          />
        )}
      />
    </>
  );
};

// src/components/ClustersTable/ClustersTable.tsx
export const ClustersTable: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState(0);
  const filterProvider = getFilterProvider();
  const linkProvider = getLinkProvider();

  const filteredItems = useMemo(() => {
    return filterProvider.filterClusters(clusters, search, statusFilter, typeFilter)
      .map(cluster => ({
        ...transformCluster(cluster),
        links: linkProvider.generateClusterLinks(cluster),
      }));
  }, [clusters, search, statusFilter, typeFilter, filterProvider, linkProvider]);

  return (
    <>
      <FrontendTableToolbar
        // ... other props
        {...(features.enableClusterTypeFiltering && {
          typeFilter,
          setTypeFilter,
          types: filterProvider.getClusterTypes(),
        })}
      />
      <FrontendTable<ClusterRow>
        // ... other props
        renderRow={(row) => (
          <ClusterRowComponent
            row={row}
            enableGrafanaLink={!!features.grafanaUrlTemplate}
            enableNotebookLink={!!features.notebookUrlTemplate}
            enableRayDashboardLink={!!features.rayDashboardUrlTemplate}
          />
        )}
      />
    </>
  );
};
```

### 7. Updated Layout

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const namespaceProvider = getNamespaceProvider();
  const NamespaceComponent = namespaceProvider.NamespaceComponent;

  return (
    <html lang="en">
      <body>
        <Script strategy="beforeInteractive" src="/dashboard_lib.bundle.js" />
        <CssVarsProvider>
          <NamespaceComponent>
            <FirstVisitProvider>
              <SnackBarProvider>
                <Box component="main" sx={{ px: 4, py: 2 }}>
                  <Breadcrumb showNamespaceDropdown={namespaceProvider.showDropdown} />
                  {children}
                </Box>
              </SnackBarProvider>
            </FirstVisitProvider>
          </NamespaceComponent>
        </CssVarsProvider>
      </body>
    </html>
  );
}
```

## Configuration Examples

### 1. Open Source Standalone (Default)

```bash
# No configuration needed - all defaults work for standalone deployment
# Results in:
# - Namespace dropdown enabled
# - No type filtering
# - No external links (buttons hidden)
# - Standard job/cluster views
```

### 2. Kubeflow Integration

```bash
NEXT_KUBEFLOW_MODE=true
NEXT_API_URL=https://kuberay-api.kubeflow-cluster.com/apis/v1

# Results in:
# - No namespace dropdown (Kubeflow provides namespace)
# - Standard filtering only
# - No external links unless configured
```

### 3. Enterprise Deployment with Extended Features

```bash
NEXT_KUBEFLOW_MODE=true
NEXT_FILTER_PROVIDER=extended
NEXT_JOB_TYPE_FILTERING=true
NEXT_CLUSTER_TYPE_FILTERING=true
NEXT_GRAFANA_URL_TEMPLATE=https://grafana.company.com/d/ray?cluster={{name}}
NEXT_LOGS_URL_TEMPLATE=https://logs.company.com/ray/{{name}}

# Results in:
# - Kubeflow namespace integration
# - "Batch API" job type filtering
# - "Jobs" vs "Notebooks" cluster type filtering
# - Working Grafana and logs links
```

### 4. Generic Enterprise with Custom Links

```bash
NEXT_API_URL=https://ray-api.company.com/apis/v1
NEXT_GRAFANA_URL_TEMPLATE=https://grafana.company.com/d/ray-dashboard?cluster={{name}}
NEXT_LOGS_URL_TEMPLATE=https://kibana.company.com/app/logs?query={{name}}
NEXT_RAY_DASHBOARD_URL_TEMPLATE=https://{{name}}-head.company.com:8265

# Results in:
# - Standalone namespace dropdown
# - Standard filtering
# - Custom enterprise links for monitoring
```

### 5. Advanced Template Examples

```bash
# Dynamic field access in templates
NEXT_GRAFANA_URL_TEMPLATE=https://grafana.company.com/d/ray?cluster={{name}}&namespace={{namespace}}
NEXT_LOGS_URL_TEMPLATE=https://logs.company.com/{{clusterSpec.headGroupSpec.labels.mlp.rbx.com/component}}/{{name}}
NEXT_NOTEBOOK_URL_TEMPLATE=https://{{annotations.mlp.rbx.com/notebook-url}}

# Branding customization
NEXT_DASHBOARD_TITLE=Company Ray Dashboard
NEXT_LOGO_URL=https://company.com/logo.png
NEXT_DOCUMENTATION_URL=https://docs.company.com/ray
```

## Migration Strategy

### Phase 1: Feature Flag Migration

1. Replace legacy boolean flags with granular feature flags
2. Update existing components to check specific feature flags instead of single boolean
3. Maintain backward compatibility during transition

### Phase 2: Provider System Implementation

1. Implement namespace provider system
2. Create filter provider system with standard and extended implementations
3. Implement link provider system with template and backend options

### Phase 3: Component Updates

1. Update table components to use provider-based filtering and linking
2. Update layout to use configurable namespace provider
3. Add conditional rendering based on feature flags

### Phase 4: Documentation and Examples

1. Document configuration options for different deployment scenarios
2. Create example configurations for common use cases
3. Provide migration guide for existing deployments

## Benefits

1. **Single Codebase**: Eliminates need for separate enterprise forks
2. **Open Source First**: Default configuration provides fully functional standalone dashboard
3. **Flexible Extensions**: Companies can add custom logic without modifying core code
4. **Environment-Based**: Configuration through environment variables follows 12-factor app principles
5. **Type Safety**: Full TypeScript support for all extension points
6. **Gradual Migration**: Can be implemented incrementally without breaking existing deployments
7. **Clear Separation**: Business logic separated from UI components through provider pattern

This design allows organizations to migrate their customizations behind feature flags while ensuring the open-source
version remains a complete,
standalone product that other organizations can easily extend for their needs.
