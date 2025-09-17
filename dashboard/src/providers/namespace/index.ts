import React, { useContext } from "react";
import { NamespaceProvider } from "../types";
import {
  StandaloneNamespaceProvider,
  NamespaceContext,
} from "./StandaloneNamespaceProvider";
import { KubeflowNamespaceProvider } from "./KubeflowNamespaceProvider";
import { features } from "@/config/features";

export const getNamespaceProvider = (): NamespaceProvider => {
  if (features.kubeflowMode) {
    return {
      useNamespace: () => useContext(NamespaceContext).namespace,
      NamespaceComponent: KubeflowNamespaceProvider,
      showDropdown: false, // Kubeflow manages namespace externally
    };
  }

  return {
    useNamespace: () => useContext(NamespaceContext).namespace,
    NamespaceComponent: StandaloneNamespaceProvider,
    showDropdown: true, // Show dropdown for standalone mode
  };
};

// Export the hook for components to use
export const useNamespace = () => {
  return useContext(NamespaceContext);
};
