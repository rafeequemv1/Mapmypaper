
import { useState } from 'react';

export const useFlowchartCache = () => {
  const getCachedFlowchart = (pdfKey: string | null) => {
    return sessionStorage.getItem(`cachedFlowchart_${pdfKey || 'default'}`);
  };

  const setCachedFlowchart = (pdfKey: string | null, flowchart: string) => {
    sessionStorage.setItem(`cachedFlowchart_${pdfKey || 'default'}`, flowchart);
  };

  return {
    getCachedFlowchart,
    setCachedFlowchart
  };
};
