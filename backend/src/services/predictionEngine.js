import * as tf from "@tensorflow/tfjs";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import Grade from "../models/Grade.js";
import Intervention from "../models/Intervention.js";
import logger from "../utils/logger.js";

/**
 * Prediction Engine for Student Dropout Analysis
 * Uses TensorFlow.js for machine learning predictions
 */

class PredictionEngine {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.featureNames = [
      'attendancePercentage',
      'overallPercentage',
      'failedSubjectsCount',
      'consecutiveAbsences',
      'lateComingCount',
      'distanceFromSchool',
      'familyIncomeLevel',
      'hasHealthIssues',
      'hasBehavioralIssues',
      'hasFamilyProblems',
      'hasEconomicDistress',
      'previousDropoutAttempts',
      'siblingsCount',
      'parentEducationLevel'
    ];
    this.modelPath = process.env.ML_MODEL_PATH || './src/ml/model/dropout_model.json';
  }

  /**
   * Initialize and load the ML model
   */
  async initializeModel() {
    try {
      // Try to load existing model
      try {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
        this.isModelLoaded = true;
        logger.info("✅ ML Model loaded successfully");
      } catch (error) {
        logger.warn("No existing model found, creating new model");
        await this.createNewModel();
      }
    } catch (error) {
      logger.error("Failed to initialize ML model:", error);
      // Create a simple fallback model
      await this.createFallbackModel();
    }
  }

  /**
   * Create a new neural network model
   */
  async createNewModel() {
    try {
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [this.featureNames.length],
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      logger.info("✅ New ML Model created successfully");
    } catch (error) {
      logger.error("Failed to create new model:", error);
      throw error;
    }
  }

  /**
   * Create a simple fallback model for basic predictions
   */
  async createFallbackModel() {
    try {
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [this.featureNames.length],
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      this.model.compile({
        optimizer: 'sgd',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      logger.info("✅ Fallback ML Model created");
    } catch (error) {
      logger.error("Failed to create fallback model:", error);
      this.isModelLoaded = false;
    }
  }

  /**
   * Prepare student data for ML prediction
   */
  prepareStudentFeatures(student) {
    try {
      // Normalize family income level
      const incomeMapping = {
        'Below Poverty Line': 0,
        'Low Income': 1,
        'Middle Income': 2,
        'High Income': 3
      };

      // Calculate parent education level (average of both parents)
      const educationMapping = {
        'None': 0,
        'Primary': 1,
        'Secondary': 2,
        'Higher Secondary': 3,
        'Graduate': 4,
        'Post Graduate': 5,
        'Doctorate': 6
      };

      const fatherEdu = educationMapping[student.father?.education] || 0;
      const motherEdu = educationMapping[student.mother?.education] || 0;
      const avgParentEducation = (fatherEdu + motherEdu) / 2;

      const features = [
        student.attendancePercentage || 0,
        student.overallPercentage || 0,
        student.failedSubjectsCount || 0,
        student.consecutiveAbsences || 0,
        student.lateComingCount || 0,
        student.distanceFromSchool || 0,
        incomeMapping[student.familyIncomeLevel] || 0,
        student.hasHealthIssues ? 1 : 0,
        student.hasBehavioralIssues ? 1 : 0,
        student.hasFamilyProblems ? 1 : 0,
        student.hasEconomicDistress ? 1 : 0,
        student.previousDropoutAttempts || 0,
        student.siblings?.count || 0,
        avgParentEducation
      ];

      // Normalize features to 0-1 range
      return this.normalizeFeatures(features);
    } catch (error) {
      logger.error("Feature preparation error:", error);
      return new Array(this.featureNames.length).fill(0);
    }
  }

  /**
   * Normalize features to 0-1 range
   */
  normalizeFeatures(features) {
    const maxValues = [100, 100, 10, 30, 50, 50, 3, 1, 1, 1, 1, 5, 10, 6];
    
    return features.map((feature, index) => {
      const maxVal = maxValues[index] || 1;
      return Math.min(feature / maxVal, 1);
    });
  }

  /**
   * Predict dropout probability for a single student
   */
  async predictDropoutProbability(studentId) {
    try {
      if (!this.isModelLoaded) {
        await this.initializeModel();
      }

      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      const features = this.prepareStudentFeatures(student);
      const inputTensor = tf.tensor2d([features]);
      
      const prediction = this.model.predict(inputTensor);
      const probability = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const dropoutProbability = probability[0] * 100;
      
      return {
        studentId,
        dropoutProbability: Math.round(dropoutProbability * 100) / 100,
        riskLevel: this.calculateRiskLevel(dropoutProbability),
        confidence: this.calculateConfidence(features),
        factors: this.identifyKeyFactors(student, features)
      };
    } catch (error) {
      logger.error("Dropout prediction error:", error);
      // Return fallback prediction based on simple rules
      return this.fallbackPrediction(studentId);
    }
  }

  /**
   * Predict dropout probabilities for multiple students
   */
  async predictBatchDropout(studentIds) {
    try {
      const predictions = await Promise.all(
        studentIds.map(id => this.predictDropoutProbability(id))
      );
      
      return predictions.filter(p => p !== null);
    } catch (error) {
      logger.error("Batch prediction error:", error);
      return [];
    }
  }

  /**
   * Calculate risk level based on dropout probability
   */
  calculateRiskLevel(probability) {
    if (probability >= 80) return "Critical";
    if (probability >= 60) return "High";
    if (probability >= 30) return "Medium";
    return "Low";
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(features) {
    // Simple confidence calculation based on data completeness
    const nonZeroFeatures = features.filter(f => f > 0).length;
    const completeness = nonZeroFeatures / features.length;
    return Math.round(completeness * 100);
  }

  /**
   * Identify key risk factors for a student
   */
  identifyKeyFactors(student, features) {
    const factors = [];
    
    // Attendance factor
    if (features[0] < 0.75) { // < 75% attendance
      factors.push({
        factor: "Poor Attendance",
        severity: features[0] < 0.5 ? "High" : "Medium",
        value: `${Math.round(features[0] * 100)}%`
      });
    }

    // Academic factor
    if (features[1] < 0.6) { // < 60% academic performance
      factors.push({
        factor: "Poor Academic Performance",
        severity: features[1] < 0.4 ? "High" : "Medium",
        value: `${Math.round(features[1] * 100)}%`
      });
    }

    // Failed subjects
    if (features[2] > 0.2) { // > 2 failed subjects (normalized)
      factors.push({
        factor: "Multiple Failed Subjects",
        severity: features[2] > 0.5 ? "High" : "Medium",
        value: `${Math.round(features[2] * 10)} subjects`
      });
    }

    // Consecutive absences
    if (features[3] > 0.1) { // > 3 consecutive absences
      factors.push({
        factor: "Consecutive Absences",
        severity: features[3] > 0.3 ? "High" : "Medium",
        value: `${Math.round(features[3] * 30)} days`
      });
    }

    // Economic distress
    if (features[10] === 1) {
      factors.push({
        factor: "Economic Distress",
        severity: "High",
        value: "Present"
      });
    }

    // Health issues
    if (features[7] === 1) {
      factors.push({
        factor: "Health Issues",
        severity: "Medium",
        value: "Present"
      });
    }

    // Behavioral issues
    if (features[8] === 1) {
      factors.push({
        factor: "Behavioral Issues",
        severity: "Medium",
        value: "Present"
      });
    }

    return factors.slice(0, 5); // Return top 5 factors
  }

  /**
   * Fallback prediction using simple rules
   */
  async fallbackPrediction(studentId) {
    try {
      const student = await Student.findById(studentId);
      if (!student) return null;

      let riskScore = 0;

      // Attendance risk
      if (student.attendancePercentage < 50) riskScore += 30;
      else if (student.attendancePercentage < 75) riskScore += 20;
      else if (student.attendancePercentage < 85) riskScore += 10;

      // Academic risk
      if (student.overallPercentage < 33) riskScore += 25;
      else if (student.overallPercentage < 50) riskScore += 15;
      else if (student.overallPercentage < 60) riskScore += 10;

      // Failed subjects
      riskScore += (student.failedSubjectsCount || 0) * 5;

      // Consecutive absences
      if (student.consecutiveAbsences >= 5) riskScore += 15;
      else if (student.consecutiveAbsences >= 3) riskScore += 10;

      // Other factors
      if (student.hasEconomicDistress) riskScore += 15;
      if (student.hasBehavioralIssues) riskScore += 10;
      if (student.hasHealthIssues) riskScore += 8;
      if (student.hasFamilyProblems) riskScore += 8;

      riskScore = Math.min(riskScore, 100);

      return {
        studentId,
        dropoutProbability: riskScore,
        riskLevel: this.calculateRiskLevel(riskScore),
        confidence: 75, // Medium confidence for rule-based prediction
        factors: this.identifyKeyFactors(student, this.prepareStudentFeatures(student)),
        method: "rule-based"
      };
    } catch (error) {
      logger.error("Fallback prediction error:", error);
      return null;
    }
  }

  /**
   * Train the model with historical data
   */
  async trainModel() {
    try {
      logger.info("Starting model training...");

      // Get training data
      const trainingData = await this.prepareTrainingData();
      
      if (trainingData.features.length === 0) {
        logger.warn("No training data available");
        return false;
      }

      const xs = tf.tensor2d(trainingData.features);
      const ys = tf.tensor2d(trainingData.labels, [trainingData.labels.length, 1]);

      // Train the model
      const history = await this.model.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              logger.info(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
          }
        }
      });

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      // Save the trained model
      await this.saveModel();

      logger.info("Model training completed successfully");
      return true;
    } catch (error) {
      logger.error("Model training error:", error);
      return false;
    }
  }

  /**
   * Prepare training data from historical student records
   */
  async prepareTrainingData() {
    try {
      // Get students with known outcomes (active vs inactive)
      const students = await Student.find({})
        .select('attendancePercentage overallPercentage failedSubjectsCount consecutiveAbsences lateComingCount distanceFromSchool familyIncomeLevel hasHealthIssues hasBehavioralIssues hasFamilyProblems hasEconomicDistress previousDropoutAttempts siblings father mother isActive');

      const features = [];
      const labels = [];

      students.forEach(student => {
        const studentFeatures = this.prepareStudentFeatures(student);
        const label = student.isActive ? 0 : 1; // 0 = active, 1 = dropout

        features.push(studentFeatures);
        labels.push(label);
      });

      logger.info(`Prepared training data: ${features.length} samples`);
      
      return { features, labels };
    } catch (error) {
      logger.error("Training data preparation error:", error);
      return { features: [], labels: [] };
    }
  }

  /**
   * Save the trained model
   */
  async saveModel() {
    try {
      await this.model.save(`file://${this.modelPath}`);
      logger.info("Model saved successfully");
    } catch (error) {
      logger.error("Model save error:", error);
    }
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel() {
    try {
      if (!this.isModelLoaded) {
        await this.initializeModel();
      }

      const testData = await this.prepareTrainingData();
      
      if (testData.features.length === 0) {
        return { accuracy: 0, loss: 0, message: "No test data available" };
      }

      const xs = tf.tensor2d(testData.features);
      const ys = tf.tensor2d(testData.labels, [testData.labels.length, 1]);

      const evaluation = this.model.evaluate(xs, ys);
      const loss = await evaluation[0].data();
      const accuracy = await evaluation[1].data();

      // Clean up tensors
      xs.dispose();
      ys.dispose();
      evaluation[0].dispose();
      evaluation[1].dispose();

      return {
        accuracy: accuracy[0],
        loss: loss[0],
        samples: testData.features.length
      };
    } catch (error) {
      logger.error("Model evaluation error:", error);
      return { accuracy: 0, loss: 0, error: error.message };
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      isLoaded: this.isModelLoaded,
      featureCount: this.featureNames.length,
      features: this.featureNames,
      modelPath: this.modelPath
    };
  }

  /**
   * Predict intervention effectiveness
   */
  async predictInterventionEffectiveness(studentId, interventionType) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      // Get historical intervention data for similar students
      const similarInterventions = await Intervention.find({
        type: interventionType,
        status: "Completed",
        outcome: { $in: ["Successful", "Partially Successful", "Not Successful"] }
      }).populate("student");

      if (similarInterventions.length === 0) {
        return {
          effectiveness: 50, // Default 50% if no historical data
          confidence: 25,
          recommendation: "Limited historical data available"
        };
      }

      // Calculate effectiveness based on similar student profiles
      let totalEffectiveness = 0;
      let matchingInterventions = 0;

      similarInterventions.forEach(intervention => {
        const similarity = this.calculateStudentSimilarity(student, intervention.student);
        
        if (similarity > 0.6) { // 60% similarity threshold
          const effectiveness = intervention.outcome === "Successful" ? 90 :
                               intervention.outcome === "Partially Successful" ? 60 : 20;
          
          totalEffectiveness += effectiveness * similarity;
          matchingInterventions++;
        }
      });

      if (matchingInterventions === 0) {
        return {
          effectiveness: 50,
          confidence: 30,
          recommendation: "No similar cases found"
        };
      }

      const avgEffectiveness = totalEffectiveness / matchingInterventions;
      const confidence = Math.min(matchingInterventions * 10, 90);

      return {
        effectiveness: Math.round(avgEffectiveness),
        confidence,
        recommendation: this.generateInterventionRecommendation(avgEffectiveness),
        similarCases: matchingInterventions
      };
    } catch (error) {
      logger.error("Intervention effectiveness prediction error:", error);
      return {
        effectiveness: 50,
        confidence: 25,
        recommendation: "Unable to predict effectiveness"
      };
    }
  }

  /**
   * Calculate similarity between two students
   */
  calculateStudentSimilarity(student1, student2) {
    const features1 = this.prepareStudentFeatures(student1);
    const features2 = this.prepareStudentFeatures(student2);

    // Calculate Euclidean distance
    let distance = 0;
    for (let i = 0; i < features1.length; i++) {
      distance += Math.pow(features1[i] - features2[i], 2);
    }
    distance = Math.sqrt(distance);

    // Convert distance to similarity (0-1 scale)
    const maxDistance = Math.sqrt(features1.length); // Maximum possible distance
    return 1 - (distance / maxDistance);
  }

  /**
   * Generate intervention recommendation
   */
  generateInterventionRecommendation(effectiveness) {
    if (effectiveness >= 80) return "Highly recommended - High success probability";
    if (effectiveness >= 60) return "Recommended - Good success probability";
    if (effectiveness >= 40) return "Consider with caution - Moderate success probability";
    return "Not recommended - Low success probability";
  }
}

// Create singleton instance
const predictionEngine = new PredictionEngine();

// Export functions
export const initializePredictionEngine = () => predictionEngine.initializeModel();
export const predictDropout = (studentId) => predictionEngine.predictDropoutProbability(studentId);
export const predictBatchDropout = (studentIds) => predictionEngine.predictBatchDropout(studentIds);
export const trainModel = () => predictionEngine.trainModel();
export const evaluateModel = () => predictionEngine.evaluateModel();
export const getModelInfo = () => predictionEngine.getModelInfo();
export const predictInterventionEffectiveness = (studentId, interventionType) => 
  predictionEngine.predictInterventionEffectiveness(studentId, interventionType);

export default predictionEngine;