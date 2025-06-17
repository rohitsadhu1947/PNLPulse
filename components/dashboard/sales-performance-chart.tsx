"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  type TooltipProps,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface SalesData {
  week: string
  cashCollected: number
  invoicesRaised: number
  valueOfNewClients: number
  commission?: number
}

interface ChartProps {
  detailed?: boolean
}

export default function SalesPerformanceChart({ detailed = false }: ChartProps) {
  const [data, setData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/sales-performance")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching sales performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-background border shadow-sm">
          <CardContent className="p-2 text-xs">
            <p className="font-bold">{label}</p>
            {payload.map((entry, index) => (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {entry.name}: {formatCurrency(entry.value as number)}
              </p>
            ))}
          </CardContent>
        </Card>
      )
    }

    return null
  }

  if (detailed) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis tickFormatter={(value) => formatCurrency(value).replace("₹", "")} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="cashCollected" name="Cash Collected" fill="#10b981" />
          <Bar dataKey="invoicesRaised" name="Invoices Raised" fill="#6366f1" />
          <Bar dataKey="valueOfNewClients" name="Value of New Clients" fill="#f59e0b" />
          <Bar dataKey="commission" name="Commission" fill="#ec4899" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis tickFormatter={(value) => formatCurrency(value).replace("₹", "")} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="cashCollected" name="Cash Collected" stroke="#10b981" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="commission" name="Commission" stroke="#ec4899" strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  )
}
