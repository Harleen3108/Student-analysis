import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    // Setting Identification
    key: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Setting name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Setting Value
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Setting value is required"],
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Setting Type and Validation
    dataType: {
      type: String,
      enum: [
        "string",
        "number",
        "boolean",
        "array",
        "object",
        "date",
        "email",
        "url",
        "json",
      ],
      required: [true, "Data type is required"],
    },
    validation: {
      required: {
        type: Boolean,
        default: false,
      },
      min: Number,
      max: Number,
      minLength: Number,
      maxLength: Number,
      pattern: String, // Regex pattern
      enum: [String], // Allowed values
    },

    // Category and Organization
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "SYSTEM",
        "SECURITY",
        "NOTIFICATION",
        "EMAIL",
        "SMS",
        "RISK_ASSESSMENT",
        "ATTENDANCE",
        "ACADEMIC",
        "INTERVENTION",
        "REPORTING",
        "UI_UX",
        "INTEGRATION",
        "BACKUP",
        "COMPLIANCE",
        "OTHER",
      ],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    group: {
      type: String,
      trim: true,
    },

    // Access Control
    isPublic: {
      type: Boolean,
      default: false,
    },
    accessLevel: {
      type: String,
      enum: ["ADMIN_ONLY", "STAFF", "ALL_USERS"],
      default: "ADMIN_ONLY",
    },
    isReadOnly: {
      type: Boolean,
      default: false,
    },

    // UI Configuration
    displayOrder: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    inputType: {
      type: String,
      enum: [
        "text",
        "number",
        "email",
        "password",
        "textarea",
        "select",
        "multiselect",
        "checkbox",
        "radio",
        "date",
        "time",
        "datetime",
        "color",
        "file",
        "json",
      ],
      default: "text",
    },
    options: [
      {
        label: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    placeholder: String,
    helpText: String,

    // Environment and Context
    environment: {
      type: String,
      enum: ["DEVELOPMENT", "STAGING", "PRODUCTION", "ALL"],
      default: "ALL",
    },
    isEnvironmentSpecific: {
      type: Boolean,
      default: false,
    },

    // Status and Lifecycle
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeprecated: {
      type: Boolean,
      default: false,
    },
    deprecationDate: Date,
    deprecationReason: String,

    // Change Tracking
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changeHistory: [
      {
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],

    // Dependencies
    dependsOn: [
      {
        settingKey: String,
        condition: String, // e.g., "equals", "not_equals", "greater_than"
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    affects: [String], // Other setting keys that this setting affects

    // Metadata
    tags: [String],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    // Backup and Restore
    isBackupable: {
      type: Boolean,
      default: true,
    },
    isRestorable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
settingSchema.index({ key: 1 }, { unique: true });
settingSchema.index({ category: 1, subcategory: 1 });
settingSchema.index({ isActive: 1, isVisible: 1 });
settingSchema.index({ environment: 1 });
settingSchema.index({ displayOrder: 1 });

// Pre-save middleware to track changes
settingSchema.pre("save", function (next) {
  if (this.isModified("value") && !this.isNew) {
    this.changeHistory.push({
      oldValue: this._original?.value,
      newValue: this.value,
      changedBy: this.lastModifiedBy,
      changedAt: new Date(),
    });
  }
  next();
});

// Post-init middleware to store original value
settingSchema.post("init", function () {
  this._original = this.toObject();
});

// Static method to get setting by key
settingSchema.statics.getSetting = async function (key) {
  const setting = await this.findOne({ 
    key: key.toUpperCase(), 
    isActive: true 
  });
  return setting ? setting.value : null;
};

// Static method to get multiple settings
settingSchema.statics.getSettings = async function (keys) {
  const upperKeys = keys.map(key => key.toUpperCase());
  const settings = await this.find({
    key: { $in: upperKeys },
    isActive: true,
  });
  
  const result = {};
  settings.forEach(setting => {
    result[setting.key] = setting.value;
  });
  
  return result;
};

// Static method to get settings by category
settingSchema.statics.getSettingsByCategory = async function (category, subcategory = null) {
  const query = {
    category: category.toUpperCase(),
    isActive: true,
  };
  
  if (subcategory) {
    query.subcategory = subcategory;
  }
  
  const settings = await this.find(query).sort({ displayOrder: 1 });
  
  const result = {};
  settings.forEach(setting => {
    result[setting.key] = setting.value;
  });
  
  return result;
};

// Static method to update setting
settingSchema.statics.updateSetting = async function (key, value, userId = null) {
  const setting = await this.findOne({ key: key.toUpperCase() });
  
  if (!setting) {
    throw new Error(`Setting with key '${key}' not found`);
  }
  
  if (setting.isReadOnly) {
    throw new Error(`Setting '${key}' is read-only`);
  }
  
  // Validate value based on data type and validation rules
  const isValid = setting.validateValue(value);
  if (!isValid.valid) {
    throw new Error(`Invalid value for setting '${key}': ${isValid.error}`);
  }
  
  setting.value = value;
  setting.lastModifiedBy = userId;
  
  return await setting.save();
};

// Static method to create default settings
settingSchema.statics.createDefaultSettings = async function () {
  const defaultSettings = [
    // System Settings
    {
      key: "SYSTEM_NAME",
      name: "System Name",
      description: "Name of the student dropout prevention system",
      value: "Student Dropout Prevention System",
      defaultValue: "Student Dropout Prevention System",
      dataType: "string",
      category: "SYSTEM",
      isPublic: true,
    },
    {
      key: "SYSTEM_VERSION",
      name: "System Version",
      description: "Current version of the system",
      value: "1.0.0",
      defaultValue: "1.0.0",
      dataType: "string",
      category: "SYSTEM",
      isReadOnly: true,
    },
    
    // Risk Assessment Settings
    {
      key: "RISK_THRESHOLD_LOW",
      name: "Low Risk Threshold",
      description: "Threshold score for low risk classification",
      value: 30,
      defaultValue: 30,
      dataType: "number",
      category: "RISK_ASSESSMENT",
      validation: { min: 0, max: 100 },
    },
    {
      key: "RISK_THRESHOLD_MEDIUM",
      name: "Medium Risk Threshold",
      description: "Threshold score for medium risk classification",
      value: 60,
      defaultValue: 60,
      dataType: "number",
      category: "RISK_ASSESSMENT",
      validation: { min: 0, max: 100 },
    },
    {
      key: "RISK_THRESHOLD_HIGH",
      name: "High Risk Threshold",
      description: "Threshold score for high risk classification",
      value: 80,
      defaultValue: 80,
      dataType: "number",
      category: "RISK_ASSESSMENT",
      validation: { min: 0, max: 100 },
    },
    
    // Notification Settings
    {
      key: "ENABLE_EMAIL_NOTIFICATIONS",
      name: "Enable Email Notifications",
      description: "Enable or disable email notifications system-wide",
      value: true,
      defaultValue: true,
      dataType: "boolean",
      category: "NOTIFICATION",
    },
    {
      key: "ENABLE_SMS_NOTIFICATIONS",
      name: "Enable SMS Notifications",
      description: "Enable or disable SMS notifications system-wide",
      value: true,
      defaultValue: true,
      dataType: "boolean",
      category: "NOTIFICATION",
    },
    
    // Attendance Settings
    {
      key: "ATTENDANCE_ALERT_THRESHOLD",
      name: "Attendance Alert Threshold",
      description: "Attendance percentage below which alerts are sent",
      value: 75,
      defaultValue: 75,
      dataType: "number",
      category: "ATTENDANCE",
      validation: { min: 0, max: 100 },
    },
    {
      key: "CONSECUTIVE_ABSENCE_ALERT",
      name: "Consecutive Absence Alert",
      description: "Number of consecutive absences that trigger an alert",
      value: 3,
      defaultValue: 3,
      dataType: "number",
      category: "ATTENDANCE",
      validation: { min: 1, max: 30 },
    },
  ];
  
  for (const settingData of defaultSettings) {
    const existing = await this.findOne({ key: settingData.key });
    if (!existing) {
      await this.create(settingData);
    }
  }
};

// Method to validate value
settingSchema.methods.validateValue = function (value) {
  const validation = this.validation || {};
  
  // Check required
  if (validation.required && (value === null || value === undefined || value === "")) {
    return { valid: false, error: "Value is required" };
  }
  
  // Type-specific validation
  switch (this.dataType) {
    case "number":
      if (isNaN(value)) {
        return { valid: false, error: "Value must be a number" };
      }
      if (validation.min !== undefined && value < validation.min) {
        return { valid: false, error: `Value must be at least ${validation.min}` };
      }
      if (validation.max !== undefined && value > validation.max) {
        return { valid: false, error: `Value must be at most ${validation.max}` };
      }
      break;
      
    case "string":
      if (typeof value !== "string") {
        return { valid: false, error: "Value must be a string" };
      }
      if (validation.minLength && value.length < validation.minLength) {
        return { valid: false, error: `Value must be at least ${validation.minLength} characters` };
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        return { valid: false, error: `Value must be at most ${validation.maxLength} characters` };
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        return { valid: false, error: "Value does not match required pattern" };
      }
      break;
      
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: "Value must be a valid email address" };
      }
      break;
      
    case "boolean":
      if (typeof value !== "boolean") {
        return { valid: false, error: "Value must be true or false" };
      }
      break;
  }
  
  // Check enum values
  if (validation.enum && validation.enum.length > 0) {
    if (!validation.enum.includes(value)) {
      return { valid: false, error: `Value must be one of: ${validation.enum.join(", ")}` };
    }
  }
  
  return { valid: true };
};

// Method to reset to default value
settingSchema.methods.resetToDefault = async function (userId = null) {
  if (this.defaultValue !== undefined) {
    this.value = this.defaultValue;
    this.lastModifiedBy = userId;
    return await this.save();
  }
  throw new Error("No default value defined for this setting");
};

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;