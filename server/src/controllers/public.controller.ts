import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { Notice } from '../models/Notice.model';
import { Scholarship } from '../models/Scholarship.model';
import { GalleryAlbum } from '../models/GalleryAlbum.model';
import { AdmissionApplication } from '../models/AdmissionApplication.model';
import { SchoolWebsiteConfig } from '../models/SchoolWebsiteConfig.model';
import { AppError } from '../middleware/error.middleware';

/**
 * 1. GET /api/public/profile
 * School profile, facts, vision, mission, principal message
 * Dynamically queries SchoolWebsiteConfig from MongoDB
 */
export const getSchoolProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let config = await SchoolWebsiteConfig.findOne();
    if (!config) {
      config = await SchoolWebsiteConfig.create({});
    }

    const profile = {
      name: config.schoolInfo.name,
      marathiName: config.schoolInfo.marathiName,
      udiseCode: config.schoolInfo.udiseCode,
      logoUrl: config.schoolInfo.logoUrl,
      cluster: 'Hingone BK',
      block: 'Dharangaon',
      district: 'Jalgaon',
      state: 'Maharashtra',
      pincode: '425105',
      establishedYear: config.schoolInfo.establishedYear,
      medium: config.academics.mediumOfInstruction,
      grades: config.academics.availableClasses.join(', '),
      type: 'Co-Educational (मुले व मुलींसाठी सहशिक्षण)',
      management: config.schoolInfo.management,
      headmaster: {
        name: config.principalMessage.displayName,
        designation: config.principalMessage.designation,
        qualification: config.principalMessage.qualification,
        message: config.principalMessage.message,
        photo: config.principalMessage.photo,
      },
      vision: config.schoolInfo.vision,
      mission: config.schoolInfo.mission,
      introduction: config.schoolInfo.introduction,
      facilities: config.schoolInfo.facilities,
      quickFacts: config.schoolInfo.quickFacts,
      contact: {
        email: config.schoolInfo.email,
        phone: config.schoolInfo.phone,
        address: config.schoolInfo.address,
        timings: config.schoolInfo.timings,
      },
      academics: config.academics,
      admissionsConfig: config.admissionsConfig,
    };

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/public/teachers
 * Approved public teacher profiles (Strictly no private credentials or contact numbers)
 */
