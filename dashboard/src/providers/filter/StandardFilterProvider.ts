import { FilterProvider } from "../types";
import { Job, Status } from "@/types/rayjob";
import { Cluster, ClusterStatus } from "@/types/raycluster";

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
      // case-insensitive search
      if (
        statusFilter &&
        job.jobStatus.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (search && !job.name.toUpperCase().includes(search.toUpperCase())) {
        return false;
      }
      // For standard provider, typeFilter is ignored since we only have 'All'
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
      // For standard provider, typeFilter is ignored since we only have 'All'
      return true;
    });
  }
}
