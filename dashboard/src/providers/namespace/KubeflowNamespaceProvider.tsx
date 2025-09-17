import React, { useState, useEffect } from "react";
import {
  NamespaceContext,
  NamespaceContextType,
} from "./StandaloneNamespaceProvider";

export const KubeflowNamespaceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [namespace, setNamespace] = useState("");

  useEffect(() => {
    // From https://github.com/kubeflow/kubeflow/tree/bd7f250df22e144b114177536309d28651b4ddbb/components/centraldashboard#client-side-library
    // @ts-ignore - Kubeflow centraldashboard integration
    if (window.centraldashboard?.CentralDashboardEventHandler) {
      // @ts-ignore
      window.centraldashboard.CentralDashboardEventHandler.init((cdeh: any) => {
        // Binds a callback that gets invoked anytime the Dashboard's
        // namespace is changed
        cdeh.onNamespaceSelected = (namespace: string) => {
          setNamespace(namespace);
        };
      });
    }
  }, []);

  // Kubeflow manages namespace externally, so we don't allow changing it
  const contextValue: NamespaceContextType = {
    namespace,
    setNamespace: () => {}, // No-op in Kubeflow mode
    namespaces: namespace ? [namespace] : [],
  };

  return (
    <NamespaceContext.Provider value={contextValue}>
      {children}
    </NamespaceContext.Provider>
  );
};
