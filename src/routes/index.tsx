// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { BakeryShop } from "@/components/BakeryShop";
import { Toaster } from "sonner";

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <BakeryShop />
      <Toaster position="top-right" richColors />
    </>
  ),
});