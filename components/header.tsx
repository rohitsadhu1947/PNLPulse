"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Users, Package, FileText, Building2, Home } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Sales Reps", href: "/sales-reps", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Weekly Reports", href: "/weekly-reports", icon: FileText },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span className="font-bold">PNLPulse</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                    pathname === item.href ? "text-foreground" : "text-foreground/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">{/* Auth components will be added here later */}</div>
      </div>
    </header>
  )
}