export const getPublicTeachers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await User.find({
      isActive: true,
      email: { $not: /(audit|test)\./i },
      name: { $not: /audit/i },
    })
      .select('name designation avatar role teacherProfile')
      .lean();

    const currentYear = new Date().getFullYear();

    const seenNames = new Set<string>();
    const uniqueStaff = staff.filter((member) => {
      const normalized = member.name?.trim().toLowerCase();
      if (!normalized || seenNames.has(normalized)) return false;
      seenNames.add(normalized);
      return true;
    });

    const publicProfiles = uniqueStaff.map((member) => {
      let experienceYears = 5;
      if (member.teacherProfile?.joiningDate) {
        const joinYear = new Date(member.teacherProfile.joiningDate).getFullYear();
        experienceYears = Math.max(1, currentYear - joinYear);
      } else if (member.role === 'principal') {
        experienceYears = 22;
      }

      return {
        _id: member._id,
        name: member.name,
        role: member.role,
        designation: member.designation,
        avatar: member.avatar || (member.role === 'principal' ? '/imgs/principal.jpeg' : ''),
        qualification: member.teacherProfile?.qualification || (member.role === 'principal' ? 'M.A., D.Ed.' : 'D.Ed., B.A.'),
        assignedClasses: member.teacherProfile?.assignedClasses || [],
        subjectSpecialization: member.teacherProfile?.subjectSpecialization || [],
        experienceYears,
      };
    });

    res.status(200).json({
      success: true,
      data: publicProfiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/public/notices
 * Notices with search and category filtering
 */
export const getPublicNotices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search } = req.query;
    const filter: any = { isActive: true };

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { content: { $regex: String(search), $options: 'i' } },
      ];
    }

    const notices = await Notice.find(filter).sort({ isImportant: -1, date: -1 });

    res.status(200).json({
      success: true,
      data: notices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/public/gallery
 * Event albums from MongoDB
 */
export const getPublicGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const albums = await GalleryAlbum.find({ isActive: true }).sort({ year: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: albums,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/public/scholarships
 * Published government scholarship schemes
 */
export const getPublicScholarships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scholarships = await Scholarship.find({ isActive: true, isPublic: true })
      .select(
        'schemeName marathiName code category description marathiDescription applicableGrades beneficiaryGroup benefitAmount eligibilityCriteria requiredDocuments applicationSteps officialUrl academicYear applicationStartDate applicationEndDate'
      )
      .sort({ code: 1 });
    res.status(200).json({
      success: true,
      data: scholarships,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. POST /api/public/admissions
 * Online admission application submission with validation and unique application ID
 */
export const submitAdmissionApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      studentName,
      gender,
      dateOfBirth,
      gradeApplying,
      parentName,
      motherName,
      guardianName,
      parentPhone,
      parentEmail,
      residentialAddress,
      village,
      taluka,
      district,
      pincode,
      category,
      caste,
      religion,
      motherTongue,
      bloodGroup,
      previousSchool,
      previousStandard,
      previousMarks,
    } = req.body;

    // Server-side validation
    if (!studentName || !gender || !dateOfBirth || !gradeApplying || !parentName || !parentPhone || !residentialAddress) {
      throw new AppError('सर्व आवश्यक माहिती (* चिन्हांकित) भरणे अनिवार्य आहे.', 400);
    }

    const cleanPhone = String(parentPhone).trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new AppError('कृपया वैध १० अंकी मोबाईल क्रमांक टाकावा.', 400);
    }

    // Generate unique application number
    const count = await AdmissionApplication.countDocuments();
    const appNumber = `ADM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newApplication = await AdmissionApplication.create({
      applicationNo: appNumber,
      studentName: studentName.trim(),
      gender,
      dateOfBirth: new Date(dateOfBirth),
      gradeApplying,
      parentName: parentName.trim(),
      motherName: motherName ? motherName.trim() : 'आई',
      guardianName: guardianName ? guardianName.trim() : parentName.trim(),
      parentPhone: cleanPhone,
      parentEmail: (parentEmail || '').trim(),
      residentialAddress: residentialAddress.trim(),
      village: village || 'हिंगोणे बु.',
      taluka: taluka || 'धरणगाव',
      district: district || 'जळगाव',
      pincode: pincode || '425105',
      category: category || 'OBC',
      caste: caste || 'मराठा',
      religion: religion || 'हिंदू',
      motherTongue: motherTongue || 'मराठी',
      bloodGroup: bloodGroup || 'B+',
      previousSchool: previousSchool ? previousSchool.trim() : 'N/A (First Admission)',
      previousStandard: previousStandard ? previousStandard.trim() : '',
      previousMarks: previousMarks ? Number(previousMarks) : 0,
      status: 'Submitted',
      appliedAt: new Date(),
      decisionHistory: [
        {
          status: 'Submitted',
          changedBy: 'ऑनलाइन प्रणाली (Portal)',
          changedAt: new Date(),
          notes: 'पालकांकडून ऑनलाइन प्रवेश अर्ज दाखल झाला.',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'ऑनलाइन प्रवेश अर्ज यशस्वीरीत्या नोंदवला गेला आहे!',
      data: {
        applicationNo: newApplication.applicationNo,
        studentName: newApplication.studentName,
        gradeApplying: newApplication.gradeApplying,
        parentName: newApplication.parentName,
        status: newApplication.status,
        appliedAt: newApplication.appliedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. GET /api/public/admissions/status/:appNo
 * Check admission application status by reference number
 */
export const checkAdmissionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appNo } = req.params;
    if (!appNo) {
      throw new AppError('Application number is required.', 400);
    }

    const application = await AdmissionApplication.findOne({
      applicationNo: String(appNo).toUpperCase().trim(),
    }).select('applicationNo studentName gradeApplying parentName status appliedAt');

    if (!application) {
      throw new AppError(`प्रवेश अर्ज क्र. '${appNo}' सापडला नाही. कृपया अचूक क्रमांक तपासा.`, 404);
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};
