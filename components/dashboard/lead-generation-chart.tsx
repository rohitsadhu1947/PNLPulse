"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  type TooltipProps,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface LeadData {
  name: string
  leadsGenerated: number
  leadsConverted: number
  valueOfConvertedLeads: number
  commission: number
}

interface ChartProps {
  detailed?: boolean
}

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"]

export default function LeadGenerationChart({ detailed = false }: ChartProps) {
  const [data, setData] = useState<LeadData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/lead-generation")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching lead generation data:", error)
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
            <p className="font-bold">{label || payload[0]?.name}</p>
            {payload.map((entry, index) => (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {entry.name}:{" "}
                {entry.name.includes("value") || entry.name.includes("commission")
                  ? formatCurrency(entry.value as number)
                  : entry.value}
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
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => formatCurrency(value).replace("₹", "")}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="leadsGenerated" name="Leads Generated" fill="#10b981" />
          <Bar yAxisId="left" dataKey="leadsConverted" name="Leads Converted" fill="#6366f1" />
          <Bar yAxisId="right" dataKey="valueOfConvertedLeads" name="Value of Converted Leads" fill="#f59e0b" />
          <Bar yAxisId="right" dataKey="commission" name="Commission" fill="#ec4899" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // Prepare data for pie chart
  const pieData = data.map((item) => ({
    name: item.name,
    value: item.commission,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="leadsGenerated" name="Leads Generated" fill="#10b981" />
          <Bar dataKey="leadsConverted" name="Leads Converted" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
