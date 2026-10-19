import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AdmissionApplication } from '../models/AdmissionApplication.model';
import { Student } from '../models/Student.model';
import { evaluateAllSchemes } from '../services/scholarshipEligibility.service';

/**
 * 1. GET /api/portal/admissions
 * Fetches admission applications with filtering, search, and metric counts
 */
export const getAdmissionsList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, grade, search } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      if (status === 'Pending') {
        // Include both Pending and Submitted
        query.status = { $in: ['Pending', 'Submitted'] };
      } else {
        query.status = status;
      }
    }

    if (grade && grade !== 'ALL') {
      query.gradeApplying = { $regex: new RegExp(String(grade), 'i') };
    }

    if (search) {
      const s = String(search).trim();
      query.$or = [
        { studentName: { $regex: new RegExp(s, 'i') } },
        { applicationNo: { $regex: new RegExp(s, 'i') } },
        { parentName: { $regex: new RegExp(s, 'i') } },
        { parentPhone: { $regex: new RegExp(s, 'i') } },
      ];
    }

    const applications = await AdmissionApplication.find(query).sort({ appliedAt: -1 });

    // Aggregate counts for dashboard filters
    const totalCount = await AdmissionApplication.countDocuments();
    const pendingCount = await AdmissionApplication.countDocuments({
      status: { $in: ['Pending', 'Submitted'] },
    });
    const underReviewCount = await AdmissionApplication.countDocuments({ status: 'Under Review' });
    const approvedCount = await AdmissionApplication.countDocuments({ status: 'Approved' });
    const admittedCount = await AdmissionApplication.countDocuments({ status: 'Admitted' });
    const waitlistedCount = await AdmissionApplication.countDocuments({ status: 'Waitlisted' });
    const rejectedCount = await AdmissionApplication.countDocuments({ status: 'Rejected' });

    res.status(200).json({
      success: true,
      data: applications,
      counts: {
        total: totalCount,
        pending: pendingCount,
        underReview: underReviewCount,
        approved: approvedCount,
        admitted: admittedCount,
        waitlisted: waitlistedCount,
        rejected: rejectedCount,
      },
      // Backward compatibility aliases
      pendingCount,
      approvedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/portal/admissions/:id
 * Fetches comprehensive application dossier with full applicant details, documents, and audit logs
 */
export const getAdmissionDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await AdmissionApplication.findById(id).populate('admittedStudentId');

    if (!application) {
      res.status(404).json({ success: false, message: 'प्रवेश अर्ज आढळला नाही.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/portal/admissions/next-gr
 * Computes next available GR (General Register) number to prevent collisions
 */
export const getNextGrNumber = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const students = await Student.find({}, { grNumber: 1 });
    let maxGr = 1400;

    students.forEach((s) => {
      const parsed = parseInt(s.grNumber, 10);
      if (!isNaN(parsed) && parsed > maxGr) {
        maxGr = parsed;
      }
    });

    const nextGr = (maxGr + 1).toString();

    res.status(200).json({
      success: true,
      data: {
        nextGrNumber: nextGr,
        highestExistingGr: maxGr.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/portal/admissions/:id/status
 * Updates status: 'Under Review', 'Approved', 'Rejected', 'Waitlisted' with audit trails
 */
export const updateAdmissionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;

    const validStatuses = ['Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Waitlisted', 'Admitted'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'अवैध प्रवेश स्थिती (Invalid status).' });
      return;
    }

    if (status === 'Rejected' && (!reason || !reason.trim())) {
      res.status(400).json({
        success: false,
        message: 'प्रवेश अर्ज नाकारताना कारण (Reason for Rejection) नमूद करणे अनिवार्य आहे.',
      });
      return;
    }

    const application = await AdmissionApplication.findById(id);
    if (!application) {
      res.status(404).json({ success: false, message: 'प्रवेश अर्ज आढळला नाही.' });
      return;
    }

    const principalName = req.user?.name || 'मुख्याध्यापक (Principal)';

    application.status = status;
    if (status === 'Rejected') {
      application.rejectionReason = reason.trim();
    }
    if (status === 'Waitlisted') {
      application.waitlistReason = (reason || notes || 'जागा उपलब्धतेनुसार प्रतीक्षा').trim();
    }
    if (notes) {
      application.notes = notes.trim();
    }

    if (!application.decisionHistory) {
      application.decisionHistory = [];
    }

    application.decisionHistory.push({
      status,
      changedBy: principalName,
      changedAt: new Date(),
      reason: reason ? reason.trim() : '',
      notes: notes ? notes.trim() : `स्थिती बदलून '${status}' केली.`,
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: `अर्ज #${application.applicationNo} ची स्थिती यशस्वीरीत्या '${status}' करण्यात आली.`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/portal/admissions/:id/enroll
 * Controlled enrollment workflow: Creates official Student record and links to application
 */
export const enrollStudentFromAdmission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      grNumber,
      standard,
      division = 'A',
      admissionDate = new Date(),
      category = 'OBC',
      bloodGroup = 'B+',
      saralId,
      penNumber,
      motherTongue = 'मराठी',
      religion = 'हिंदू',
      caste = 'मराठा',
    } = req.body;

    if (!grNumber) {
      res.status(400).json({ success: false, message: 'जनरल रजिस्टर क्रमांक (GR Number) आवश्यक आहे.' });
      return;
    }

    const application = await AdmissionApplication.findById(id);
    if (!application) {
      res.status(404).json({ success: false, message: 'प्रवेश अर्ज आढळला नाही.' });
      return;
    }

    // Check if GR number is already in use
    const existingStudentWithGr = await Student.findOne({ grNumber: String(grNumber).trim() });
    if (existingStudentWithGr) {
      res.status(409).json({
        success: false,
        message: `जनरल रजिस्टर क्र. ${grNumber} आधीपासूनच विद्यार्थी '${existingStudentWithGr.name}' यांच्यासाठी नोंदवला गेला आहे. कृपया दुसरा GR क्रमांक द्या.`,
      });
      return;
    }

    // Prevent duplicate enrollment from this application
    if (application.status === 'Admitted' && application.admittedStudentId) {
      res.status(400).json({
        success: false,
        message: `हा अर्ज आधीच दाखल झाला असून विद्यार्थी आयडी संलग्न आहे (GR: ${application.assignedGrNumber}).`,
      });
      return;
    }

    const finalStandard = standard || application.gradeApplying || 'इयत्ता १ ली';
    const cleanStandard = finalStandard.includes('(') ? finalStandard.split('(')[0].trim() : finalStandard;
    const principalName = req.user?.name || 'मुख्याध्यापक (Principal)';

    // Generate compliant SARAL & PEN IDs if not provided
    const cleanGr = String(grNumber).trim();
    const finalSaral = saralId ? String(saralId).trim() : `2703080450126${cleanGr.padStart(4, '0')}`;
    const finalPen = penNumber ? String(penNumber).trim() : `PEN2026${cleanGr}`;

    // Map gender to Marathi
    let marathiGender: 'मुलगा' | 'मुलगी' | 'इतर' = 'मुलगा';
    if (application.gender === 'Female' || application.gender === 'मुलगी') {
      marathiGender = 'मुलगी';
    } else if (application.gender === 'Other' || application.gender === 'इतर') {
      marathiGender = 'इतर';
    }

    // Create the new official student document
    const newStudent = await Student.create({
      grNumber: cleanGr,
      name: application.studentName,
      aadhaarNumber: 'XXXXXXXXXXXX',
      dateOfBirth: application.dateOfBirth,
      gender: marathiGender,
      motherTongue: application.motherTongue || motherTongue,
      religion: application.religion || religion,
      caste: application.caste || caste,
      category: (application.category as any) || category || 'OBC',
      bloodGroup: (application.bloodGroup as any) || bloodGroup || 'B+',
      fatherName: application.parentName,
      motherName: application.motherName || 'आई',
      guardianName: application.guardianName || application.parentName,
      parentsOccupation: 'शेतकरी / कामगार',
      annualFamilyIncome: 45000,
      isBpl: false,
      houseNumber: 'घर क्र.',
      village: application.village || 'हिंगोणे बु.',
      taluka: application.taluka || 'धरणगाव',
      district: application.district || 'जळगाव',
      pincode: application.pincode || '425105',
      primaryPhone: application.parentPhone,
      residentialAddress: application.residentialAddress,
      saralId: finalSaral,
      penNumber: finalPen,
      admissionDate: new Date(admissionDate),
      studentType: 'Fresher',
      entryStandard: cleanStandard,
      currentStandard: cleanStandard,
      classGrade: cleanStandard,
      division: (division as 'A' | 'B') || 'A',
      mediumOfInstruction: 'मराठी',
      attendancePercentage: 100,
      isActive: true,
      admissionYear: '2026-27',
      academicHistory: [
        {
          academicYear: '2026-27',
          standard: cleanStandard,
          division: (division as 'A' | 'B') || 'A',
          status: 'Admitted',
          promotedDate: new Date(admissionDate),
          promotedBy: principalName,
          remarks: `नवीन प्रवेश मंजूर (Application #${application.applicationNo})`,
        },
      ],
    });

    // Update application with admitted status and links
    application.status = 'Admitted';
    application.admittedStudentId = newStudent._id as any;
    application.assignedGrNumber = cleanGr;
    application.assignedStandard = cleanStandard;
    application.assignedDivision = (division as 'A' | 'B') || 'A';
    application.admissionDate = new Date(admissionDate);

    if (!application.decisionHistory) {
      application.decisionHistory = [];
    }

    application.decisionHistory.push({
      status: 'Admitted',
      changedBy: principalName,
      changedAt: new Date(),
      notes: `प्रवेश निश्चित: विद्यार्थी नोंदवहीत GR No. ${cleanGr} आणि वर्ग ${cleanStandard} - ${division} मध्ये दाखल.`,
    });

    await application.save();

    // Recalculate scholarship calculations for newly admitted student
    evaluateAllSchemes().catch((err) =>
      console.error('[Admissions] Error evaluating scholarships after enrollment:', err)
    );

    res.status(201).json({
      success: true,
      message: `विद्यार्थी '${newStudent.name}' यांचा वर्ग '${cleanStandard}' (तुकडी ${division}) मध्ये GR क्र. ${cleanGr} सह अधिकृत प्रवेश निश्चित झाला आहे!`,
      data: {
        applicationNo: application.applicationNo,
        studentId: newStudent._id,
        grNumber: newStudent.grNumber,
        name: newStudent.name,
        standard: newStudent.currentStandard,
        division: newStudent.division,
      },
    });
  } catch (error) {
    next(error);
  }
};
