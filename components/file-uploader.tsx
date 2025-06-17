"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addFileRecord } from "@/lib/actions"
import { FileText, Upload, X } from "lucide-react"
import { formatFileSize } from "@/lib/utils"

interface FileUploaderProps {
  entityType: "sales_rep" | "product" | "weekly_report"
  entityId: number
  uploadedBy?: number | null
  onSuccess?: () => void
  maxSize?: number // in bytes, default 5MB
  allowedTypes?: string[] // e.g. ['application/pdf', 'image/jpeg']
}

export function FileUploader({
  entityType,
  entityId,
  uploadedBy = null,
  onSuccess,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = [],
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file size
    if (maxSize && selectedFile.size > maxSize) {
      setError(`File size exceeds the maximum allowed size (${formatFileSize(maxSize)})`)
      return
    }

    // Check file type if allowedTypes is provided
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      setError(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`)
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // In a real app, you would upload the file to a storage service first
      // and then store the file metadata in the database
      // For this example, we'll simulate the file upload and just store the metadata

      // Simulate file upload - in a real app, you would upload to a storage service
      // and get back a URL or file path
      const simulatedFilename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`

      // Add file record to database
      const result = await addFileRecord(
        simulatedFilename,
        file.name,
        file.size,
        file.type,
        entityType,
        entityId,
        description || null,
        uploadedBy,
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to upload file")
      }

      // Reset form
      setFile(null)
      setDescription("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setError(typeof error === "string" ? error : "An error occurred while uploading the file")
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload File</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className={file ? "hidden" : ""}
            disabled={isUploading}
          />
          {!file && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Select File
            </Button>
          )}
        </div>
      </div>

      {file && (
        <div className="rounded-md border p-4 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={clearFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
          <div className="flex items-start gap-3">
            <div className="bg-muted rounded-md p-2">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="file-description">Description (optional)</Label>
            <Textarea
              id="file-description"
              placeholder="Add a description for this file"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none"
              rows={2}
              disabled={isUploading}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleUpload} disabled={isUploading} className="flex items-center gap-2">
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  )
}
