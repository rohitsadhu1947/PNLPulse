"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { deleteFileRecord, updateFileRecord } from "@/lib/actions"
import { formatFileSize, formatDate } from "@/lib/utils"
import type { File as FileType } from "@/lib/db"
import { Download, FileText, MoreVertical, Pencil, Trash2 } from "lucide-react"

interface FileListProps {
  files: FileType[]
  entityType: "sales_rep" | "product" | "weekly_report"
  entityId: number
  onRefresh?: () => void
}

export function FileList({ files, entityType, entityId, onRefresh }: FileListProps) {
  const [editingFile, setEditingFile] = useState<FileType | null>(null)
  const [description, setDescription] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileType | null>(null)

  const handleEditClick = (file: FileType) => {
    setEditingFile(file)
    setDescription(file.description || "")
  }

  const handleUpdateDescription = async () => {
    if (!editingFile) return

    setIsUpdating(true)
    try {
      const result = await updateFileRecord(editingFile.id, description, entityType, entityId)

      if (!result.success) {
        throw new Error(result.error || "Failed to update file")
      }

      // Reset state
      setEditingFile(null)

      // Refresh the file list
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error updating file:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = (file: FileType) => {
    setFileToDelete(file)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteFileRecord(fileToDelete.id, entityType, entityId)

      if (!result.success) {
        throw new Error(result.error || "Failed to delete file")
      }

      // Reset state
      setDeleteDialogOpen(false)
      setFileToDelete(null)

      // Refresh the file list
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Function to determine file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    // In a real app, you would have different icons for different file types
    return <FileText className="h-8 w-8 text-primary" />
  }

  // Function to handle file download
  const handleDownload = (file: FileType) => {
    // In a real app, you would fetch the file from your storage service
    // and trigger a download
    alert(`In a real app, this would download the file: ${file.original_filename}`)
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="bg-muted rounded-md p-2">{getFileIcon(file.mime_type)}</div>
                <div>
                  <CardTitle className="text-base">{file.original_filename}</CardTitle>
                  <CardDescription>
                    {formatFileSize(file.file_size)} • Uploaded {formatDate(file.created_at)}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditClick(file)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Description
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(file)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          {file.description && (
            <CardContent>
              <p className="text-sm">{file.description}</p>
            </CardContent>
          )}
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleDownload(file)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardFooter>
        </Card>
      ))}

      {/* Edit Description Dialog */}
      {editingFile && (
        <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit File Description</DialogTitle>
              <DialogDescription>Update the description for {editingFile.original_filename}</DialogDescription>
            </DialogHeader>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this file"
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFile(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdateDescription} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {fileToDelete?.original_filename}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
