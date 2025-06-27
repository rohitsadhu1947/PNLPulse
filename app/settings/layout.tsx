'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from 'lucide-react';

const settingsSections = [
  { name: "Users", href: "/settings/users" },
  { name: "Roles", href: "/settings/roles" },
  { name: "RBAC", href: "/settings/rbac" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-50 border-r p-6">
        <Link
          href="/dashboard"
          className="flex items-center mb-6 text-blue-700 hover:text-blue-900 font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h2 className="text-lg font-semibold mb-6">Settings</h2>
        <nav className="space-y-2">
          {settingsSections.map((section) => (
            <Link
              key={section.name}
              href={section.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === section.href ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {section.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 