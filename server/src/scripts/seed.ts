import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { User } from '../models/User.model';
import { Notice } from '../models/Notice.model';
import { Scholarship } from '../models/Scholarship.model';
import { GalleryAlbum } from '../models/GalleryAlbum.model';
import { AdmissionApplication } from '../models/AdmissionApplication.model';
import { Student } from '../models/Student.model';
import { Finance } from '../models/Finance.model';
import { CertificateRequest } from '../models/CertificateRequest.model';
import { Teacher } from '../models/Teacher.model';
import { ScholarshipEligibility } from '../models/ScholarshipEligibility.model';
import { evaluateAllSchemes } from '../services/scholarshipEligibility.service';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB:', ENV.MONGODB_URI);
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seed] Connected.');

    // Clear existing collections
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Notice.deleteMany({});
    await Scholarship.deleteMany({});
    await GalleryAlbum.deleteMany({});
    await AdmissionApplication.deleteMany({});
    await Student.deleteMany({});
    await Finance.deleteMany({});
    await CertificateRequest.deleteMany({});
    await ScholarshipEligibility.deleteMany({});
    console.log('[Seed] Cleared existing records.');

    // 1. Staff Accounts (Principal & Teachers with rich approved public profiles)
    const users = [
      {
        name: 'Shri. S. R. Patil',
        email: 'principal@zphingone.edu.in',
        username: 'principal',
        password: 'Principal@123',
        role: 'principal' as const,
        phone: '+91 98234 56789',
        designation: 'Headmaster (मुख्याध्यापक)',
        avatar: '/imgs/principal.jpeg',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2004-0112',
          qualification: 'M.A., D.Ed. (मराठी व इतिहास)',
          joiningDate: new Date('2004-07-01'),
          assignedClasses: ['इयत्ता ७ वी'],
          subjectSpecialization: ['मराठी', 'इतिहास व नागरिकशास्त्र', 'प्रशासन'],
        },
      },
      {
        name: 'Smt. K. N. Pawar',
        email: 'teacher.pawar@zphingone.edu.in',
        username: 'teacher.pawar',
        password: 'Teacher@123',
        role: 'teacher' as const,
        phone: '+91 98765 43210',
        designation: 'Senior Primary Teacher (वरिष्ठ प्राथमिक शिक्षिका)',
        avatar: '',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2015-0812',
          qualification: 'M.A., D.Ed. (मराठी माध्यम)',
          joiningDate: new Date('2015-06-15'),
          assignedClasses: ['इयत्ता १ ली', 'इयत्ता २ री'],
          subjectSpecialization: ['मराठी', 'परिसर अभ्यास', 'हस्तकला व कार्यानुभव'],
        },
      },
      {
        name: 'Shri. R. V. Shinde',
        email: 'teacher.shinde@zphingone.edu.in',
        username: 'teacher.shinde',
        password: 'Teacher@123',
        role: 'teacher' as const,
        phone: '+91 98111 22233',
        designation: 'Mathematics & Science Specialist (गणित व विज्ञान विषय शिक्षक)',
        avatar: '',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2018-0433',
          qualification: 'B.Sc., B.Ed. (गणित व भौतिकशास्त्र)',
          joiningDate: new Date('2018-08-01'),
          assignedClasses: ['इयत्ता ३ री', 'इयत्ता ४ थी'],
          subjectSpecialization: ['गणित', 'सामान्य विज्ञान', 'इंग्रजी'],
        },
      },
      {
        name: 'Shri. M. P. Patil',
        email: 'teacher.patil@zphingone.edu.in',
        username: 'teacher.patil',
        password: 'Teacher@123',
        role: 'teacher' as const,
        phone: '+91 98333 44455',
        designation: 'Primary Teacher & Sports In-charge (क्रीडा प्रमुख शिक्षक)',
        avatar: '',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2012-0921',
          qualification: 'B.A., B.P.Ed., D.Ed.',
          joiningDate: new Date('2012-09-10'),
          assignedClasses: ['इयत्ता ५ वी'],
          subjectSpecialization: ['शारीरिक शिक्षण व क्रीडा', 'भूगोल', 'सामान्य ज्ञान'],
        },
      },
      {
        name: 'Smt. S. S. Bhadane',
        email: 'teacher.bhadane@zphingone.edu.in',
        username: 'teacher.bhadane',
        password: 'Teacher@123',
        role: 'teacher' as const,
        phone: '+91 98444 55566',
        designation: 'Language & Digital Literacy Teacher (भाषा व संगणक शिक्षिका)',
        avatar: '',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2020-0315',
          qualification: 'M.Sc., B.Ed. (संगणक व इंग्रजी)',
          joiningDate: new Date('2020-01-15'),
          assignedClasses: ['इयत्ता ६ वी'],
          subjectSpecialization: ['इंग्रजी', 'संगणक साक्षरता', 'चित्रकला'],
        },
      },
    ];

    for (const u of users) {
      const createdUser = await User.create(u);

      // Create corresponding rich Teacher record
      await Teacher.create({
        name: u.name,
        gender: u.name.includes('Smt.') ? 'Female' : 'Male',
        dateOfBirth: new Date(u.role === 'principal' ? '1978-04-12' : '1988-08-20'),
        bloodGroup: u.role === 'principal' ? 'O+' : 'B+',
        contactPhone: u.phone.replace('+91 ', '').replace(' ', ''),
        email: u.email,
        aadhaarNumber: '982345678912',
        residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५',
        employeeId: u.teacherProfile.employeeId,
        designation: u.designation,
        qualification: u.teacherProfile.qualification,
        joiningDate: u.teacherProfile.joiningDate,
        assignedClasses: u.teacherProfile.assignedClasses,
        subjectSpecialization: u.teacherProfile.subjectSpecialization,
        experienceYears: u.role === 'principal' ? 22 : 11,
        linkedUserId: createdUser._id,
        medicalFitness: 'Fit',
        emergencyContactName: 'कुटुंब संपर्क',
        emergencyContactPhone: '9823456789',
        isActive: true,
      });
    }
    console.log(`[Seed] Seeded ${users.length} staff accounts and corresponding teacher records.`);

    // 2. Scholarships (Official Maharashtra Gov schemes)
    const scholarships = [
      {
        schemeName: 'Savitribai Phule Scholarship Scheme for Girls',
        marathiName: 'क्रांतीज्योती सावित्रीबाई फुले शिष्यवृत्ती योजना',
        code: 'SP-SCH-01',
        category: 'Girl Child Welfare',
        description: 'State welfare scholarship aimed at preventing dropout among backward class and disadvantaged girl students in upper primary standards.',
        marathiDescription: 'उच्च प्राथमिक स्तरावरील (इयत्ता ५ वी ते ७ वी) मागासवर्गीय व वंचित घटकातील विद्यार्थिनींची गळती रोखण्यासाठी आणि शिक्षणास प्रोत्साहन देण्यासाठी राज्य शासनाची महत्त्वपूर्ण योजना.',
        applicableGrades: 'इयत्ता ५ वी ते ७ वी (Classes 5 to 7)',
        applicableStandards: ['इयत्ता ५ वी', 'इयत्ता ६ वी', 'इयत्ता ७ वी'],
        beneficiaryGroup: 'इयत्ता ५ वी ते ७ वी मधील सर्व मागासवर्गीय (SC/NT/SBC/OBC) विद्यार्थिनी',
        applicableCategories: ['SC', 'NT', 'SBC', 'OBC'],
        incomeLimit: 0, // No income ceiling for primary girls
        genderRequirement: 'मुलगी' as const,
        minorityRequirement: 'ALL' as const,
        cwsnRequirement: 'ALL' as const,
        bplRequirement: 'ALL' as const,
        benefitAmount: '₹1,000/- प्रति वर्ष (₹100 प्रति महिना १० महिन्यांसाठी)',
        eligibilityCriteria: [
          'विद्यार्थिनी इयत्ता ५ वी ते ७ वी मध्ये नियमित शिकत असावी',
          'विद्यार्थी लिंग: मुलगी असणे अनिवार्य',
          'अनुसूचित जाती, भटक्या जमाती किंवा इतर मागास प्रवर्गातील विद्यार्थिनी',
          'किमान ७५% शालेय उपस्थिती व समाधानकारक प्रगती आवश्यक',
        ],
        requiredDocuments: [
          'विद्यार्थिनीचे आधार कार्ड झेरॉक्स',
          'बँक खाते पासबुक झेरॉक्स (विद्यार्थिनीच्या किंवा संयुक्त नावे)',
          'जातीचा दाखला (सक्षम अधिकाऱ्याचा)',
          'मागील वर्षाची गुणपत्रिका झेरॉक्स',
        ],
        applicationSteps: 'शाळेच्या वर्गशिक्षकांकडे आवश्यक कागदपत्रांसह विहित नमुन्यातील अर्ज भरून सादर करावा. शाळा महाडीबीटी (MahaDBT) पोर्टलवर नोंदणी करते.',
        officialUrl: 'https://mahadbt.maharashtra.gov.in/',
        academicYear: '2026-27',
        applicationStartDate: new Date('2026-06-15'),
        applicationEndDate: new Date('2026-11-30'),
        isActive: true,
        isPublic: true,
      },
      {
        schemeName: 'Suvarna Mahotsavi Tribal Pre-Matric Scholarship',
        marathiName: 'सुवर्णमहोत्सवी आदिवासी पूर्व माध्यमिक शिष्यवृत्ती',
        code: 'SM-SCH-02',
        category: 'Tribal Welfare',
        description: 'Centrally sponsored and state managed scholarship providing educational assistance, books and stationery aid to scheduled tribe students.',
        marathiDescription: 'अनुसूचित जमाती (ST) प्रवर्गातील गरीब व गरजू विद्यार्थ्यांना शिक्षणाचा खर्च उचलण्यासाठी, वह्या-पुस्तके व गणवेश साहाय्यासाठी आदिवासी विकास विभागामार्फत थेट शिष्यवृत्ती.',
        applicableGrades: 'इयत्ता १ ली ते ७ वी (Classes 1 to 7)',
        applicableStandards: [
          'इयत्ता १ ली',
          'इयत्ता २ री',
          'इयत्ता ३ री',
          'इयत्ता ४ थी',
          'इयत्ता ५ वी',
          'इयत्ता ६ वी',
          'इयत्ता ७ वी',
        ],
        beneficiaryGroup: 'अनुसूचित जमाती (ST) प्रवर्गातील सर्व मुले व मुली (वार्षिक उत्पन्न मर्यादा ₹१ लाख)',
        applicableCategories: ['ST'],
        incomeLimit: 100000,
        genderRequirement: 'ALL' as const,
        minorityRequirement: 'ALL' as const,
        cwsnRequirement: 'ALL' as const,
        bplRequirement: 'ALL' as const,
        benefitAmount: '₹1,000/- प्रति वर्ष शैक्षणिक साहित्य व गणवेश साहाय्य',
        eligibilityCriteria: [
          'विद्यार्थी अनुसूचित जमाती (ST) प्रवर्गाचा असणे बंधनकारक',
          'पालकांचे वार्षिक कौटुंबिक उत्पन्न ₹१,००,०००/- पेक्षा कमी असावे',
          'शाळेतील नियमित उपस्थिती व समाधानकारक शैक्षणिक प्रगती',
          'विद्यार्थ्यांचे राष्ट्रीयीकृत बँक खाते असणे आवश्यक',
        ],
        requiredDocuments: [
          'सक्षम अधिकाऱ्याचा जातीचा वैध दाखला',
          'पालकांचा तहसीलदारांचा उत्पन्नाचा दाखला (चालू आर्थिक वर्ष)',
          'विद्यार्थी व पालकांचे आधार कार्ड',
          'राष्ट्रीयीकृत बँक पासबुक झेरॉक्स (DBT जोडणीसह)',
        ],
        applicationSteps: 'शैक्षणिक वर्षाच्या प्रारंभी जुलै महिन्यात विहित नमुन्यात अर्ज मुख्याध्यापक कार्यालयात सादर करावा.',
        officialUrl: 'https://tribal.maharashtra.gov.in/',
        academicYear: '2026-27',
        applicationStartDate: new Date('2026-07-01'),
        applicationEndDate: new Date('2026-11-15'),
        isActive: true,
        isPublic: true,
      },
      {
        schemeName: 'Special Attendance Allowance for CWSN Disabled Students',
        marathiName: 'दिव्यांग विद्यार्थी दैनिक उपस्थिती भत्ता योजना',
        code: 'CWSN-ATT-03',
        category: 'CWSN / Disability',
        description: 'Inclusive education daily allowance under Samagra Shiksha for children with special needs having benchmark disability of 40% or more.',
        marathiDescription: 'समग्र शिक्षा अभियानांतर्गत ४०% किंवा त्याहून अधिक दिव्यांगत्व असणाऱ्या विशेष गरजा असणाऱ्या (CWSN) बालकांना शाळेत नियमित येण्यासाठी दैनिक उपस्थिती भत्ता व विशेष साधने.',
        applicableGrades: 'इयत्ता १ ली ते ७ वी (Classes 1 to 7)',
        applicableStandards: [
          'इयत्ता १ ली',
          'इयत्ता २ री',
          'इयत्ता ३ री',
          'इयत्ता ४ थी',
          'इयत्ता ५ वी',
          'इयत्ता ६ वी',
          'इयत्ता ७ वी',
        ],
        beneficiaryGroup: '४०% किंवा त्याहून अधिक दिव्यांगत्व असलेले सर्व विशेष गरजा असणारे (CWSN) विद्यार्थी',
        applicableCategories: ['ALL'],
        incomeLimit: 0, // No income ceiling for disabled attendance grant
        genderRequirement: 'ALL' as const,
        minorityRequirement: 'ALL' as const,
        cwsnRequirement: 'CWSN_ONLY' as const,
        bplRequirement: 'ALL' as const,
        benefitAmount: '₹150/- प्रति महिना उपस्थिती भत्ता + मोफत शैक्षणिक व गतिशीलता साधने',
        eligibilityCriteria: [
          'जिल्हा शल्यचिकित्सक (सिव्हिल सर्जन) यांचे ४०% पेक्षा अधिकचे UDID दिव्यांगत्व प्रमाणपत्र',
          'शाळेत नियमित उपस्थिती असणे आवश्यक',
          'समग्र शिक्षा अभियानांतर्गत समावेशित शिक्षण योजनेचा लाभ',
        ],
        requiredDocuments: [
          'वैद्यकीय मंडळाचे दिव्यांग प्रमाणपत्र (UDID कार्ड)',
          'विद्यार्थ्याचे आधार कार्ड',
          'बँक खाते पासबुक',
          '२ पासपोर्ट आकाराचे फोटो',
        ],
        applicationSteps: 'विशेष शिक्षक (Special Educator) यांच्या मार्गदर्शनाखाली शाळेमार्फत समग्र शिक्षा अभियानाकडे प्रस्ताव पाठवला जातो.',
        officialUrl: 'https://samagrashiksha.maharashtra.gov.in/',
        academicYear: '2026-27',
        applicationStartDate: new Date('2026-06-15'),
        applicationEndDate: new Date('2026-12-31'),
        isActive: true,
        isPublic: true,
      },
      {
        schemeName: 'Pre-Matric Scholarship for Children of Cleanliness Workers',
        marathiName: 'स्वच्छता कामगारांच्या पाल्यांसाठी पूर्व माध्यमिक शिष्यवृत्ती',
        code: 'PMC-SCH-04',
        category: 'Cleanliness Workers / Sanitation',
        description: 'Central sector scheme for providing financial assistance to children whose parents are engaged in unclean and health hazard occupations.',
        marathiDescription: 'स्थानिक स्वराज्य संस्था, ग्रामपंचायत किंवा शासकीय संस्थांमध्ये स्वच्छता व सफाई क्षेत्रात कार्यरत कामगारांच्या पाल्यांसाठी केंद्र शासन पुरस्कृत विशेष पूर्व माध्यमिक शिष्यवृत्ती.',
        applicableGrades: 'इयत्ता १ ली ते ७ वी (Classes 1 to 7)',
        applicableStandards: [
          'इयत्ता १ ली',
          'इयत्ता २ री',
          'इयत्ता ३ री',
          'इयत्ता ४ थी',
          'इयत्ता ५ वी',
          'इयत्ता ६ वी',
          'इयत्ता ७ वी',
        ],
        beneficiaryGroup: 'अस्वच्छ व स्वच्छता व्यवसायात काम करणाऱ्या पालकांची सर्व मुले व मुली (प्रवर्ग बंधन नाही)',
        applicableCategories: ['ALL'],
        incomeLimit: 0, // Central guideline: No income limit
        genderRequirement: 'ALL' as const,
        minorityRequirement: 'ALL' as const,
        cwsnRequirement: 'ALL' as const,
        bplRequirement: 'ALL' as const,
        occupationKeyword: 'स्वच्छता',
        benefitAmount: '₹3,000/- प्रति वर्ष शिष्यवृत्ती व पुस्तक अनुदान',
        eligibilityCriteria: [
          'पालक स्थानिक स्वराज्य संस्था किंवा ग्रामपंचायतीत स्वच्छता कामगार असणे आवश्यक',
          'कोणतीही जात अथवा उत्पन्नाची मर्यादा लागू नाही',
          'विद्यार्थी शाळेत नियमित उपस्थित असणे आवश्यक',
        ],
        requiredDocuments: [
          'पालकांचे ग्रामपंचायत/नगरपालिका सेवा प्रमाणपत्र (स्वच्छता कामगार)',
          'विद्यार्थ्याचे आधार कार्ड व बँक पासबुक',
          'शाळा प्रवेशाचा पुरावा',
        ],
        applicationSteps: 'मुख्याध्यापकांमार्फत जिल्हा समाज कल्याण अधिकारी कार्यालयाकडे ऑनलाइन प्रस्ताव सादर केला जातो.',
        officialUrl: 'https://sjsa.maharashtra.gov.in/',
        academicYear: '2026-27',
        applicationStartDate: new Date('2026-07-01'),
        applicationEndDate: new Date('2026-11-30'),
        isActive: true,
        isPublic: true,
      },
      {
        schemeName: 'State Minority Pre-Matric Scholarship Scheme',
        marathiName: 'धार्मिक अल्पसंख्याक पूर्व माध्यमिक शिष्यवृत्ती योजना',
        code: 'MIN-SCH-05',
        category: 'Minority Welfare',
        description: 'State government scholarship for registered religious minority students (Muslim, Buddhist, Christian, Jain, Sikh, Parsi) with family income under ₹1 Lakh.',
        marathiDescription: 'अल्पसंख्याक विकास विभाग, महाराष्ट्र शासन यांच्यामार्फत धार्मिक अल्पसंख्याक समाजातील (मुस्लिम, बौद्ध, ख्रिश्चन, जैन, शीख) गुणवंत व गरजू प्राथमिक विद्यार्थ्यांसाठी पूर्व माध्यमिक शिष्यवृत्ती.',
        applicableGrades: 'इयत्ता १ ली ते ७ वी (Classes 1 to 7)',
        applicableStandards: [
          'इयत्ता १ ली',
          'इयत्ता २ री',
          'इयत्ता ३ री',
          'इयत्ता ४ थी',
          'इयत्ता ५ वी',
          'इयत्ता ६ वी',
          'इयत्ता ७ वी',
        ],
        beneficiaryGroup: 'धार्मिक अल्पसंख्याक प्रवर्गातील मुले व मुली (वार्षिक उत्पन्न मर्यादा ₹१ लाख)',
        applicableCategories: ['ALL'],
        incomeLimit: 100000,
        genderRequirement: 'ALL' as const,
        minorityRequirement: 'ANY_MINORITY' as const,
        cwsnRequirement: 'ALL' as const,
        bplRequirement: 'ALL' as const,
        benefitAmount: '₹1,500/- प्रति वर्ष शिष्यवृत्ती व शैक्षणिक साहाय्य',
        eligibilityCriteria: [
          'विद्यार्थी अधिकृत अधिसूचित धार्मिक अल्पसंख्याक समाजातील असणे आवश्यक',
          'पालकांचे सर्व मार्गांनी मिळणारे वार्षिक उत्पन्न ₹१,००,०००/- पेक्षा कमी असावे',
          'मागील वार्षिक परीक्षेत किमान ५०% गुण व ७५% शालेय उपस्थिती',
        ],
        requiredDocuments: [
          'अल्पसंख्याक समाजाचे स्वयंघोषणापत्र / सक्षम दाखला',
          'पालकांचा तहसीलदारांचा उत्पन्नाचा वैध दाखला',
          'विद्यार्थ्याचे आधार कार्ड व बँक खाते पासबुक',
          'मागील वर्षाची गुणपत्रिका',
        ],
        applicationSteps: 'महाडीबीटी (MahaDBT) पोर्टलवर अल्पसंख्याक शिष्यवृत्ती विभागांतर्गत मुख्याध्यापकांमार्फत ऑनलाइन अर्ज सादर केला जातो.',
        officialUrl: 'https://mdd.maharashtra.gov.in/',
        academicYear: '2026-27',
        applicationStartDate: new Date('2026-07-15'),
        applicationEndDate: new Date('2026-12-15'),
        isActive: true,
        isPublic: true,
      },
    ];

    for (const s of scholarships) {
      await Scholarship.create(s);
    }
    console.log(`[Seed] Seeded ${scholarships.length} official government scholarship schemes.`);

    // 3. Event Gallery Albums using actual imgs/ files
    const albums = [
      {
        title: '2025 Navratri & Rangoli Celebration',
        marathiTitle: '२०२५ नवरात्रोत्सव व हस्तकला रांगोळी स्पर्धा',
        category: '2025 Navratri',
        year: '2025',
        description: 'पारंपरिक सण, विद्यार्थिनींनी रेखाटलेल्या सुंदर रांगोळ्या, हस्तकौशल्याचे प्रदर्शन आणि सामाजिक एकात्मता.',
        coverImage: '/imgs/rangoli_comp.jpg',
        images: [
          { src: '/imgs/rangoli_comp.jpg', caption: 'Vibrant Traditional Rangoli Competition', marathiCaption: 'वार्षिक रांगोळी स्पर्धेत विद्यार्थिनींची कलाकृती' },
          { src: '/imgs/lamp_making_comp.jpg', caption: 'Diwali Kandil & Eco-Craft Workshop', marathiCaption: 'पर्यावरणपूरक आकाशकंदील व हस्तकला कार्यशाळा' },
          { src: '/imgs/rakshabandhan.jpg', caption: 'Rakshabandhan Social Unity Celebration', marathiCaption: 'रक्षाबंधन सण व सामाजिक सलोखा उपक्रम' },
          { src: '/imgs/rakshabandhan2.jpg', caption: 'Vruksha Bandhan - Pledging Nature Care', marathiCaption: 'वृक्षबंधन - निसर्ग व वृक्ष संरक्षणाची प्रतिज्ञा' },
          { src: '/imgs/rakshabandhan5.jpg', caption: 'Handmade Eco-Rakhis Display', marathiCaption: 'विद्यार्थ्यांनी तयार केलेल्या हस्तनिर्मित राख्या' },
        ],
      },
      {
        title: '2026 Sports Day & Athletic Meet',
        marathiTitle: '२०२६ वार्षिक क्रीडा महोत्सव व स्पर्धा',
        category: '2026 Sports Day',
        year: '2026',
        description: 'विस्तीर्ण खेळाच्या मैदानावर कबड्डी, खो-खो, धावणे व मैदानी खेळांची जल्लोषात संपन्न झालेली क्रीडा स्पर्धा.',
        coverImage: '/imgs/playground.jpg',
        images: [
          { src: '/imgs/playground.jpg', caption: 'Spacious Open Sports Ground & Field', marathiCaption: 'शाळेचे १.२ एकर भव्य क्रीडांगण व विद्यार्थी सराव' },
          { src: '/imgs/prize_distribution.jpg', caption: 'Merit & Sports Prize Distribution', marathiCaption: 'क्रीडा स्पर्धेतील विजेत्या विद्यार्थ्यांचा गौरव' },
          { src: '/imgs/activity.jpg', caption: 'Active Outdoor Skill Games', marathiCaption: 'आनंददायी शारीरिक शिक्षण व मैदानी खेळ' },
          { src: '/imgs/activity4.jpg', caption: 'Student Enthusiasm & Teamwork', marathiCaption: 'सांघिक खेळ व विद्यार्थ्यांचा उत्साह' },
        ],
      },
      {
        title: 'Annual Day & Sneha Melava Gathering',
        marathiTitle: 'वार्षिक स्नेहसंमेलन, पालक मेळावा व सांस्कृतिक सोहळा',
        category: 'Annual Day',
        year: '2025',
        description: 'पालक, ग्रामस्थ आणि शाळा व्यवस्थापन समितीच्या उपस्थितीत पार पडलेला भव्य वार्षिक स्नेह मेळावा.',
        coverImage: '/imgs/melava.jpg',
        images: [
          { src: '/imgs/melava.jpg', caption: 'Parents & Community Gathering (Sneha Melava)', marathiCaption: 'पालक मेळावा व शाळा व्यवस्थापन समिती सभा' },
          { src: '/imgs/activity2.jpg', caption: 'Student Group Performance & Recitation', marathiCaption: 'सांस्कृतिक सादरीकरण व समूह वाचन' },
          { src: '/imgs/activity3.jpg', caption: 'Creative Classroom Charts & Artworks', marathiCaption: 'विद्यार्थी भित्तीपत्रिका व हस्तकला प्रदर्शन' },
          { src: '/imgs/rakshabandhan3.jpg', caption: 'Fellowship & Sweet Distribution', marathiCaption: 'गोडधोड वाटप व स्नेहभोजन सोहळा' },
        ],
      },
      {
        title: 'Tree Plantation & Green Campus Drive',
        marathiTitle: 'माझी शाळा, हरित शाळा - वृक्षारोपण मोहीम',
        category: 'Environment',
        year: '2025',
        description: 'शाळा परिसरात १००+ देशी वृक्षांची लागवड व संगोपनाचा अनोखा हरित उपक्रम.',
        coverImage: '/imgs/plantation1.jpg',
        images: [
          { src: '/imgs/plantation1.jpg', caption: 'Planting Indigenous Neem & Banyan Saplings', marathiCaption: 'कडुलिंब व वड रोपांची खड्डे करून लागवड' },
          { src: '/imgs/plantation2.jpg', caption: 'Active Student Participation in Tree Beds', marathiCaption: 'विद्यार्थी व शिक्षकांचा वृक्षारोपणात सहभाग' },
          { src: '/imgs/plantation3.jpg', caption: 'Community Support & Village Participation', marathiCaption: 'ग्रामस्थांच्या उपस्थितीत हरित संकल्प' },
          { src: '/imgs/plantation4.jpg', caption: 'Nurturing & Daily Watering Routine', marathiCaption: 'रोपांना नियमित पाणी घालण्याची सवय' },
          { src: '/imgs/plantation5.jpg', caption: 'Herbal Garden & Floral Boundary', marathiCaption: 'औषधी वनस्पती व फुलझाडांचे संगोपन' },
          { src: '/imgs/plantation6.jpg', caption: 'Tree Adoption Pledge by Pupils', marathiCaption: 'प्रत्येक विद्यार्थ्याने दत्तक घेतले झाड' },
        ],
      },
      {
        title: 'Swachh Bharat - Swachh Vidyalaya Drive',
        marathiTitle: 'स्वच्छ भारत, सुंदर शाळा - स्वच्छता व श्रमदान',
        category: 'Cleanliness',
        year: '2025',
        description: 'स्वच्छता मॉनिटरिंग, वर्गखोल्यांचे निर्जंतुकीकरण, आणि ५ स्टार स्वच्छ शाळा मानांकन.',
        coverImage: '/imgs/cleaning.jpg',
        images: [
          { src: '/imgs/cleaning.jpg', caption: 'Floor Sanitization & Shramdaan', marathiCaption: 'वर्गखोली स्वच्छता व मुलांचे श्रमदान' },
          { src: '/imgs/cleaning2.jpg', caption: 'Plastic-Free Courtyard Maintenance', marathiCaption: 'प्लास्टिकमुक्त शाळा परिसर मोहीम' },
          { src: '/imgs/cleaning3.jpg', caption: 'Clean School Grounds & Dustless Yard', marathiCaption: 'धुळीपासून मुक्त स्वच्छ मैदान' },
        ],
      },
      {
        title: 'Health Camps & Student Welfare',
        marathiTitle: 'आरोग्य तपासणी, पाठ्यपुस्तके व शैक्षणिक सहल',
        category: 'Welfare',
        year: '2026',
        description: 'मोफत आरोग्य तपासणी, पाठ्यपुस्तक वाटप, मध्यान्ह भोजन व अभ्यास सहल.',
        coverImage: '/imgs/health_checkup.jpg',
        images: [
          { src: '/imgs/health_checkup.jpg', caption: 'Doctor Examination & Health Checkup Camp', marathiCaption: 'प्राथमिक आरोग्य केंद्रामार्फत वैद्यकीय तपासणी' },
          { src: '/imgs/books.jpg', caption: 'Free Government Textbooks Distribution', marathiCaption: '१००% मोफत बालभारती पाठ्यपुस्तके वाटप' },
          { src: '/imgs/resource_distribution.jpg', caption: 'School Uniforms & Learning Kits Aid', marathiCaption: 'मोफत गणवेश व दप्तर किट वाटप' },
          { src: '/imgs/mdm.jpg', caption: 'Hygienic Fresh Mid-Day Meal (PM POSHAN)', marathiCaption: 'गरम व ताजी पौष्टिक खिचडी वाटप' },
          { src: '/imgs/trip.jpg', caption: 'Educational Field Study Excursion', marathiCaption: 'विद्यार्थ्यांची निसर्ग व शैक्षणिक सहल' },
          { src: '/imgs/complent_box.jpg', caption: 'Suggestion & Grievance Redressal Box', marathiCaption: 'विद्यार्थी तक्रार व सूचना पेटी' },
        ],
      },
    ];

    for (const a of albums) {
      await GalleryAlbum.create(a);
    }
    console.log(`[Seed] Seeded ${albums.length} gallery event albums.`);

    // 4. Official Notices
    const notices = [
      {
        title: 'शैक्षणिक सत्र २०२६-२७ नवीन प्रवेश प्रक्रिया सुरू (Admissions Open 2026-27)',
        content: 'नवीन शैक्षणिक सत्राकरिता इयत्ता १ ली ते ७ वी मधील सर्व विद्यार्थ्यांसाठी मोफत प्रवेश प्रक्रिया सुरू झाली आहे. आवश्यक कागदपत्रे: जन्म दाखला, आधार कार्ड, बँक खाते पासबुक झेरॉक्स. पालकांनी त्वरित ऑनलाइन अर्ज करावा किंवा शाळेत संपर्क साधावा.',
        category: 'ACADEMIC',
        date: new Date('2026-06-15'),
        isImportant: true,
        publishedBy: 'Headmaster Office',
      },
      {
        title: 'माझी शाळा, हरित शाळा - वृक्षारोपण मोहीम व पालक मेळावा',
        content: 'शाळा परिसरात १०० देशी वृक्षांची लागवड करण्यात येत आहे. सर्व सन्माननीय पालक, शाळा व्यवस्थापन समिती (SMC) सदस्य व ग्रामस्थांनी सकाळी १०:०० वाजता उपस्थित राहावे.',
        category: 'EVENT',
        date: new Date('2026-07-20'),
        isImportant: true,
        publishedBy: 'Eco Club & SMC',
      },
      {
        title: 'वार्षिक आरोग्य तपासणी शिबिर संपन्न (Annual Health & Dental Camp)',
        content: 'प्राथमिक आरोग्य केंद्र हिंगोणे यांच्या सहकार्याने सर्व १४८ विद्यार्थ्यांची आरोग्य तपासणी, हिमोग्लोबिन चाचणी व औषध वाटप यशस्वीरीत्या पूर्ण झाले.',
        category: 'GENERAL',
        date: new Date('2026-08-10'),
        isImportant: false,
        publishedBy: 'Health Coordinator',
      },
      {
        title: 'दिवाळी आकाशकंदील व रांगोळी स्पर्धा पारितोषिक वितरण',
        content: 'विद्यार्थ्यांच्या हस्तकला व सुप्त कलागुणांना वाव देण्यासाठी आयोजित करण्यात आलेल्या रांगोळी व आकाशकंदील स्पर्धेतील विजेत्या विद्यार्थ्यांना गौरविण्यात आले.',
        category: 'EVENT',
        date: new Date('2026-10-12'),
        isImportant: false,
        publishedBy: 'Cultural Committee',
      },
      {
        title: 'शालेय पोषण आहार (MDM) दरमहा धान्य वाटप व गुणवत्ता तपासणी',
        content: 'शाळेत दररोज सर्व १४८ विद्यार्थ्यांना गरम व ताजी मूगडाळ खिचडी, उकडलेली अंडी आणि मोड आलेली कडधान्ये दिली जातात. अन्न पोषण मूल्ये व स्वयंपाकगृहाची स्वच्छता प्रमाणित आहे.',
        category: 'GENERAL',
        date: new Date('2026-10-15'),
        isImportant: false,
        publishedBy: 'MDM In-charge',
      },
    ];

    for (const n of notices) {
      await Notice.create(n);
    }
    console.log(`[Seed] Seeded ${notices.length} notices.`);

    // 5. Initial Admission Applications
    const sampleApps = [
      {
        applicationNo: 'ADM-2026-0001',
        studentName: 'पाटील आरव गणेश',
        gender: 'Male',
        dateOfBirth: new Date('2020-04-12'),
        gradeApplying: 'इयत्ता १ ली',
        parentName: 'गणेश तुकाराम पाटील',
        parentPhone: '9823412345',
        parentEmail: 'ganesh.patil@gmail.com',
        residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव',
        previousSchool: 'अंगणवाडी हिंगोणे बु.',
        status: 'Pending',
        appliedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        applicationNo: 'ADM-2026-0002',
        studentName: 'पाटील आरव संतोष',
        gender: 'Male',
        dateOfBirth: new Date('2019-06-15'),
        gradeApplying: 'इयत्ता १ ली',
        parentName: 'संतोष रमेश पाटील',
        parentPhone: '9876543210',
        parentEmail: 'santosh.patil@gmail.com',
        residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव',
        previousSchool: 'अंगणवाडी हिंगोणे बु.',
        status: 'Pending',
        appliedAt: new Date(),
      },
    ];
    for (const app of sampleApps) {
      await AdmissionApplication.create(app);
    }
    console.log(`[Seed] Seeded ${sampleApps.length} admission applications.`);

    // 6. Generate Exactly 148 Realistic Students for Classes 1 to 7
    const classConfigs = [
      { name: 'इयत्ता १ ली', boys: 11, girls: 11, birthYear: 2020 },
      { name: 'इयत्ता २ री', boys: 10, girls: 10, birthYear: 2019 },
      { name: 'इयत्ता ३ री', boys: 13, girls: 11, birthYear: 2018 },
      { name: 'इयत्ता ४ थी', boys: 11, girls: 11, birthYear: 2017 },
      { name: 'इयत्ता ५ वी', boys: 10, girls: 10, birthYear: 2016 },
      { name: 'इयत्ता ६ वी', boys: 10, girls: 10, birthYear: 2015 },
      { name: 'इयत्ता ७ वी', boys: 10, girls: 10, birthYear: 2014 },
    ];

    const boyNames = ['वेदांत', 'आरव', 'ओंकार', 'प्रणव', 'सार्थक', 'अथर्व', 'यश', 'समर्थ', 'हर्षल', 'जयेश', 'मयूर', 'रोहित', 'भावेश', 'गौरव', 'रोहन', 'निलेश', 'तेजस', 'ऋषिकेश', 'कृष्णा', 'दर्शन', 'आदित्य', 'चेतन', 'स्वप्निल'];
    const girlNames = ['समृद्धी', 'तन्वी', 'मयुरी', 'अनुष्का', 'श्रावणी', 'प्रांजल', 'वैभवी', 'साक्षी', 'आर्या', 'दिशा', 'स्नेहा', 'अक्षरा', 'पूजा', 'हर्षदा', 'रुपाली', 'प्रतीक्षा', 'तेजस्विनी', 'गायत्री', 'पल्लवी', 'श्वेता', 'भाग्यश्री'];
    const fatherNames = ['सचिन', 'राहुल', 'गणेश', 'प्रवीण', 'संदीप', 'विजय', 'ज्ञानेश्वर', 'कैलास', 'दीपक', 'संजय', 'संतोष', 'तुकाराम', 'नामदेव', 'रवींद्र', 'महेंद्र', 'प्रकाश', 'अनिल', 'सुनील'];
    const surnames = ['पाटील', 'शिंदे', 'पवार', 'भदाणे', 'सोनवणे', 'चौधरी', 'राजपूत', 'कोळी', 'वाणी', 'महाजन', 'गवळी', 'बोरसे', 'अहिरे', 'मोरे'];
    const categories = ['OBC', 'OBC', 'OBC', 'ST', 'SC', 'General', 'NT'] as const;

    let grCounter = 1350;
    const studentDocs = [];

    for (const conf of classConfigs) {
      // Boys
      for (let i = 0; i < conf.boys; i++) {
        grCounter++;
        const sName = surnames[(grCounter + i) % surnames.length];
        const fName = fatherNames[(grCounter + i * 2) % fatherNames.length];
        const bName = boyNames[(grCounter + i * 3) % boyNames.length];
        const fullName = `${sName} ${bName} ${fName}`;
        const cat = categories[(grCounter + i) % categories.length];
        const att = 92 + ((grCounter + i) % 7); // 92% to 98%
        const isScholar = (conf.name.includes('५') || conf.name.includes('६') || conf.name.includes('७')) && (cat === 'ST' || cat === 'SC');

        const bpl = (cat === 'ST' || cat === 'SC' || (i % 5 === 0));
        const pen = `2026${conf.birthYear}${((i % 89) + 10).toString().padStart(3, '0')}`;
        const saral = `27030804501-${conf.birthYear}-${grCounter}`;
        const div = i % 2 === 0 ? 'A' : 'B';
        const aadh = `98${Math.floor(1000000000 + Math.random() * 9000000000)}`;

        studentDocs.push({
          grNumber: `${grCounter}`,
          name: fullName,
          aadhaarNumber: aadh,
          dateOfBirth: new Date(`${conf.birthYear}-${((i % 12) + 1).toString().padStart(2, '0')}-${((i % 27) + 1).toString().padStart(2, '0')}`),
          gender: 'मुलगा' as const,
          motherTongue: 'मराठी',
          religion: (cat === 'SC' && (i % 2 === 0)) ? 'बौद्ध' : 'हिंदू',
          caste: cat === 'OBC' ? 'लेवा पाटील' : (cat === 'ST' ? 'भिल्ल' : (cat === 'SC' ? 'नवबौद्ध' : 'मराठा')),
          category: cat,
          bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4],
          fatherName: `${fName} ${sName}`,
          motherName: `${['सुनिता', 'मनिषा', 'सुवर्णा', 'अनिता', 'रेखा', 'संगीता'][i % 6]} ${sName}`,
          guardianName: `${fName} ${sName}`,
          parentsOccupation: i % 3 === 0 ? 'शेतकरी' : (i % 3 === 1 ? 'शेतमजूर' : 'व्यवसाय / सेवा'),
          annualFamilyIncome: 35000 + ((i * 1450) % 40000),
          isBpl: bpl,
          bplNumber: bpl ? `BPL-2026-${1000 + i}` : '',
          minorityStatus: (cat === 'SC' && (i % 2 === 0)) ? 'Religious Minority' : 'None',
          houseNumber: `घर क्र. ${((i % 35) + 1)}`,
          village: 'हिंगोणे बु.',
          taluka: 'धरणगाव',
          district: 'जळगाव',
          pincode: '425105',
          primaryPhone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          secondaryPhone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
          residentialAddress: `घर क्र. ${((i % 35) + 1)}, मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५`,
          saralId: saral,
          penNumber: pen,
          admissionDate: new Date(`${conf.birthYear + 6}-06-15`),
          studentType: 'Fresher' as const,
          entryStandard: 'इयत्ता १ ली',
          currentStandard: conf.name,
          classGrade: conf.name,
          division: div as 'A' | 'B',
          mediumOfInstruction: 'मराठी' as const,
          previousYearMarks: 75 + (i % 23),
          attendancePercentage: att,
          scholarshipScheme: isScholar ? 'सुवर्णमहोत्सवी आदिवासी पूर्व माध्यमिक शिष्यवृत्ती' : '',
          bankAccountHolder: fullName,
          bankName: 'बँक ऑफ महाराष्ट्र (Bank of Maharashtra)',
          bankAccountNumber: `6034${Math.floor(1000000 + Math.random() * 9000000)}`,
          bankIfsc: 'MAHB0000412',
          isCwsn: (i === 4 && conf.name.includes('२')),
          cwsnDisabilityType: (i === 4 && conf.name.includes('२')) ? 'Locomotor (अस्थिव्यंग)' : 'None',
          heightCm: 112 + (2020 - conf.birthYear) * 4,
          weightKg: 19 + (2020 - conf.birthYear) * 2,
          isActive: true,
          admissionYear: '2026-27',
        });
      }

      // Girls
      for (let j = 0; j < conf.girls; j++) {
        grCounter++;
        const sName = surnames[(grCounter + j) % surnames.length];
        const fName = fatherNames[(grCounter + j * 2) % fatherNames.length];
        const gName = girlNames[(grCounter + j * 3) % girlNames.length];
        const fullName = `${sName} ${gName} ${fName}`;
        const cat = categories[(grCounter + j) % categories.length];
        const att = 93 + ((grCounter + j) % 6); // 93% to 98%
        const isSavitri = (conf.name.includes('५') || conf.name.includes('६') || conf.name.includes('७'));
        const bpl = (cat === 'ST' || cat === 'SC' || (j % 5 === 0));
        const pen = `2026${conf.birthYear}${((j % 89) + 50).toString().padStart(3, '0')}`;
        const saral = `27030804501-${conf.birthYear}-${grCounter}`;
        const div = j % 2 === 0 ? 'A' : 'B';
        const aadh = `98${Math.floor(1000000000 + Math.random() * 9000000000)}`;

        studentDocs.push({
          grNumber: `${grCounter}`,
          name: fullName,
          aadhaarNumber: aadh,
          dateOfBirth: new Date(`${conf.birthYear}-${((j % 12) + 1).toString().padStart(2, '0')}-${((j % 27) + 1).toString().padStart(2, '0')}`),
          gender: 'मुलगी' as const,
          motherTongue: 'मराठी',
          religion: (cat === 'SC' && (j % 2 === 0)) ? 'बौद्ध' : 'हिंदू',
          caste: cat === 'OBC' ? 'लेवा पाटील' : (cat === 'ST' ? 'भिल्ल' : (cat === 'SC' ? 'नवबौद्ध' : 'मराठा')),
          category: cat,
          bloodGroup: ['A+', 'B+', 'O+', 'AB+'][j % 4],
          fatherName: `${fName} ${sName}`,
          motherName: `${['सुनिता', 'मनिषा', 'सुवर्णा', 'अनिता', 'रेखा', 'संगीता'][j % 6]} ${sName}`,
          guardianName: `${fName} ${sName}`,
          parentsOccupation: j % 3 === 0 ? 'शेतकरी' : (j % 3 === 1 ? 'शेतमजूर' : 'व्यवसाय / सेवा'),
          annualFamilyIncome: 35000 + ((j * 1450) % 40000),
          isBpl: bpl,
          bplNumber: bpl ? `BPL-2026-${2000 + j}` : '',
          minorityStatus: (cat === 'SC' && (j % 2 === 0)) ? 'Religious Minority' : 'None',
          houseNumber: `घर क्र. ${((j % 35) + 1)}`,
          village: 'हिंगोणे बु.',
          taluka: 'धरणगाव',
          district: 'जळगाव',
          pincode: '425105',
          primaryPhone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
          secondaryPhone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
          residentialAddress: `घर क्र. ${((j % 35) + 1)}, मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव - ४२५१०५`,
          saralId: saral,
          penNumber: pen,
          admissionDate: new Date(`${conf.birthYear + 6}-06-15`),
          studentType: 'Fresher' as const,
          entryStandard: 'इयत्ता १ ली',
          currentStandard: conf.name,
          classGrade: conf.name,
          division: div as 'A' | 'B',
          mediumOfInstruction: 'मराठी' as const,
          previousYearMarks: 76 + (j % 23),
          attendancePercentage: att,
          scholarshipScheme: isSavitri ? 'सावित्रीबाई फुले शिष्यवृत्ती योजना' : '',
          bankAccountHolder: fullName,
          bankName: 'बँक ऑफ महाराष्ट्र (Bank of Maharashtra)',
          bankAccountNumber: `6034${Math.floor(1000000 + Math.random() * 9000000)}`,
          bankIfsc: 'MAHB0000412',
          isCwsn: false,
          cwsnDisabilityType: 'None',
          heightCm: 110 + (2020 - conf.birthYear) * 4,
          weightKg: 18 + (2020 - conf.birthYear) * 2,
          isActive: true,
          admissionYear: '2026-27',
        });
      }
    }

    await Student.insertMany(studentDocs);
    console.log(`[Seed] Seeded exactly ${studentDocs.length} real students across Classes 1 to 7 with full SARAL & bank details.`);

    // 7. Seed Finances & Grants
    const finances = [
      // Funds Received
      {
        type: 'fund_received' as const,
        fundId: 'FND-2026-001',
        schemeType: 'School Maintenance & Development Grant',
        title: 'शाळा व्यवस्थापन व देखभाल अनुदान (School Maintenance Grant)',
        category: 'School Grant' as const,
        amount: 150000,
        issuedBy: 'Zilla Parishad Jalgaon - Education Department',
        issueDate: new Date('2026-06-10'),
        expiryDate: new Date('2027-03-31'),
        utilizedAmount: 26500,
        date: new Date('2026-06-10'),
        voucherNo: 'CR-2026-01',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Active' as const,
        notes: 'जिल्हा परिषद जळगाव वार्षिक प्राथमिक शाळा अनुदान',
      },
      {
        type: 'fund_received' as const,
        fundId: 'FND-2026-002',
        schemeType: 'PM-POSHAN (Mid-Day Meal) Grant',
        title: 'मध्यान्ह भोजन पोषण आहार निधी (PM POSHAN MDM Allocation)',
        category: 'MDM Grant' as const,
        amount: 280000,
        issuedBy: 'Directorate of Primary Education, Maharashtra',
        issueDate: new Date('2026-07-01'),
        expiryDate: new Date('2026-12-31'),
        utilizedAmount: 185400,
        date: new Date('2026-07-01'),
        voucherNo: 'CR-2026-02',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Active' as const,
        notes: 'सत्र १ करिता धान्य व स्वयंपाकी मानधन निधी',
      },
      {
        type: 'fund_received' as const,
        fundId: 'FND-2026-003',
        schemeType: 'Samagra Shiksha - Composite School Grant',
        title: 'समग्र शिक्षा समग्र शाळा अनुदान (Composite School Grant)',
        category: 'Composite School Grant' as const,
        amount: 50000,
        issuedBy: 'Samagra Shiksha State Project Office, Maharashtra',
        issueDate: new Date('2026-08-15'),
        expiryDate: new Date('2027-03-31'),
        utilizedAmount: 15300,
        date: new Date('2026-08-15'),
        voucherNo: 'CR-2026-03',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Active' as const,
        notes: 'डिजिटल साहित्य व प्रयोगशाळा संवर्धन',
      },
      {
        type: 'fund_received' as const,
        fundId: 'FND-2026-004',
        schemeType: 'Sports & Physical Education Grant',
        title: 'क्रीडा व शारीरिक शिक्षण साहित्य निधी (Sports & PE Grant)',
        category: 'Sports Grant' as const,
        amount: 15000,
        issuedBy: 'District Sports Office & ZP Jalgaon',
        issueDate: new Date('2026-09-05'),
        expiryDate: new Date('2027-02-28'),
        utilizedAmount: 9200,
        date: new Date('2026-09-05'),
        voucherNo: 'CR-2026-04',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Active' as const,
        notes: 'मैदानी खेळ व क्रीडा स्पर्धा निधी',
      },
      // Expenses
      {
        type: 'expense' as const,
        purpose: 'शालेय रंगकाम व स्वच्छता साहित्य खरेदी',
        title: 'शालेय रंगकाम व स्वच्छता साहित्य खरेदी',
        billNumber: 'INV-2026-101',
        vendorName: 'पाटील हार्डवेअर व पेंट्स, धरणगाव',
        category: 'Maintenance & Repairs' as const,
        amount: 14500,
        billDate: new Date('2026-07-18'),
        associatedFundId: 'FND-2026-001',
        associatedFundScheme: 'School Maintenance & Development Grant',
        date: new Date('2026-07-18'),
        voucherNo: 'EXP-2026-01',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Approved' as const,
        notes: 'वर्गखोल्या रंगरंगोटी व निर्जंतुकीकरण साहित्य',
      },
      {
        type: 'expense' as const,
        purpose: 'डिजिटल क्लासरूम स्क्रीन दुरुस्ती, केबल्स व वायफाय राउटर',
        title: 'डिजिटल क्लासरूम स्क्रीन दुरुस्ती, केबल्स व वायफाय राउटर',
        billNumber: 'INV-2026-204',
        vendorName: 'साई कॉम्प्युटर्स व इलेक्ट्रॉनिक्स, जळगाव',
        category: 'Digital Infrastructure' as const,
        amount: 6800,
        billDate: new Date('2026-08-22'),
        associatedFundId: 'FND-2026-003',
        associatedFundScheme: 'Samagra Shiksha - Composite School Grant',
        date: new Date('2026-08-22'),
        voucherNo: 'EXP-2026-02',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Approved' as const,
        notes: 'स्मार्ट टीव्ही HDMI केबल व इन्व्हर्टर बॅटरी चेकअप',
      },
      {
        type: 'expense' as const,
        purpose: 'क्रीडा साहित्य, खो-खो खांब व चेंडू खरेदी',
        title: 'क्रीडा साहित्य, खो-खो खांब व चेंडू खरेदी',
        billNumber: 'BILL-SP-89',
        vendorName: 'महावीर स्पोर्ट्स, धरणगाव',
        category: 'Sports Equipment' as const,
        amount: 9200,
        billDate: new Date('2026-09-12'),
        associatedFundId: 'FND-2026-004',
        associatedFundScheme: 'Sports & Physical Education Grant',
        date: new Date('2026-09-12'),
        voucherNo: 'EXP-2026-03',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Approved' as const,
        notes: 'क्रीडा महोत्सव २०२६ सराव साहित्य',
      },
      {
        type: 'expense' as const,
        purpose: 'मध्यान्ह भोजन डाळी, तेल, मसाले व भाजीपाला देयक',
        title: 'मध्यान्ह भोजन डाळी, तेल, मसाले व भाजीपाला देयक',
        billNumber: 'MDM-INV-301',
        vendorName: 'हिंगोणे विविध कार्यकारी सहकारी सोसायटी',
        category: 'Mid-Day Meal Utilities' as const,
        amount: 185400,
        billDate: new Date('2026-09-30'),
        associatedFundId: 'FND-2026-002',
        associatedFundScheme: 'PM-POSHAN (Mid-Day Meal) Grant',
        date: new Date('2026-09-30'),
        voucherNo: 'EXP-2026-04',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Approved' as const,
        notes: 'सर्व १४८ विद्यार्थ्यांचे ३ महिन्यांचे ताजे धान्य देयक',
      },
      {
        type: 'expense' as const,
        purpose: 'शैक्षणिक तक्ते, नकाशे व परीक्षा स्टेशनरी खरेदी',
        title: 'शैक्षणिक तक्ते, नकाशे व परीक्षा स्टेशनरी खरेदी',
        billNumber: 'STN-412',
        vendorName: 'श्री गणेश झेरॉक्स व बुक डेपो, धरणगाव',
        category: 'Educational Materials & Books' as const,
        amount: 8500,
        billDate: new Date('2026-10-02'),
        associatedFundId: 'FND-2026-003',
        associatedFundScheme: 'Samagra Shiksha - Composite School Grant',
        date: new Date('2026-10-02'),
        voucherNo: 'EXP-2026-05',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Approved' as const,
        notes: 'सत्र १ परीक्षा प्रश्नपत्रिका झेरॉक्स व लेखन साहित्य',
      },
      {
        type: 'expense' as const,
        purpose: 'शालेय परिसर वृक्ष संवर्धन व कुंपण दुरुस्ती',
        title: 'शालेय परिसर वृक्ष संवर्धन व कुंपण दुरुस्ती',
        billNumber: 'FNC-550',
        vendorName: 'किसान ॲग्रो व फेन्सिंग वर्क्स, धरणगाव',
        category: 'Maintenance & Repairs' as const,
        amount: 12000,
        billDate: new Date('2026-10-10'),
        associatedFundId: 'FND-2026-001',
        associatedFundScheme: 'School Maintenance & Development Grant',
        date: new Date('2026-10-10'),
        voucherNo: 'EXP-2026-06',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        status: 'Approved' as const,
        notes: 'हरित शाळा वृक्षारोपण कुंपण जाळी खरेदी',
      },
    ];

    for (const f of finances) {
      await Finance.create(f);
    }
    console.log(`[Seed] Seeded ${finances.length} financial ledger transactions.`);

    // 8. Seed Certificate Requests (Pending & Approved)
    const certRequests = [
      {
        certificateNo: 'CERT-2026-001',
        studentName: 'पाटील वेदांत सचिन',
        grNumber: '1351',
        classGrade: 'इयत्ता १ ली',
        type: 'बोनाफाईड प्रमाणपत्र (Bonafide)' as const,
        reason: 'राष्ट्रीयीकृत बँकेत बचत खाते उघडण्यासाठी',
        status: 'Pending' as const,
        requestedBy: 'Smt. K. N. Pawar (वर्गशिक्षिका)',
        requestedDate: new Date('2026-10-14'),
      },
      {
        certificateNo: 'CERT-2026-002',
        studentName: 'सोनवणे आरव गणेश',
        grNumber: '1375',
        classGrade: 'इयत्ता २ री',
        type: 'बोनाफाईड प्रमाणपत्र (Bonafide)' as const,
        reason: 'आधार कार्ड दुरुस्ती व पत्ता पडताळणी',
        status: 'Pending' as const,
        requestedBy: 'Smt. K. N. Pawar (वर्गशिक्षिका)',
        requestedDate: new Date('2026-10-15'),
      },
      {
        certificateNo: 'CERT-2026-003',
        studentName: 'भदाणे तन्वी प्रवीण',
        grNumber: '1398',
        classGrade: 'इयत्ता ३ री',
        type: 'हजेरी प्रमाणपत्र (Attendance)' as const,
        reason: 'शासकीय शिष्यवृत्ती पडताळणी करिता',
        status: 'Pending' as const,
        requestedBy: 'Shri. R. V. Shinde (वर्गशिक्षक)',
        requestedDate: new Date('2026-10-16'),
      },
      {
        certificateNo: 'CERT-2026-004',
        studentName: 'पाटील ओंकार संदीप',
        grNumber: '1420',
        classGrade: 'इयत्ता ४ थी',
        type: 'बोनाफाईड प्रमाणपत्र (Bonafide)' as const,
        reason: 'क्रीडा शिष्यवृत्ती आवेदन',
        status: 'Approved' as const,
        requestedBy: 'Shri. R. V. Shinde (वर्गशिक्षक)',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        requestedDate: new Date('2026-09-10'),
        approvedDate: new Date('2026-09-12'),
      },
      {
        certificateNo: 'CERT-2026-005',
        studentName: 'पवार मयुरी विजय',
        grNumber: '1442',
        classGrade: 'इयत्ता ५ वी',
        type: 'बोनाफाईड प्रमाणपत्र (Bonafide)' as const,
        reason: 'सावित्रीबाई फुले शिष्यवृत्ती अर्ज',
        status: 'Approved' as const,
        requestedBy: 'Shri. M. P. Patil (वर्गशिक्षक)',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        requestedDate: new Date('2026-09-20'),
        approvedDate: new Date('2026-09-21'),
      },
      {
        certificateNo: 'CERT-2026-006',
        studentName: 'गवळी यश ज्ञानेश्वर',
        grNumber: '1465',
        classGrade: 'इयत्ता ६ वी',
        type: 'निर्गम उतारा (Nirgam Utara)' as const,
        reason: 'तहसीलदार कार्यालय जात प्रमाणपत्र पडताळणी',
        status: 'Approved' as const,
        requestedBy: 'Smt. S. S. Bhadane (वर्गशिक्षिका)',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        requestedDate: new Date('2026-10-01'),
        approvedDate: new Date('2026-10-02'),
      },
      {
        certificateNo: 'CERT-2026-007',
        studentName: 'शिंदे समृद्धी राहुल',
        grNumber: '1488',
        classGrade: 'इयत्ता ७ वी',
        type: 'शाळा सोडल्याचा दाखला (Leaving TC)' as const,
        reason: 'इयत्ता ७ वी उत्तीर्ण होऊन माध्यमिक विद्यालयात प्रवेशासाठी',
        status: 'Approved' as const,
        requestedBy: 'Shri. S. R. Patil (मुख्याध्यापक)',
        approvedBy: 'Shri. S. R. Patil (Principal)',
        requestedDate: new Date('2026-10-05'),
        approvedDate: new Date('2026-10-06'),
      },
    ];

    for (const c of certRequests) {
      await CertificateRequest.create(c);
    }
    console.log(`[Seed] Seeded ${certRequests.length} certificate requests (3 Pending, 4 Approved).`);

    // 9. Run Eligibility Engine across all seeded students and schemes
    console.log('[Seed] Evaluating initial student scholarship eligibilities via Eligibility Engine...');
    await evaluateAllSchemes();
    console.log('[Seed] Evaluated all schemes and generated initial eligibility records.');

    console.log('[Seed] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
