import { useState, useRef } from 'react'
import { X, Upload, Download, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const BulkUploadModal = ({ isOpen, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    setIsLoading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onSubmit(selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setTimeout(() => {
        toast.success('Students uploaded successfully!')
        handleClose()
      }, 500)
      
    } catch (error) {
      toast.error(error.message || 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setIsLoading(false)
    onClose()
  }

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = `firstName,lastName,rollNumber,class,section,email,phone,dateOfBirth,gender
John,Doe,ST001,10A,A,john.doe@school.com,9876543210,2008-01-15,Male
Jane,Smith,ST002,10A,A,jane.smith@school.com,9876543211,2008-02-20,Female
Mike,Johnson,ST003,10B,B,mike.johnson@school.com,9876543212,2008-03-10,Male`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_upload_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Template downloaded successfully!')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Students</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Upload Instructions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use Excel (.xlsx, .xls) or CSV format</li>
                  <li>• Maximum file size: 5MB</li>
                  <li>• Download template for correct format</li>
                  <li>• Ensure all required fields are filled</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Download Template</p>
                <p className="text-sm text-gray-600">Get the correct format for upload</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn-outline flex items-center gap-2"
              disabled={isLoading}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-sm text-green-700">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-green-600 hover:text-green-800"
                    disabled={isLoading}
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                      disabled={isLoading}
                    >
                      Click to upload
                    </button>
                    {' '}or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">Excel or CSV files only</p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-gray-900">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="btn-outline flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="btn-primary flex-1"
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? 'Uploading...' : 'Upload Students'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkUploadModal