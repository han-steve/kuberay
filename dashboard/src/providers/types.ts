import React from "react";
import { Job, Jobs, Status } from "@/types/rayjob";
import { Cluster, ClusterStatus } from "@/types/raycluster";

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

export interface JobLinks {
  rayGrafanaDashboardLink: string;
  logsLink: string;
  rayHeadDashboardLink: string;
}

export interface ClusterLinks {
  rayGrafanaDashboardLink: string;
  rayHeadDashboardLink: string;
  notebookLink: string;
}

export interface LinkProvider {
  generateJobLinks(job: Job): JobLinks;
  generateClusterLinks(cluster: Cluster): ClusterLinks;
}
