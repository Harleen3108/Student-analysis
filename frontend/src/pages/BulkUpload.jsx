import React, { useState } from 'react'
import { useQueryClient } from 'react-query'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { studentsAPI } from '../services/api'
import BulkUploadModal from '../components/Modals/BulkUploadModal'
import toast from 'react-hot-toast'

const BulkUpload = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadHistory, setUploadHistory] = useState([
    {
      id: 1,
      fileName: 'students_batch_1.xlsx',
      uploadDate: '2024-12-10',
      status: 'success',
      totalRecords: 150,
      successCount: 148,
      errorCount: 2,
      uploadedBy: 'Admin User'
    },
    {
      id: 2,
      fileName: 'students_batch_2.csv',
      uploadDate: '2024-12-08',
      status: 'partial',
      totalRecords: 75,
      successCount: 70,
      errorCount: 5,
      uploadedBy: 'Admin User'
    }
  ])
  const queryClient = useQueryClient()

  const handleBulkUpload = async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await studentsAPI.bulkUpload(formData)
      
      if (response.data.success) {
        // Add to upload history
        const newUpload = {
          id: Date.now(),
          fileName: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          status: response.data.errors?.length > 0 ? 'partial' : 'success',
          totalRecords: response.data.totalRecords,
          successCount: response.data.successCount,
          errorCount: response.data.errors?.length || 0,
          uploadedBy: 'Admin User'
        }
        
        setUploadHistory(prev => [newUpload, ...prev])
        queryClient.invalidateQueries(['students'])
        
        toast.success(`Successfully uploaded ${response.data.successCount} students!`)
        
        if (response.data.errors?.length > 0) {
          toast.error(`${response.data.errors.length} records had errors`)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
      throw error
    }
  }

  const downloadTemplate = () => {
    const csvContent = `firstName,lastName,rollNumber,class,section,email,phone,dateOfBirth,gender,address,parentName,parentPhone,parentEmail
John,Doe,ST001,10,A,john.doe@school.com,9876543210,2008-01-15,Male,"123 Main St, City",John Doe Sr,9876543200,parent@email.com
Jane,Smith,ST002,10,A,jane.smith@school.com,9876543211,2008-02-20,Female,"456 Oak Ave, City",Jane Smith Sr,9876543201,parent2@email.com
Mike,Johnson,ST003,10,B,mike.johnson@school.com,9876543212,2008-03-10,Male,"789 Pine Rd, City",Mike Johnson Sr,9876543202,parent3@email.com`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_bulk_upload_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Template downloaded successfully!')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      success: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bulk Upload Students</h1>
          <p className="text-gray-600">Upload multiple students using Excel or CSV files</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Students
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Download Template</h3>
              <p className="text-sm text-gray-600">Get the correct format for upload</p>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            className="btn-outline w-full mt-4"
          >
            Download CSV Template
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Upload Students</h3>
              <p className="text-sm text-gray-600">Add multiple students at once</p>
            </div>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary w-full mt-4"
          >
            Start Upload
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Upload Guidelines</h3>
              <p className="text-sm text-gray-600">Best practices and tips</p>
            </div>
          </div>
          <button className="btn-outline w-full mt-4">
            View Guidelines
          </button>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">File Requirements</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Supported formats: Excel (.xlsx, .xls) or CSV</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Maximum 1000 records per upload</li>
              <li>• UTF-8 encoding for special characters</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Required Fields</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• First Name, Last Name</li>
              <li>• Roll Number (must be unique)</li>
              <li>• Class, Section</li>
              <li>• Email, Phone</li>
              <li>• Date of Birth, Gender</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upload History</h3>
        </div>

        {uploadHistory.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No uploads yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start by uploading your first batch of students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadHistory.map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(upload.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{upload.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(upload.status)}`}>
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>Total: {upload.totalRecords}</div>
                        <div className="text-xs text-gray-500">
                          Success: {upload.successCount} • Errors: {upload.errorCount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(upload.successCount / upload.totalRecords) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {Math.round((upload.successCount / upload.totalRecords) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(upload.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.uploadedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleBulkUpload}
      />
    </div>
  )
}

export default BulkUpload