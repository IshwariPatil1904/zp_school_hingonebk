import { IStudent, Student } from '../models/Student.model';
import { IScholarship, Scholarship } from '../models/Scholarship.model';
import {
  IScholarshipEligibility,
  ScholarshipEligibility,
  EligibilityStatus,
} from '../models/ScholarshipEligibility.model';

export const RULE_VERSION = 'v1.0.26';

export interface EvaluationOutcome {
  status: EligibilityStatus;
  reasons: string[];
  missingInfo: string[];
  evaluatedAt: Date;
  ruleVersion: string;
}

/**
 * Standardizes Marathi & English standard representations (1 through 7)
 */
export const extractStandardNumber = (stdString: string): number | null => {
  if (!stdString) return null;
  const marathiDigits: Record<string, number> = {
    '१': 1,
    '२': 2,
    '३': 3,
    '४': 4,
    '५': 5,
    '६': 6,
    '७': 7,
  };

  for (const [mChar, num] of Object.entries(marathiDigits)) {
    if (stdString.includes(mChar)) return num;
  }

  const match = stdString.match(/[1-7]/);
  if (match) return parseInt(match[0], 10);
  return null;
};

/**
 * Core Reusable Eligibility Engine
 * Evaluates a student against official government criteria without inventing rules.
 */
