import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Excused"],
      required: [true, "Attendance status is required"],
    },
    timeIn: {
      type: Date,
    },
    timeOut: {
      type: Date,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String, // For absences or late arrivals
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Marked by is required"],
    },
    remarks: {
      type: String,
    },
    // For tracking consecutive absences
    isConsecutive: {
      type: Boolean,
      default: false,
    },
    consecutiveCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Static method to get student attendance summary
attendanceSchema.statics.getStudentSummary = async function (
  studentId,
  startDate,
  endDate
) {
  try {
    const pipeline = [
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Absent"] }, 1, 0],
            },
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Late"] }, 1, 0],
            },
          },
          excusedDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Excused"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          excusedDays: 1,
          percentage: {
            $cond: [
              { $eq: ["$totalDays", 0] },
              100,
              {
                $multiply: [
                  { $divide: ["$presentDays", "$totalDays"] },
                  100,
                ],
              },
            ],
          },
        },
      },
    ];

    const result = await this.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        excusedDays: 0,
        percentage: "100.00",
      };
    }

    const summary = result[0];
    summary.percentage = summary.percentage.toFixed(2);
    
    return summary;
  } catch (error) {
    throw new Error(`Error calculating attendance summary: ${error.message}`);
  }
};

// Static method to get class attendance for a specific date
attendanceSchema.statics.getClassAttendance = async function (classId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.find({
      class: classId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate("student", "firstName lastName rollNumber");
  } catch (error) {
    throw new Error(`Error getting class attendance: ${error.message}`);
  }
};

// Static method to mark attendance for multiple students
attendanceSchema.statics.markBulkAttendance = async function (attendanceData) {
  try {
    const operations = attendanceData.map((record) => ({
      updateOne: {
        filter: {
          student: record.student,
          date: record.date,
        },
        update: {
          $set: {
            status: record.status,
            timeIn: record.timeIn,
            timeOut: record.timeOut,
            lateMinutes: record.lateMinutes || 0,
            reason: record.reason,
            markedBy: record.markedBy,
            remarks: record.remarks,
          },
        },
        upsert: true,
      },
    }));

    return await this.bulkWrite(operations);
  } catch (error) {
    throw new Error(`Error marking bulk attendance: ${error.message}`);
  }
};

// Static method to get attendance trends
attendanceSchema.statics.getAttendanceTrends = async function (
  studentId,
  months = 6
) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const pipeline = [
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalDays: 1,
          presentDays: 1,
          percentage: {
            $multiply: [{ $divide: ["$presentDays", "$totalDays"] }, 100],
          },
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ];

    return await this.aggregate(pipeline);
  } catch (error) {
    throw new Error(`Error getting attendance trends: ${error.message}`);
  }
};

// Method to calculate consecutive absences
attendanceSchema.methods.updateConsecutiveAbsences = async function () {
  if (this.status === "Absent") {
    // Find the last attendance record for this student
    const lastRecord = await this.constructor
      .findOne({
        student: this.student,
        date: { $lt: this.date },
      })
      .sort({ date: -1 });

    if (lastRecord && lastRecord.status === "Absent" && lastRecord.isConsecutive) {
      this.isConsecutive = true;
      this.consecutiveCount = lastRecord.consecutiveCount + 1;
    } else if (lastRecord && lastRecord.status === "Absent") {
      this.isConsecutive = true;
      this.consecutiveCount = 2;
    } else {
      this.isConsecutive = false;
      this.consecutiveCount = 0;
    }
  } else {
    this.isConsecutive = false;
    this.consecutiveCount = 0;
  }
};

// Pre-save middleware
attendanceSchema.pre("save", async function (next) {
  // Calculate consecutive absences
  await this.updateConsecutiveAbsences();
  
  // Set time in for present/late students if not provided
  if ((this.status === "Present" || this.status === "Late") && !this.timeIn) {
    this.timeIn = new Date();
  }
  
  next();
});

// Post-save middleware to update student attendance metrics
attendanceSchema.post("save", async function () {
  try {
    const Student = mongoose.model("Student");
    
    // Get current academic year dates
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 3, 1); // April 1st
    const endDate = new Date();
    
    // Calculate attendance summary
    const summary = await this.constructor.getStudentSummary(
      this.student,
      startDate,
      endDate
    );
    
    // Update student record
    await Student.findByIdAndUpdate(this.student, {
      attendancePercentage: parseFloat(summary.percentage),
      totalDaysPresent: summary.presentDays,
      totalDaysAbsent: summary.absentDays,
      consecutiveAbsences: this.isConsecutive ? this.consecutiveCount : 0,
    });
  } catch (error) {
    console.error("Error updating student attendance metrics:", error);
  }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;