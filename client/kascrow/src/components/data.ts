import { Lock } from "lucide-react";
import React from "react";
import type { LucideProps } from "lucide-react";

export interface IRecentEscrow {
  lucide: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  title: string;
  id: string;
  value: string;
  status: string;
}

export const recentEscrow = {
  lucide: Lock,
  title: "Level 80 Game Account",
  id: "ESC-992-KAS",
  value: "4500.00 KAS",
  status: "active",
};

export const recentEscrow2 = {
  lucide: Lock,
  title: "Digital Art Collection#4",
  id: "ESC-982-KAS",
  value: "12, 500.00 KAS",
  status: "completed",
};

export const recentEscrow3 = {
  lucide: Lock,
  title: "Domain Transfer",
  id: "ESC-192-KAS",
  value: "500.00 KAS",
  status: "pending",
};

export const recentEscrows: IRecentEscrow[] = [
  recentEscrow,
  recentEscrow2,
  recentEscrow3,
];