export const evaluateStudentForScheme = (
  student: IStudent,
  scheme: IScholarship
): EvaluationOutcome => {
  const reasons: string[] = [];
  const missingInfo: string[] = [];
  const evaluatedAt = new Date();

  const studentStdNum = extractStandardNumber(
    student.currentStandard || student.classGrade || ''
  );

  // -------------------------------------------------------------
  // 1. Applicable Standards / Grades Check
  // -------------------------------------------------------------
  let standardEligible = false;
  if (scheme.applicableStandards && scheme.applicableStandards.length > 0) {
    const allowedStdNums = scheme.applicableStandards
      .map(extractStandardNumber)
      .filter((n): n is number => n !== null);

    if (allowedStdNums.length > 0) {
      standardEligible = studentStdNum !== null && allowedStdNums.includes(studentStdNum);
    } else {
      standardEligible = scheme.applicableStandards.some(
        (s) =>
          s.trim().toLowerCase() === (student.currentStandard || '').trim().toLowerCase() ||
          s.trim().toLowerCase() === (student.classGrade || '').trim().toLowerCase()
      );
    }
  } else if (scheme.applicableGrades) {
    // Parse grades string like "५ ते ७" or "१ ते ७"
    if (scheme.applicableGrades.includes('५') && scheme.applicableGrades.includes('७')) {
      standardEligible = studentStdNum !== null && studentStdNum >= 5 && studentStdNum <= 7;
    } else if (scheme.applicableGrades.includes('१') && scheme.applicableGrades.includes('७')) {
      standardEligible = studentStdNum !== null && studentStdNum >= 1 && studentStdNum <= 7;
    } else {
      standardEligible = true;
    }
  } else {
    standardEligible = true;
  }

  if (!standardEligible) {
    reasons.push(
      `इयत्ता अपात्र: ही योजना ${scheme.applicableGrades || scheme.applicableStandards.join(', ')} साठी आहे (विद्यार्थ्याची इयत्ता: ${student.currentStandard || student.classGrade}).`
    );
  }

  // -------------------------------------------------------------
  // 2. Gender Criteria Check
  // -------------------------------------------------------------
  if (scheme.genderRequirement && scheme.genderRequirement !== 'ALL') {
    const studentGender = student.gender || 'इतर';
    if (studentGender !== scheme.genderRequirement) {
      reasons.push(
        `लिंग अपात्र: ही योजना केवळ ${scheme.genderRequirement === 'मुलगी' ? 'विद्यार्थिनींसाठी (मुली)' : 'मुलांसाठी'} लागू आहे (विद्यार्थ्याचे लिंग: ${studentGender}).`
      );
    }
  }

  // -------------------------------------------------------------
  // 3. Social Category / Caste Check
  // -------------------------------------------------------------
  if (
    scheme.applicableCategories &&
    scheme.applicableCategories.length > 0 &&
    !scheme.applicableCategories.includes('ALL')
  ) {
    const studentCat = student.category || 'General';
    // Allow matching VJNT with NT, or SC, ST, etc.
    const isCatMatch =
      scheme.applicableCategories.includes(studentCat) ||
      (scheme.applicableCategories.includes('NT') && studentCat === 'NT') ||
      (scheme.applicableCategories.includes('VJNT') && (studentCat === 'NT' || studentCat === 'SBC'));

    if (!isCatMatch) {
      reasons.push(
        `प्रवर्ग अपात्र: ही योजना [${scheme.applicableCategories.join(', ')}] प्रवर्गातील विद्यार्थ्यांसाठी आहे (विद्यार्थ्याचा प्रवर्ग: ${studentCat}).`
      );
    }
  }

  // -------------------------------------------------------------
  // 4. Disability / CWSN Criteria Check
  // -------------------------------------------------------------
  if (scheme.cwsnRequirement === 'CWSN_ONLY') {
    if (!student.isCwsn) {
      reasons.push(
        'दिव्यांगत्व निकष अपूर्ण: ही योजना किमान ४०% दिव्यांगत्व असलेल्या विशेष गरजा असणाऱ्या (CWSN) विद्यार्थ्यांसाठी आहे.'
      );
    }
  }

  // -------------------------------------------------------------
  // 5. Minority Community Criteria Check
  // -------------------------------------------------------------
  if (scheme.minorityRequirement && scheme.minorityRequirement !== 'ALL') {
    const isMinority =
      student.minorityStatus !== 'None' ||
      ['मुस्लिम', 'बौद्ध', 'ख्रिश्चन', 'जैन', 'शीख'].includes(student.religion || '');

    if (!isMinority) {
      reasons.push(
        'अल्पसंख्याक निकष अपूर्ण: विद्यार्थी अधिकृत भाषिक किंवा धार्मिक अल्पसंख्याक प्रवर्गात मोडत नाही.'
      );
    }
  }

  // -------------------------------------------------------------
  // 6. Annual Family Income Ceiling Check
  // -------------------------------------------------------------
  if (scheme.incomeLimit && scheme.incomeLimit > 0) {
    if (student.annualFamilyIncome && student.annualFamilyIncome > scheme.incomeLimit) {
      reasons.push(
        `उत्पन्न मर्यादा ओलांडली: कमाल वार्षिक मर्यादा ₹${scheme.incomeLimit.toLocaleString('en-IN')}/- आहे (नोंदणीकृत वार्षिक उत्पन्न: ₹${student.annualFamilyIncome.toLocaleString('en-IN')}/-).`
      );
    }
  }

  // -------------------------------------------------------------
  // 7. Parent Occupation Check (e.g. Cleanliness Workers)
  // -------------------------------------------------------------
  if (scheme.occupationKeyword && scheme.occupationKeyword.trim() !== '') {
    const parentOcc = (student.parentsOccupation || '').toLowerCase();
    const keyword = scheme.occupationKeyword.toLowerCase();
    if (!parentOcc.includes(keyword) && !parentOcc.includes('सफाई') && !parentOcc.includes('स्वच्छता')) {
      reasons.push(
        `पालकांचा व्यवसाय निकष: पालकांचा व्यवसाय '${scheme.occupationKeyword}' क्षेत्रात असणे आवश्यक आहे (सद्य व्यवसाय: ${student.parentsOccupation || 'नोंद नाही'}).`
      );
    }
  }

  // -------------------------------------------------------------
  // Disqualification Decision:
  // If any hard criteria mismatched, the student is strictly Not Eligible.
  // -------------------------------------------------------------
  if (reasons.length > 0) {
    return {
      status: 'Not Eligible',
      reasons,
      missingInfo: [],
      evaluatedAt,
      ruleVersion: RULE_VERSION,
    };
  }

  // -------------------------------------------------------------
  // 8. Missing Information / Verification Check (Triggers Needs Review)
  // -------------------------------------------------------------
  // 8.1 Missing Annual Income when scheme has income ceiling
  if (scheme.incomeLimit && scheme.incomeLimit > 0) {
    if (!student.annualFamilyIncome || student.annualFamilyIncome <= 0) {
      missingInfo.push(
        'पालकांचे वार्षिक कौटुंबिक उत्पन्न नोंदवलेले नाही / तहसीलदारांचा उत्पन्नाचा दाखला प्रलंबित'
      );
    }
  }

  // 8.2 Missing or Masked Aadhaar
  if (
    !student.aadhaarNumber ||
    student.aadhaarNumber.length < 12 ||
    student.aadhaarNumber.includes('X')
  ) {
    missingInfo.push('१२ अंकी वैध आधार कार्ड क्रमांक व महाडीबीटी बायोमेट्रिक प्रमाणीकरण प्रलंबित');
  }

  // 8.3 Missing Bank Account / IFSC
  if (!student.bankAccountNumber || !student.bankIfsc) {
    missingInfo.push(
      'थेट लाभ हस्तांतरण (DBT) करिता राष्ट्रीयीकृत बँक खाते क्रमांक किंवा IFSC कोड प्रलंबित'
    );
  }

  // 8.4 CWSN Disability Certificate
  if (scheme.cwsnRequirement === 'CWSN_ONLY') {
    if (!student.cwsnDisabilityType || student.cwsnDisabilityType === 'None') {
      missingInfo.push(
        'जिल्हा शल्यचिकित्सक (सिव्हिल सर्जन) यांचे ४०% पेक्षा अधिकचे UDID दिव्यांगत्व प्रमाणपत्र प्रलंबित'
      );
    }
  }

  // 8.5 Application Deadline Warning
  if (scheme.applicationEndDate && new Date() > new Date(scheme.applicationEndDate)) {
    reasons.push(
      `अर्ज सादर करण्याची विहित अंतिम मुदत समाप्त झाली आहे (${new Date(
        scheme.applicationEndDate
      ).toLocaleDateString('mr-IN')})`
    );
  }

  if (missingInfo.length > 0) {
    reasons.push(
      `विद्यार्थी प्राथमिक अटींची पूर्तता करतो; मात्र ${missingInfo.length} अनिवार्य कागदपत्रे / माहिती पडताळणी प्रलंबित आहे.`
    );
    return {
      status: 'Needs Review',
      reasons,
      missingInfo,
      evaluatedAt,
      ruleVersion: RULE_VERSION,
    };
  }

  // All rules and documents satisfied
  reasons.push(
    'विद्यार्थी सर्व विहित शासकीय अटी व निकष पूर्ण करतो (इयत्ता, प्रवर्ग, लिंग, उत्पन्न मर्यादा व DBT बँक तपशील प्रमाणित).'
  );

  return {
    status: 'Eligible',
    reasons,
    missingInfo: [],
    evaluatedAt,
    ruleVersion: RULE_VERSION,
  };
};

