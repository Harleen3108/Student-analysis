import { BookMarked, GraduationCap, Heart, DollarSign, Calendar } from 'lucide-react'

const Support = () => {
  const resources = [
    {
      icon: Calendar,
      title: 'Importance of Regular Attendance',
      content: 'Regular school attendance is crucial for academic success. Students who attend school regularly are more likely to succeed academically and socially. Missing school means missing out on learning opportunities and falling behind peers.',
      tips: [
        'Establish a consistent morning routine',
        'Prepare school materials the night before',
        'Ensure adequate sleep (8-10 hours for children)',
        'Address any concerns about school promptly'
      ]
    },
    {
      icon: GraduationCap,
      title: 'Study Tips for Success',
      content: 'Effective study habits can significantly improve academic performance and reduce stress.',
      tips: [
        'Create a dedicated, quiet study space',
        'Break study sessions into 25-30 minute intervals',
        'Use active learning techniques (summarizing, teaching others)',
        'Review material regularly, not just before exams',
        'Ask teachers for help when needed'
      ]
    },
    {
      icon: BookMarked,
      title: 'Exam Preparation Guide',
      content: 'Proper exam preparation reduces anxiety and improves performance.',
      tips: [
        'Start preparing at least 2 weeks before exams',
        'Create a study schedule covering all subjects',
        'Practice with past papers and sample questions',
        'Get adequate rest the night before',
        'Eat a healthy breakfast on exam day',
        'Stay positive and manage stress'
      ]
    },
    {
      icon: Heart,
      title: 'Mental Health Awareness',
      content: 'Mental health is as important as physical health. Watch for signs of stress, anxiety, or depression in your child.',
      tips: [
        'Maintain open communication with your child',
        'Encourage physical activity and outdoor time',
        'Limit screen time, especially before bed',
        'Teach stress management techniques',
        'Seek professional help if needed',
        'Create a supportive home environment'
      ]
    },
    {
      icon: DollarSign,
      title: 'Financial Aid & Scholarships',
      content: 'Various financial assistance programs are available to support students education.',
      tips: [
        'Contact school administration for scholarship information',
        'Research government education schemes',
        'Look for merit-based and need-based scholarships',
        'Apply early for financial aid programs',
        'Keep academic records updated for applications',
        'Explore education loan options if needed'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Support & Guidance</h1>
        <p className="text-gray-600">Resources and tips to support your child's education</p>
      </div>

      <div className="space-y-6">
        {resources.map((resource, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <resource.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-700 mb-4">{resource.content}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Tips:</p>
                  <ul className="space-y-2">
                    {resource.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Need More Help?</h3>
        <p className="text-blue-800 text-sm">
          If you need additional support or have concerns about your child, please contact the school counselor or your child's teacher through the Communications section.
        </p>
      </div>
    </div>
  )
}

export default Support
