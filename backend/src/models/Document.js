import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // File Information
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
    },
    fileName: {
      type: String,
      required: [true, "Stored filename is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    fileExtension: {
      type: String,
      required: [true, "File extension is required"],
    },

    // Storage Information
    storageProvider: {
      type: String,
      enum: ["cloudinary", "local", "aws-s3"],
      default: "cloudinary",
    },
    url: {
      type: String,
      required: [true, "File URL is required"],
    },
    publicId: {
      type: String, // For Cloudinary
    },
    path: {
      type: String, // Local file path or S3 key
    },

    // Document Type and Category
    documentType: {
      type: String,
      enum: [
        "Student Photo",
        "Birth Certificate",
        "Address Proof",
        "Income Certificate",
        "Medical Certificate",
        "Previous School Records",
        "Report Card",
        "Intervention Report",
        "Session Notes",
        "Assessment Report",
        "Parent Consent",
        "Other",
      ],
      required: [true, "Document type is required"],
    },
    category: {
      type: String,
      enum: [
        "Student Documents",
        "Academic Records",
        "Medical Records",
        "Financial Documents",
        "Intervention Documents",
        "Reports",
        "Certificates",
        "Photos",
        "Other",
      ],
      required: [true, "Document category is required"],
    },

    // Related Entities
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    relatedIntervention: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Intervention",
    },
    relatedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Access Control
    visibility: {
      type: String,
      enum: ["Public", "Private", "Restricted"],
      default: "Private",
    },
    accessLevel: {
      type: String,
      enum: ["Admin Only", "Staff Only", "Counselor Only", "Parent Access", "Student Access"],
      default: "Staff Only",
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },

    // Status and Verification
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Expired"],
      default: "Pending",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    verificationNotes: String,

    // Expiry (for certificates, etc.)
    hasExpiry: {
      type: Boolean,
      default: false,
    },
    expiryDate: Date,
    isExpired: {
      type: Boolean,
      default: false,
    },

    // Tags and Keywords
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],

    // Version Control
    version: {
      type: Number,
      default: 1,
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
    },
    previousVersions: [
      {
        version: Number,
        url: String,
        publicId: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Download and View Tracking
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: Date,
    lastAccessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Security
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptionKey: String,
    checksum: String, // File integrity check

    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    // Upload Information
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadSource: {
      type: String,
      enum: ["Web Upload", "Mobile App", "Bulk Import", "System Generated"],
      default: "Web Upload",
    },

    // Approval Workflow
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,

    // Deletion (Soft Delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
documentSchema.index({ relatedStudent: 1, documentType: 1 });
documentSchema.index({ relatedIntervention: 1 });
documentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
documentSchema.index({ documentType: 1, category: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ isDeleted: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ expiryDate: 1 });

// Text index for search
documentSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  keywords: "text",
});

// Virtual for file size in human readable format
documentSchema.virtual("fileSizeFormatted").get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual for file type icon
documentSchema.virtual("fileIcon").get(function () {
  const ext = this.fileExtension.toLowerCase();
  
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "powerpoint";
  if (["txt"].includes(ext)) return "text";
  
  return "file";
});

// Pre-save middleware to check expiry
documentSchema.pre("save", function (next) {
  if (this.hasExpiry && this.expiryDate) {
    this.isExpired = new Date() > this.expiryDate;
  }
  next();
});

// Static method to get documents by student
documentSchema.statics.getStudentDocuments = async function (studentId, category = null) {
  const query = {
    relatedStudent: studentId,
    isDeleted: false,
  };
  
  if (category) {
    query.category = category;
  }
  
  return await this.find(query)
    .sort({ uploadedAt: -1 })
    .populate("uploadedBy", "firstName lastName")
    .populate("verifiedBy", "firstName lastName");
};

// Static method to get expiring documents
documentSchema.statics.getExpiringDocuments = async function (days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return await this.find({
    hasExpiry: true,
    expiryDate: { $lte: futureDate },
    isExpired: false,
    isDeleted: false,
  })
    .sort({ expiryDate: 1 })
    .populate("relatedStudent", "firstName lastName rollNumber")
    .populate("uploadedBy", "firstName lastName");
};

// Static method to get documents requiring approval
documentSchema.statics.getPendingApprovals = async function () {
  return await this.find({
    requiresApproval: true,
    approvalStatus: "Pending",
    isDeleted: false,
  })
    .sort({ uploadedAt: 1 })
    .populate("uploadedBy", "firstName lastName")
    .populate("relatedStudent", "firstName lastName rollNumber");
};

// Method to increment download count
documentSchema.methods.incrementDownload = async function (userId) {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  this.lastAccessedBy = userId;
  return await this.save();
};

// Method to increment view count
documentSchema.methods.incrementView = async function (userId) {
  this.viewCount += 1;
  this.lastAccessed = new Date();
  this.lastAccessedBy = userId;
  return await this.save();
};

// Method to create new version
documentSchema.methods.createNewVersion = async function (newFileData) {
  // Add current version to previous versions
  this.previousVersions.push({
    version: this.version,
    url: this.url,
    publicId: this.publicId,
    uploadedAt: this.uploadedAt,
    uploadedBy: this.uploadedBy,
  });
  
  // Update with new file data
  this.version += 1;
  this.url = newFileData.url;
  this.publicId = newFileData.publicId;
  this.fileSize = newFileData.fileSize;
  this.uploadedAt = new Date();
  this.uploadedBy = newFileData.uploadedBy;
  
  return await this.save();
};

// Method to soft delete
documentSchema.methods.softDelete = async function (userId, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.deletionReason = reason;
  return await this.save();
};

const Document = mongoose.model("Document", documentSchema);

export default Document;