const API_BASE = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

const assert = (condition: boolean, message: string) => {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
};

const runTests = async () => {
  console.log('================================================================');
  console.log('   AUTOMATED TEST SUITE: SCHOLARSHIP & ELIGIBILITY ENGINE (ZP)');
  console.log('================================================================');

  try {
    // -------------------------------------------------------------
    // 1. Authenticate Principal and Teacher
    // -------------------------------------------------------------
    console.log('\n--- 1. Authenticating Principal and Teacher ---');

    const principalLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'principal@zphingone.edu.in',
        password: 'Principal@123',
      }),
    });
    const principalLoginData = await principalLoginRes.json();
    assert(principalLoginRes.status === 200, 'Principal successfully authenticated');
    const principalCookies = principalLoginRes.headers.getSetCookie?.() || [];
    const principalCookieHeader = principalCookies.map((c: string) => c.split(';')[0]).join('; ');
    const principalCsrf = principalLoginData.data.csrfToken;

    const teacherLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'teacher.pawar',
        password: 'Teacher@123',
      }),
    });
    const teacherLoginData = await teacherLoginRes.json();
    assert(teacherLoginRes.status === 200, 'Teacher successfully authenticated');
    const teacherCookies = teacherLoginRes.headers.getSetCookie?.() || [];
    const teacherCookieHeader = teacherCookies.map((c: string) => c.split(';')[0]).join('; ');
    const teacherCsrf = teacherLoginData.data.csrfToken;

    // -------------------------------------------------------------
    // 2. Scholarship Schemes Listing with Aggregated Counts
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Schemes List & Eligibility Counters ---');

    const schemesRes = await fetch(`${API_BASE}/portal/scholarships`, {
      headers: { Cookie: principalCookieHeader },
    });
    const schemesData = await schemesRes.json();
    assert(schemesRes.status === 200, 'Scholarships list returns 200 OK');
    assert(Array.isArray(schemesData.data.schemes) && schemesData.data.schemes.length >= 4, `Found ${schemesData.data.schemes.length} registered scholarship schemes`);

    const savitribai = schemesData.data.schemes.find((s: any) => s.code === 'SP-SCH-01');
    const tribal = schemesData.data.schemes.find((s: any) => s.code === 'SM-SCH-02');
    const cwsn = schemesData.data.schemes.find((s: any) => s.code === 'CWSN-ATT-03');

    assert(!!savitribai && !!tribal && !!cwsn, 'Official Savitribai Phule, Tribal, and CWSN schemes present');
    assert(savitribai.eligibleCount > 0, `Savitribai Phule scheme has ${savitribai.eligibleCount} eligible students calculated`);
    assert(savitribai.ineligibleCount > 0, `Savitribai Phule scheme has ${savitribai.ineligibleCount} ineligible students (class/gender mismatches)`);
    assert(tribal.eligibleCount > 0, `Tribal Pre-Matric scheme has ${tribal.eligibleCount} eligible students`);

    // -------------------------------------------------------------
    // 3. Scheme Details
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Scheme Details by ID ---');

    const schemeDetailRes = await fetch(`${API_BASE}/portal/scholarships/${savitribai._id}`, {
      headers: { Cookie: principalCookieHeader },
    });
    const schemeDetailData = await schemeDetailRes.json();
    assert(schemeDetailRes.status === 200, 'Single scheme details returns 200 OK');
    assert(schemeDetailData.data.code === 'SP-SCH-01', 'Scheme code matches SP-SCH-01');
    assert(schemeDetailData.data.applicableStandards.length === 3, 'Applicable standards are Classes 5, 6, 7');
    assert(schemeDetailData.data.genderRequirement === 'मुलगी', 'Gender requirement is strictly female (मुलगी)');

    // -------------------------------------------------------------
    // 4. Eligibility Engine: Verifying Eligible, Not Eligible, and Needs Review
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Eligibility Engine Evaluation Results & Reasons ---');

    // 4.1 Savitribai Phule: Eligible tab
    const eligibleRes = await fetch(`${API_BASE}/portal/scholarships/${savitribai._id}/evaluations?status=Eligible`, {
      headers: { Cookie: principalCookieHeader },
    });
    const eligibleData = await eligibleRes.json();
    assert(eligibleRes.status === 200, 'Eligible evaluations endpoint returns 200 OK');
    assert(eligibleData.data.length > 0, `Found ${eligibleData.data.length} eligible students in Savitribai Phule scheme`);
    const firstEligible = eligibleData.data[0];
    assert(firstEligible.gender === 'मुलगी', 'Eligible student is female');
    assert(['इयत्ता ५ वी', 'इयत्ता ६ वी', 'इयत्ता ७ वी'].includes(firstEligible.standard), 'Eligible student is in Classes 5, 6, or 7');
    assert(firstEligible.reasons.length > 0 && firstEligible.missingInfo.length === 0, 'Eligible student has validation confirmation and 0 missing items');

    // 4.2 Savitribai Phule: Ineligible tab & exact disqualification reasons
    const ineligibleRes = await fetch(`${API_BASE}/portal/scholarships/${savitribai._id}/evaluations?status=Not Eligible&limit=20`, {
      headers: { Cookie: principalCookieHeader },
    });
    const ineligibleData = await ineligibleRes.json();
    assert(ineligibleRes.status === 200, 'Ineligible evaluations endpoint returns 200 OK');
    assert(ineligibleData.data.length > 0, `Found ${ineligibleData.data.length} ineligible students`);

    // Check gender and class mismatch reasons
    const boyMismatch = ineligibleData.data.find((e: any) => e.gender === 'मुलगा');
    assert(!!boyMismatch, 'Found male student flagged as ineligible for girls scholarship');
    assert(boyMismatch.reasons.some((r: string) => r.includes('लिंग अपात्र')), `Boy disqualified with exact reason: ${boyMismatch.reasons[0]}`);

    const lowerClassMismatch = ineligibleData.data.find((e: any) => ['इयत्ता १ ली', 'इयत्ता २ री', 'इयत्ता ३ री', 'इयत्ता ४ थी'].includes(e.standard));
    assert(!!lowerClassMismatch, 'Found lower primary student flagged as ineligible');
    assert(lowerClassMismatch.reasons.some((r: string) => r.includes('इयत्ता अपात्र')), `Lower standard student disqualified with exact reason: ${lowerClassMismatch.reasons[0]}`);

    // 4.3 Tribal Scholarship: Income Ceiling & Category Mismatch Test
    const tribalEvalRes = await fetch(`${API_BASE}/portal/scholarships/${tribal._id}/evaluations?status=Not Eligible&limit=20`, {
      headers: { Cookie: principalCookieHeader },
    });
    const tribalEvalData = await tribalEvalRes.json();
    const nonStStudent = tribalEvalData.data.find((e: any) => e.category !== 'ST');
    assert(!!nonStStudent, 'Found non-ST student evaluated for Tribal Scholarship');
    assert(nonStStudent.reasons.some((r: string) => r.includes('प्रवर्ग अपात्र')), `Non-ST student disqualified with category mismatch reason: ${nonStStudent.reasons[0]}`);

    // -------------------------------------------------------------
    // 5. Scheme Management: Create, Unique Code, and Auto-Evaluation
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Scheme Creation, Validation & Dynamic Evaluation ---');

    const testSchemeCode = `TEST-SCH-${Date.now().toString().slice(-4)}`;

    const createSchemeRes = await fetch(`${API_BASE}/portal/scholarships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        schemeName: 'Late Vasantrao Naik Merit Scholarship',
        marathiName: 'स्व. वसंतराव नाईक गुणवत्ता शिष्यवृत्ती',
        code: testSchemeCode,
        category: 'Merit / Special',
        applicableGrades: 'इयत्ता ५ वी ते ७ वी',
        applicableStandards: ['इयत्ता ५ वी', 'इयत्ता ६ वी', 'इयत्ता ७ वी'],
        applicableCategories: ['NT', 'VJNT', 'OBC'],
        incomeLimit: 75000,
        genderRequirement: 'ALL',
        benefitAmount: '₹2,000/- वार्षिक',
        eligibilityCriteria: ['इयत्ता ५ वी ते ७ वी', 'वार्षिक उत्पन्न ७५,००० पेक्षा कमी'],
        requiredDocuments: ['आधार कार्ड', 'तहसीलदार उत्पन्न दाखला'],
      }),
    });
    const createSchemeData = await createSchemeRes.json();
    if (createSchemeRes.status !== 201) {
      console.error('DEBUG createScheme failed:', createSchemeRes.status, createSchemeData);
    }
    assert(createSchemeRes.status === 201, `Principal successfully created scholarship scheme (${testSchemeCode})`);
    assert(createSchemeData.counts?.totalStudents >= 148, `Eligibility engine automatically evaluated all ${createSchemeData.counts?.totalStudents} students`);

    // Duplicate code check -> 400
    const duplicateSchemeRes = await fetch(`${API_BASE}/portal/scholarships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        schemeName: 'Duplicate Test',
        marathiName: 'दुबार चाचणी',
        code: testSchemeCode,
        applicableGrades: 'इयत्ता १ ली',
        benefitAmount: '₹1,000/-',
      }),
    });
    assert(duplicateSchemeRes.status === 400, 'Duplicate scheme code rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // 6. Update Scheme & Trigger Re-evaluation
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Scheme Update & Eligibility Re-evaluation ---');

    const createdSchemeId = createSchemeData.data._id;
    const updateRes = await fetch(`${API_BASE}/portal/scholarships/${createdSchemeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        benefitAmount: '₹2,500/- वार्षिक',
        incomeLimit: 85000,
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Principal successfully updated scholarship criteria');
    assert(updateData.data.benefitAmount === '₹2,500/- वार्षिक', 'Updated benefit amount persists');

    // -------------------------------------------------------------
    // 7. Toggle Public / Active Status & Public Website Verification
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Status Toggle & Public Website Protection ---');

    // Toggle public to false
    const toggleRes = await fetch(`${API_BASE}/portal/scholarships/${createdSchemeId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({ isPublic: false }),
    });
    assert(toggleRes.status === 200, 'Principal toggled scheme public visibility to false');

    // Query public endpoint
    const publicRes = await fetch(`${API_BASE}/public/scholarships`);
    const publicData = await publicRes.json();
    assert(publicRes.status === 200, 'Public scholarships endpoint returns 200 OK');
    const isUnpublishedPresent = publicData.data.some((s: any) => s.code === testSchemeCode);
    assert(!isUnpublishedPresent, 'Unpublished scheme is strictly excluded from public website');
    assert(!publicData.data[0].students && !publicData.data[0].beneficiaries, 'Public website NEVER leaks individual student records');

    // -------------------------------------------------------------
    // 8. Principal Scholarship Approval Workflow
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Principal Approval Workflow ---');

    const approveRes = await fetch(`${API_BASE}/portal/scholarships/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        grNumber: firstEligible.studentGrNumber,
        schemeId: savitribai._id,
        schemeName: savitribai.schemeName,
      }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, `Principal successfully approved scholarship for student (GR #${firstEligible.studentGrNumber})`);
    assert(approveData.student.scholarshipScheme === savitribai.schemeName, 'Student profile updated with approved scholarship scheme');

    // -------------------------------------------------------------
    // 9. RBAC Enforcement: Teacher Read-Only & Class Scoping
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing RBAC: Teacher Read-Only Access & Security Guards ---');

    // Teacher can view schemes list (200 OK)
    const teacherListRes = await fetch(`${API_BASE}/portal/scholarships`, {
      headers: { Cookie: teacherCookieHeader },
    });
    const teacherListData = await teacherListRes.json();
    assert(teacherListRes.status === 200, 'Teacher can view scholarship schemes list (200 OK)');
    assert(teacherListData.readOnly === true, 'Teacher response has readOnly: true');

    // Teacher cannot create scheme -> 403 Forbidden
    const teacherCreateRes = await fetch(`${API_BASE}/portal/scholarships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({
        schemeName: 'Unauthorized Scheme',
        marathiName: 'अनधिकृत',
        code: 'UNAUTH-01',
        applicableGrades: '१ ली',
        benefitAmount: '₹500',
      }),
    });
    assert(teacherCreateRes.status === 403, 'Server enforces RBAC: Teacher cannot create scholarships (403 Forbidden)');

    // Teacher cannot update scheme -> 403 Forbidden
    const teacherUpdateRes = await fetch(`${API_BASE}/portal/scholarships/${savitribai._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({ benefitAmount: '₹9,999' }),
    });
    assert(teacherUpdateRes.status === 403, 'Server enforces RBAC: Teacher cannot edit scholarships (403 Forbidden)');

    // Teacher cannot approve scholarship -> 403 Forbidden
    const teacherApproveRes = await fetch(`${API_BASE}/portal/scholarships/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({
        grNumber: '1001',
        schemeName: 'Unauthorized',
      }),
    });
    assert(teacherApproveRes.status === 403, 'Server enforces RBAC: Teacher cannot approve scholarships (403 Forbidden)');

    // -------------------------------------------------------------
    // 10. CSV Ledger Export
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Scholarship CSV Ledger Export ---');

    const csvRes = await fetch(`${API_BASE}/portal/scholarships/${savitribai._id}/export/csv?status=Eligible`, {
      headers: { Cookie: principalCookieHeader },
    });
    const csvText = await csvRes.text();
    assert(csvRes.status === 200, 'Scholarship CSV export returns 200 OK');
    assert(Boolean(csvRes.headers.get('content-type')?.includes('text/csv')), 'Content-Type is text/csv');
    assert(csvText.includes('क्रांतीज्योती सावित्रीबाई फुले'), 'CSV contains scheme name in header');
    assert(csvText.includes('रजिस्टर क्र.') && csvText.includes('पात्रता स्थिती'), 'CSV contains official column headers');
    assert(csvText.includes(firstEligible.studentGrNumber), 'CSV contains evaluated student records');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`   SCHOLARSHIP TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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
