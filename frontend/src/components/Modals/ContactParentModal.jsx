import { useState } from 'react';
import { X, Mail, MessageSquare, FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { communicationsAPI } from '../../services/api';

const ContactParentModal = ({ isOpen, onClose, student }) => {
  const [activeTab, setActiveTab] = useState('sms');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    reportType: 'progress',
    includeReport: false
  });

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      
      if (activeTab === 'sms') {
        console.log('📱 Sending SMS:', { studentId: student._id || student.id, message: formData.message });
        response = await communicationsAPI.sendSMS({
          studentId: student._id || student.id,
          message: formData.message
        });
        console.log('✅ SMS response:', response);
        toast.success('SMS sent successfully to parent!');
      } else if (activeTab === 'report') {
        console.log('📄 Sending Report:', { studentId: student._id || student.id, reportType: formData.reportType });
        response = await communicationsAPI.sendReport({
          studentId: student._id || student.id,
          reportType: formData.reportType,
          message: formData.message
        });
        console.log('✅ Report response:', response);
        toast.success('Report sent successfully to parent!');
      }

      // Reset form
      setFormData({
        subject: '',
        message: '',
        reportType: 'progress',
        includeReport: false
      });
      
      onClose();
    } catch (error) {
      console.error('Error sending communication:', error);
      toast.error(error.response?.data?.message || 'Failed to send communication');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'sms', label: 'Send SMS', icon: MessageSquare },
    { id: 'report', label: 'Send Report', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contact Parent</h3>
            <p className="text-sm text-gray-600 mt-1">
              {student.firstName} {student.lastName} - {student.rollNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Parent Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Parent Contact Information</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Name:</strong> {student.father?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {student.father?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {student.father?.phone || 'N/A'}</p>
            </div>
          </div>

          {/* SMS Tab */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> SMS messages are limited to 160 characters. Keep your message concise.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message * ({formData.message.length}/160)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => {
                    if (e.target.value.length <= 160) {
                      setFormData({ ...formData, message: e.target.value });
                    }
                  }}
                  className="input w-full"
                  rows="4"
                  placeholder="Enter your SMS message (max 160 characters)..."
                  required
                  maxLength={160}
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Quick Templates:</h5>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, message: `Dear Parent, ${student.firstName} has shown improvement this week. Keep up the good work!` })}
                    className="text-sm text-blue-600 hover:text-blue-800 block"
                  >
                    • Positive feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, message: `Dear Parent, Please check ${student.firstName}'s attendance. Contact school for details.` })}
                    className="text-sm text-blue-600 hover:text-blue-800 block"
                  >
                    • Attendance concern
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, message: `Dear Parent, Request meeting to discuss ${student.firstName}'s progress. Please contact school.` })}
                    className="text-sm text-blue-600 hover:text-blue-800 block"
                  >
                    • Meeting request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Report Type *
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="progress">Complete Progress Report</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="academic">Academic Performance Report</option>
                  <option value="risk">Risk Analysis Report</option>
                  <option value="behavioral">Behavioral Report</option>
                </select>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Report will include:</h5>
                <ul className="space-y-2 text-sm text-gray-700">
                  {formData.reportType === 'progress' && (
                    <>
                      <li>• Overall academic performance</li>
                      <li>• Attendance summary</li>
                      <li>• Risk assessment</li>
                      <li>• Teacher observations</li>
                      <li>• Recommendations</li>
                    </>
                  )}
                  {formData.reportType === 'attendance' && (
                    <>
                      <li>• Daily attendance records</li>
                      <li>• Absence patterns</li>
                      <li>• Late arrivals</li>
                      <li>• Attendance percentage</li>
                    </>
                  )}
                  {formData.reportType === 'academic' && (
                    <>
                      <li>• Subject-wise performance</li>
                      <li>• Test scores and grades</li>
                      <li>• Academic trends</li>
                      <li>• Areas of improvement</li>
                    </>
                  )}
                  {formData.reportType === 'risk' && (
                    <>
                      <li>• Current risk level</li>
                      <li>• Risk factors analysis</li>
                      <li>• Intervention recommendations</li>
                      <li>• Action plan</li>
                    </>
                  )}
                  {formData.reportType === 'behavioral' && (
                    <>
                      <li>• Behavioral observations</li>
                      <li>• Disciplinary records</li>
                      <li>• Social interactions</li>
                      <li>• Counselor notes</li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input w-full"
                  rows="3"
                  placeholder="Add a personal message to accompany the report..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send {activeTab === 'sms' ? 'SMS' : 'Report'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactParentModal;
