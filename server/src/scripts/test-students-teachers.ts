/**
 * Test Suite: Students and Teachers Modules
 * Validates Mongoose models, controllers, APIs, validation, pagination, filtering, privacy masking, RBAC, and MongoDB persistence.
 */

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('================================================================');
  console.log('   AUTOMATED TEST SUITE: STUDENTS & TEACHERS MODULES (ZP SCHOOL) ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, extra?: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extra ? `-> ${extra}` : ''}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // Step 1: Authentication for Principal and Teacher
    // -------------------------------------------------------------
    console.log('\n--- 1. Authenticating Principal and Teacher ---');

    // Principal Login
    const principalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'principal@zphingone.edu.in', password: 'Principal@123' }),
    });
    const principalLoginData = await principalLoginRes.json();
    assert(principalLoginRes.status === 200, 'Principal successfully authenticated');
    const principalCookies = principalLoginRes.headers.getSetCookie?.() || [];
    const principalCookieHeader = principalCookies.map((c: string) => c.split(';')[0]).join('; ');
    const principalCsrf = principalLoginData.data.csrfToken;

    // Teacher Login (teacher.pawar)
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher.pawar', password: 'Teacher@123' }),
    });
    const teacherLoginData = await teacherLoginRes.json();
    assert(teacherLoginRes.status === 200, 'Teacher successfully authenticated');
    const teacherCookies = teacherLoginRes.headers.getSetCookie?.() || [];
    const teacherCookieHeader = teacherCookies.map((c: string) => c.split(';')[0]).join('; ');
    const teacherCsrf = teacherLoginData.data.csrfToken;

    // -------------------------------------------------------------
    // Step 2: Student Module - Pagination & Default Privacy Masking
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Students Pagination, Privacy Masking, & Filtering ---');

    // 2.1 Pagination
    const pageRes = await fetch(`${BASE_URL}/portal/students?page=1&limit=10`, {
      headers: { Cookie: principalCookieHeader },
    });
    const pageData = await pageRes.json();
    assert(pageRes.status === 200, 'Students endpoint returns 200 OK');
    assert(pageData.data.length === 10, 'Students pagination returns exactly 10 items for limit=10');
    assert(pageData.pagination.totalStudents >= 148, `Total students count in MongoDB is >= 148 (actual: ${pageData.pagination.totalStudents})`);

    // 2.2 Default Aadhaar and Bank Masking
    const firstStudent = pageData.data[0];
    const aadhaarMasked = firstStudent.aadhaarNumber.startsWith('•••• ••••');
    const bankMasked = firstStudent.bankAccountNumber.startsWith('••••••••');
    assert(aadhaarMasked, `Aadhaar is masked by default (${firstStudent.aadhaarNumber})`);
    assert(bankMasked, `Bank account is masked by default (${firstStudent.bankAccountNumber})`);

    // 2.3 Unmasked Data On-Demand for Authorized Staff
    const unmaskedRes = await fetch(`${BASE_URL}/portal/students/${firstStudent._id}?unmasked=true`, {
      headers: { Cookie: principalCookieHeader },
    });
    const unmaskedData = await unmaskedRes.json();
    assert(unmaskedRes.status === 200, 'Student details by ID returns 200 OK');
    const aadhaarUnmasked = /^\d{12}$/.test(unmaskedData.data.aadhaarNumber);
    assert(aadhaarUnmasked, `Aadhaar is cleanly unmasked on request (${unmaskedData.data.aadhaarNumber})`);

    // 2.4 Verify 6 Profile Sections Exist
    const s = unmaskedData.data;
    assert(!!s.name && !!s.dateOfBirth && !!s.gender && !!s.category, 'Section 1 (General Profile) complete');
    assert(!!s.fatherName && !!s.motherName && typeof s.isBpl === 'boolean', 'Section 2 (Family Details) complete');
    assert(!!s.village && !!s.taluka && !!s.district && !!s.primaryPhone, 'Section 3 (Contact & Address) complete');
    assert(!!s.saralId && !!s.penNumber && !!s.currentStandard && !!s.division, 'Section 4 (Academic / SARAL) complete');
    assert(!!s.bankName && !!s.bankAccountHolder && !!s.bankIfsc, 'Section 5 (Bank Details) complete');
    assert(typeof s.isCwsn === 'boolean' && s.heightCm > 0 && s.weightKg > 0, 'Section 6 (Health & CWSN) complete');

    // 2.5 Filters: Standard, Division, Gender, Category
    const class4Res = await fetch(`${BASE_URL}/portal/students?standard=${encodeURIComponent('वर्ग ४ थी')}&limit=100`, {
      headers: { Cookie: principalCookieHeader },
    });
    const class4Data = await class4Res.json();
    const allClass4 = class4Data.data.every((item: any) => item.currentStandard.includes('४ थी'));
    assert(allClass4 && class4Data.data.length > 0, `Filter by standard 'वर्ग ४ थी' matches all results (${class4Data.data.length} found)`);

    const divARes = await fetch(`${BASE_URL}/portal/students?division=A&limit=100`, {
      headers: { Cookie: principalCookieHeader },
    });
    const divAData = await divARes.json();
    const allDivA = divAData.data.every((item: any) => item.division === 'A');
    assert(allDivA && divAData.data.length > 0, `Filter by division 'A' matches all results (${divAData.data.length} found)`);

    const obcRes = await fetch(`${BASE_URL}/portal/students?category=OBC&limit=100`, {
      headers: { Cookie: principalCookieHeader },
    });
    const obcData = await obcRes.json();
    const allObc = obcData.data.every((item: any) => item.category === 'OBC');
    assert(allObc && obcData.data.length > 0, `Filter by category 'OBC' matches all results (${obcData.data.length} found)`);

    // -------------------------------------------------------------
    // Step 3: Student Creation & Edit (MongoDB Persistence & RBAC)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Student Creation & Update with RBAC ---');

    // 3.1 Teacher trying to create student -> 403 Forbidden
    const teacherCreateStudentRes = await fetch(`${BASE_URL}/portal/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({ name: 'Unauthorized Student' }),
    });
    assert(teacherCreateStudentRes.status === 403, 'Teacher cannot create student (403 Forbidden returned)');

    // 3.2 Principal creates new student
    const testGrNumber = `TEST-${Date.now().toString().slice(-4)}`;
    const newStudentPayload = {
      name: 'समीर राहुल महाजन (Test Student)',
      grNumber: testGrNumber,
      dateOfBirth: '2016-04-12',
      gender: 'मुलगा',
      motherTongue: 'मराठी',
      religion: 'हिंदू',
      caste: 'लेवा पाटील',
      category: 'OBC',
      bloodGroup: 'O+',
      fatherName: 'राहुल महाजन',
      motherName: 'सुनीता महाजन',
      guardianName: 'राहुल महाजन',
      parentsOccupation: 'शेती (Farmer)',
      annualFamilyIncome: 55000,
      isBpl: false,
      minorityStatus: 'None',
      houseNumber: '१४',
      village: 'हिंगोणे बु.',
      taluka: 'धरणगाव',
      district: 'जळगाव',
      pincode: '४२५१०५',
      primaryPhone: '९८२३४९९००१',
      residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव',
      saralId: `SARAL-${testGrNumber}`,
      penNumber: `PEN-${testGrNumber}`,
      admissionDate: '2022-06-15',
      studentType: 'Fresher',
      entryStandard: 'वर्ग १ ली',
      currentStandard: 'वर्ग ३ री',
      division: 'A',
      mediumOfInstruction: 'मराठी (Marathi)',
      previousYearMarks: 85,
      attendancePercentage: 92,
      bankAccountHolder: 'समीर राहुल महाजन',
      bankName: 'Bank of Maharashtra',
      bankAccountNumber: '60123456789',
      bankIfsc: 'MAHB0000123',
      isCwsn: false,
      heightCm: 118,
      weightKg: 21,
    };

    const principalCreateRes = await fetch(`${BASE_URL}/portal/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify(newStudentPayload),
    });
    const principalCreateData = await principalCreateRes.json();
    assert(principalCreateRes.status === 201, `Principal successfully admitted student: ${principalCreateData.message}`);
    const createdStudentId = principalCreateData.data._id;

    // 3.3 Principal updates student details
    const updateRes = await fetch(`${BASE_URL}/portal/students/${createdStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        previousYearMarks: 91,
        bloodGroup: 'AB+',
        heightCm: 121,
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Student updated successfully (200 OK)');
    assert(updateData.data.previousYearMarks === 91 && updateData.data.bloodGroup === 'AB+', 'Updated values persist in MongoDB');

    // -------------------------------------------------------------
    // Step 4: Teacher Module - List, Filtering, Details
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Teachers Module: List, Filter, Details ---');

    // 4.1 Teachers list
    const teachersListRes = await fetch(`${BASE_URL}/portal/teachers`, {
      headers: { Cookie: principalCookieHeader },
    });
    const teachersListData = await teachersListRes.json();
    assert(teachersListRes.status === 200, 'Teachers list endpoint returns 200 OK');
    assert(teachersListData.data.length >= 5, `Found ${teachersListData.data.length} registered teachers in MongoDB`);

    // 4.2 Subject Filter
    const mathTeachersRes = await fetch(`${BASE_URL}/portal/teachers?subject=${encodeURIComponent('गणित')}`, {
      headers: { Cookie: principalCookieHeader },
    });
    const mathTeachersData = await mathTeachersRes.json();
    const allMath = mathTeachersData.data.every((t: any) =>
      t.subjectSpecialization.some((s: string) => s.includes('गणित'))
    );
    assert(allMath && mathTeachersData.data.length > 0, `Filter by subject 'गणित' returned ${mathTeachersData.data.length} teachers`);

    // 4.3 Experience Filter
    const expTeachersRes = await fetch(`${BASE_URL}/portal/teachers?minExp=10`, {
      headers: { Cookie: principalCookieHeader },
    });
    const expTeachersData = await expTeachersRes.json();
    const all10Plus = expTeachersData.data.every((t: any) => t.experienceYears >= 10);
    assert(all10Plus && expTeachersData.data.length > 0, `Filter by experience >= 10 years returned ${expTeachersData.data.length} senior teachers`);

    // 4.4 Get Single Teacher by ID (Personal, Professional, Health)
    const sampleTeacher = teachersListData.data[0];
    const singleTeacherRes = await fetch(`${BASE_URL}/portal/teachers/${sampleTeacher._id}`, {
      headers: { Cookie: principalCookieHeader },
    });
    const singleTeacherData = await singleTeacherRes.json();
    const st = singleTeacherData.data;
    assert(!!st.name && !!st.gender && !!st.dateOfBirth && !!st.contactPhone && !!st.residentialAddress, 'Teacher Personal details verified');
    assert(!!st.employeeId && !!st.designation && !!st.qualification && Array.isArray(st.assignedClasses), 'Teacher Professional details verified');
    assert(!!st.medicalFitness && !!st.emergencyContactName && !!st.emergencyContactPhone, 'Teacher Health & Emergency details verified');

    // -------------------------------------------------------------
    // Step 5: Teacher Creation by Principal with Staff Login Account
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Teacher Registration & Account Linking ---');

    const testEmpId = `SEV-${Date.now().toString().slice(-4)}`;
    const testUsername = `test.teacher.${Date.now().toString().slice(-4)}`;
    const testEmail = `${testUsername}@zphingone.edu.in`;

    // 5.1 Teacher trying to create a teacher -> 403 Forbidden
    const teacherCreateTeacherRes = await fetch(`${BASE_URL}/portal/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({ name: 'Unauthorized Teacher' }),
    });
    assert(teacherCreateTeacherRes.status === 403, 'Teacher cannot register a new teacher (403 Forbidden returned)');

    // 5.2 Principal creates teacher + linked user account
    const createTeacherRes = await fetch(`${BASE_URL}/portal/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        name: 'श्रीमती कविता किशोर पाटील',
        gender: 'Female',
        dateOfBirth: '1989-08-20',
        bloodGroup: 'A+',
        contactPhone: '९८२३४००००२',
        email: testEmail,
        aadhaarNumber: '९८२३४५६७११२२',
        residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव',
        employeeId: testEmpId,
        designation: 'सहायक प्राथमिक शिक्षक',
        qualification: 'M.Sc., B.Ed.',
        joiningDate: '2019-07-01',
        assignedClasses: ['वर्ग ५ वी', 'वर्ग ६ वी'],
        subjectSpecialization: ['विज्ञान व तंत्रज्ञान', 'गणित'],
        experienceYears: 6,
        medicalFitness: 'Fit',
        emergencyContactName: 'किशोर पाटील',
        emergencyContactPhone: '९८२३४००००३',
        createLoginAccount: true,
        username: testUsername,
        password: 'Teacher@123',
      }),
    });
    const createTeacherData = await createTeacherRes.json();
    assert(createTeacherRes.status === 201, `Principal successfully registered teacher (${createTeacherData.data?.employeeId})`);
    assert(!!createTeacherData.data?.linkedUserId, 'Staff User account was created and linked via linkedUserId');

    // 5.3 Test that the new teacher can log in immediately
    const newTeacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUsername, password: 'Teacher@123' }),
    });
    const newTeacherLoginData = await newTeacherLoginRes.json();
    assert(newTeacherLoginRes.status === 200, `New teacher logged in with generated credentials (@${testUsername})`);
    const newTeacherCookies = newTeacherLoginRes.headers.getSetCookie?.() || [];
    const newTeacherCookieHeader = newTeacherCookies.map((c: string) => c.split(';')[0]).join('; ');
    const newTeacherCsrf = newTeacherLoginData.data.csrfToken;

    // -------------------------------------------------------------
    // Step 6: Teacher Self-Profile Update & Whitelist Security
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Teacher Self-Profile Update & Server-Side Security ---');

    // 6.1 Teacher self-update permitted fields
    const selfUpdateRes = await fetch(`${BASE_URL}/portal/teachers/my-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': newTeacherCsrf,
        Cookie: newTeacherCookieHeader,
      },
      body: JSON.stringify({
        contactPhone: '९९०००११२२३',
        residentialAddress: 'नवीन घर, जि. प. शाळा परिसर, हिंगोणे बु.',
        emergencyContactName: 'किशोर आनंद पाटील',
        emergencyContactPhone: '९९०००११२२४',
        bloodGroup: 'AB+',
        // Attempt privilege escalation (should be stripped/ignored server-side)
        employeeId: 'HACKED-ID',
        designation: 'Principal Hacker',
        experienceYears: 99,
      }),
    });
    const selfUpdateData = await selfUpdateRes.json();
    assert(selfUpdateRes.status === 200, 'Teacher self-update succeeded for permitted fields');
    assert(selfUpdateData.data.contactPhone === '९९०००११२२३', 'Permitted contact phone was updated');
    assert(selfUpdateData.data.bloodGroup === 'AB+', 'Permitted blood group was updated');
    assert(selfUpdateData.data.employeeId === testEmpId, 'Security: Employee ID was NOT altered by teacher');
    assert(selfUpdateData.data.designation === 'सहायक प्राथमिक शिक्षक', 'Security: Designation was NOT altered by teacher');

    // 6.2 Teacher attempting to update ANOTHER teacher's record -> 403 Forbidden
    const otherTeacherUpdateRes = await fetch(`${BASE_URL}/portal/teachers/${sampleTeacher._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': newTeacherCsrf,
        Cookie: newTeacherCookieHeader,
      },
      body: JSON.stringify({ contactPhone: '0000000000' }),
    });
    assert(otherTeacherUpdateRes.status === 403, 'Security: Teacher cannot edit another teacher profile (403 Forbidden)');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Test Suite encountered an unexpected exception:', err);
    process.exit(1);
  }
};

runTests();

export {};
