import React, { useState } from 'react'
import { Download, FileText, Calendar, Filter, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

const Reports = () => {
  const [selectedReportType, setSelectedReportType] = useState('risk-analysis')
  const [dateRange, setDateRange] = useState('last-30-days')
  const [classFilter, setClassFilter] = useState('all')

  const reportTypes = [
    {
      id: 'risk-analysis',
      name: 'Risk Analysis Report',
      description: 'Comprehensive analysis of student dropout risk factors',
      icon: '⚠️'
    },
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Student attendance patterns and trends',
      icon: '📊'
    },
    {
      id: 'academic-performance',
      name: 'Academic Performance Report',
      description: 'Grade analysis and academic progress tracking',
      icon: '📈'
    },
    {
      id: 'intervention-summary',
      name: 'Intervention Summary',
      description: 'Overview of intervention programs and their effectiveness',
      icon: '💝'
    },
    {
      id: 'class-overview',
      name: 'Class Overview Report',
      description: 'Class-wise performance and risk distribution',
      icon: '🏫'
    },
    {
      id: 'parent-communication',
      name: 'Parent Communication Log',
      description: 'Record of parent meetings and communications',
      icon: '👨‍👩‍👧‍👦'
    }
  ]

  const recentReports = [
    {
      id: 1,
      name: 'Monthly Risk Analysis - November 2024',
      type: 'Risk Analysis Report',
      generatedDate: '2024-12-01',
      size: '2.4 MB',
      format: 'PDF'
    },
    {
      id: 2,
      name: 'Class 10A Attendance Report',
      type: 'Attendance Report',
      generatedDate: '2024-11-28',
      size: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 3,
      name: 'Intervention Effectiveness Q4 2024',
      type: 'Intervention Summary',
      generatedDate: '2024-11-25',
      size: '3.1 MB',
      format: 'PDF'
    }
  ]

  const handleGenerateReport = async () => {
    try {
      const reportConfig = {
        type: selectedReportType,
        dateRange,
        classFilter,
        format: 'pdf', // Could be made configurable
        timestamp: new Date().toISOString()
      }
      
      console.log('Generating report with config:', reportConfig)
      
      // Simulate API call delay
      toast.loading('Generating report...')
      
      setTimeout(() => {
        const reportName = reportTypes.find(r => r.id === selectedReportType)?.name || 'Report'
        
        // Simulate file download
        const blob = new Blob(['Sample report content'], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.dismiss()
        toast.success(`${reportName} generated and downloaded successfully!`)
      }, 2000)
      
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to generate report')
      console.error('Report generation error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dropout Reports</h1>
        <p className="text-gray-600">Generate and download comprehensive reports on student data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generation Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Type Selection */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportType(report.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedReportType === report.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{report.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Configuration */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="input"
                >
                  <option value="last-7-days">Last 7 days</option>
                  <option value="last-30-days">Last 30 days</option>
                  <option value="last-3-months">Last 3 months</option>
                  <option value="last-6-months">Last 6 months</option>
                  <option value="current-year">Current Academic Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Filter
                </label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Classes</option>
                  <option value="9A">Class 9A</option>
                  <option value="9B">Class 9B</option>
                  <option value="10A">Class 10A</option>
                  <option value="10B">Class 10B</option>
                  <option value="11A">Class 11A</option>
                  <option value="11B">Class 11B</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select className="input">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900">Additional Options</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-700">Include student photos</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-700">Include parent contact information</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                  <span className="ml-2 text-sm text-gray-700">Include risk factor analysis</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-700">Include intervention history</span>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleGenerateReport}
                className="btn-primary flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </button>
              <button 
                onClick={() => {
                  const scheduleDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  toast.success(`Report scheduled for ${scheduleDate}`)
                }}
                className="btn-outline flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule Report
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reports Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <button 
                      onClick={() => {
                        // Simulate file download
                        const blob = new Blob(['Sample report content'], { type: 'application/pdf' })
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = report.name.replace(/\s+/g, '_') + '.pdf'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        window.URL.revokeObjectURL(url)
                        toast.success(`Downloaded ${report.name}`)
                      }}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{report.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{report.type}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{report.generatedDate}</span>
                    <span>{report.size} • {report.format}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                // This would navigate to a detailed reports history page
                toast.success('Showing all generated reports')
              }}
              className="w-full mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              View All Reports
            </button>
          </div>

          {/* Quick Stats */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reports Generated</span>
                <span className="text-sm font-medium text-gray-900">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="text-sm font-medium text-gray-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Most Popular</span>
                <span className="text-sm font-medium text-gray-900">Risk Analysis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Size</span>
                <span className="text-sm font-medium text-gray-900">2.1 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports