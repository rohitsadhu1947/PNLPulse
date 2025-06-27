"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from 'lucide-react';

const settingsSections = [
  { name: "Users", href: "/settings/users" },
  { name: "Roles", href: "/settings/roles" },
  { name: "RBAC", href: "/settings/rbac" },
  // Future: add more settings sections here
];

export default function SettingsLandingPage() {
  return (
    <div className="text-gray-500">Select a settings section from the sidebar.</div>
  );
} 