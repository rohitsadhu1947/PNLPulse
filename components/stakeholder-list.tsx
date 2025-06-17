"use client"

import { useState } from "react"
import Link from "next/link"
import type { Stakeholder } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { deleteStakeholder } from "@/lib/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"

export function StakeholderList({
  stakeholders,
  clientId,
}: {
  stakeholders: Stakeholder[]
  clientId: number
}) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setIsDeleting(id)
    try {
      await deleteStakeholder(id, clientId)
    } catch (error) {
      console.error("Error deleting stakeholder:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  // Function to get badge color based on relationship status
  const getRelationshipBadgeColor = (status: string | null) => {
    switch (status) {
      case "Cold":
        return "bg-blue-200 text-blue-800"
      case "Engaged":
        return "bg-amber-200 text-amber-800"
      case "Advocate":
        return "bg-green-200 text-green-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  // Function to get badge color based on decision role
  const getDecisionRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "Decision Maker":
        return "bg-purple-200 text-purple-800"
      case "Influencer":
        return "bg-indigo-200 text-indigo-800"
      case "Gatekeeper":
        return "bg-red-200 text-red-800"
      case "User":
        return "bg-green-200 text-green-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  if (stakeholders.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No stakeholders found. Add your first stakeholder to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stakeholders.map((stakeholder) => (
        <div key={stakeholder.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{stakeholder.name}</h3>
              <p className="text-muted-foreground">{stakeholder.designation || "No designation"}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/clients/${clientId}/stakeholders/${stakeholder.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the stakeholder {stakeholder.name}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(stakeholder.id)}
                      disabled={isDeleting === stakeholder.id}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting === stakeholder.id ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{stakeholder.email || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p>{stakeholder.phone || "Not provided"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {stakeholder.decision_role && (
              <Badge className={getDecisionRoleBadgeColor(stakeholder.decision_role)}>
                {stakeholder.decision_role}
              </Badge>
            )}
            {stakeholder.relationship_status && (
              <Badge className={getRelationshipBadgeColor(stakeholder.relationship_status)}>
                {stakeholder.relationship_status}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
