"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addProduct } from "@/lib/actions"
import { useRouter } from "next/navigation"

const initialProducts = [
  {
    name: "ICE",
    description: "Insurance Claim Engine - Automated insurance claim processing solution",
    price: 250000,
  },
  {
    name: "Enbed Technology",
    description: "Enterprise-grade embedded technology solutions for IoT devices",
    price: 180000,
  },
  {
    name: "Enbed Solutions",
    description: "Custom software solutions for enterprise businesses",
    price: 350000,
  },
  {
    name: "Enlyt",
    description: "Data analytics and business intelligence platform",
    price: 200000,
  },
]

export function SeedProducts() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  async function handleSeedProducts() {
    setIsSeeding(true)
    setMessage("Seeding products...")

    try {
      for (const product of initialProducts) {
        await addProduct(product.name, product.description, product.price)
      }

      setMessage("Products seeded successfully!")
      router.refresh()
    } catch (error) {
      console.error("Error seeding products:", error)
      setMessage("Error seeding products. Please try again.")
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
      <h2 className="text-xl font-medium">Seed Initial Products</h2>
      <p className="text-muted-foreground text-center mb-2">
        Add the initial product catalog (ICE, Enbed Technology, Enbed Solutions, Enlyt)
      </p>
      <Button onClick={handleSeedProducts} disabled={isSeeding} className="w-full max-w-xs">
        {isSeeding ? "Seeding..." : "Seed Products"}
      </Button>
      {message && (
        <p className={`mt-2 ${message.includes("Error") ? "text-destructive" : "text-green-600"}`}>{message}</p>
      )}
    </div>
  )
}
