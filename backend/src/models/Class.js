import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      unique: true,
      trim: true,
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      uppercase: true,
      trim: true,
    },
    grade: {
      type: Number,
      required: [true, "Grade is required"],
      min: 1,
      max: 12,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      default: "2024-25",
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subjects: [
      {
        name: String,
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        code: String,
      },
    ],
    maxStudents: {
      type: Number,
      default: 40,
    },
    currentStudents: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique class-section-year combination
classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });

const Class = mongoose.model("Class", classSchema);

export default Class;