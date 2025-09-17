import { FilterProvider } from "../types";
import { Job, Status } from "@/types/rayjob";
import { Cluster, ClusterStatus } from "@/types/raycluster";

/**
 * Extended filter provider that supports custom job and cluster type filtering
 * based on Kubernetes labels. This can be used by organizations that need
 * to categorize their Ray workloads beyond the standard types.
 *
 * This example shows how to filter jobs by "Batch API" type and clusters
 * by "Jobs" vs "Notebooks" based on specific label patterns.
 */
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

      // Extended type filtering based on labels
      if (typeFilter === 1) {
        // Batch API jobs
        // Example: Filter jobs based on a specific component label
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

      // Extended type filtering based on labels
      const isRayJob = this.clusterIsRayJob(cluster);
      if (typeFilter === 1 && isRayJob) return false; // Notebooks only
      if (typeFilter === 2 && !isRayJob) return false; // Jobs only

      return true;
    });
  }

  private clusterIsRayJob(cluster: Cluster): boolean {
    // Example: Determine if cluster is a Ray job based on component labels
    const jobType =
      cluster.clusterSpec.headGroupSpec.labels?.["mlp.rbx.com/component"];
    return jobType === "rayjob" || jobType === "rayllmbatchinference";
  }
}
