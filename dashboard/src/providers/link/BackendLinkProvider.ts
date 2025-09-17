import { LinkProvider, JobLinks, ClusterLinks } from "../types";
import { Job } from "@/types/rayjob";
import { Cluster } from "@/types/raycluster";

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
