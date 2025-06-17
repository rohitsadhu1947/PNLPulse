"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

interface FileUploadProps {
  onUpload: (file: File) => void
  accept?: string
  defaultPreview?: string
  label?: string
}

export function FileUpload({ onUpload, accept = "image/*", defaultPreview, label = "Upload Image" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultPreview || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Call the onUpload callback
    setIsUploading(true)
    try {
      onUpload(file)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="file-upload">{label}</Label>

      <div className="flex flex-col items-center gap-4">
        {preview && (
          <div className="relative w-40 h-40 border rounded-md overflow-hidden">
            <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button type="button" variant="outline" onClick={triggerFileInput} disabled={isUploading}>
            {isUploading ? "Uploading..." : preview ? "Change Image" : "Select Image"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" onClick={() => setPreview(null)} className="text-destructive">
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
