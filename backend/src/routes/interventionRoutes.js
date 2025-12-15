import express from 'express';

const router = express.Router();

// Sample interventions data
let sampleInterventions = [
  {
    id: 1,
    title: 'Academic Support Program',
    student: 'Alex Johnson',
    studentId: 1,
    type: 'Academic Support',
    priority: 'High',
    status: 'In Progress',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    progress: 65,
    assignedTo: 'Ms. Sarah Wilson',
    description: 'Providing additional tutoring and study materials to improve academic performance.',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Family Counseling Session',
    student: 'Mike Davis',
    studentId: 3,
    type: 'Counseling',
    priority: 'Critical',
    status: 'Scheduled',
    startDate: '2024-12-15',
    endDate: '2024-12-22',
    progress: 25,
    assignedTo: 'Dr. John Smith',
    description: 'Family counseling to address behavioral issues and improve home environment.',
    createdAt: new Date().toISOString()
  }
];

// Get all interventions
router.get('/', (req, res) => {
  const { status, priority, studentId } = req.query;
  let filteredInterventions = [...sampleInterventions];

  if (status && status !== 'all') {
    filteredInterventions = filteredInterventions.filter(i => 
      i.status.toLowerCase() === status.toLowerCase()
    );
  }

  if (priority) {
    filteredInterventions = filteredInterventions.filter(i => 
      i.priority.toLowerCase() === priority.toLowerCase()
    );
  }

  if (studentId) {
    filteredInterventions = filteredInterventions.filter(i => 
      i.studentId === parseInt(studentId)
    );
  }

  res.json({
    success: true,
    data: {
      interventions: filteredInterventions,
      total: filteredInterventions.length
    }
  });
});

// Get intervention by ID
router.get('/:id', (req, res) => {
  const intervention = sampleInterventions.find(i => i.id === parseInt(req.params.id));
  
  if (!intervention) {
    return res.status(404).json({
      success: false,
      message: 'Intervention not found'
    });
  }

  res.json({
    success: true,
    data: intervention
  });
});

// Create new intervention
router.post('/', (req, res) => {
  try {
    const newIntervention = {
      id: sampleInterventions.length + 1,
      ...req.body,
      status: 'Scheduled',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    sampleInterventions.push(newIntervention);

    res.status(201).json({
      success: true,
      message: 'Intervention created successfully',
      data: newIntervention
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create intervention',
      error: error.message
    });
  }
});

// Update intervention
router.put('/:id', (req, res) => {
  try {
    const interventionId = parseInt(req.params.id);
    const interventionIndex = sampleInterventions.findIndex(i => i.id === interventionId);
    
    if (interventionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    sampleInterventions[interventionIndex] = {
      ...sampleInterventions[interventionIndex],
      ...req.body,
      id: interventionId,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Intervention updated successfully',
      data: sampleInterventions[interventionIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update intervention',
      error: error.message
    });
  }
});

// Delete intervention
router.delete('/:id', (req, res) => {
  try {
    const interventionId = parseInt(req.params.id);
    const interventionIndex = sampleInterventions.findIndex(i => i.id === interventionId);
    
    if (interventionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found'
      });
    }

    const deletedIntervention = sampleInterventions.splice(interventionIndex, 1)[0];

    res.json({
      success: true,
      message: 'Intervention deleted successfully',
      data: deletedIntervention
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete intervention',
      error: error.message
    });
  }
});

export default router;