"use client"

import { useState, useRef } from "react"
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadedReceipt {
  id: string
  fileName: string
  filePath: string
}

interface ReceiptUploadProps {
  transactionId?: string
  onUploadComplete?: (receipt: UploadedReceipt) => void
  disabled?: boolean
}

export function ReceiptUpload({
  transactionId,
  onUploadComplete,
  disabled = false,
}: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError("")

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (transactionId) {
        formData.append("transactionId", transactionId)
      }

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setProgress(percentComplete)
        }
      })

      const response = await new Promise<{ success: boolean; receipt?: UploadedReceipt; error?: string }>((resolve, reject) => {
        xhr.open("POST", "/api/upload")

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              resolve({ success: false, error: errorData.error })
            } catch {
              resolve({ success: false, error: "Upload failed" })
            }
          }
        }

        xhr.onerror = () => reject(new Error("Network error"))

        xhr.send(formData)
      })

      if (response.success && response.receipt) {
        onUploadComplete?.(response.receipt)
      } else {
        setError(response.error || "Upload failed")
      }
    } catch {
      setError("Failed to upload file")
    } finally {
      setUploading(false)
      setProgress(0)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Uploading...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">{progress}%</div>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className="h-6 w-6 mx-auto text-gray-400" />
            <div className="text-sm text-gray-600">
              Click or drag to upload receipt
            </div>
            <div className="text-xs text-gray-400">
              JPG, PNG, PDF (max 5MB)
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
      )}
    </div>
  )
}

interface ReceiptThumbnailProps {
  receipt: {
    id: string
    fileName: string
    filePath: string
  }
  onDelete?: () => void
  onClick?: () => void
  showDelete?: boolean
}

export function ReceiptThumbnail({
  receipt,
  onDelete,
  onClick,
  showDelete = true,
}: ReceiptThumbnailProps) {
  const isPdf = receipt.fileName.toLowerCase().endsWith(".pdf")
  const apiPath = `/api/uploads/${receipt.filePath.split("/").pop()}`

  return (
    <div className="relative inline-block group">
      <div
        onClick={onClick}
        className="w-12 h-12 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center bg-gray-50"
      >
        {isPdf ? (
          <FileText className="h-6 w-6 text-red-500" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apiPath}
            alt={receipt.fileName}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      {showDelete && onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

interface ReceiptListProps {
  receipts: Array<{
    id: string
    fileName: string
    filePath: string
  }>
  onDelete?: (receiptId: string) => void
  onView?: (receipt: { id: string; fileName: string; filePath: string }) => void
}

export function ReceiptList({ receipts, onDelete, onView }: ReceiptListProps) {
  if (receipts.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {receipts.map((receipt) => (
        <ReceiptThumbnail
          key={receipt.id}
          receipt={receipt}
          onDelete={onDelete ? () => onDelete(receipt.id) : undefined}
          onClick={onView ? () => onView(receipt) : undefined}
        />
      ))}
    </div>
  )
}
