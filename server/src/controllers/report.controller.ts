import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Student } from '../models/Student.model';
import { Finance } from '../models/Finance.model';
import { Teacher } from '../models/Teacher.model';
import { User } from '../models/User.model';

const SCHOOL_NAME = 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.';
const SCHOOL_SUBTITLE = 'ता. धरणगाव, जि. जळगाव - केंद्र: बांभोरी | UDISE: 27030504401';

/**
 * Helper to check teacher class-level authorization
 */
const getAuthorizedClassesForTeacher = (req: AuthRequest): string[] => {
  if (req.user?.role === 'principal') return []; // Principal has unrestricted access
  return req.user?.teacherProfile?.assignedClasses || [];
};

/**
 * 1. Student Reports Controller
 * Aggregates Gender, Category, Class-wise distributions with filter support
 */
export const getStudentReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, standard, division } = req.query;
    const filter: any = { isActive: true };

    const authorizedClasses = getAuthorizedClassesForTeacher(req);

    // If teacher, enforce assigned class restrictions
    if (req.user?.role === 'teacher' && authorizedClasses.length > 0) {
      if (standard && standard !== 'ALL') {
        if (!authorizedClasses.includes(String(standard))) {
          res.status(403).json({
            success: false,
            message: `Forbidden: Teachers can only view reports for their assigned classes: ${authorizedClasses.join(', ')}`,
          });
          return;
        }
        filter.currentStandard = standard;
      } else {
        filter.currentStandard = { $in: authorizedClasses };
      }
    } else if (standard && standard !== 'ALL') {
      filter.currentStandard = standard;
    }

    if (division && division !== 'ALL') {
      filter.division = division;
    }

    if (academicYear && academicYear !== 'ALL') {
      filter.admissionYear = academicYear;
    }

    const students = await Student.find(filter).sort({ currentStandard: 1, division: 1, grNumber: 1 });

    // 1. Gender Distribution
    const genderCounts: Record<string, number> = {
      'मुलगा (Boys)': 0,
      'मुलगी (Girls)': 0,
      'इतर (Others)': 0,
    };

    // 2. Category Distribution
    const categoryCounts: Record<string, number> = {
      General: 0,
      OBC: 0,
      SC: 0,
      ST: 0,
      NT: 0,
      SBC: 0,
    };

    // 3. Class-wise distribution
    const classMap: Record<string, { standard: string; boys: number; girls: number; other: number; total: number }> = {};
    const standardOrder = [
      'इयत्ता १ ली',
      'इयत्ता २ री',
      'इयत्ता ३ री',
      'इयत्ता ४ थी',
      'इयत्ता ५ वी',
      'इयत्ता ६ वी',
      'इयत्ता ७ वी',
    ];

    standardOrder.forEach((std) => {
      classMap[std] = { standard: std, boys: 0, girls: 0, other: 0, total: 0 };
    });

    students.forEach((stu) => {
      // Gender
      if (stu.gender === 'मुलगा') genderCounts['मुलगा (Boys)']++;
      else if (stu.gender === 'मुलगी') genderCounts['मुलगी (Girls)']++;
      else genderCounts['इतर (Others)']++;

      // Category
      if (stu.category && categoryCounts[stu.category] !== undefined) {
        categoryCounts[stu.category]++;
      } else {
        categoryCounts.General++;
      }

      // Class-wise
      const std = stu.currentStandard || stu.classGrade || 'इयत्ता १ ली';
      if (!classMap[std]) {
        classMap[std] = { standard: std, boys: 0, girls: 0, other: 0, total: 0 };
      }
      classMap[std].total++;
      if (stu.gender === 'मुलगा') classMap[std].boys++;
      else if (stu.gender === 'मुलगी') classMap[std].girls++;
      else classMap[std].other++;
    });

    const totalStudents = students.length;

    // Formatted for Recharts
    const genderDistribution = Object.entries(genderCounts).map(([name, value], idx) => ({
      name,
      value,
      percentage: totalStudents > 0 ? Number(((value / totalStudents) * 100).toFixed(1)) : 0,
      fill: idx === 0 ? '#176638' : idx === 1 ? '#FFA500' : '#2563EB',
    }));

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(1)) : 0,
    }));

    const classDistribution = Object.values(classMap).filter((item) => {
      // If teacher has assigned classes, filter only assigned classes
      if (req.user?.role === 'teacher' && authorizedClasses.length > 0) {
        return authorizedClasses.includes(item.standard);
      }
      return true;
    });

    // Sanitized student tabular sample (strict privacy: no Aadhaar, bank, health)
    const sanitizedStudents = students.map((s, idx) => ({
      srNo: idx + 1,
      grNumber: s.grNumber,
      name: s.name,
      standard: s.currentStandard,
      division: s.division,
      gender: s.gender,
      category: s.category,
      caste: s.caste,
      attendancePercentage: s.attendancePercentage || 92,
      admissionYear: s.admissionYear || '2026-27',
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalBoys: genderCounts['मुलगा (Boys)'],
          totalGirls: genderCounts['मुलगी (Girls)'],
          totalClasses: Object.keys(classMap).length,
          appliedFilters: {
            academicYear: academicYear || '2026-27',
            standard: standard || 'ALL',
            division: division || 'ALL',
          },
        },
        genderDistribution,
        categoryDistribution,
        classDistribution,
        students: sanitizedStudents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Funds Reports Controller
 * Aggregates Funds received vs Expenses, balance, utilization & categories
 */
export const getFundReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, academicYear } = req.query;
    const filter: any = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(String(startDate));
      if (endDate) filter.date.$lte = new Date(String(endDate));
    }

    const transactions = await Finance.find(filter).sort({ date: -1 });

    // Consistent logic with Funds module:
    // Exclude reversed transactions
    const activeFunds = transactions.filter(
      (t) => t.type === 'fund_received' && t.status !== 'Reversed'
    );
    const activeExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.status !== 'Reversed'
    );

    const totalFundsReceived = activeFunds.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = activeExpenses.reduce((sum, t) => sum + t.amount, 0);
    const availableBalance = totalFundsReceived - totalExpenses;
    const utilizationRate =
      totalFundsReceived > 0 ? Number(((totalExpenses / totalFundsReceived) * 100).toFixed(1)) : 0;

    // 1. Comparison Bar Chart Data (Funds Received vs Expenses vs Balance)
    const comparisonData = [
      { name: 'एकूण प्राप्त निधी (Received)', amount: totalFundsReceived, fill: '#176638' },
      { name: 'झालेला खर्च (Expenses)', amount: totalExpenses, fill: '#FFA500' },
      { name: 'शिल्लक निधी (Balance)', amount: availableBalance, fill: '#2563EB' },
    ];

    // 2. Fund-wise utilization breakdown
    const fundUtilization = activeFunds.map((fund) => {
      const fundExpenses = activeExpenses.filter(
        (e) => e.associatedFundId === fund.fundId || e.category === fund.category
      );
      const utilized = fundExpenses.reduce((sum, e) => sum + e.amount, 0);
      const remaining = Math.max(0, fund.amount - utilized);
      const percentUtilized = fund.amount > 0 ? Number(((utilized / fund.amount) * 100).toFixed(1)) : 0;

      return {
        fundId: fund.fundId || fund.voucherNo,
        schemeType: fund.schemeType || fund.title,
        allocated: fund.amount,
        utilized,
        remaining,
        percentUtilized,
        status: fund.status,
      };
    });

    // 3. Expense category distribution
    const categoryTotals: Record<string, { category: string; amount: number; count: number }> = {};
    activeExpenses.forEach((exp) => {
      const cat = exp.category || 'इतर अनुज्ञेय खर्च';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { category: cat, amount: 0, count: 0 };
      }
      categoryTotals[cat].amount += exp.amount;
      categoryTotals[cat].count++;
    });

    const categoryColors = ['#176638', '#FFA500', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'];
    const expenseCategoryDistribution = Object.values(categoryTotals).map((item, idx) => ({
      category: item.category,
      amount: item.amount,
      count: item.count,
      percentage: totalExpenses > 0 ? Number(((item.amount / totalExpenses) * 100).toFixed(1)) : 0,
      fill: categoryColors[idx % categoryColors.length],
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalFundsReceived,
          totalExpenses,
          availableBalance,
          utilizationRate,
          totalTransactions: transactions.length,
          totalFundsCount: activeFunds.length,
          totalExpensesCount: activeExpenses.length,
          appliedFilters: {
            startDate: startDate || '',
            endDate: endDate || '',
            academicYear: academicYear || '2026-27',
          },
        },
        comparisonData,
        fundUtilization,
        expenseCategoryDistribution,
        transactions: transactions.map((t) => ({
          _id: t._id,
          voucherNo: t.voucherNo,
          type: t.type,
          title: t.title,
          schemeType: t.schemeType || '',
          category: t.category,
          amount: t.amount,
          date: t.date,
          status: t.status,
          approvedBy: t.approvedBy,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Teacher Reports Controller
 * Aggregates Subject distribution and Experience histogram
 */
export const getTeacherReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teachers = await Teacher.find({ isActive: true });

    // 1. Subject distribution
    const subjectCounts: Record<string, number> = {
      'मराठी (Marathi)': 0,
      'गणित (Mathematics)': 0,
      'विज्ञान (Science)': 0,
      'इंग्रजी (English)': 0,
      'सामाजिक शास्त्रे (Social Science)': 0,
      'शारीरिक शिक्षण व कला (Physical Ed)': 0,
      'माहिती संप्रेषण तंत्रज्ञान (ICT)': 0,
    };

    // 2. Experience histogram bins
    const experienceBins: Record<string, number> = {
      '०-५ वर्षे (0-5 yrs)': 0,
      '६-१० वर्षे (6-10 yrs)': 0,
      '११-१५ वर्षे (11-15 yrs)': 0,
      '१६-२०+ वर्षे (16-20+ yrs)': 0,
    };

    let maleCount = 0;
    let femaleCount = 0;
    let totalExp = 0;

    teachers.forEach((teacher) => {
      // Gender
      if (teacher.gender === 'Male' || (teacher.gender as any) === 'पुरुष') maleCount++;
      else femaleCount++;

      // Experience
      const exp = teacher.experienceYears || 5;
      totalExp += exp;
      if (exp <= 5) experienceBins['०-५ वर्षे (0-5 yrs)']++;
      else if (exp <= 10) experienceBins['६-१० वर्षे (6-10 yrs)']++;
      else if (exp <= 15) experienceBins['११-१५ वर्षे (11-15 yrs)']++;
      else experienceBins['१६-२०+ वर्षे (16-20+ yrs)']++;

      // Subjects
      const subjects = teacher.subjectSpecialization || ['मराठी (Marathi)', 'गणित (Mathematics)'];
      subjects.forEach((subj) => {
        let matched = false;
        Object.keys(subjectCounts).forEach((key) => {
          if (subj.toLowerCase().includes(key.split(' ')[0].toLowerCase())) {
            subjectCounts[key]++;
            matched = true;
          }
        });
        if (!matched) {
          subjectCounts['मराठी (Marathi)']++;
        }
      });
    });

    const totalTeachers = teachers.length;
    const avgExperience = totalTeachers > 0 ? Number((totalExp / totalTeachers).toFixed(1)) : 0;

    const subjectColors = ['#176638', '#FFA500', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'];
    const subjectDistribution = Object.entries(subjectCounts).map(([name, count], idx) => ({
      name,
      count,
      percentage: totalTeachers > 0 ? Number(((count / (totalTeachers * 1.5)) * 100).toFixed(1)) : 0,
      fill: subjectColors[idx % subjectColors.length],
    }));

    const experienceHistogram = Object.entries(experienceBins).map(([range, count]) => ({
      range,
      count,
    }));

    // Sanitized teacher roster (omit private residential address / medical records)
    const sanitizedTeachers = teachers.map((t, idx) => ({
      srNo: idx + 1,
      employeeId: t.employeeId,
      name: t.name,
      designation: t.designation,
      qualification: t.qualification,
      experienceYears: t.experienceYears,
      gender: t.gender,
      subjectSpecialization: (t.subjectSpecialization || []).join(', '),
      assignedClasses: (t.assignedClasses || []).join(', '),
      joiningDate: t.joiningDate,
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTeachers,
          avgExperience,
          maleTeachers: maleCount,
          femaleTeachers: femaleCount,
        },
        subjectDistribution,
        experienceHistogram,
        teachers: sanitizedTeachers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Export Student Reports to CSV
 */
export const exportStudentsCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, standard, division } = req.query;
    const filter: any = { isActive: true };

    const authorizedClasses = getAuthorizedClassesForTeacher(req);
    if (req.user?.role === 'teacher' && authorizedClasses.length > 0) {
      if (standard && standard !== 'ALL') {
        if (!authorizedClasses.includes(String(standard))) {
          res.status(403).json({
            success: false,
            message: 'Forbidden: Unauthorized class access.',
          });
          return;
        }
        filter.currentStandard = standard;
      } else {
        filter.currentStandard = { $in: authorizedClasses };
      }
    } else if (standard && standard !== 'ALL') {
      filter.currentStandard = standard;
    }

    if (division && division !== 'ALL') filter.division = division;
    if (academicYear && academicYear !== 'ALL') filter.admissionYear = academicYear;

    const students = await Student.find(filter).sort({ currentStandard: 1, division: 1, grNumber: 1 });

    const filename = `ZP_Students_Report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.write('\uFEFF'); // UTF-8 BOM

    // Official Report Metadata Header
    res.write(`"${SCHOOL_NAME}"\n`);
    res.write(`"${SCHOOL_SUBTITLE}"\n`);
    res.write(`"अहवाल नाव (Report Title)","विद्यार्थी संख्या व प्रवर्गनिहाय अहवाल (Students Roster & Demographics)"\n`);
    res.write(`"शैक्षणिक वर्ष (Academic Year)","${academicYear || '2026-27'}"\n`);
    res.write(`"निवडलेली इयत्ता (Class Filter)","${standard || 'सर्व इयत्ता (ALL)'}"\n`);
    res.write(`"निवडलेली तुकडी (Division Filter)","${division || 'सर्व (ALL)'}"\n`);
    res.write(`"तयार केल्याचा दिनांक (Generated On)","${new Date().toLocaleString('mr-IN')}"\n`);
    res.write(`"तयार करणारी व्यक्ती (Generated By)","${req.user?.name} (${req.user?.role})"\n`);
    res.write(`"एकूण विद्यार्थी संख्या (Total Students)","${students.length}"\n\n`);

    // Column Headers (Strict Privacy - No Bank, No Full Aadhaar, No Medical)
    const headers = [
      'अ. क्र. (Sr No)',
      'जनरल रजिस्टर क्र. (GR No)',
      'विद्यार्थ्याचे पूर्ण नाव (Student Full Name)',
      'इयत्ता (Standard)',
      'तुकडी (Division)',
      'लिंग (Gender)',
      'प्रवर्ग (Category)',
      'जात (Caste)',
      'हजेरी टक्केवारी (Attendance %)',
      'प्रवेश वर्ष (Admission Year)',
    ];
    res.write(headers.join(',') + '\n');

    students.forEach((s, idx) => {
      const cleanName = s.name.replace(/"/g, '""');
      const cleanCaste = (s.caste || '').replace(/"/g, '""');
      const row = [
        idx + 1,
        `"${s.grNumber}"`,
        `"${cleanName}"`,
        `"${s.currentStandard}"`,
        `"${s.division}"`,
        `"${s.gender}"`,
        `"${s.category}"`,
        `"${cleanCaste}"`,
        `${s.attendancePercentage || 92}%`,
        `"${s.admissionYear || '2026-27'}"`,
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Export Funds & Ledger to CSV
 */
export const exportFundsCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(String(startDate));
      if (endDate) filter.date.$lte = new Date(String(endDate));
    }

    const transactions = await Finance.find(filter).sort({ date: -1 });

    const activeFunds = transactions.filter((t) => t.type === 'fund_received' && t.status !== 'Reversed');
    const activeExpenses = transactions.filter((t) => t.type === 'expense' && t.status !== 'Reversed');
    const totalFundsReceived = activeFunds.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = activeExpenses.reduce((sum, t) => sum + t.amount, 0);
    const availableBalance = totalFundsReceived - totalExpenses;

    const filename = `ZP_Financial_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.write('\uFEFF');

    // Metadata Header
    res.write(`"${SCHOOL_NAME}"\n`);
    res.write(`"${SCHOOL_SUBTITLE}"\n`);
    res.write(`"अहवाल नाव (Report Title)","शालेय निधी व खर्च ताळेबंद अहवाल (Financial Ledger & Utilization Report)"\n`);
    res.write(`"एकूण प्राप्त निधी (Total Funds INR)","₹${totalFundsReceived.toLocaleString('en-IN')}"\n`);
    res.write(`"एकूण झालेला खर्च (Total Expenses INR)","₹${totalExpenses.toLocaleString('en-IN')}"\n`);
    res.write(`"अखेर शिल्लक रक्कम (Available Balance INR)","₹${availableBalance.toLocaleString('en-IN')}"\n`);
    res.write(`"तयार केल्याचा दिनांक (Generated Date)","${new Date().toLocaleString('mr-IN')}"\n`);
    res.write(`"तयार करणारी व्यक्ती (Generated By)","${req.user?.name} (${req.user?.role})"\n\n`);

    const headers = [
      'अ. क्र. (Sr No)',
      'व्हाउचर / निधी क्र. (Voucher/Fund ID)',
      'व्यवहार प्रकार (Transaction Type)',
      'निधी योजना / खर्चाचे प्रयोजन (Scheme / Purpose)',
      'खर्च वर्गवारी (Category)',
      'रक्कम INR (Amount)',
      'दिनांक (Date)',
      'स्थिती (Status)',
      'मंजूर अधिकारी (Approved By)',
    ];
    res.write(headers.join(',') + '\n');

    transactions.forEach((t, idx) => {
      const typeLabel = t.type === 'fund_received' ? 'निधी जमा (Fund Received)' : 'खर्च (Expense)';
      const desc = (t.schemeType || t.title || t.purpose || '').replace(/"/g, '""');
      const cleanCat = (t.category || '').replace(/"/g, '""');
      const row = [
        idx + 1,
        `"${t.fundId || t.voucherNo}"`,
        `"${typeLabel}"`,
        `"${desc}"`,
        `"${cleanCat}"`,
        t.amount,
        `"${new Date(t.date).toLocaleDateString('mr-IN')}"`,
        `"${t.status}"`,
        `"${t.approvedBy.replace(/"/g, '""')}"`,
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Export Teachers Roster to CSV
 */
export const exportTeachersCsv = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teachers = await Teacher.find({ isActive: true });

    const filename = `ZP_Teachers_Report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.write('\uFEFF');

    res.write(`"${SCHOOL_NAME}"\n`);
    res.write(`"${SCHOOL_SUBTITLE}"\n`);
    res.write(`"अहवाल नाव (Report Title)","शिक्षक वृंद व विषय वाटप अहवाल (Teachers Roster & Subject Distribution)"\n`);
    res.write(`"एकूण कार्यरत शिक्षक (Total Staff)","${teachers.length}"\n`);
    res.write(`"तयार केल्याचा दिनांक (Generated Date)","${new Date().toLocaleString('mr-IN')}"\n`);
    res.write(`"तयार करणारी व्यक्ती (Generated By)","${req.user?.name} (${req.user?.role})"\n\n`);

    const headers = [
      'अ. क्र. (Sr No)',
      'कर्मचारी सेवाार्थ क्र. (Sevaarth ID)',
      'शिक्षकाचे पूर्ण नाव (Full Name)',
      'पदनाम (Designation)',
      'शैक्षणिक पात्रता (Qualification)',
      'विषय विशेषीकरण (Subjects)',
      'अध्यापन अनुभव वर्षे (Experience Yrs)',
      'नेमून दिलेले वर्ग (Assigned Classes)',
    ];
    res.write(headers.join(',') + '\n');

    teachers.forEach((t, idx) => {
      const cleanName = t.name.replace(/"/g, '""');
      const subjects = (t.subjectSpecialization || []).join(' | ').replace(/"/g, '""');
      const classes = (t.assignedClasses || []).join(' | ').replace(/"/g, '""');
      const row = [
        idx + 1,
        `"${t.employeeId}"`,
        `"${cleanName}"`,
        `"${t.designation}"`,
        `"${t.qualification}"`,
        `"${subjects}"`,
        t.experienceYears || 5,
        `"${classes}"`,
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Formatted Official Printable PDF View (Students)
 */
export const renderStudentsReportPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { academicYear, standard, division } = req.query;
    const filter: any = { isActive: true };

    const authorizedClasses = getAuthorizedClassesForTeacher(req);
    if (req.user?.role === 'teacher' && authorizedClasses.length > 0) {
      if (standard && standard !== 'ALL') {
        if (!authorizedClasses.includes(String(standard))) {
          res.status(403).send('<h1>403 Forbidden: Unauthorized class report.</h1>');
          return;
        }
        filter.currentStandard = standard;
      } else {
        filter.currentStandard = { $in: authorizedClasses };
      }
    } else if (standard && standard !== 'ALL') {
      filter.currentStandard = standard;
    }

    if (division && division !== 'ALL') filter.division = division;
    if (academicYear && academicYear !== 'ALL') filter.admissionYear = academicYear;

    const students = await Student.find(filter).sort({ currentStandard: 1, division: 1, grNumber: 1 });

    const totalStudents = students.length;
    const boysCount = students.filter((s) => s.gender === 'मुलगा').length;
    const girlsCount = students.filter((s) => s.gender === 'मुलगी').length;

    const html = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>विद्यार्थी अहवाल - ${SCHOOL_NAME}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; padding: 15px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #176638; padding-bottom: 8px; margin-bottom: 12px; }
    .emblem { font-size: 11px; font-weight: bold; color: #b45309; }
    .title { font-size: 20px; font-weight: 800; color: #176638; margin: 2px 0; }
    .subtitle { font-size: 11px; color: #4b5563; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; background: #F4F7F4; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #E1E8E1; }
    .summary-cards { display: flex; gap: 12px; margin-bottom: 12px; }
    .card { flex: 1; border: 1px solid #E1E8E1; padding: 8px 12px; border-radius: 6px; background: #FAFAFA; text-align: center; }
    .card-val { font-size: 16px; font-weight: bold; color: #176638; }
    .card-lbl { font-size: 10px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
    th { background: #176638; color: #fff; padding: 6px 8px; font-weight: 700; border: 1px solid #176638; }
    td { padding: 5px 8px; border: 1px solid #E5E7EB; }
    tr:nth-child(even) { background: #F9FAFB; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; font-weight: bold; padding: 0 40px; }
    .sign-box { text-align: center; border-top: 1px solid #374151; padding-top: 4px; width: 180px; }
    .btn-print { background: #176638; color: #fff; padding: 8px 18px; font-size: 12px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer; margin-bottom: 12px; }
    @media print { .btn-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ प्रिंट / PDF सेव्ह करा (Print to PDF)</button>
  <div class="header">
    <div class="emblem">॥ महाराष्ट्र शासन - जिल्हा परिषद, जळगाव ॥</div>
    <div class="title">${SCHOOL_NAME}</div>
    <div class="subtitle">${SCHOOL_SUBTITLE}</div>
  </div>

  <div class="meta-bar">
    <div><strong>अहवाल :</strong> विद्यार्थी संख्या व प्रवर्ग अहवाल (Student Roster)</div>
    <div><strong>इयत्ता :</strong> ${standard || 'सर्व वर्ग'} | <strong>तुकडी :</strong> ${division || 'सर्व'}</div>
    <div><strong>दिनांक :</strong> ${new Date().toLocaleDateString('mr-IN')}</div>
  </div>

  <div class="summary-cards">
    <div class="card"><div class="card-val">${totalStudents}</div><div class="card-lbl">एकूण विद्यार्थी संख्या</div></div>
    <div class="card"><div class="card-val" style="color: #176638;">${boysCount}</div><div class="card-lbl">मुले (Boys)</div></div>
    <div class="card"><div class="card-val" style="color: #FFA500;">${girlsCount}</div><div class="card-lbl">मुली (Girls)</div></div>
    <div class="card"><div class="card-val">${academicYear || '2026-27'}</div><div class="card-lbl">शैक्षणिक वर्ष</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>अ. क्र.</th>
        <th>G.R. क्र.</th>
        <th>विद्यार्थ्याचे पूर्ण नाव</th>
        <th>इयत्ता</th>
        <th>तुकडी</th>
        <th>लिंग</th>
        <th>प्रवर्ग</th>
        <th>जात</th>
        <th>हजेरी %</th>
      </tr>
    </thead>
    <tbody>
      ${students
        .map(
          (s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${s.grNumber}</strong></td>
          <td>${s.name}</td>
          <td>${s.currentStandard}</td>
          <td>${s.division}</td>
          <td>${s.gender}</td>
          <td>${s.category}</td>
          <td>${s.caste || '-'}</td>
          <td>${s.attendancePercentage || 92}%</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sign-box">वर्गशिक्षक स्वाक्षरी<br><span style="font-size: 9px; color: #6b7280;">जि. प. शाळा, हिंगोणे बु.</span></div>
    <div class="sign-box">मुख्याध्यापक स्वाक्षरी व शिक्का<br><span style="font-size: 9px; color: #6b7280;">जि. प. शाळा, हिंगोणे बु.</span></div>
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
 * 8. Formatted Official Printable PDF View (Funds)
 */
export const renderFundsReportPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transactions = await Finance.find({}).sort({ date: -1 });

    const activeFunds = transactions.filter((t) => t.type === 'fund_received' && t.status !== 'Reversed');
    const activeExpenses = transactions.filter((t) => t.type === 'expense' && t.status !== 'Reversed');
    const totalFundsReceived = activeFunds.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = activeExpenses.reduce((sum, t) => sum + t.amount, 0);
    const availableBalance = totalFundsReceived - totalExpenses;

    const html = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>शालेय निधी अहवाल - ${SCHOOL_NAME}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; padding: 15px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #176638; padding-bottom: 8px; margin-bottom: 12px; }
    .emblem { font-size: 11px; font-weight: bold; color: #b45309; }
    .title { font-size: 20px; font-weight: 800; color: #176638; margin: 2px 0; }
    .subtitle { font-size: 11px; color: #4b5563; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; background: #F4F7F4; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #E1E8E1; }
    .summary-cards { display: flex; gap: 12px; margin-bottom: 15px; }
    .card { flex: 1; border: 1px solid #E1E8E1; padding: 10px; border-radius: 6px; background: #FAFAFA; text-align: center; }
    .card-val { font-size: 18px; font-weight: bold; }
    .card-lbl { font-size: 10px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 15px; }
    th { background: #176638; color: #fff; padding: 6px 8px; font-weight: 700; border: 1px solid #176638; }
    td { padding: 5px 8px; border: 1px solid #E5E7EB; }
    tr:nth-child(even) { background: #F9FAFB; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; font-weight: bold; padding: 0 40px; }
    .sign-box { text-align: center; border-top: 1px solid #374151; padding-top: 4px; width: 180px; }
    .btn-print { background: #176638; color: #fff; padding: 8px 18px; font-size: 12px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer; margin-bottom: 12px; }
    @media print { .btn-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ प्रिंट / PDF सेव्ह करा (Print to PDF)</button>
  <div class="header">
    <div class="emblem">॥ महाराष्ट्र शासन - जिल्हा परिषद, जळगाव ॥</div>
    <div class="title">${SCHOOL_NAME}</div>
    <div class="subtitle">${SCHOOL_SUBTITLE}</div>
  </div>

  <div class="meta-bar">
    <div><strong>अहवाल :</strong> शालेय आर्थिक ताळेबंद व निधी उपयोगिता अहवाल (Finance & Utilization)</div>
    <div><strong>दिनांक :</strong> ${new Date().toLocaleDateString('mr-IN')}</div>
  </div>

  <div class="summary-cards">
    <div class="card"><div class="card-val" style="color: #176638;">₹${totalFundsReceived.toLocaleString('en-IN')}</div><div class="card-lbl">एकूण प्राप्त निधी (Received)</div></div>
    <div class="card"><div class="card-val" style="color: #FFA500;">₹${totalExpenses.toLocaleString('en-IN')}</div><div class="card-lbl">एकूण झालेला खर्च (Expenses)</div></div>
    <div class="card"><div class="card-val" style="color: #2563EB;">₹${availableBalance.toLocaleString('en-IN')}</div><div class="card-lbl">अखेर शिल्लक रक्कम (Balance)</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>अ. क्र.</th>
        <th>व्हाउचर / निधी क्र.</th>
        <th>प्रकार</th>
        <th>योजना / तपशील</th>
        <th>वर्गवारी</th>
        <th>रक्कम (₹)</th>
        <th>दिनांक</th>
        <th>स्थिती</th>
      </tr>
    </thead>
    <tbody>
      ${transactions
        .map(
          (t, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${t.fundId || t.voucherNo}</strong></td>
          <td>${t.type === 'fund_received' ? 'जमा निधी' : 'खर्च'}</td>
          <td>${t.schemeType || t.title}</td>
          <td>${t.category}</td>
          <td>₹${t.amount.toLocaleString('en-IN')}</td>
          <td>${new Date(t.date).toLocaleDateString('mr-IN')}</td>
          <td>${t.status}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sign-box">शाळा समिती सदस्य स्वाक्षरी<br><span style="font-size: 9px; color: #6b7280;">शाळा व्यवस्थापन समिती</span></div>
    <div class="sign-box">मुख्याध्यापक स्वाक्षरी व मोहर<br><span style="font-size: 9px; color: #6b7280;">जि. प. शाळा, हिंगोणे बु.</span></div>
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
 * 9. Formatted Official Printable PDF View (Teachers)
 */
export const renderTeachersReportPdf = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teachers = await Teacher.find({ isActive: true });

    const html = `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>शिक्षक वृंद अहवाल - ${SCHOOL_NAME}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 0; padding: 15px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #176638; padding-bottom: 8px; margin-bottom: 12px; }
    .emblem { font-size: 11px; font-weight: bold; color: #b45309; }
    .title { font-size: 20px; font-weight: 800; color: #176638; margin: 2px 0; }
    .subtitle { font-size: 11px; color: #4b5563; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; background: #F4F7F4; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #E1E8E1; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-bottom: 15px; }
    th { background: #176638; color: #fff; padding: 6px 8px; font-weight: 700; border: 1px solid #176638; }
    td { padding: 5px 8px; border: 1px solid #E5E7EB; }
    tr:nth-child(even) { background: #F9FAFB; }
    .signatures { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; font-weight: bold; padding: 0 40px; }
    .sign-box { text-align: center; border-top: 1px solid #374151; padding-top: 4px; width: 180px; }
    .btn-print { background: #176638; color: #fff; padding: 8px 18px; font-size: 12px; font-weight: bold; border-radius: 6px; border: none; cursor: pointer; margin-bottom: 12px; }
    @media print { .btn-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ प्रिंट / PDF सेव्ह करा (Print to PDF)</button>
  <div class="header">
    <div class="emblem">॥ महाराष्ट्र शासन - जिल्हा परिषद, जळगाव ॥</div>
    <div class="title">${SCHOOL_NAME}</div>
    <div class="subtitle">${SCHOOL_SUBTITLE}</div>
  </div>

  <div class="meta-bar">
    <div><strong>अहवाल :</strong> शिक्षक वृंद, पात्रता व विषय वाटप अहवाल (Teachers Roster)</div>
    <div><strong>एकूण शिक्षक :</strong> ${teachers.length} | <strong>दिनांक :</strong> ${new Date().toLocaleDateString('mr-IN')}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>अ. क्र.</th>
        <th>सेवाार्थ क्र.</th>
        <th>शिक्षकाचे पूर्ण नाव</th>
        <th>पदनाम</th>
        <th>पात्रता</th>
        <th>विषय विशेषीकरण</th>
        <th>अनुभव वर्षे</th>
        <th>नेमून दिलेले वर्ग</th>
      </tr>
    </thead>
    <tbody>
      ${teachers
        .map(
          (t, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${t.employeeId}</strong></td>
          <td>${t.name}</td>
          <td>${t.designation}</td>
          <td>${t.qualification}</td>
          <td>${(t.subjectSpecialization || []).join(', ')}</td>
          <td>${t.experienceYears || 5} वर्षे</td>
          <td>${(t.assignedClasses || []).join(', ')}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div></div>
    <div class="sign-box">मुख्याध्यापक स्वाक्षरी व शिक्का<br><span style="font-size: 9px; color: #6b7280;">जि. प. शाळा, हिंगोणे बु.</span></div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};
