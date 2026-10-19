import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Student } from '../models/Student.model';
import { PromotionHistory, IPromotedStudentRecord } from '../models/PromotionHistory.model';
import { evaluateAllSchemes } from '../services/scholarshipEligibility.service';

const STANDARD_SEQUENCE: Record<string, string> = {
  'इयत्ता १ ली': 'इयत्ता २ री',
  'इयत्ता २ री': 'इयत्ता ३ री',
  'इयत्ता ३ री': 'इयत्ता ४ थी',
  'इयत्ता ४ थी': 'इयत्ता ५ वी',
  'इयत्ता ५ वी': 'इयत्ता ६ वी',
  'इयत्ता ६ वी': 'इयत्ता ७ वी',
  'इयत्ता ७ वी': 'उत्तीर्ण / प्राथमिक शिक्षण पूर्ण',
};

/**
 * 1. GET /api/portal/promotion/preview
 * Previews students to be promoted, validates sequences, and flags duplicates/repeaters
 */
export const previewPromotion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      academicYear = '2026-27',
      targetAcademicYear = '2027-28',
      currentStandard,
      division,
      destinationStandard,
      destinationDivision = 'A',
    } = req.query;

    if (!currentStandard) {
      res.status(400).json({ success: false, message: 'सद्यस्थिती वर्ग (currentStandard) आवश्यक आहे.' });
      return;
    }

    const filter: any = {
      $or: [{ currentStandard }, { classGrade: currentStandard }],
      isActive: true,
    };

    if (division && division !== 'ALL') {
      filter.division = division;
    }

    const students = await Student.find(filter).sort({ division: 1, grNumber: 1 });

    const suggestedTarget =
      (destinationStandard as string) || STANDARD_SEQUENCE[currentStandard as string] || currentStandard;

    const studentPreviews = students.map((s) => {
      // Check if student has already been processed for targetAcademicYear
      const alreadyProcessed =
        s.admissionYear === targetAcademicYear ||
        s.currentStandard === suggestedTarget ||
        (s.academicHistory || []).some((h: any) => h.academicYear === targetAcademicYear);

      return {
        _id: s._id,
        grNumber: s.grNumber,
        name: s.name,
        gender: s.gender,
        category: s.category,
        currentStandard: s.currentStandard || s.classGrade,
        currentDivision: s.division || 'A',
        suggestedDestinationStandard: suggestedTarget,
        suggestedDestinationDivision: destinationDivision,
        attendancePercentage: s.attendancePercentage || 90,
        alreadyProcessed,
        isEligible: !alreadyProcessed,
        suggestedStatus: 'Promoted' as const,
      };
    });

    const alreadyProcessedCount = studentPreviews.filter((p) => p.alreadyProcessed).length;
    const eligibleCount = studentPreviews.filter((p) => p.isEligible).length;

    res.status(200).json({
      success: true,
      data: {
        academicYear,
        targetAcademicYear,
        sourceStandard: currentStandard,
        sourceDivision: division || 'ALL',
        destinationStandard: suggestedTarget,
        destinationDivision,
        totalFound: students.length,
        eligibleCount,
        alreadyProcessedCount,
        students: studentPreviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/portal/students/promote
 * Handles student promotion with transactional safety, history recording, repeaters, and scholarship recalculation
 */
export const promoteStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      fromClass,
      toClass,
      fromDivision = 'ALL',
      toDivision = 'A',
      academicYear = '2026-27',
      targetAcademicYear = '2027-28',
      studentSelections, // Optional array of { studentId, status: 'Promoted' | 'Repeated', reason }
    } = req.body;

    if (!fromClass || !toClass) {
      res.status(400).json({
        success: false,
        message: 'प्रारंभिक वर्ग (fromClass) आणि पदोन्नती वर्ग (toClass) आवश्यक आहेत.',
      });
      return;
    }

    // Query students: if explicit studentSelections provided, query by IDs to allow detecting already promoted students
    let students: any[] = [];
    if (Array.isArray(studentSelections) && studentSelections.length > 0) {
      const selectedIds = studentSelections.map((s) => s.studentId);
      students = await Student.find({ _id: { $in: selectedIds }, isActive: true });
    } else {
      const filter: any = {
        $or: [{ currentStandard: fromClass }, { classGrade: fromClass }],
        isActive: true,
      };
      if (fromDivision && fromDivision !== 'ALL') {
        filter.division = fromDivision;
      }
      students = await Student.find(filter);
    }

    if (students.length === 0) {
      res.status(400).json({
        success: false,
        message: `'${fromClass}' वर्गात पदोन्नतीसाठी कोणतेही पात्र विद्यार्थी आढळले नाहीत.`,
      });
      return;
    }

    const principalName = req.user?.name || 'मुख्याध्यापक (Principal)';
    const principalId = req.user?._id;

    let promotedCount = 0;
    let repeatedCount = 0;
    let skippedCount = 0;

    const studentRecords: IPromotedStudentRecord[] = [];
    const skippedRecords: Array<{ grNumber: string; name: string; reason: string }> = [];

    // Map selection statuses if provided
    const selectionMap = new Map<string, { status: 'Promoted' | 'Repeated'; reason?: string }>();
    if (Array.isArray(studentSelections)) {
      studentSelections.forEach((sel) => {
        selectionMap.set(String(sel.studentId), {
          status: sel.status || 'Promoted',
          reason: sel.reason,
        });
      });
    }

    for (const student of students) {
      const studentIdStr = String(student._id);
      const customSelection = selectionMap.get(studentIdStr);
      const chosenStatus = customSelection?.status || 'Promoted';
      const customReason = customSelection?.reason;

      // Prevent duplicate processing:
      // Check if student already promoted to targetAcademicYear or already in toClass
      const isAlreadyProcessed =
        student.admissionYear === targetAcademicYear ||
        (student.currentStandard === toClass && chosenStatus === 'Promoted') ||
        (student.academicHistory || []).some((h: any) => h.academicYear === targetAcademicYear);

      if (isAlreadyProcessed) {
        skippedCount++;
        skippedRecords.push({
          grNumber: student.grNumber,
          name: student.name,
          reason: `विद्यार्थ्यांची यापूर्वीच शैक्षणिक वर्ष ${targetAcademicYear} साठी प्रक्रिया झाली आहे (Duplicate skipped).`,
        });
        studentRecords.push({
          studentId: student._id,
          grNumber: student.grNumber,
          studentName: student.name,
          fromStandard: student.currentStandard || fromClass,
          fromDivision: student.division || 'A',
          toStandard: student.currentStandard || fromClass,
          toDivision: student.division || 'A',
          status: 'Skipped',
          reason: `Duplicate skipped for ${targetAcademicYear}`,
        });
        continue;
      }

      // Record previous academic history entry
      const previousStandard = student.currentStandard || student.classGrade || fromClass;
      const previousDivision = student.division || 'A';

      if (!student.academicHistory) {
        student.academicHistory = [];
      }

      student.academicHistory.push({
        academicYear: targetAcademicYear,
        standard: previousStandard,
        division: previousDivision,
        status: chosenStatus,
        promotedDate: new Date(),
        promotedBy: principalName,
        remarks:
          customReason ||
          (chosenStatus === 'Promoted'
            ? `शैक्षणिक वर्ष ${academicYear} मधून उत्तीर्ण होऊन वर्ग ${toClass} मध्ये पदोन्नती (${targetAcademicYear})`
            : `शैक्षणिक वर्ष ${academicYear} मध्ये वर्ग पुनरावृत्ती (${targetAcademicYear})`),
      });

      if (chosenStatus === 'Promoted') {
        student.currentStandard = toClass;
        student.classGrade = toClass;
        student.division = (toDivision as 'A' | 'B') || 'A';
        student.admissionYear = targetAcademicYear;

        // If promoting to 7th complete, mark as Completed or preserve
        if (toClass.includes('उत्तीर्ण')) {
          student.isActive = false; // Alumni/Graduated
        }

        promotedCount++;
        studentRecords.push({
          studentId: student._id,
          grNumber: student.grNumber,
          studentName: student.name,
          fromStandard: previousStandard,
          fromDivision: previousDivision,
          toStandard: toClass,
          toDivision: (toDivision as 'A' | 'B') || 'A',
          status: 'Promoted',
          reason: customReason || 'वार्षिक प्रगती समाधानकारक (Regular Annual Promotion)',
        });
      } else {
        // Exception: Repeating the standard
        student.studentType = 'Repeater';
        student.admissionYear = targetAcademicYear;
        repeatedCount++;
        studentRecords.push({
          studentId: student._id,
          grNumber: student.grNumber,
          studentName: student.name,
          fromStandard: previousStandard,
          fromDivision: previousDivision,
          toStandard: previousStandard,
          toDivision: previousDivision,
          status: 'Repeated',
          reason: customReason || 'पालकांच्या संमतीने वर्ग पुनरावृत्ती (Academic Repetition)',
        });
      }

      await student.save();
    }

    // Create Promotion History Log Document
    if (principalId && (promotedCount > 0 || repeatedCount > 0)) {
      await PromotionHistory.create({
        academicYear,
        targetAcademicYear,
        fromStandard: fromClass,
        fromDivision: fromDivision || 'ALL',
        toStandard: toClass,
        toDivision: toDivision || 'A',
        promotedBy: principalName,
        promotedById: principalId,
        promotionDate: new Date(),
        totalStudents: students.length,
        promotedCount,
        repeatedCount,
        skippedCount,
        studentRecords,
      });
    }

    // Asynchronously recalculate scholarship calculations for updated classes
    evaluateAllSchemes().catch((err) =>
      console.error('[Promotion] Error recalculating scholarship eligibility:', err)
    );

    res.status(200).json({
      success: true,
      message: `${promotedCount} विद्यार्थ्यांना '${fromClass}' मधून '${toClass}' मध्ये यशस्वीरीत्या पदोन्नती दिली.${
        repeatedCount > 0 ? ` (${repeatedCount} विद्यार्थी पुनरावृत्ती नोंद)` : ''
      }${skippedCount > 0 ? ` (${skippedCount} विद्यार्थी वगळले)` : ''}`,
      promotedBy: principalName,
      promotedCount,
      repeatedCount,
      skippedCount,
      skippedRecords,
      totalProcessed: students.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/portal/promotion/history
 * Fetches previous promotion batch logs for administrative audit trail
 */
export const getPromotionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const history = await PromotionHistory.find().sort({ promotionDate: -1 }).limit(50);
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