/**
 * Bulk Evaluates All Students for a Given Scheme and Updates Database
 */
export const evaluateAllStudentsForScheme = async (
  schemeId: string,
  academicYear: string = '2026-27'
): Promise<{
  eligibleCount: number;
  ineligibleCount: number;
  reviewCount: number;
  totalStudents: number;
}> => {
  const scheme = await Scholarship.findById(schemeId);
  if (!scheme) {
    throw new Error(`Scholarship scheme with ID ${schemeId} not found`);
  }

  const students = await Student.find({ isActive: true });
  const operations = [];

  let eligibleCount = 0;
  let ineligibleCount = 0;
  let reviewCount = 0;

  for (const student of students) {
    const outcome = evaluateStudentForScheme(student, scheme);

    if (outcome.status === 'Eligible') eligibleCount++;
    else if (outcome.status === 'Not Eligible') ineligibleCount++;
    else if (outcome.status === 'Needs Review') reviewCount++;

    operations.push({
      updateOne: {
        filter: {
          studentId: student._id,
          schemeId: scheme._id,
          academicYear,
        },
        update: {
          $set: {
            studentGrNumber: student.grNumber,
            studentName: student.name,
            standard: student.currentStandard || student.classGrade,
            division: student.division || 'A',
            category: student.category || 'General',
            gender: student.gender,
            annualIncome: student.annualFamilyIncome || 0,
            schemeCode: scheme.code,
            schemeName: scheme.schemeName,
            status: outcome.status,
            reasons: outcome.reasons,
            missingInfo: outcome.missingInfo,
            evaluatedAt: outcome.evaluatedAt,
            ruleVersion: outcome.ruleVersion,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    await ScholarshipEligibility.bulkWrite(operations);
  }

  // Update counts on Scholarship document
  scheme.eligibleCount = eligibleCount;
  scheme.ineligibleCount = ineligibleCount;
  scheme.reviewCount = reviewCount;
  await scheme.save();

  return {
    eligibleCount,
    ineligibleCount,
    reviewCount,
    totalStudents: students.length,
  };
};

/**
 * Bulk Evaluates All Active Schemes across All Students
 */
export const evaluateAllSchemes = async (): Promise<void> => {
  const activeSchemes = await Scholarship.find({ isActive: true });
  for (const scheme of activeSchemes) {
    await evaluateAllStudentsForScheme(scheme._id.toString(), scheme.academicYear || '2026-27');
  }
};
