import React, { useState, useEffect } from "react";
import { features } from "@/config/features";

export interface NamespaceContextType {
  namespace: string;
  setNamespace: (namespace: string) => void;
  namespaces: string[];
}

export const NamespaceContext = React.createContext<NamespaceContextType>({
  namespace: "default",
  setNamespace: () => {},
  namespaces: ["default"],
});

export const StandaloneNamespaceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [namespace, setNamespace] = useState(features.defaultNamespace);
  const [namespaces, setNamespaces] = useState<string[]>(
    features.defaultNamespaces,
  );

  useEffect(() => {
    // If user hasn't configured namespaces, try to fetch from API
    if (
      features.defaultNamespaces.length === 1 &&
      features.defaultNamespaces[0] === features.defaultNamespace
    ) {
      // TODO: Fetch available namespaces from K8s API via KubeRay API server
      // fetchNamespaces().then(setNamespaces).catch(() => {
      //   // Keep the default if API fails
      // });

      // For now, provide some common namespaces as fallback
      setNamespaces([
        features.defaultNamespace,
        "kube-system",
        "kuberay-system",
      ]);
    }
  }, []);

  return (
    <NamespaceContext.Provider value={{ namespace, setNamespace, namespaces }}>
      {children}
    </NamespaceContext.Provider>
  );
};
