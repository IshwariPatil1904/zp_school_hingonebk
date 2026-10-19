import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Student } from '../models/Student.model';
import { Finance } from '../models/Finance.model';
import { CertificateRequest } from '../models/CertificateRequest.model';
import { CertificateConfig, DEFAULT_CERTIFICATE_CONFIG } from '../models/CertificateConfig.model';
import { AdmissionApplication } from '../models/AdmissionApplication.model';
import { Notice } from '../models/Notice.model';
import { Scholarship } from '../models/Scholarship.model';
import { Teacher } from '../models/Teacher.model';
import { AuditLog } from '../models/AuditLog.model';
import { ScholarshipEligibility } from '../models/ScholarshipEligibility.model';
import {
  evaluateAllStudentsForScheme,
  RULE_VERSION,
} from '../services/scholarshipEligibility.service';

const maskAadhaar = (val?: string): string => {
  if (!val || val.length < 4) return '•••• •••• ••••';
  const clean = val.replace(/\s+/g, '');
  return `•••• •••• ${clean.slice(-4)}`;
};

const maskBank = (val?: string): string => {
  if (!val || val.length < 4) return '••••••••••••';
  return `••••••••${val.slice(-4)}`;
};

/**
 * Principal Dashboard Summary
 * Fetches real aggregate statistics from MongoDB collections
 */
