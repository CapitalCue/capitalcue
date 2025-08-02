'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/toaster'
import { useSearchParams } from 'next/navigation'
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  X
} from 'lucide-react'

interface Document {
  id: string
  filename: string
  originalFilename: string
  fileType: string
  fileSize: number
  uploadDate: string
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'ERROR'
  extractedMetrics: Record<string, any> | null
  processingError: string | null
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dragActive, setDragActive] = useState(false)
  
  const searchParams = useSearchParams()
  const showUpload = searchParams?.get('action') === 'upload'

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await apiClient.get<Document[]>('/documents')
      if (response.success && response.data) {
        setDocuments(response.data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles) return

    setUploading(true)
    const formData = new FormData()
    
    Array.from(selectedFiles).forEach((file) => {
      formData.append('documents', file)
    })

    try {
      const response = await apiClient.upload('/documents/upload', formData)
      if (response.success) {
        toast.success(`Successfully uploaded ${selectedFiles.length} document(s)`)
        setSelectedFiles(null)
        fetchDocuments()
      } else {
        toast.error(response.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return

    try {
      const response = await apiClient.delete(`/documents/${id}`)
      if (response.success) {
        toast.success('Document deleted successfully')
        fetchDocuments()
      } else {
        toast.error(response.error || 'Delete failed')
      }
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const handleDownload = async (id: string, filename: string) => {
    try {
      const blob = await apiClient.download(`/documents/${id}/download`)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Download failed')
      }
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const handleProcess = async (id: string) => {
    try {
      const response = await apiClient.post(`/documents/${id}/process`)
      if (response.success) {
        toast.success('Document processing started')
        fetchDocuments()
      } else {
        toast.error(response.error || 'Processing failed to start')
      }
    } catch (error) {
      toast.error('Processing failed to start')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPLOADED': return 'Uploaded'
      case 'PROCESSING': return 'Processing'
      case 'PROCESSED': return 'Processed'
      case 'ERROR': return 'Error'
      default: return status
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status === filter
    const matchesSearch = doc.originalFilename.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Documents
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your financial documents and data sources
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upload Documents</h3>
        </div>
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-900">
                  Drop files here or click to upload
                </span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  disabled={uploading}
                />
              </label>
              <p className="mt-2 text-sm text-gray-500">
                Supports PDF, Excel (.xlsx, .xls), and CSV files up to 10MB each
              </p>
            </div>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => {
                        const dt = new DataTransfer()
                        Array.from(selectedFiles).forEach((f, i) => {
                          if (i !== index) dt.items.add(f)
                        })
                        setSelectedFiles(dt.files.length > 0 ? dt.files : null)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Documents</option>
                  <option value="UPLOADED">Uploaded</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PROCESSED">Processed</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Your Documents ({filteredDocuments.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by uploading your first document'
                }
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.originalFilename}
                      </p>
                      <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                        <span>{getStatusText(doc.status)}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{formatDate(doc.uploadDate)}</span>
                        <span className="uppercase text-xs">{doc.fileType}</span>
                      </div>
                      {doc.processingError && (
                        <p className="mt-1 text-sm text-red-600">
                          Error: {doc.processingError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.status === 'UPLOADED' && (
                      <button
                        onClick={() => handleProcess(doc.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        Process
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(doc.id, doc.originalFilename)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.originalFilename)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {doc.extractedMetrics && Object.keys(doc.extractedMetrics).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-2">
                      Extracted Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(doc.extractedMetrics).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500">{key}:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}