import { LinkProvider, JobLinks, ClusterLinks } from "../types";
import { Job } from "@/types/rayjob";
import { Cluster } from "@/types/raycluster";
import { features } from "@/config/features";

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
    data: Job | Cluster,
  ): string {
    if (!template) return "";

    // Replace template variables with actual values from the data object
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}