export const getPrincipalDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Total active students
    const totalStudents = await Student.countDocuments({ isActive: true });

    // 2. Total active teachers
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });

    // 3. Class-wise distribution & Gender breakdown
    const classDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$classGrade',
          total: { $sum: 1 },
          boys: { $sum: { $cond: [{ $eq: ['$gender', 'मुलगा'] }, 1, 0] } },
          girls: { $sum: { $cond: [{ $eq: ['$gender', 'मुलगी'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Overall Gender distribution
    const genderAggregation = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);
    const genderDistribution = {
      boys: genderAggregation.find((g) => g._id === 'मुलगा')?.count || 0,
      girls: genderAggregation.find((g) => g._id === 'मुलगी')?.count || 0,
    };

    // 5. Category distribution
    const categoryDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // 6. Pending admissions
    const pendingAdmissionsCount = await AdmissionApplication.countDocuments({ status: 'Pending' });
    const pendingAdmissions = await AdmissionApplication.find({ status: 'Pending' })
      .sort({ appliedAt: -1 })
      .limit(5);

    // 7. Pending certificate requests
    const pendingCertificatesCount = await CertificateRequest.countDocuments({ status: 'Pending' });
    const pendingCertificates = await CertificateRequest.find({ status: 'Pending' })
      .sort({ requestedDate: -1 })
      .limit(5);

    // 8. Total funds received, expenses, and available balance
    const fundsAggregation = await Finance.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const totalFundsReceived =
      fundsAggregation.find((f) => f._id === 'fund_received')?.totalAmount || 0;
    const totalExpenses =
      fundsAggregation.find((f) => f._id === 'expense')?.totalAmount || 0;
    const availableBalance = totalFundsReceived - totalExpenses;

    // 9. Recent activities and notices
    const recentNotices = await Notice.find().sort({ date: -1 }).limit(5);
    const recentExpenses = await Finance.find({ type: 'expense' })
      .sort({ date: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        classDistribution,
        genderDistribution,
        categoryDistribution,
        pendingAdmissionsCount,
        pendingAdmissions,
        pendingCertificatesCount,
        pendingCertificates,
        financials: {
          totalFundsReceived,
          totalExpenses,
          availableBalance,
        },
        recentExpenses,
        recentNotices,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Teacher Dashboard Summary
 * Fetches real aggregate statistics strictly for the teacher's authorized classes
 */
export const getTeacherDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const assignedClasses = user?.teacherProfile?.assignedClasses || ['इयत्ता १ ली', 'इयत्ता २ री'];

    // 1. Total authorized students in assigned classes
    const totalAuthorizedStudents = await Student.countDocuments({
      isActive: true,
      classGrade: { $in: assignedClasses },
    });

    // 2. Class-wise distribution for assigned classes
    const classDistribution = await Student.aggregate([
      { $match: { isActive: true, classGrade: { $in: assignedClasses } } },
      {
        $group: {
          _id: '$classGrade',
          total: { $sum: 1 },
          boys: { $sum: { $cond: [{ $eq: ['$gender', 'मुलगा'] }, 1, 0] } },
          girls: { $sum: { $cond: [{ $eq: ['$gender', 'मुलगी'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Gender distribution in assigned classes
    const genderAggregation = await Student.aggregate([
      { $match: { isActive: true, classGrade: { $in: assignedClasses } } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);
    const genderDistribution = {
      boys: genderAggregation.find((g) => g._id === 'मुलगा')?.count || 0,
      girls: genderAggregation.find((g) => g._id === 'मुलगी')?.count || 0,
    };

    // 4. Category distribution in assigned classes
    const categoryDistribution = await Student.aggregate([
      { $match: { isActive: true, classGrade: { $in: assignedClasses } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // 5. Scholarship eligibility summary in assigned classes
    const scholarshipStudentsCount = await Student.countDocuments({
      isActive: true,
      classGrade: { $in: assignedClasses },
      scholarshipScheme: { $exists: true, $ne: '' },
    });

    // 6. Certificates summary for assigned classes
    const pendingCertificatesCount = await CertificateRequest.countDocuments({
      classGrade: { $in: assignedClasses },
      status: 'Pending',
    });

    const approvedCertificatesCount = await CertificateRequest.countDocuments({
      classGrade: { $in: assignedClasses },
      status: 'Approved',
    });

    const myRecentCertificates = await CertificateRequest.find({
      classGrade: { $in: assignedClasses },
    })
      .sort({ requestedDate: -1 })
      .limit(5);

    // 7. Read-only financial summaries for school transparency
    const fundsAggregation = await Finance.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    const totalFundsReceived =
      fundsAggregation.find((f) => f._id === 'fund_received')?.totalAmount || 0;
    const totalExpenses =
      fundsAggregation.find((f) => f._id === 'expense')?.totalAmount || 0;
    const availableBalance = totalFundsReceived - totalExpenses;

    // 8. Recent school notices
    const recentNotices = await Notice.find().sort({ date: -1 }).limit(5);

    res.status(200).json({
      success: true,
      data: {
        teacherName: user?.name,
        designation: user?.designation,
        assignedClasses,
        totalAuthorizedStudents,
        classDistribution,
        genderDistribution,
        categoryDistribution,
        scholarshipSummary: {
          enrolledCount: scholarshipStudentsCount,
          totalEligible: totalAuthorizedStudents,
        },
        certificates: {
          pending: pendingCertificatesCount,
          approved: approvedCertificatesCount,
          recent: myRecentCertificates,
        },
        financialSummaries: {
          totalFundsReceived,
          totalExpenses,
          availableBalance,
          readOnly: true,
        },
        recentNotices,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Students Controller
 */
export const getStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 12));
    const skip = (page - 1) * limit;

    const { classGrade, standard, gender, category, division, search, myClassesOnly, unmasked } =
      req.query;
    const query: any = { isActive: true };

    const classFilter = standard || classGrade;
    if (req.user?.role === 'teacher' && myClassesOnly === 'true') {
      const assigned = req.user.teacherProfile?.assignedClasses || [];
      if (assigned.length > 0) {
        query.$or = [{ currentStandard: { $in: assigned } }, { classGrade: { $in: assigned } }];
      }
    } else if (classFilter && classFilter !== 'ALL') {
      const cleanGrade = (classFilter as string).replace(/^(वर्ग|इयत्ता)\s*/, '').trim();
      const variations = [
        classFilter as string,
        `इयत्ता ${cleanGrade}`,
        `वर्ग ${cleanGrade}`,
      ];
      query.$or = [
        { currentStandard: { $in: variations } },
        { classGrade: { $in: variations } },
        { currentStandard: new RegExp(cleanGrade, 'i') },
        { classGrade: new RegExp(cleanGrade, 'i') },
      ];
    }

    if (gender && gender !== 'ALL') {
      query.gender = gender;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (division && division !== 'ALL') {
      query.division = division;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { grNumber: searchRegex },
          { saralId: searchRegex },
          { penNumber: searchRegex },
          { primaryPhone: searchRegex },
          { fatherName: searchRegex },
        ],
      });
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort({ grNumber: 1 }).skip(skip).limit(limit);

    // Apply default privacy masking on Aadhaar and Bank accounts
    const sanitized = students.map((s) => {
      const doc = s.toObject();
      if (unmasked !== 'true') {
        doc.aadhaarNumber = maskAadhaar(doc.aadhaarNumber);
        doc.bankAccountNumber = maskBank(doc.bankAccountNumber);
      }
      return doc;
    });

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pagination: {
        totalStudents: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    const doc = student.toObject();
    const rawAadhaar = student.aadhaarNumber || '';
    const rawBank = student.bankAccountNumber || '';

    if (req.query.unmasked !== 'true') {
      doc.aadhaarNumber = maskAadhaar(doc.aadhaarNumber);
      doc.bankAccountNumber = maskBank(doc.bankAccountNumber);
    }

    res.status(200).json({
      success: true,
      data: doc,
      rawAadhaarLast4: rawAadhaar.slice(-4),
      rawBankLast4: rawBank.slice(-4),
    });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body;
    const studentName = body.name || body.studentName;
    const currentStandard = body.currentStandard || body.grade || 'इयत्ता १ ली';
    if (!studentName) {
      res.status(400).json({ success: false, message: 'Student full name and standard are required.' });
      return;
    }

    // Safely compute next integer GR number
    const allStudents = await Student.find({}, { grNumber: 1 }).lean();
    let maxGr = 1500;
    for (const s of allStudents) {
      const num = parseInt(s.grNumber, 10);
      if (!isNaN(num) && num > maxGr) {
        maxGr = num;
      }
    }
    const grNumber = body.grNumber || (maxGr + 1).toString();
    const currentYear = new Date().getFullYear();
    const saralId = body.saralId || `27030804501-${currentYear}-${grNumber}`;
    const penNumber = body.penNumber || `2026${currentYear}${Math.floor(100 + Math.random() * 900)}`;

    const newStudent = await Student.create({
      aadhaarNumber: body.aadhaarNumber || '98' + Math.floor(1000000000 + Math.random() * 9000000000),
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : new Date('2018-06-01'),
      gender: body.gender || 'मुलगा',
      motherTongue: body.motherTongue || 'मराठी',
      religion: body.religion || 'हिंदू',
      caste: body.caste || 'मराठा',
      category: body.category || 'OBC',
      bloodGroup: body.bloodGroup || 'B+',
      fatherName: body.fatherName || 'पालक',
      motherName: body.motherName || 'आई',
      guardianName: body.guardianName || body.fatherName || 'पालक',
      parentsOccupation: body.parentsOccupation || 'शेतकरी / शेतमजूर',
      annualFamilyIncome: body.annualFamilyIncome ? Number(body.annualFamilyIncome) : 45000,
      isBpl: body.isBpl ?? false,
      minorityStatus: body.minorityStatus || 'None',
      houseNumber: body.houseNumber || 'घर क्र. १२',
      village: body.village || 'हिंगोणे बु.',
      taluka: body.taluka || 'धरणगाव',
      district: body.district || 'जळगाव',
      pincode: body.pincode || '425105',
      primaryPhone: body.primaryPhone || '9823456789',
      residentialAddress: body.residentialAddress || 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
      admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
      studentType: body.studentType || 'Fresher',
      entryStandard: body.entryStandard || currentStandard,
      division: body.division || 'A',
      mediumOfInstruction: body.mediumOfInstruction || 'मराठी',
      previousYearMarks: body.previousYearMarks ? Number(body.previousYearMarks) : 80,
      attendancePercentage: body.attendancePercentage ? Number(body.attendancePercentage) : 95,
      bankAccountHolder: body.bankAccountHolder || studentName,
      bankName: body.bankName || 'बँक ऑफ महाराष्ट्र',
      bankAccountNumber: body.bankAccountNumber || '60341234567',
      bankIfsc: body.bankIfsc || 'MAHB0000412',
      isCwsn: body.isCwsn ?? false,
      heightCm: body.heightCm ? Number(body.heightCm) : 120,
      weightKg: body.weightKg ? Number(body.weightKg) : 22,
      admissionYear: body.admissionYear || '2026-27',
      ...body,
      name: studentName,
      grNumber,
      saralId,
      penNumber,
      currentStandard,
      classGrade: currentStandard,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Student '${newStudent.name}' enrolled successfully with GR #${newStudent.grNumber}.`,
      data: newStudent,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'A student with this GR number or SARAL ID already exists.' });
      return;
    }
    next(error);
  }
};

export const updateStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    // Role-check: Teacher can only update students of their assigned classes
    if (req.user?.role === 'teacher') {
      const assigned = req.user.teacherProfile?.assignedClasses || [];
      if (!assigned.includes(student.currentStandard) && !assigned.includes(student.classGrade)) {
        res.status(403).json({
          success: false,
          message: `Access denied: You are assigned to [${assigned.join(', ')}]. You cannot modify student '${student.name}' in standard '${student.currentStandard}'.`,
        });
        return;
      }
    }

    if (updateData.currentStandard) {
      updateData.classGrade = updateData.currentStandard;
    }

    Object.assign(student, updateData);
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student record for '${student.name}' updated successfully.`,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const admitStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    return createStudent(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const promoteStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fromClass, toClass } = req.body;
    if (!fromClass || !toClass) {
      res.status(400).json({ success: false, message: 'Source and destination classes are required.' });
      return;
    }

    const result = await Student.updateMany(
      { classGrade: fromClass, isActive: true },
      { $set: { classGrade: toClass, currentStandard: toClass } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} students successfully promoted from '${fromClass}' to '${toClass}'.`,
      promotedBy: req.user?.name,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Teachers Controller (List, Filter, Details, Create, Edit)
 */
export const getTeachersList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subject, minExp, maxExp, search } = req.query;
    const query: any = { isActive: true };

    if (subject && subject !== 'ALL') {
      query.subjectSpecialization = { $in: [new RegExp(subject as string, 'i')] };
    }

    if (minExp) {
      query.experienceYears = query.experienceYears || {};
      query.experienceYears.$gte = parseInt(minExp as string, 10);
    }

    if (maxExp) {
      query.experienceYears = query.experienceYears || {};
      query.experienceYears.$lte = parseInt(maxExp as string, 10);
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { employeeId: searchRegex },
        { qualification: searchRegex },
        { designation: searchRegex },
      ];
    }

    const teachers = await Teacher.find(query)
      .populate('linkedUserId', 'email username role isActive')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(
      'linkedUserId',
      'email username role isActive'
    );
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

export const createTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      gender,
      dateOfBirth,
      bloodGroup,
      contactPhone,
      email,
      aadhaarNumber,
      residentialAddress,
      employeeId,
      designation,
      qualification,
      joiningDate,
      assignedClasses,
      subjectSpecialization,
      experienceYears,
      medicalFitness,
      emergencyContactName,
      emergencyContactPhone,
      createLoginAccount,
      username,
      password,
    } = req.body;

    if (!name || !employeeId || !email) {
      res.status(400).json({
        success: false,
        message: 'Name, employee ID (Sevaarth), and email are required.',
      });
      return;
    }

    let linkedUserId = undefined;

    // If create login account is requested
    if (createLoginAccount && username && password) {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Username or email already exists for staff login.',
        });
        return;
      }

      const newUser = await User.create({
        name,
        email,
        username,
        password,
        role: 'teacher',
        phone: contactPhone || '',
        designation: designation || 'Primary Teacher',
        isActive: true,
        teacherProfile: {
          employeeId,
          qualification: qualification || 'B.A., B.Ed.',
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          assignedClasses: assignedClasses || [],
          subjectSpecialization: subjectSpecialization || [],
        },
      });
      linkedUserId = newUser._id;
    }

    const newTeacher = await Teacher.create({
      name,
      gender: gender || 'Female',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
      bloodGroup: bloodGroup || 'B+',
      contactPhone: contactPhone || '9800000000',
      email,
      aadhaarNumber: aadhaarNumber || '982345678912',
      residentialAddress: residentialAddress || 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
      employeeId,
      designation: designation || 'Primary Teacher',
      qualification: qualification || 'B.A., B.Ed.',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      assignedClasses: assignedClasses || [],
      subjectSpecialization: subjectSpecialization || [],
      experienceYears: Number(experienceYears) || 5,
      medicalFitness: medicalFitness || 'Fit',
      emergencyContactName: emergencyContactName || 'कुटुंब संपर्क',
      emergencyContactPhone: emergencyContactPhone || '9823456789',
      linkedUserId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Teacher '${newTeacher.name}' (${newTeacher.employeeId}) successfully registered.`,
      data: newTeacher,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Employee ID or email already registered.' });
      return;
    }
    next(error);
  }
};

export const updateTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher record not found.' });
      return;
    }

    // Role check: Only principal can update other teachers or administrative fields
    if (req.user?.role !== 'principal') {
      const isSelf =
        teacher.linkedUserId?.toString() === req.user?._id?.toString() ||
        teacher.email === req.user?.email;

      if (!isSelf) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Teachers can only update their own profile.',
        });
        return;
      }

      // Whitelist only allowed fields for teacher self-update
      const allowedFields = [
        'contactPhone',
        'residentialAddress',
        'emergencyContactName',
        'emergencyContactPhone',
        'bloodGroup',
      ];
      for (const key of Object.keys(updateData)) {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      }
    }

    Object.assign(teacher, updateData);
    await teacher.save();

    // Sync User record if linked
    if (teacher.linkedUserId) {
      await User.findByIdAndUpdate(teacher.linkedUserId, {
        $set: {
          name: teacher.name,
          phone: teacher.contactPhone,
          designation: teacher.designation,
          'teacherProfile.employeeId': teacher.employeeId,
          'teacherProfile.qualification': teacher.qualification,
          'teacherProfile.assignedClasses': teacher.assignedClasses,
          'teacherProfile.subjectSpecialization': teacher.subjectSpecialization,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Teacher record for '${teacher.name}' updated successfully.`,
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherSelfProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const teacher = await Teacher.findOne({
      $or: [{ linkedUserId: userId }, { email: req.user?.email }],
    });

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeacherSelfProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { contactPhone, residentialAddress, emergencyContactName, emergencyContactPhone, bloodGroup } =
      req.body;

    const teacher = await Teacher.findOne({
      $or: [{ linkedUserId: userId }, { email: req.user?.email }],
    });

    if (teacher) {
      if (contactPhone) teacher.contactPhone = contactPhone;
      if (residentialAddress) teacher.residentialAddress = residentialAddress;
      if (emergencyContactName) teacher.emergencyContactName = emergencyContactName;
      if (emergencyContactPhone) teacher.emergencyContactPhone = emergencyContactPhone;
      if (bloodGroup) teacher.bloodGroup = bloodGroup;
      await teacher.save();
    }

    if (req.user && contactPhone) {
      req.user.phone = contactPhone;
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Your personal profile details have been successfully updated.',
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finances Controller
 */
export const getFinancialRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only non-reversed transactions count towards active balances
    const allTransactions = await Finance.find().sort({ date: -1 });

    const activeFunds = allTransactions.filter(
      (t) => t.type === 'fund_received' && t.status !== 'Reversed'
    );
    const activeExpenses = allTransactions.filter(
      (t) => t.type === 'expense' && t.status !== 'Reversed'
    );

    const totalFundsReceived = activeFunds.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = activeExpenses.reduce((sum, t) => sum + t.amount, 0);
    const availableBalance = totalFundsReceived - totalExpenses;

    // Categorized breakdown across official government schemes
    const schemesSummary = activeFunds.map((fund) => {
      const fundExpenses = activeExpenses.filter(
        (e) => e.associatedFundId === fund.fundId || e.category === fund.category
      );
      const utilized = fundExpenses.reduce((sum, e) => sum + e.amount, 0);
      const remaining = Math.max(0, fund.amount - utilized);
      return {
        fundId: fund.fundId || fund.voucherNo,
        schemeType: fund.schemeType || fund.title,
        allocated: fund.amount,
        utilized,
        remaining,
        status: fund.status,
      };
    });

    res.status(200).json({
      success: true,
      readOnly: req.user?.role === 'teacher',
      data: {
        totalFundsReceived,
        totalExpenses,
        availableBalance,
        schemesSummary,
        recentFunds: activeFunds.slice(0, 5),
        recentExpenses: activeExpenses.slice(0, 10),
        transactions: allTransactions,
        readOnly: req.user?.role === 'teacher',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Paginated Funds List with Search & Filtering
 */
export const getFundsList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;
    const { search, scheme, status } = req.query;

    const query: any = { type: 'fund_received' };

    if (scheme && scheme !== 'ALL') {
      query.$or = [
        { schemeType: new RegExp(scheme as string, 'i') },
        { title: new RegExp(scheme as string, 'i') },
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { fundId: searchRegex },
        { schemeType: searchRegex },
        { title: searchRegex },
        { issuedBy: searchRegex },
        { voucherNo: searchRegex },
      ];
    }

    const totalFunds = await Finance.countDocuments(query);
    const funds = await Finance.find(query).sort({ date: -1 }).skip(skip).limit(limit);

    // Attach transaction history / expenses to each fund
    const enrichedFunds = await Promise.all(
      funds.map(async (fund) => {
        const doc = fund.toObject();
        const relatedExpenses = await Finance.find({
          type: 'expense',
          associatedFundId: fund.fundId,
          status: { $ne: 'Reversed' },
        }).sort({ date: -1 });

        const actualUtilized = relatedExpenses.reduce((sum, e) => sum + e.amount, 0);
        doc.utilizedAmount = actualUtilized;
        (doc as any).remainingAmount = Math.max(0, fund.amount - actualUtilized);
        (doc as any).transactionHistory = relatedExpenses;
        return doc;
      })
    );

    res.status(200).json({
      success: true,
      totalFunds,
      page,
      limit,
      totalPages: Math.ceil(totalFunds / limit),
      data: enrichedFunds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add New Fund (Principal Only)
 */
export const createFund = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { schemeType, fundId, amount, issuedBy, issueDate, expiryDate, notes } = req.body;

    if (!schemeType || !fundId || !amount || !issuedBy || !issueDate || !expiryDate) {
      res.status(400).json({
        success: false,
        message: 'Fund scheme/type, Fund ID, amount, issuing authority, issue date, and deadline are required.',
      });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, message: 'Fund amount must be a positive number.' });
      return;
    }

    const startDate = new Date(issueDate);
    const endDate = new Date(expiryDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid calendar dates provided.' });
      return;
    }
    if (endDate < startDate) {
      res.status(400).json({
        success: false,
        message: 'Expiry/submission deadline cannot be earlier than the issue date.',
      });
      return;
    }

    // Check for unique fund ID
    const existingFund = await Finance.findOne({ fundId: fundId.trim() });
    if (existingFund) {
      res.status(400).json({
        success: false,
        message: `Fund ID '${fundId}' is already registered. Please provide a unique Fund ID.`,
      });
      return;
    }

    const fundsCount = await Finance.countDocuments({ type: 'fund_received' });
    const voucherNo = `CR-2026-${(fundsCount + 1).toString().padStart(2, '0')}`;

    const newFund = await Finance.create({
      type: 'fund_received',
      fundId: fundId.trim(),
      schemeType,
      title: `${schemeType} (${fundId.trim()})`,
      category: schemeType,
      amount: numericAmount,
      issuedBy,
      issueDate: startDate,
      expiryDate: endDate,
      date: startDate,
      voucherNo,
      approvedBy: `${req.user?.name} (Principal)`,
      status: 'Active',
      utilizedAmount: 0,
      notes: notes || '',
    });

    // Record audit trail
    await AuditLog.create({
      action: 'CREATE_FUND',
      entityType: 'Fund',
      entityId: newFund._id.toString(),
      voucherNo,
      amount: numericAmount,
      performedBy: req.user?.name || 'Principal',
      performedByRole: req.user?.role || 'principal',
      details: `Fund received: '${schemeType}' (${fundId.trim()}) amount ₹${numericAmount.toLocaleString('en-IN')} issued by ${issuedBy}.`,
    });

    res.status(201).json({
      success: true,
      message: `Fund '${schemeType}' (${fundId.trim()}) of ₹${numericAmount.toLocaleString('en-IN')} successfully created.`,
      data: newFund,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Duplicate Fund ID or voucher reference.' });
      return;
    }
    next(error);
  }
};

/**
 * Get Paginated Expenses List with Search, Filters & Export Format
 */
export const getExpensesList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;
    const { search, category, associatedFundId, status } = req.query;

    const query: any = { type: 'expense' };

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (associatedFundId && associatedFundId !== 'ALL') {
      query.associatedFundId = associatedFundId;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { purpose: searchRegex },
        { title: searchRegex },
        { billNumber: searchRegex },
        { vendorName: searchRegex },
        { voucherNo: searchRegex },
      ];
    }

    const totalExpenses = await Finance.countDocuments(query);
    const expenses = await Finance.find(query).sort({ date: -1 }).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      totalExpenses,
      page,
      limit,
      totalPages: Math.ceil(totalExpenses / limit),
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add New Expense with Strict Financial Integrity & Overspending Policy
 */
export const recordExpense = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      purpose,
      title,
      amount,
      billNumber,
      vendorName,
      category,
      billDate,
      associatedFundId,
      notes,
      billAttachment,
    } = req.body;

    const expensePurpose = purpose || title;
    if (!expensePurpose || !amount) {
      res.status(400).json({
        success: false,
        message: 'Purpose and amount are required.',
      });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, message: 'Expense amount must be a positive number.' });
      return;
    }

    const finalBillNumber = (billNumber && billNumber.trim()) || `BILL-${Date.now().toString().slice(-6)}`;
    const finalVendorName = (vendorName && vendorName.trim()) || 'स्थानिक पुरवठादार (Local Vendor)';
    const finalCategory = category || 'Maintenance & Repairs';

    // 1. Prevent duplicate bill submissions from the same vendor
    const existingBill = await Finance.findOne({
      type: 'expense',
      billNumber: finalBillNumber,
      vendorName: finalVendorName,
      status: { $ne: 'Reversed' },
    });
    if (existingBill) {
      res.status(400).json({
        success: false,
        message: `Duplicate bill entry: Bill #${finalBillNumber} from vendor '${finalVendorName}' has already been processed under voucher ${existingBill.voucherNo}.`,
      });
      return;
    }

    // 2. Locate associated fund
    let fund = null;
    if (associatedFundId) {
      fund = await Finance.findOne({
        type: 'fund_received',
        $or: [{ fundId: associatedFundId.trim() }, { voucherNo: associatedFundId.trim() }],
        status: { $ne: 'Reversed' },
      });
    } else {
      // Find active fund with sufficient balance
      const activeFunds = await Finance.find({ type: 'fund_received', status: 'Active' });
      for (const f of activeFunds) {
        const expenses = await Finance.find({
          type: 'expense',
          associatedFundId: f.fundId,
          status: { $ne: 'Reversed' },
        });
        const currentUtil = expenses.reduce((s, e) => s + e.amount, 0);
        if (f.amount - currentUtil >= numericAmount) {
          fund = f;
          break;
        }
      }
      if (!fund && activeFunds.length > 0) {
        fund = activeFunds[0];
      }
    }

    if (!fund) {
      res.status(400).json({
        success: false,
        message: `Associated fund '${associatedFundId || 'Default'}' does not exist or has been reversed.`,
      });
      return;
    }

    // 3. Calculate dynamic remaining balance in this specific fund
    const currentFundExpenses = await Finance.find({
      type: 'expense',
      associatedFundId: fund.fundId,
      status: { $ne: 'Reversed' },
    });
    const currentUtilized = currentFundExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingInFund = fund.amount - currentUtilized;

    // Financial integrity policy check on specific fund:
    if (numericAmount > remainingInFund) {
      res.status(400).json({
        success: false,
        message: `Spending policy limit exceeded: Available balance in fund '${fund.fundId} (${fund.schemeType || fund.title})' is ₹${remainingInFund.toLocaleString('en-IN')}, which is insufficient for expense of ₹${numericAmount.toLocaleString('en-IN')}. Invalid negative balances are prohibited.`,
      });
      return;
    }

    // 4. Calculate dynamic overall school balance
    const allActiveTransactions = await Finance.find({ status: { $ne: 'Reversed' } });
    const totalFundsReceived = allActiveTransactions
      .filter((t) => t.type === 'fund_received')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allActiveTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const overallAvailable = totalFundsReceived - totalExpenses;

    if (numericAmount > overallAvailable) {
      res.status(400).json({
        success: false,
        message: `Overall liquidity violation: School total available balance is ₹${overallAvailable.toLocaleString('en-IN')}, which cannot cover this expense of ₹${numericAmount.toLocaleString('en-IN')}.`,
      });
      return;
    }

    // 5. Generate unique voucher number
    const expenseCount = await Finance.countDocuments({ type: 'expense' });
    const voucherNo = `EXP-2026-${(expenseCount + 1).toString().padStart(2, '0')}`;

    const newExpense = await Finance.create({
      type: 'expense',
      purpose: expensePurpose,
      title: expensePurpose,
      amount: numericAmount,
      billNumber: finalBillNumber,
      vendorName: finalVendorName,
      category: finalCategory,
      billDate: billDate ? new Date(billDate) : new Date(),
      date: billDate ? new Date(billDate) : new Date(),
      associatedFundId: fund.fundId,
      associatedFundScheme: fund.schemeType || fund.title,
      billAttachment: billAttachment || '',
      voucherNo,
      approvedBy: `${req.user?.name} (Principal)`,
      notes: notes || '',
      status: 'Approved',
    });

    // 6. Update fund utilization status
    const newUtilized = currentUtilized + numericAmount;
    fund.utilizedAmount = newUtilized;
    if (newUtilized >= fund.amount) {
      fund.status = 'Fully Utilized';
    }
    await fund.save();

    // 7. Record Audit Log
    await AuditLog.create({
      action: 'RECORD_EXPENSE',
      entityType: 'Expense',
      entityId: newExpense._id.toString(),
      voucherNo,
      amount: numericAmount,
      performedBy: req.user?.name || 'Principal',
      performedByRole: req.user?.role || 'principal',
      details: `Expense approved: '${expensePurpose}' of ₹${numericAmount.toLocaleString('en-IN')} (Bill #${billNumber}, Vendor: ${vendorName}) debited from fund '${fund.fundId}'.`,
    });

    res.status(201).json({
      success: true,
      message: `Expense '${expensePurpose}' of ₹${numericAmount.toLocaleString('en-IN')} approved and debited from fund '${fund.fundId}'.`,
      data: newExpense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlled Transaction Reversal (Principal Only - Reverses without hard deletion)
 */
export const reverseTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A clear official reason is required for controlled transaction reversal.',
      });
      return;
    }

    const transaction = await Finance.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction record not found.' });
      return;
    }

    if (transaction.status === 'Reversed') {
      res.status(400).json({ success: false, message: 'This transaction has already been reversed.' });
      return;
    }

    transaction.status = 'Reversed';
    transaction.reversalReason = reason.trim();
    transaction.reversedBy = req.user?.name || 'Principal';
    transaction.reversedAt = new Date();
    await transaction.save();

    // If it was an expense, restore the utilized balance on the associated fund
    if (transaction.type === 'expense' && transaction.associatedFundId) {
      const fund = await Finance.findOne({ fundId: transaction.associatedFundId, type: 'fund_received' });
      if (fund) {
        fund.utilizedAmount = Math.max(0, (fund.utilizedAmount || 0) - transaction.amount);
        if (fund.status === 'Fully Utilized' && fund.utilizedAmount < fund.amount) {
          fund.status = 'Active';
        }
        await fund.save();
      }
    }

    // Record Audit Log
    await AuditLog.create({
      action: transaction.type === 'expense' ? 'REVERSE_EXPENSE' : 'REVERSE_FUND',
      entityType: transaction.type === 'expense' ? 'Expense' : 'Fund',
      entityId: transaction._id.toString(),
      voucherNo: transaction.voucherNo,
      amount: transaction.amount,
      performedBy: req.user?.name || 'Principal',
      performedByRole: req.user?.role || 'principal',
      reason: reason.trim(),
      details: `Transaction ${transaction.voucherNo} (${transaction.title}) of ₹${transaction.amount.toLocaleString('en-IN')} marked as REVERSED. Reason: ${reason.trim()}`,
    });

    res.status(200).json({
      success: true,
      message: `Transaction ${transaction.voucherNo} successfully reversed. Balance and ledger adjusted.`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Financial Ledger to CSV
 */
export const exportFinancialLedgerCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transactions = await Finance.find().sort({ date: -1 });

    const headers = [
      'Voucher No',
      'Transaction Type',
      'Scheme / Fund ID',
      'Title / Purpose',
      'Category',
      'Vendor / Issuing Authority',
      'Bill Number',
      'Amount (INR)',
      'Transaction Date',
      'Status',
      'Approved By',
      'Notes',
    ];

    const rows = transactions.map((t) => [
      `"${t.voucherNo}"`,
      `"${t.type === 'fund_received' ? 'Fund Received (जमा)' : 'Expense (खर्च)'}"`,
      `"${t.fundId || t.associatedFundId || '-'}"`,
      `"${(t.purpose || t.title || '').replace(/"/g, '""')}"`,
      `"${(t.category || t.schemeType || '').replace(/"/g, '""')}"`,
      `"${(t.vendorName || t.issuedBy || '-').replace(/"/g, '""')}"`,
      `"${t.billNumber || '-'}"`,
      t.amount,
      t.date ? new Date(t.date).toISOString().split('T')[0] : '',
      `"${t.status}"`,
      `"${(t.approvedBy || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="financial_ledger_zphingone_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Scholarships Controller
 */
/**
 * -------------------------------------------------------------
 * Scholarships Controller (Complete Scheme Management & Eligibility Engine)
 * -------------------------------------------------------------
 */

/**
 * 1. Get All Scholarship Schemes with real-time eligibility counts
 */
export const getScholarships = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isTeacher = req.user?.role === 'teacher';
    // If teacher, only active schemes; if principal, all schemes
    const query = isTeacher ? { isActive: true } : {};
    const schemes = await Scholarship.find(query).sort({ code: 1 });

    // Compute live aggregated metrics across all schemes
    const enrichedSchemes = await Promise.all(
      schemes.map(async (scheme) => {
        const doc = scheme.toObject();

        const [eligibleCount, ineligibleCount, reviewCount, approvedCount] =
          await Promise.all([
            ScholarshipEligibility.countDocuments({
              schemeId: scheme._id,
              status: 'Eligible',
            }),
            ScholarshipEligibility.countDocuments({
              schemeId: scheme._id,
              status: 'Not Eligible',
            }),
            ScholarshipEligibility.countDocuments({
              schemeId: scheme._id,
              status: 'Needs Review',
            }),
            ScholarshipEligibility.countDocuments({
              schemeId: scheme._id,
              isApprovedByPrincipal: true,
            }),
          ]);

        doc.eligibleCount = eligibleCount;
        doc.ineligibleCount = ineligibleCount;
        doc.reviewCount = reviewCount;
        doc.approvedCount = approvedCount;
        return doc;
      })
    );

    const studentsWithScholarship = await Student.find({
      isActive: true,
      scholarshipScheme: { $exists: true, $ne: '' },
    }).select('grNumber name classGrade gender category scholarshipScheme');

    const totalEligible = enrichedSchemes.reduce((acc, s) => acc + s.eligibleCount, 0);
    const totalNeedsReview = enrichedSchemes.reduce((acc, s) => acc + s.reviewCount, 0);
    const totalApproved = enrichedSchemes.reduce((acc, s) => acc + s.approvedCount, 0);

    res.status(200).json({
      success: true,
      readOnly: isTeacher,
      data: {
        schemes: enrichedSchemes,
        stats: {
          totalSchemes: enrichedSchemes.length,
          totalEligible,
          totalNeedsReview,
          totalApproved,
          totalBeneficiaries: studentsWithScholarship.length,
        },
        beneficiaries: studentsWithScholarship,
        totalBeneficiaries: studentsWithScholarship.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Single Scholarship Scheme Details
 */
export const getScholarshipById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await Scholarship.findById(id);
    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
      return;
    }

    const doc = scheme.toObject();
    const [eligibleCount, ineligibleCount, reviewCount, approvedCount] =
      await Promise.all([
        ScholarshipEligibility.countDocuments({
          schemeId: scheme._id,
          status: 'Eligible',
        }),
        ScholarshipEligibility.countDocuments({
          schemeId: scheme._id,
          status: 'Not Eligible',
        }),
        ScholarshipEligibility.countDocuments({
          schemeId: scheme._id,
          status: 'Needs Review',
        }),
        ScholarshipEligibility.countDocuments({
          schemeId: scheme._id,
          isApprovedByPrincipal: true,
        }),
      ]);

    doc.eligibleCount = eligibleCount;
    doc.ineligibleCount = ineligibleCount;
    doc.reviewCount = reviewCount;
    doc.approvedCount = approvedCount;

    res.status(200).json({
      success: true,
      readOnly: req.user?.role === 'teacher',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get Filtered & Paginated Student Eligibility Records for a Scheme
 * Supports tabs: Eligible, Not Eligible, Needs Review
 * Teachers only see students from their assigned classes
 */
export const getScholarshipEvaluations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, search, standard, division } = req.query;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;

    const scheme = await Scholarship.findById(id);
    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
      return;
    }

    const filter: any = { schemeId: scheme._id };

    // RBAC: Teachers only view authorized classes
    if (req.user?.role === 'teacher') {
      const assigned = req.user.teacherProfile?.assignedClasses || [];
      if (assigned.length > 0) {
        filter.standard = { $in: assigned };
      }
    } else if (standard && standard !== 'ALL') {
      filter.standard = standard;
    }

    if (division && division !== 'ALL') {
      filter.division = division;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search as string, 'i');
      filter.$or = [
        { studentName: regex },
        { studentGrNumber: regex },
        { category: regex },
      ];
    }

    const [totalMatching, evaluations, eligibleTotal, ineligibleTotal, reviewTotal, approvedTotal] =
      await Promise.all([
        ScholarshipEligibility.countDocuments(filter),
        ScholarshipEligibility.find(filter)
          .sort({ status: 1, studentGrNumber: 1 })
          .skip(skip)
          .limit(limit),
        ScholarshipEligibility.countDocuments({ schemeId: scheme._id, status: 'Eligible' }),
        ScholarshipEligibility.countDocuments({ schemeId: scheme._id, status: 'Not Eligible' }),
        ScholarshipEligibility.countDocuments({ schemeId: scheme._id, status: 'Needs Review' }),
        ScholarshipEligibility.countDocuments({ schemeId: scheme._id, isApprovedByPrincipal: true }),
      ]);

    res.status(200).json({
      success: true,
      readOnly: req.user?.role === 'teacher',
      schemeName: scheme.schemeName,
      marathiName: scheme.marathiName,
      code: scheme.code,
      academicYear: scheme.academicYear || '2026-27',
      ruleVersion: RULE_VERSION,
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages: Math.ceil(totalMatching / limit),
      },
      counts: {
        total: eligibleTotal + ineligibleTotal + reviewTotal,
        eligible: eligibleTotal,
        ineligible: ineligibleTotal,
        needsReview: reviewTotal,
        approved: approvedTotal,
      },
      data: evaluations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Create New Scholarship Scheme (Principal Only)
 */
export const createScholarship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      schemeName,
      marathiName,
      code,
      category,
      description,
      marathiDescription,
      applicableGrades,
      applicableStandards,
      beneficiaryGroup,
      applicableCategories,
      incomeLimit,
      genderRequirement,
      minorityRequirement,
      cwsnRequirement,
      bplRequirement,
      occupationKeyword,
      benefitAmount,
      eligibilityCriteria,
      requiredDocuments,
      applicationSteps,
      officialUrl,
      academicYear,
      applicationStartDate,
      applicationEndDate,
      isPublic,
    } = req.body;

    if (!schemeName || !marathiName || !code || !applicableGrades || !benefitAmount) {
      res.status(400).json({
        success: false,
        message: 'Scheme name, Marathi name, unique code, applicable grades, and benefits are required.',
      });
      return;
    }

    const existingCode = await Scholarship.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      res.status(400).json({
        success: false,
        message: `Scholarship scheme code '${code.trim().toUpperCase()}' is already registered.`,
      });
      return;
    }

    const newScheme = await Scholarship.create({
      schemeName: schemeName.trim(),
      marathiName: marathiName.trim(),
      code: code.trim().toUpperCase(),
      category: category || 'Pre-Matric',
      description: description || '',
      marathiDescription: marathiDescription || '',
      applicableGrades: applicableGrades.trim(),
      applicableStandards: Array.isArray(applicableStandards) ? applicableStandards : [],
      beneficiaryGroup: beneficiaryGroup || applicableGrades,
      applicableCategories: Array.isArray(applicableCategories) && applicableCategories.length > 0 ? applicableCategories : ['ALL'],
      incomeLimit: incomeLimit ? Number(incomeLimit) : 0,
      genderRequirement: genderRequirement || 'ALL',
      minorityRequirement: minorityRequirement || 'ALL',
      cwsnRequirement: cwsnRequirement || 'ALL',
      bplRequirement: bplRequirement || 'ALL',
      occupationKeyword: occupationKeyword || '',
      benefitAmount: benefitAmount.trim(),
      eligibilityCriteria: Array.isArray(eligibilityCriteria) ? eligibilityCriteria : [],
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      applicationSteps: applicationSteps || 'शाळेमार्फत महाडीबीटी पोर्टलवर ऑनलाइन अर्ज सादर करणे.',
      officialUrl: officialUrl || 'https://mahadbt.maharashtra.gov.in/',
      academicYear: academicYear || '2026-27',
      applicationStartDate: applicationStartDate ? new Date(applicationStartDate) : new Date(),
      applicationEndDate: applicationEndDate ? new Date(applicationEndDate) : new Date('2026-12-31'),
      isActive: true,
      isPublic: isPublic !== false,
    });

    // Run eligibility engine across all active students for this new scheme
    const counts = await evaluateAllStudentsForScheme(newScheme._id.toString(), newScheme.academicYear);

    await AuditLog.create({
      action: 'CREATE_SCHOLARSHIP',
      entityType: 'Scholarship',
      entityId: newScheme._id.toString(),
      performedBy: req.user?.name || 'Principal',
      performedByRole: req.user?.role || 'principal',
      details: `Created scholarship scheme '${newScheme.schemeName}' (${newScheme.code}). Initial eligibility: ${counts.eligibleCount} eligible, ${counts.reviewCount} needs review.`,
    });

    res.status(201).json({
      success: true,
      message: `Scholarship scheme '${newScheme.schemeName}' created and evaluated successfully.`,
      data: newScheme,
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Update Scholarship Scheme (Principal Only)
 */
export const updateScholarship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await Scholarship.findById(id);
    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
      return;
    }

    const updateData = req.body;
    Object.assign(scheme, updateData);
    if (updateData.code) {
      scheme.code = updateData.code.trim().toUpperCase();
    }
    await scheme.save();

    // Re-evaluate students with updated criteria
    const counts = await evaluateAllStudentsForScheme(scheme._id.toString(), scheme.academicYear || '2026-27');

    await AuditLog.create({
      action: 'UPDATE_SCHOLARSHIP',
      entityType: 'Scholarship',
      entityId: scheme._id.toString(),
      performedBy: req.user?.name || 'Principal',
      performedByRole: req.user?.role || 'principal',
      details: `Updated criteria for scholarship '${scheme.schemeName}'. Re-evaluated: ${counts.eligibleCount} eligible, ${counts.reviewCount} needs review.`,
    });

    res.status(200).json({
      success: true,
      message: `Scholarship scheme '${scheme.schemeName}' updated and re-evaluated.`,
      data: scheme,
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Toggle Active Status or Public Visibility (Principal Only)
 */
export const toggleScholarshipStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, isPublic } = req.body;

    const scheme = await Scholarship.findById(id);
    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
      return;
    }

    if (isActive !== undefined) scheme.isActive = Boolean(isActive);
    if (isPublic !== undefined) scheme.isPublic = Boolean(isPublic);
    await scheme.save();

    res.status(200).json({
      success: true,
      message: `Scholarship scheme status updated (Active: ${scheme.isActive}, Public: ${scheme.isPublic}).`,
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Re-evaluate Scheme Eligibility (Principal Only)
 */
export const reEvaluateScholarship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await Scholarship.findById(id);
    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
      return;
    }

    const counts = await evaluateAllStudentsForScheme(scheme._id.toString(), scheme.academicYear || '2026-27');

    res.status(200).json({
      success: true,
      message: `Eligibility re-evaluation complete for '${scheme.schemeName}'.`,
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Approve / Sanction Scholarship for Student (Principal Only)
 */
export const approveScholarship = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { grNumber, schemeName, schemeId } = req.body;
    if (!grNumber) {
      res.status(400).json({ success: false, message: 'Student GR number is required.' });
      return;
    }

    const student = await Student.findOne({ grNumber });
    if (!student) {
      res.status(404).json({ success: false, message: `Student with GR #${grNumber} not found.` });
      return;
    }

    let targetScheme = null;
    if (schemeId) {
      targetScheme = await Scholarship.findById(schemeId);
    } else if (schemeName) {
      targetScheme = await Scholarship.findOne({
        $or: [{ schemeName }, { marathiName: schemeName }],
      });
    }

    const finalSchemeName = targetScheme?.schemeName || schemeName || 'State Merit Scholarship';

    // Update student's primary scholarship field
    student.scholarshipScheme = finalSchemeName;
    await student.save();

    // If an eligibility record exists, mark it approved
    if (targetScheme) {
      await ScholarshipEligibility.updateOne(
        { studentId: student._id, schemeId: targetScheme._id },
        {
          $set: {
            isApprovedByPrincipal: true,
            approvedAt: new Date(),
            approvedBy: `${req.user?.name} (Principal)`,
          },
        }
      );
      await Scholarship.updateOne({ _id: targetScheme._id }, { $inc: { approvedCount: 1 } });
    }

    await AuditLog.create({
      action: 'APPROVE_SCHOLARSHIP',
      entityType: 'Scholarship',
      entityId: student._id.toString(),
      performedBy: req.user?.name || 'Principal',
      performedByRole: req.user?.role || 'principal',
      details: `Approved scholarship '${finalSchemeName}' for student '${student.name}' (GR #${grNumber}).`,
    });

    res.status(200).json({
      success: true,
      message: `Scholarship scheme '${finalSchemeName}' approved by Principal for student ${student.name}.`,
      approvedBy: req.user?.name,
      student: {
        grNumber: student.grNumber,
        name: student.name,
        scholarshipScheme: student.scholarshipScheme,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Export Scholarship Student List CSV
 * Mask sensitive data; Teachers only access assigned classes
 */
export const exportScholarshipCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const scheme = await Scholarship.findById(id);
    if (!scheme) {
      res.status(404).json({ success: false, message: 'Scholarship scheme not found.' });
      return;
    }

    const filter: any = { schemeId: scheme._id };

    if (req.user?.role === 'teacher') {
      const assigned = req.user.teacherProfile?.assignedClasses || [];
      if (assigned.length > 0) {
        filter.standard = { $in: assigned };
      }
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const evaluations = await ScholarshipEligibility.find(filter)
      .sort({ standard: 1, studentGrNumber: 1 })
      .lean();

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${scheme.code}_${status || 'All'}_Scholarship_Ledger_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // UTF-8 BOM
    res.write('\uFEFF');

    // Report Header Metadata
    res.write(`"जि. प. प्राथमिक शाळा, हिंगोणे बु., ता. धरणगाव, जि. जळगाव - शिष्यवृत्ती पात्रता अहवाल"\n`);
    res.write(`"योजनेचे नाव (Scheme Name)","${scheme.marathiName} (${scheme.schemeName})"\n`);
    res.write(`"योजना संकेतांक (Code)","${scheme.code}"\n`);
    res.write(`"शैक्षणिक वर्ष (Academic Year)","${scheme.academicYear || '2026-27'}"\n`);
    res.write(`"अहवाल दिनांक (Export Date)","${new Date().toLocaleDateString('mr-IN')}"\n`);
    res.write(`"नियम आवृत्ती (Rule Version)","${RULE_VERSION}"\n\n`);

    // Columns
    const headers = [
      'अ. क्र. (Sr No)',
      'रजिस्टर क्र. (GR)',
      'विद्यार्थ्याचे नाव (Student Name)',
      'इयत्ता (Class)',
      'तुकडी (Div)',
      'लिंग (Gender)',
      'प्रवर्ग (Category)',
      'वार्षिक उत्पन्न (Annual Income INR)',
      'पात्रता स्थिती (Status)',
      'पात्रता / अपात्रता कारणे (Evaluation Reasons)',
      'प्रलंबित कागदपत्रे / माहिती (Missing Information)',
      'मुख्याध्यापक मंजुरी (Principal Approved)',
    ];
    res.write(headers.join(',') + '\n');

    evaluations.forEach((e, idx) => {
      const cleanReasons = (e.reasons || []).join(' | ').replace(/"/g, '""');
      const cleanMissing = (e.missingInfo || []).join(' | ').replace(/"/g, '""');
      const approvedLabel = e.isApprovedByPrincipal ? 'होय (Approved)' : 'प्रलंबित (Pending)';

      const row = [
        idx + 1,
        `"${e.studentGrNumber}"`,
        `"${e.studentName.replace(/"/g, '""')}"`,
        `"${e.standard}"`,
        `"${e.division}"`,
        `"${e.gender}"`,
        `"${e.category}"`,
        e.annualIncome || 0,
        `"${e.status}"`,
        `"${cleanReasons}"`,
        `"${cleanMissing}"`,
        `"${approvedLabel}"`,
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Certificates Controller
 */
export const getCertificates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, search, type } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (type && type !== 'ALL') {
      filter.type = new RegExp(String(type), 'i');
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { studentName: { $regex: q, $options: 'i' } },
        { grNumber: { $regex: q, $options: 'i' } },
        { certificateNo: { $regex: q, $options: 'i' } },
        { classGrade: { $regex: q, $options: 'i' } },
      ];
    }

    const certificates = await CertificateRequest.find(filter).sort({ requestedDate: -1, createdAt: -1 });

    const pendingCount = await CertificateRequest.countDocuments({ status: 'Pending' });
    const approvedCount = await CertificateRequest.countDocuments({ status: 'Approved' });
    const rejectedCount = await CertificateRequest.countDocuments({ status: 'Rejected' });
    const totalCount = await CertificateRequest.countDocuments();

    // Check teacher authorization for each certificate
    const userRole = req.user?.role;
    const teacherName = req.user?.name || '';
    const assignedClasses = req.user?.teacherProfile?.assignedClasses || [];

    const enrichedCertificates = certificates.map((cert) => {
      const c = cert.toObject();
      let isAuthorized = true;
      if (userRole === 'teacher') {
        const isRequester = c.requestedBy && c.requestedBy.includes(teacherName);
        const isClassTeacher = assignedClasses.length === 0 || assignedClasses.includes(c.classGrade);
        isAuthorized = Boolean(isRequester || isClassTeacher);
      }
      return {
        ...c,
        isAuthorized,
      };
    });

    res.status(200).json({
      success: true,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount,
      data: enrichedCertificates,
    });
  } catch (error) {
    next(error);
  }
};

export const requestCertificate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      studentId,
      studentName,
      grNumber,
      classGrade,
      division,
      type,
      reason,
      purpose,
      leavingDate,
      reasonForLeaving,
      conduct,
      progress,
      dateOfBirthInWords,
      nationality,
      scholarshipSchemeName,
      sanctionAmount,
      academicYear,
      verificationNote,
    } = req.body;

    if (!studentName || !type) {
      res.status(400).json({
        success: false,
        message: 'Student name and certificate type are required.',
      });
      return;
    }

    let finalType = type;
    const lowerType = type.toLowerCase();
    let prefix = 'CERT';
    if (lowerType.includes('bonafide')) {
      finalType = 'Bonafide Certificate';
      prefix = 'BON';
    } else if (lowerType.includes('leaving')) {
      finalType = 'Leaving Certificate';
      prefix = 'LC';
    } else if (lowerType.includes('scholarship')) {
      finalType = 'Scholarship Certificate';
      prefix = 'SCH';
    } else if (lowerType.includes('nirgam')) {
      finalType = 'निर्गम उतारा (Nirgam Utara)';
      prefix = 'NIR';
    } else if (lowerType.includes('attendance')) {
      finalType = 'हजेरी प्रमाणपत्र (Attendance)';
      prefix = 'ATT';
    }

    // Try finding student record for richer data
    let foundStudent = null;
    if (studentId) {
      foundStudent = await Student.findById(studentId);
    }
    if (!foundStudent && studentName) {
      foundStudent = await Student.findOne({ name: studentName });
    }
    if (!foundStudent && grNumber) {
      foundStudent = await Student.findOne({ grNumber });
    }

    const count = await CertificateRequest.countDocuments();
    const certificateNo = `${prefix}-2026-${(count + 1).toString().padStart(3, '0')}`;

    const newCert = await CertificateRequest.create({
      certificateNo,
      studentId: foundStudent?._id,
      studentName: studentName || foundStudent?.name,
      grNumber: grNumber || foundStudent?.grNumber || '1421',
      classGrade: classGrade || foundStudent?.currentStandard || 'इयत्ता १ ली',
      division: division || foundStudent?.division || 'A',
      type: finalType,
      reason: reason || purpose || 'बँक खाते, शिष्यवृत्ती व अधिकृत कामासाठी',
      purpose: purpose || reason || 'अधिकृत कामासाठी',
      status: 'Pending',
      requestedBy: `${req.user?.name} (${req.user?.role === 'principal' ? 'मुख्याध्यापक' : 'वर्गशिक्षक'})`,
      requestedDate: new Date(),

      // Leaving Certificate fields
      leavingDate: leavingDate ? new Date(leavingDate) : new Date(),
      reasonForLeaving: reasonForLeaving || '',
      conduct: conduct || 'उत्कृष्ट (Excellent)',
      progress: progress || 'समाधानकारक (Satisfactory)',
      dateOfBirthInWords: dateOfBirthInWords || '',
      nationality: nationality || 'भारतीय (Indian)',

      // Scholarship Certificate fields
      scholarshipSchemeName: scholarshipSchemeName || '',
      sanctionAmount: Number(sanctionAmount) || 0,
      academicYear: academicYear || '2026-27',
      verificationNote: verificationNote || '',
    });

    res.status(201).json({
      success: true,
      message: `Certificate request #${newCert.certificateNo} for ${newCert.studentName} submitted. Awaiting Principal approval.`,
      data: newCert,
    });
  } catch (error) {
    next(error);
  }
};

export const approveCertificate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'principal') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Principal has authorization to approve certificates.',
      });
      return;
    }

    const { certificateId } = req.body;
    let cert = null;

    if (certificateId) {
      if (typeof certificateId === 'string' && certificateId.match(/^[0-9a-fA-F]{24}$/)) {
        cert = await CertificateRequest.findById(certificateId);
      }
      if (!cert) {
        cert = await CertificateRequest.findOne({ certificateNo: certificateId });
      }
    }

    if (!cert && req.params.id) {
      const pId = String(req.params.id);
      if (/^[0-9a-fA-F]{24}$/.test(pId)) {
        cert = await CertificateRequest.findById(pId);
      } else {
        cert = await CertificateRequest.findOne({ certificateNo: pId });
      }
    }

    if (!cert) {
      cert = (await CertificateRequest.findOne({ status: 'Pending' })) || (await CertificateRequest.findOne());
    }

    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate request not found.' });
      return;
    }

    // Get current config snapshot
    let config = await CertificateConfig.findOne();
    if (!config) {
      config = await CertificateConfig.create(DEFAULT_CERTIFICATE_CONFIG);
    }

    cert.status = 'Approved';
    cert.approvedBy = `${req.user?.name} (Principal)`;
    cert.approvedDate = new Date();
    cert.templateVersion = config.version;
    cert.templateConfigSnapshot = config.toObject();
    await cert.save();

    res.status(200).json({
      success: true,
      message: `Certificate #${cert.certificateNo} for ${cert.studentName} has been officially approved and digitally signed by Principal.`,
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectCertificate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'principal') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Principal has authorization to reject certificates.',
      });
      return;
    }

    const certificateId = req.body.certificateId || req.params.id;
    const rejectionReason =
      req.body.rejectionReason || req.body.reason || 'माहिती अपूर्ण / विहित कागदपत्रांची पूर्तता झालेली नाही';

    let cert = null;
    if (certificateId) {
      if (typeof certificateId === 'string' && certificateId.match(/^[0-9a-fA-F]{24}$/)) {
        cert = await CertificateRequest.findById(certificateId);
      }
      if (!cert) {
        cert = await CertificateRequest.findOne({ certificateNo: certificateId });
      }
    }

    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate request not found.' });
      return;
    }

    cert.status = 'Rejected';
    cert.rejectionReason = rejectionReason;
    cert.rejectedBy = `${req.user?.name} (Principal)`;
    cert.rejectedDate = new Date();
    await cert.save();

    res.status(200).json({
      success: true,
      message: `Certificate #${cert.certificateNo} request for ${cert.studentName} has been rejected.`,
      data: cert,
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificateConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let config = await CertificateConfig.findOne();
    if (!config) {
      config = await CertificateConfig.create(DEFAULT_CERTIFICATE_CONFIG);
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCertificateConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'principal') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Principal can update certificate configurations.',
      });
      return;
    }

    const { activeTemplate, templates } = req.body;

    let config = await CertificateConfig.findOne();
    if (!config) {
      config = await CertificateConfig.create(DEFAULT_CERTIFICATE_CONFIG);
    }

    if (activeTemplate) {
      config.activeTemplate = activeTemplate;
    }

    if (templates) {
      if (templates.bonafide) config.templates.bonafide = { ...config.templates.bonafide, ...templates.bonafide };
      if (templates.leaving) config.templates.leaving = { ...config.templates.leaving, ...templates.leaving };
      if (templates.scholarship)
        config.templates.scholarship = { ...config.templates.scholarship, ...templates.scholarship };
    }

    config.version = (config.version || 1) + 1;
    config.lastUpdatedBy = req.user?.name || 'Principal';
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Certificate configuration updated successfully.',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

export const restoreDefaultCertificateConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'principal') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Principal can restore default certificate settings.',
      });
      return;
    }

    let config = await CertificateConfig.findOne();
    if (config) {
      config.activeTemplate = DEFAULT_CERTIFICATE_CONFIG.activeTemplate;
      config.templates = DEFAULT_CERTIFICATE_CONFIG.templates;
      config.version = (config.version || 1) + 1;
      config.lastUpdatedBy = `${req.user?.name} (Restored Default)`;
      await config.save();
    } else {
      config = await CertificateConfig.create(DEFAULT_CERTIFICATE_CONFIG);
    }

    res.status(200).json({
      success: true,
      message: 'Certificate templates restored to factory defaults.',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadCertificate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    let cert = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      cert = await CertificateRequest.findById(id);
    } else {
      cert = await CertificateRequest.findOne({ certificateNo: id });
    }

    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate record not found.' });
      return;
    }

    // Integrity enforcement: Pending or rejected requests must NOT be downloadable as approved certificates!
    if (cert.status === 'Pending') {
      res.status(400).json({
        success: false,
        message:
          'प्रलंबित प्रमाणपत्राची प्रत काढता येत नाही. प्रथम मुख्याध्यापकांची मंजुरी आवश्यक आहे. (Cannot download pending certificate. Approval from Principal required.)',
      });
      return;
    }

    if (cert.status === 'Rejected') {
      res.status(400).json({
        success: false,
        message:
          'नाकारण्यात आलेल्या प्रमाणपत्राची प्रत काढता येत नाही. (Cannot download rejected certificate request.)',
      });
      return;
    }

    // Role check: If teacher, verify authorization to access this certificate
    if (req.user?.role === 'teacher') {
      const teacherName = req.user.name || '';
      const assignedClasses = req.user.teacherProfile?.assignedClasses || [];
      const isRequester = cert.requestedBy && cert.requestedBy.includes(teacherName);
      const isClassTeacher = assignedClasses.length === 0 || assignedClasses.includes(cert.classGrade);

      if (!isRequester && !isClassTeacher) {
        res.status(403).json({
          success: false,
          message: `Forbidden: Teachers can only download certificates for their assigned classes (${assignedClasses.join(', ') || 'None'}) or requests they submitted.`,
        });
        return;
      }
    }

    // Idempotent download tracking - preserves certificate number and prevents duplicate issuance
    cert.downloadCount = (cert.downloadCount || 0) + 1;
    cert.lastDownloadedAt = new Date();
    await cert.save();

    // Fetch student profile for certificate body enrichment
    let student = null;
    if (cert.studentId) {
      student = await Student.findById(cert.studentId);
    }
    if (!student && cert.grNumber) {
      student = await Student.findOne({ grNumber: cert.grNumber });
    }
    if (!student && cert.studentName) {
      student = await Student.findOne({ name: cert.studentName });
    }

    // Get active config or snapshot
    let config = cert.templateConfigSnapshot;
    if (!config) {
      config = await CertificateConfig.findOne();
      if (!config) {
        config = await CertificateConfig.create(DEFAULT_CERTIFICATE_CONFIG);
      }
    }

    // Select template based on type
    const lowerType = cert.type.toLowerCase();
    let templateKey: 'bonafide' | 'leaving' | 'scholarship' = 'bonafide';
    if (lowerType.includes('leaving')) templateKey = 'leaving';
    else if (lowerType.includes('scholarship')) templateKey = 'scholarship';

    const template = config.templates?.[templateKey] || DEFAULT_CERTIFICATE_CONFIG.templates[templateKey];

    // Placeholder substitution
    const dobFormatted = student?.dateOfBirth
      ? new Date(student.dateOfBirth).toLocaleDateString('mr-IN')
      : '०१/०६/२०१६';
    const leavingDateFormatted = cert.leavingDate
      ? new Date(cert.leavingDate).toLocaleDateString('mr-IN')
      : new Date().toLocaleDateString('mr-IN');
    const issueDateFormatted = cert.approvedDate
      ? new Date(cert.approvedDate).toLocaleDateString('mr-IN')
      : new Date().toLocaleDateString('mr-IN');

    let filledBody = template.body
      .replace(/{studentName}/g, cert.studentName)
      .replace(/{grNumber}/g, cert.grNumber)
      .replace(/{standard}/g, cert.classGrade)
      .replace(/{division}/g, cert.division || 'A')
      .replace(/{dob}/g, dobFormatted)
      .replace(/{caste}/g, student?.caste || 'मराठा')
      .replace(/{category}/g, student?.category || 'General')
      .replace(/{fatherName}/g, student?.fatherName || 'सचिन पाटील')
      .replace(/{motherName}/g, student?.motherName || 'सुनिता पाटील')
      .replace(/{purpose}/g, cert.purpose || cert.reason || 'शैक्षणिक व अधिकृत कामासाठी')
      .replace(/{academicYear}/g, cert.academicYear || '2026-27')
      .replace(/{leavingDate}/g, leavingDateFormatted)
      .replace(/{reasonForLeaving}/g, cert.reasonForLeaving || 'पुढील शिक्षणासाठी / पालकांची बदली')
      .replace(/{conduct}/g, cert.conduct || 'उत्कृष्ट (Excellent)')
      .replace(/{progress}/g, cert.progress || 'समाधानकारक (Satisfactory)')
      .replace(/{nationality}/g, cert.nationality || 'भारतीय (Indian)')
      .replace(/{scholarshipSchemeName}/g, cert.scholarshipSchemeName || 'सावित्रीबाई फुले कन्या शिष्यवृत्ती')
      .replace(/{sanctionAmount}/g, (cert.sanctionAmount || 1000).toLocaleString('en-IN'));

    res.status(200).json({
      success: true,
      message: `Official Certificate #${cert.certificateNo} retrieved successfully.`,
      data: {
        certificate: cert,
        student,
        template,
        filledBody,
        issueDate: issueDateFormatted,
        downloadCount: cert.downloadCount,
        lastDownloadedAt: cert.lastDownloadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const renderCertificatePdfHtml = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id);
    let cert = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      cert = await CertificateRequest.findById(id);
    } else {
      cert = await CertificateRequest.findOne({ certificateNo: id });
    }

    if (!cert) {
      res.status(404).send('<h1>404 Not Found: Certificate not found</h1>');
      return;
    }

    if (cert.status !== 'Approved') {
      res
        .status(400)
        .send(
          `<h1>400 Error: Cannot print or download unapproved certificate (${cert.status}). Principal approval required.</h1>`
        );
      return;
    }

    // Role check for teachers
    if (req.user?.role === 'teacher') {
      const teacherName = req.user.name || '';
      const assignedClasses = req.user.teacherProfile?.assignedClasses || [];
      const isRequester = cert.requestedBy && cert.requestedBy.includes(teacherName);
      const isClassTeacher = assignedClasses.length === 0 || assignedClasses.includes(cert.classGrade);

      if (!isRequester && !isClassTeacher) {
        res.status(403).send('<h1>403 Forbidden: You are not authorized to print this certificate.</h1>');
        return;
      }
    }

    cert.downloadCount = (cert.downloadCount || 0) + 1;
    cert.lastDownloadedAt = new Date();
    await cert.save();

    let student = null;
    if (cert.studentId) student = await Student.findById(cert.studentId);
    if (!student && cert.grNumber) student = await Student.findOne({ grNumber: cert.grNumber });
    if (!student && cert.studentName) student = await Student.findOne({ name: cert.studentName });

    let config = cert.templateConfigSnapshot;
    if (!config) {
      config = (await CertificateConfig.findOne()) || DEFAULT_CERTIFICATE_CONFIG;
    }

    const lowerType = cert.type.toLowerCase();
    let templateKey: 'bonafide' | 'leaving' | 'scholarship' = 'bonafide';
    if (lowerType.includes('leaving')) templateKey = 'leaving';
    else if (lowerType.includes('scholarship')) templateKey = 'scholarship';

    const template = config.templates?.[templateKey] || DEFAULT_CERTIFICATE_CONFIG.templates[templateKey];

    const dobFormatted = student?.dateOfBirth
      ? new Date(student.dateOfBirth).toLocaleDateString('mr-IN')
      : '०१/०६/२०१६';
    const leavingDateFormatted = cert.leavingDate
      ? new Date(cert.leavingDate).toLocaleDateString('mr-IN')
      : new Date().toLocaleDateString('mr-IN');
    const issueDateFormatted = cert.approvedDate
      ? new Date(cert.approvedDate).toLocaleDateString('mr-IN')
      : new Date().toLocaleDateString('mr-IN');

    let filledBody = template.body
      .replace(/{studentName}/g, cert.studentName)
      .replace(/{grNumber}/g, cert.grNumber)
      .replace(/{standard}/g, cert.classGrade)
      .replace(/{division}/g, cert.division || 'A')
      .replace(/{dob}/g, dobFormatted)
      .replace(/{caste}/g, student?.caste || 'मराठा')
      .replace(/{category}/g, student?.category || 'General')
      .replace(/{fatherName}/g, student?.fatherName || 'पालक')
      .replace(/{motherName}/g, student?.motherName || 'माता')
      .replace(/{purpose}/g, cert.purpose || cert.reason || 'शैक्षणिक कामी')
      .replace(/{academicYear}/g, cert.academicYear || '2026-27')
      .replace(/{leavingDate}/g, leavingDateFormatted)
      .replace(/{reasonForLeaving}/g, cert.reasonForLeaving || 'पुढील शिक्षणासाठी')
      .replace(/{conduct}/g, cert.conduct || 'उत्कृष्ट (Excellent)')
      .replace(/{progress}/g, cert.progress || 'समाधानकारक (Satisfactory)')
      .replace(/{nationality}/g, cert.nationality || 'भारतीय (Indian)')
      .replace(/{scholarshipSchemeName}/g, cert.scholarshipSchemeName || 'सावित्रीबाई फुले कन्या शिष्यवृत्ती')
      .replace(/{sanctionAmount}/g, (cert.sanctionAmount || 1000).toLocaleString('en-IN'));

    const colorMap: Record<string, string> = {
      green: '#176638',
      blue: '#2563EB',
      red: '#DC2626',
      black: '#111827',
      purple: '#7C3AED',
    };
    const accentHex = colorMap[template.accentColor] || '#176638';

    const html = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>${cert.certificateNo} - ${cert.studentName} (${template.title})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8fafc;
      color: #1f2937;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cert-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 35px;
      position: relative;
      ${template.showBorder ? `border: 6px double ${accentHex}; outline: 2px solid ${accentHex}; outline-offset: 4px;` : 'border: 1px solid #e5e7eb;'}
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 70px;
      color: ${accentHex}10;
      font-weight: 900;
      pointer-events: none;
      white-space: nowrap;
      text-transform: uppercase;
      z-index: 1;
    }
    .header-section {
      text-align: center;
      border-bottom: 2px solid ${accentHex};
      padding-bottom: 14px;
      margin-bottom: 20px;
      position: relative;
      z-index: 2;
    }
    .emblem-title {
      font-size: 13px;
      font-weight: 700;
      color: #b45309;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .main-school-name {
      font-size: 24px;
      font-weight: 800;
      color: ${accentHex};
      margin: 0 0 6px 0;
    }
    .school-subtitle {
      font-size: 13px;
      color: #4b5563;
      margin: 0;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      position: relative;
      z-index: 2;
    }
    .cert-badge {
      background: ${accentHex};
      color: #ffffff;
      padding: 6px 20px;
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      display: inline-block;
      margin: 0 auto 20px auto;
    }
    .cert-badge-wrap { text-align: center; }
    .body-content {
      font-size: 15px;
      line-height: 2.1;
      text-align: justify;
      color: #111827;
      margin-bottom: 30px;
      position: relative;
      z-index: 2;
      text-indent: 40px;
    }
    .footer-note {
      font-size: 12px;
      font-style: italic;
      color: #6b7280;
      border-top: 1px dashed #d1d5db;
      padding-top: 10px;
      margin-bottom: 40px;
      position: relative;
      z-index: 2;
    }
    .sign-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 2;
      margin-top: 20px;
    }
    .seal-box {
      width: 100px;
      height: 100px;
      border: 2px dashed ${accentHex};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: ${accentHex};
      text-align: center;
      padding: 6px;
      margin: 0 auto;
      font-weight: bold;
    }
    .sign-box {
      text-align: center;
      width: 200px;
    }
    .sign-line {
      border-top: 1px solid #1f2937;
      margin-top: 50px;
      padding-top: 5px;
      font-weight: 700;
      font-size: 13px;
    }
    .print-controls {
      text-align: center;
      margin-bottom: 20px;
    }
    .btn-print {
      background: ${accentHex};
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-controls { display: none; }
      .cert-container { border: 6px double ${accentHex} !important; outline: 2px solid ${accentHex} !important; margin: 0; width: 100%; max-width: 100%; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨️ प्रिंट / PDF सेव्ह करा (Print to PDF)</button>
  </div>
  <div class="cert-container">
    <div class="watermark">ZP PRIMARY SCHOOL HINGONE BK</div>
    <div class="header-section">
      <div class="emblem-title">॥ महाराष्ट्र शासन - जिल्हा परिषद, जळगाव ॥</div>
      <h1 class="main-school-name">${template.header}</h1>
      <p class="school-subtitle">${template.subheader}</p>
    </div>

    <div class="meta-bar">
      <div><strong>जावक क्र. :</strong> ${cert.certificateNo}</div>
      <div><strong>दिनांक :</strong> ${issueDateFormatted}</div>
    </div>

    <div class="cert-badge-wrap">
      <div class="cert-badge">${template.title}</div>
    </div>

    <div class="body-content">
      ${filledBody}
    </div>

    <div class="footer-note">
      <strong>टीप :</strong> ${template.footerNote}
    </div>

    <div class="sign-section">
      <div class="sign-box">
        <div class="sign-line">${template.teacherSignLabel}</div>
        <div style="font-size: 11px; color: #4b5563;">जि. प. प्राथ. शाळा, हिंगोणे बु.</div>
      </div>

      ${template.showSeal ? `
      <div>
        <div class="seal-box">
          शालेय मोहर<br>ZP SEAL
        </div>
      </div>` : '<div></div>'}

      <div class="sign-box">
        <div style="font-size: 12px; font-weight: bold; color: ${accentHex};">${cert.approvedBy || 'मुख्याध्यापक'}</div>
        <div class="sign-line">${template.principalSignLabel}</div>
        <div style="font-size: 11px; color: #4b5563;">जि. प. प्राथ. शाळा, हिंगोणे बु.</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Admissions Applications Controller (Principal Review)
 */
export const getAdmissionsList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const applications = await AdmissionApplication.find(query).sort({ appliedAt: -1 });
    const pendingCount = await AdmissionApplication.countDocuments({ status: 'Pending' });
    const approvedCount = await AdmissionApplication.countDocuments({ status: 'Approved' });

    res.status(200).json({
      success: true,
      pendingCount,
      approvedCount,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmissionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const application = await AdmissionApplication.findById(id);
    if (!application) {
      res.status(404).json({ success: false, message: 'Admission application not found.' });
      return;
    }

    application.status = status;
    await application.save();

    // If approved, automatically enroll student into Student collection!
    if (status === 'Approved') {
      const latestStudent = await Student.findOne().sort({ grNumber: -1 });
      const nextGr = latestStudent ? parseInt(latestStudent.grNumber, 10) + 1 : 1500;

      await Student.create({
        grNumber: nextGr.toString(),
        name: application.studentName,
        classGrade: application.gradeApplying,
        gender: application.gender === 'Female' ? 'मुलगी' : 'मुलगा',
        dateOfBirth: application.dateOfBirth,
        category: 'OBC',
        parentName: application.parentName,
        parentPhone: application.parentPhone,
        residentialAddress: application.residentialAddress,
        attendancePercentage: 100,
        isActive: true,
        admissionYear: '2026-27',
      });
    }

    res.status(200).json({
      success: true,
      message: `Application #${application.applicationNo} status updated to ${status}.`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Website Content Management (Principal Only)
 */
export const getWebsiteOverview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const noticeCount = await Notice.countDocuments();
    const notices = await Notice.find().sort({ date: -1 });
    const admissionCount = await AdmissionApplication.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        schoolName: 'जि. प. प्राथमिक शाळा, हिंगोणे बु.',
        udise: '27030804501',
        totalNotices: noticeCount,
        recentNotices: notices,
        totalOnlineAdmissions: admissionCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWebsiteContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { noticeTitle, noticeContent, category } = req.body;
    if (noticeTitle && noticeContent) {
      await Notice.create({
        title: noticeTitle,
        content: noticeContent,
        category: category || 'GENERAL',
        date: new Date(),
        isImportant: true,
        publishedBy: 'मुख्याध्यापक कार्यालय (Principal Office)',
      });
    }

    res.status(200).json({
      success: true,
      message: 'New announcement published to public website notice board successfully.',
      updatedBy: req.user?.name,
    });
  } catch (error) {
    next(error);
  }
};
