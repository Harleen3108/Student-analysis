import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "counselor", "parent"],
      required: [true, "User role is required"],
    },
    avatar: {
      type: String,
      default: null,
    },

    // Role-specific fields
    // For Teachers
    employeeId: {
      type: String,
      sparse: true, // Allows multiple null values
      unique: true,
    },
    assignedClasses: [
      {
        type: String, // Class names like "10A", "10B"
      },
    ],
    subjects: [
      {
        type: String,
      },
    ],

    // For Parents
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // For Counselors
    caseLoad: {
      type: Number,
      default: 0,
    },
    specialization: {
      type: String,
      enum: ["academic", "behavioral", "career", "general"],
      default: "general",
    },

    // Notification preferences
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        start: {
          type: String,
          default: "22:00",
        },
        end: {
          type: String,
          default: "08:00",
        },
      },
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Refresh token
    refreshToken: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook for password hashing and employee ID generation
userSchema.pre("save", async function () {
  // Hash password if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate employee ID for teachers/counselors
  if (
    (this.role === "teacher" || this.role === "counselor") &&
    !this.employeeId &&
    this.isNew
  ) {
    const prefix = this.role === "teacher" ? "TCH" : "CNS";
    const count = await this.constructor.countDocuments({ role: this.role });
    this.employeeId = `${prefix}${String(count + 1).padStart(4, "0")}`;
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for performance (email and employeeId already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastLogin: 1 });

const User = mongoose.model("User", userSchema);

export default User;