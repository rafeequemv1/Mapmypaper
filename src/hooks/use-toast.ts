
import * as React from "react";
import {
  useToast as useToastPrimitive,
  toast as toastPrimitive,
} from "@/components/ui/toast";

export const useToast = useToastPrimitive;
export const toast = toastPrimitive;
