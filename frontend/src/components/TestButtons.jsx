import React from 'react'
import toast from 'react-hot-toast'

const TestButtons = () => {
  const testPrimary = () => toast.success('Primary button works!')
  const testSecondary = () => toast.success('Secondary button works!')
  const testOutline = () => toast.success('Outline button works!')

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Button Test</h2>
      <div className="flex gap-4">
        <button onClick={testPrimary} className="btn-primary">
          Primary Button
        </button>
        <button onClick={testSecondary} className="btn-secondary">
          Secondary Button
        </button>
        <button onClick={testOutline} className="btn-outline">
          Outline Button
        </button>
      </div>
    </div>
  )
}

export default TestButtons