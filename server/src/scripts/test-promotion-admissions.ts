import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

const parseCookies = (res: Response): { cookieHeader: string; csrfToken: string } => {
  const rawCookies = res.headers.getSetCookie?.() || [];
  const cookiePairs: string[] = [];
  let csrfToken = '';

  for (const cookieStr of rawCookies) {
    const parts = cookieStr.split(';')[0].split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    cookiePairs.push(`${key}=${val}`);
    if (key === 'csrfToken') {
      csrfToken = val;
    }
  }

  return { cookieHeader: cookiePairs.join('; '), csrfToken };
};

const runTests = async () => {
  console.log('====================================================');
  console.log(' STARTING PROMOTION & ADMISSIONS MODULE TEST SUITE  ');
  console.log('====================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. Unauthenticated Access Restrictions (401 Expected)
    // -------------------------------------------------------------
    console.log('--- 1. Testing Unauthenticated Request Restrictions ---');
    const unauthPromotion = await fetch(`${BASE_URL}/portal/promotion/preview?currentStandard=इयत्ता १ ली`);
    assert(unauthPromotion.status === 401, '1. Unauthenticated access to promotion preview rejected with 401');

    const unauthAdmissions = await fetch(`${BASE_URL}/portal/admissions`);
    assert(unauthAdmissions.status === 401, '2. Unauthenticated access to admissions rejected with 401');

    console.log('✅ [PASS] 1. Unauthenticated requests correctly rejected with 401 Unauthorized\n');

    // -------------------------------------------------------------
    // 2. Authenticating Teacher & Principal
    // -------------------------------------------------------------
    console.log('--- 2. Authenticating Principal & Teacher Sessions ---');
    // Login Teacher
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'teacher.pawar', password: 'Teacher@123' }),
    });
    assert(teacherLoginRes.status === 200, 'Teacher login failed');
    const { cookieHeader: teacherCookie, csrfToken: teacherCsrfToken } = parseCookies(teacherLoginRes);

    // Login Principal
    const principalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'principal', password: 'Principal@123' }),
    });
    assert(principalLoginRes.status === 200, 'Principal login failed');
    const { cookieHeader: principalCookie, csrfToken: principalCsrfToken } = parseCookies(principalLoginRes);

    console.log('✅ [PASS] 2. Teacher & Principal sessions authenticated with secure cookies\n');

    // -------------------------------------------------------------
    // 3. Teacher Role Permissions & RBAC Enforcement (403 Expected)
    // -------------------------------------------------------------
    console.log('--- 3. Testing RBAC Restrictions for Teachers ---');
    const teacherPreviewRes = await fetch(`${BASE_URL}/portal/promotion/preview?currentStandard=इयत्ता १ ली`, {
      headers: { Cookie: teacherCookie },
    });
    assert(teacherPreviewRes.status === 403, '3. Teacher accessing promotion preview rejected with 403 Forbidden');

    const teacherPromoteRes = await fetch(`${BASE_URL}/portal/students/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ fromClass: 'इयत्ता १ ली', toClass: 'इयत्ता २ री' }),
    });
    assert(teacherPromoteRes.status === 403, '4. Teacher promoting students rejected with 403 Forbidden');

    const teacherStatusRes = await fetch(`${BASE_URL}/portal/admissions/dummyid/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ status: 'Approved' }),
    });
    assert(teacherStatusRes.status === 403, '5. Teacher modifying admission status rejected with 403 Forbidden');

    const teacherEnrollRes = await fetch(`${BASE_URL}/portal/admissions/dummyid/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ grNumber: '9999' }),
    });
    assert(teacherEnrollRes.status === 403, '6. Teacher enrolling student rejected with 403 Forbidden');

    console.log('✅ [PASS] 3. All administrative promotion & admission endpoints strictly blocked for teachers with 403\n');

    // -------------------------------------------------------------
    // 4. Public Admission Application Submission & Status Tracking
    // -------------------------------------------------------------
    console.log('--- 4. Testing Public Admission Submission Workflow ---');
    const uniquePhone = `982${Math.floor(1000000 + Math.random() * 9000000)}`;
    const submissionPayload = {
      studentName: 'कु. आरव निलेश पाटील (Test Applicant)',
      gender: 'Male',
      dateOfBirth: '2020-04-12',
      gradeApplying: 'इयत्ता १ ली (Class 1)',
      parentName: 'निलेश भगवान पाटील',
      motherName: 'वैशाली निलेश पाटील',
      parentPhone: uniquePhone,
      parentEmail: 'nilesh.patil@example.com',
      residentialAddress: 'मु. पो. हिंगोणे बु., ता. धरणगाव, जि. जळगाव',
      category: 'OBC',
      caste: 'लेवा पाटील',
      religion: 'हिंदू',
      motherTongue: 'मराठी',
      bloodGroup: 'O+',
      previousSchool: 'अंगणवाडी केंद्र क्र. २, हिंगोणे बु.',
    };

    const submitRes = await fetch(`${BASE_URL}/public/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionPayload),
    });
    assert(submitRes.status === 201, `Submission failed with status ${submitRes.status}`);
    const submitJson = await submitRes.json();
    assert(submitJson.success === true, 'Public submission was not marked successful');
    const createdAppNo = submitJson.data.applicationNo;
    assert(createdAppNo && createdAppNo.startsWith('ADM-'), `Invalid applicationNo generated: ${createdAppNo}`);
    console.log(`Generated Application Number: ${createdAppNo}`);

    // Track status from public endpoint
    const statusTrackRes = await fetch(`${BASE_URL}/public/admissions/status/${createdAppNo}`);
    assert(statusTrackRes.status === 200, 'Public status tracking failed');
    const statusTrackJson = await statusTrackRes.json();
    assert(statusTrackJson.data.applicationNo === createdAppNo, 'Tracked applicationNo mismatch');
    assert(statusTrackJson.data.status === 'Submitted' || statusTrackJson.data.status === 'Pending', 'Initial status mismatch');

    console.log('✅ [PASS] 4. Public online admission submitted, unique reference assigned, and status trackable\n');

    // -------------------------------------------------------------
    // 5. Admissions Desk (Principal Review & Decision Workflow)
    // -------------------------------------------------------------
    console.log('--- 5. Testing Admissions Desk Review Workflow ---');
    // Principal lists applications
    const listRes = await fetch(`${BASE_URL}/portal/admissions`, {
      headers: { Cookie: principalCookie },
    });
    assert(listRes.status === 200, 'Principal cannot list admissions');
    const listJson = await listRes.json();
    assert(listJson.success === true, 'List admissions response failed');
    assert(listJson.counts && typeof listJson.counts.total === 'number', 'Missing counts aggregation');

    const targetApp = listJson.data.find((a: any) => a.applicationNo === createdAppNo);
    assert(targetApp, `Newly submitted application ${createdAppNo} not found in admissions list`);
    const appId = targetApp._id;

    // Principal views detailed application dossier
    const detailsRes = await fetch(`${BASE_URL}/portal/admissions/${appId}`, {
      headers: { Cookie: principalCookie },
    });
    assert(detailsRes.status === 200, 'Fetching application details failed');
    const detailsJson = await detailsRes.json();
    assert(detailsJson.data.studentName.includes('आरव'), 'Applicant name mismatch in dossier');
    assert(Array.isArray(detailsJson.data.decisionHistory), 'Decision history is not an array');
    assert(Array.isArray(detailsJson.data.documents), 'Documents checklist missing');

    // Principal marks application "Under Review"
    const underReviewRes = await fetch(`${BASE_URL}/portal/admissions/${appId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ status: 'Under Review', notes: 'कागदपत्र पडताळणी सुरू केली आहे.' }),
    });
    if (underReviewRes.status !== 200) {
      console.log('Status code:', underReviewRes.status, 'Body:', await underReviewRes.text());
    }
    assert(underReviewRes.status === 200, 'Status update to Under Review failed');
    const underReviewJson = await underReviewRes.json();
    assert(underReviewJson.data.status === 'Under Review', 'Application status was not updated to Under Review');

    // Test rejection validation: Rejection requires a reason!
    const emptyRejectRes = await fetch(`${BASE_URL}/portal/admissions/${appId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ status: 'Rejected', reason: '' }),
    });
    assert(emptyRejectRes.status === 400, 'Rejection without reason should be rejected with 400');

    // Principal approves application
    const approveRes = await fetch(`${BASE_URL}/portal/admissions/${appId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ status: 'Approved', notes: 'सर्व कागदपत्रे वैध आढळली. प्रवेश मंजूर.' }),
    });
    assert(approveRes.status === 200, 'Approving application failed');
    const approveJson = await approveRes.json();
    assert(approveJson.data.status === 'Approved', 'Application status was not updated to Approved');

    console.log('✅ [PASS] 5. Application dossier reviewed, Under Review audit logged, rejection validated, and approved\n');

    // -------------------------------------------------------------
    // 6. Controlled Student Enrollment Workflow & Duplicate Prevention
    // -------------------------------------------------------------
    console.log('--- 6. Testing Controlled Student Enrollment Workflow ---');
    // Fetch next GR Number calculation
    const nextGrRes = await fetch(`${BASE_URL}/portal/admissions/next-gr`, {
      headers: { Cookie: principalCookie },
    });
    assert(nextGrRes.status === 200, 'Failed to fetch next GR number');
    const nextGrJson = await nextGrRes.json();
    const suggestedGr = nextGrJson.data.nextGrNumber;
    assert(suggestedGr && suggestedGr.length > 0, 'Empty next GR number calculated');
    console.log(`Suggested Next GR Number: ${suggestedGr}`);

    // Test Duplicate GR Number Prevention: Try enrolling with an existing GR number (e.g., "1351")
    const dupEnrollRes = await fetch(`${BASE_URL}/portal/admissions/${appId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        grNumber: '1351',
        standard: 'इयत्ता १ ली',
        division: 'A',
      }),
    });
    assert(dupEnrollRes.status === 409, 'Duplicate GR number should return 409 Conflict');

    // Enroll with the calculated new unique GR Number
    const validEnrollRes = await fetch(`${BASE_URL}/portal/admissions/${appId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        grNumber: suggestedGr,
        standard: 'इयत्ता १ ली',
        division: 'A',
        admissionDate: '2026-06-15',
        category: 'OBC',
        bloodGroup: 'O+',
      }),
    });
    assert(validEnrollRes.status === 201, `Enrollment failed with status ${validEnrollRes.status}`);
    const validEnrollJson = await validEnrollRes.json();
    assert(validEnrollJson.success === true, 'Enrollment was not marked successful');
    assert(validEnrollJson.data.grNumber === suggestedGr, 'Enrolled GR number mismatch');
    const createdStudentId = validEnrollJson.data.studentId;

    // Verify student is now present in the official students collection
    const checkStudentRes = await fetch(`${BASE_URL}/portal/students/${createdStudentId}`, {
      headers: { Cookie: principalCookie },
    });
    assert(checkStudentRes.status === 200, 'Newly enrolled student could not be found via /portal/students/:id');
    const checkStudentJson = await checkStudentRes.json();
    assert(checkStudentJson.data.name.includes('आरव'), 'Enrolled student name mismatch');
    assert(checkStudentJson.data.currentStandard === 'इयत्ता १ ली', 'Enrolled standard mismatch');
    assert(Array.isArray(checkStudentJson.data.academicHistory), 'Academic history missing on new student');
    assert(checkStudentJson.data.academicHistory[0].status === 'Admitted', 'Initial academic history status is not Admitted');

    console.log('✅ [PASS] 6. Controlled enrollment created official student record, linked GR number, and initiated academic progression\n');

    // -------------------------------------------------------------
    // 7. Student Promotion Workflow (Preview, Validation, Execution)
    // -------------------------------------------------------------
    console.log('--- 7. Testing Student Promotion Workflow ---');
    // Principal previews promotion for available standard with >= 2 students
    const standardsToTry = ['इयत्ता २ री', 'इयत्ता ३ री', 'इयत्ता ४ थी', 'इयत्ता १ ली'];
    let selectedStandard = 'इयत्ता २ री';
    let previewJson: any = null;

    for (const std of standardsToTry) {
      const pRes = await fetch(
        `${BASE_URL}/portal/promotion/preview?currentStandard=${encodeURIComponent(std)}&targetAcademicYear=2027-28`,
        { headers: { Cookie: principalCookie } }
      );
      assert(pRes.status === 200, 'Promotion preview failed');
      const pData = await pRes.json();
      if (pData.data.totalFound >= 2) {
        selectedStandard = std;
        previewJson = pData;
        break;
      }
    }

    assert(previewJson, 'Could not find any standard with >= 2 students');
    assert(previewJson.success === true, 'Preview response failed');
    const destinationStd = previewJson.data.destinationStandard;
    assert(destinationStd, 'Suggested destination class missing');
    assert(Array.isArray(previewJson.data.students), 'Students list missing in preview');
    console.log(`Found ${previewJson.data.totalFound} students in ${selectedStandard} available for promotion to ${destinationStd}.`);

    // Choose 2 eligible students: 1 Promoted, 1 Repeated (legitimate exception)
    const eligibleStudents = previewJson.data.students.filter((s: any) => s.isEligible);
    const testStudents = eligibleStudents.slice(0, 2);
    assert(testStudents.length >= 2, `Need at least 2 eligible students in ${selectedStandard} for promotion test`);

    const promotePayload = {
      fromClass: selectedStandard,
      toClass: destinationStd,
      fromDivision: 'ALL',
      toDivision: 'A',
      academicYear: '2026-27',
      targetAcademicYear: '2027-28',
      studentSelections: [
        {
          studentId: testStudents[0]._id,
          status: 'Promoted',
          reason: 'वार्षिक प्रगती समाधानकारक (Annual Progression)',
        },
        {
          studentId: testStudents[1]._id,
          status: 'Repeated',
          reason: `पालकांच्या विनंतीनुसार ${selectedStandard} मध्ये पुनरावृत्ती (Academic Repetition)`,
        },
      ],
    };

    const execPromoteRes = await fetch(`${BASE_URL}/portal/students/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify(promotePayload),
    });
    assert(execPromoteRes.status === 200, `Execution failed with status ${execPromoteRes.status}`);
    const execPromoteJson = await execPromoteRes.json();
    console.log('execPromoteJson:', JSON.stringify(execPromoteJson, null, 2));
    assert(execPromoteJson.success === true, 'Promotion execution was not marked successful');
    assert(execPromoteJson.promotedCount === 1, `Expected 1 promoted, got ${execPromoteJson.promotedCount}`);
    assert(execPromoteJson.repeatedCount === 1, `Expected 1 repeated, got ${execPromoteJson.repeatedCount}`);

    // Verify first student is now in destinationStd with academic history
    const s1Res = await fetch(`${BASE_URL}/portal/students/${testStudents[0]._id}`, {
      headers: { Cookie: principalCookie },
    });
    const s1Json = await s1Res.json();
    assert(s1Json.data.currentStandard === destinationStd, `Promoted student did not update to ${destinationStd}`);
    assert(s1Json.data.classGrade === destinationStd, 'classGrade out of sync');
    const s1History = s1Json.data.academicHistory;
    assert(Array.isArray(s1History) && s1History.length > 0, 'Missing academicHistory on promoted student');
    const latestProgression = s1History[s1History.length - 1];
    assert(latestProgression.status === 'Promoted', 'Latest progression status is not Promoted');
    assert(latestProgression.academicYear === '2027-28', 'Progression academic year mismatch');

    // Verify second student remains in selectedStandard with status Repeated
    const s2Res = await fetch(`${BASE_URL}/portal/students/${testStudents[1]._id}`, {
      headers: { Cookie: principalCookie },
    });
    const s2Json = await s2Res.json();
    assert(s2Json.data.currentStandard === selectedStandard, `Repeating student standard was improperly changed from ${selectedStandard}`);
    assert(s2Json.data.studentType === 'Repeater', 'Repeating student type is not Repeater');

    console.log('✅ [PASS] 7. Promotion workflow executed, student classes updated, repeaters handled, and academic progression preserved\n');

    // -------------------------------------------------------------
    // 8. Duplicate Promotion Prevention & Audit Trail History
    // -------------------------------------------------------------
    console.log('--- 8. Testing Duplicate Promotion Prevention & Audit History ---');
    // Try promoting the exact same students again for targetAcademicYear 2027-28
    const dupPromoteRes = await fetch(`${BASE_URL}/portal/students/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify(promotePayload),
    });
    assert(dupPromoteRes.status === 200, 'Duplicate request returned non-200');
    const dupPromoteJson = await dupPromoteRes.json();
    assert(dupPromoteJson.skippedCount > 0, 'Duplicate processing was not skipped');
    console.log(`Duplicate prevention successfully skipped ${dupPromoteJson.skippedCount} students.`);

    // Check Promotion Batch History Audit Log
    const historyRes = await fetch(`${BASE_URL}/portal/promotion/history`, {
      headers: { Cookie: principalCookie },
    });
    assert(historyRes.status === 200, 'Failed to fetch promotion history');
    const historyJson = await historyRes.json();
    assert(Array.isArray(historyJson.data) && historyJson.data.length > 0, 'No promotion batch logs found in audit history');
    const latestBatch = historyJson.data[0];
    assert(latestBatch.academicYear === '2026-27', 'Batch academic year mismatch');
    assert(latestBatch.targetAcademicYear === '2027-28', 'Batch target academic year mismatch');
    assert(latestBatch.promotedBy && latestBatch.promotedBy.length > 0, 'Missing principal name in batch history');

    console.log('✅ [PASS] 8. Duplicate promotion safely prevented and batch history logged with full audit details\n');

    // -------------------------------------------------------------
    // 9. Backward Compatibility Verification
    // -------------------------------------------------------------
    console.log('--- 9. Testing Backward Compatibility for Simple Promotion ---');
    const legacyPromoteRes = await fetch(`${BASE_URL}/portal/students/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ fromClass: 'इयत्ता ३ री', toClass: 'इयत्ता ४ थी' }),
    });
    if (legacyPromoteRes.status !== 200) {
      console.log('Legacy error status:', legacyPromoteRes.status, 'body:', await legacyPromoteRes.text());
    }
    assert(legacyPromoteRes.status === 200, 'Legacy simple promotion payload failed');
    const legacyJson = await legacyPromoteRes.json();
    assert(legacyJson.success === true, 'Legacy promotion was not successful');

    console.log('✅ [PASS] 9. Legacy promotion payload { fromClass, toClass } works seamlessly\n');

    console.log('====================================================');
    console.log('   ALL 9 TEST SECTIONS PASSED WITH 100% SUCCESS!    ');
    console.log('====================================================\n');
  } catch (error: any) {
    console.error('\n❌ [TEST FAILURE]:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

runTests();
