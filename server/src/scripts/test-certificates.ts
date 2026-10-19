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

async function runCertificatesTests() {
  console.log('====================================================');
  console.log('   STARTING AUTOMATED CERTIFICATES WORKFLOW SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  const test = (name: string, fn: () => void | Promise<void>) => {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`✅ [PASS] ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`❌ [FAIL] ${name}:`, err.message);
            throw err;
          });
      } else {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  };

  // 1. Authenticate Teacher (teacher.pawar)
  console.log('--- 1. Authenticating Teacher & Principal Accounts ---');
  const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'teacher.pawar', password: 'Teacher@123' }),
  });
  const teacherLoginData = await teacherLoginRes.json();
  assert.strictEqual(teacherLoginRes.status, 200, 'Teacher login failed');
  const teacherCookies = (teacherLoginRes.headers.getSetCookie?.() || []).map((c: string) => c.split(';')[0]).join('; ');
  const teacherCsrf = teacherLoginData.data?.csrfToken || '';
  test('1. Teacher login succeeds and receives session cookies', () => {
    assert(teacherCookies.includes('token='));
  });

  // Authenticate Principal (principal@zphingone.edu.in)
  const principalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'principal@zphingone.edu.in', password: 'Principal@123' }),
  });
  const principalLoginData = await principalLoginRes.json();
  assert.strictEqual(principalLoginRes.status, 200, 'Principal login failed');
  const principalCookies = (principalLoginRes.headers.getSetCookie?.() || []).map((c: string) => c.split(';')[0]).join('; ');
  const principalCsrf = principalLoginData.data?.csrfToken || '';
  test('2. Principal login succeeds with administrative session', () => {
    assert(principalCookies.includes('token='));
  });

  // 2. Teacher Submits 3 Certificate Types
  console.log('\n--- 2. Testing Teacher Certificate Request Workflow ---');

  // A. Bonafide Certificate
  const bonafideReqRes = await fetch(`${BASE_URL}/portal/certificates/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({
      studentName: 'पाटील वेदांत सचिन',
      grNumber: '1351',
      classGrade: 'इयत्ता १ ली',
      division: 'A',
      type: 'Bonafide Certificate',
      purpose: 'बचत खाते उघडणे व आधार पडताळणी',
      academicYear: '2026-27',
    }),
  });
  const bonafideReqData = await bonafideReqRes.json();
  test('3. Teacher can submit Bonafide Certificate request (201 Created)', () => {
    assert.strictEqual(bonafideReqRes.status, 201);
    assert.strictEqual(bonafideReqData.success, true);
    assert.strictEqual(bonafideReqData.data.status, 'Pending');
    assert(bonafideReqData.data.certificateNo.startsWith('BON-2026-'));
  });
  const bonafideId = bonafideReqData.data._id;
  const bonafideNo = bonafideReqData.data.certificateNo;

  // B. Leaving Certificate
  const leavingReqRes = await fetch(`${BASE_URL}/portal/certificates/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({
      studentName: 'सोनवणे आरव गणेश',
      grNumber: '1375',
      classGrade: 'इयत्ता २ री',
      division: 'A',
      type: 'Leaving Certificate',
      reasonForLeaving: 'पालकांची अन्य जिल्ह्यात बदली झाल्यामुळे',
      conduct: 'उत्कृष्ट (Excellent)',
      progress: 'चांगली (Good)',
      leavingDate: '2026-10-18',
    }),
  });
  const leavingReqData = await leavingReqRes.json();
  test('4. Teacher can submit Leaving Certificate request with conduct & reason (201 Created)', () => {
    assert.strictEqual(leavingReqRes.status, 201);
    assert.strictEqual(leavingReqData.data.status, 'Pending');
    assert(leavingReqData.data.certificateNo.startsWith('LC-2026-'));
  });
  const leavingId = leavingReqData.data._id;

  // C. Scholarship Certificate
  const scholarshipReqRes = await fetch(`${BASE_URL}/portal/certificates/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({
      studentName: 'भदाणे तन्वी प्रवीण',
      grNumber: '1398',
      classGrade: 'इयत्ता ३ री',
      division: 'A',
      type: 'Scholarship Certificate',
      scholarshipSchemeName: 'सावित्रीबाई फुले कन्या शिष्यवृत्ती योजना',
      sanctionAmount: 1000,
      academicYear: '2026-27',
      purpose: 'महाडीबीटी शिष्यवृत्ती मंजुरी अभिलेख',
    }),
  });
  const scholarshipReqData = await scholarshipReqRes.json();
  test('5. Teacher can submit Scholarship Certificate request with scheme & amount (201 Created)', () => {
    assert.strictEqual(scholarshipReqRes.status, 201);
    assert.strictEqual(scholarshipReqData.data.status, 'Pending');
    assert(scholarshipReqData.data.certificateNo.startsWith('SCH-2026-'));
  });
  const scholarshipId = scholarshipReqData.data._id;

  // 3. Security & RBAC Enforcement on Teacher
  console.log('\n--- 3. Testing RBAC Security Restrictions for Teachers (403 Expected) ---');

  const teacherApproveRes = await fetch(`${BASE_URL}/portal/certificates/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({ certificateId: bonafideId }),
  });
  test('6. Teacher attempting to approve certificate is rejected with 403 Forbidden', () => {
    assert.strictEqual(teacherApproveRes.status, 403);
  });

  const teacherRejectRes = await fetch(`${BASE_URL}/portal/certificates/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({ certificateId: leavingId, rejectionReason: 'Unauthorized' }),
  });
  test('7. Teacher attempting to reject certificate is rejected with 403 Forbidden', () => {
    assert.strictEqual(teacherRejectRes.status, 403);
  });

  const teacherConfigRes = await fetch(`${BASE_URL}/portal/certificates/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({ activeTemplate: 'Bonafide Certificate' }),
  });
  test('8. Teacher attempting to update certificate config is rejected with 403 Forbidden', () => {
    assert.strictEqual(teacherConfigRes.status, 403);
  });

  const teacherRestoreRes = await fetch(`${BASE_URL}/portal/certificates/config/restore-default`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookies,
      'X-CSRF-Token': teacherCsrf,
    },
    body: JSON.stringify({}),
  });
  test('9. Teacher attempting to restore default settings is rejected with 403 Forbidden', () => {
    assert.strictEqual(teacherRestoreRes.status, 403);
  });

  // 4. Download Restrictions on Pending Certificates
  console.log('\n--- 4. Testing Download Integrity on Pending Certificates ---');
  const downloadPendingRes = await fetch(`${BASE_URL}/portal/certificates/${bonafideId}/download`, {
    headers: { Cookie: teacherCookies },
  });
  test('10. Downloading a Pending certificate is blocked with 400 Bad Request', () => {
    assert.strictEqual(downloadPendingRes.status, 400);
  });

  const printPendingRes = await fetch(`${BASE_URL}/portal/certificates/${bonafideId}/pdf`, {
    headers: { Cookie: teacherCookies },
  });
  test('11. Direct PDF/Print of a Pending certificate is blocked with 400 Bad Request', () => {
    assert.strictEqual(printPendingRes.status, 400);
  });

  // 5. Principal Workflow (Approve, Reject with Reason)
  console.log('\n--- 5. Testing Principal Approval and Rejection Workflow ---');

  // Principal views list
  const listRes = await fetch(`${BASE_URL}/portal/certificates`, {
    headers: { Cookie: principalCookies },
  });
  const listData = await listRes.json();
  test('12. Principal can view certificate requests list with status counts', () => {
    assert.strictEqual(listRes.status, 200);
    assert(listData.pendingCount >= 3);
    assert(Array.isArray(listData.data));
  });

  // Principal approves Bonafide Certificate
  const principalApproveRes = await fetch(`${BASE_URL}/portal/certificates/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: principalCookies,
      'X-CSRF-Token': principalCsrf,
    },
    body: JSON.stringify({ certificateId: bonafideId }),
  });
  const principalApproveData = await principalApproveRes.json();
  test('13. Principal successfully approves Bonafide Certificate (200 OK)', () => {
    assert.strictEqual(principalApproveRes.status, 200);
    assert.strictEqual(principalApproveData.data.status, 'Approved');
    assert(principalApproveData.data.approvedBy.includes('Principal'));
    assert(principalApproveData.data.approvedDate);
    assert(principalApproveData.data.templateConfigSnapshot);
  });

  // Principal rejects Leaving Certificate with mandatory/custom reason
  const principalRejectRes = await fetch(`${BASE_URL}/portal/certificates/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: principalCookies,
      'X-CSRF-Token': principalCsrf,
    },
    body: JSON.stringify({
      certificateId: leavingId,
      rejectionReason: 'पालकांचे प्रत्यक्ष विनंती अर्ज व संमतीपत्र दाखल केलेले नाही.',
    }),
  });
  const principalRejectData = await principalRejectRes.json();
  test('14. Principal successfully rejects request with mandatory rejection reason', () => {
    assert.strictEqual(principalRejectRes.status, 200);
    assert.strictEqual(principalRejectData.data.status, 'Rejected');
    assert(principalRejectData.data.rejectionReason.includes('संमतीपत्र दाखल केलेले नाही'));
    assert(principalRejectData.data.rejectedBy.includes('Principal'));
  });

  // Principal approves Scholarship Certificate
  const principalApproveSchRes = await fetch(`${BASE_URL}/portal/certificates/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: principalCookies,
      'X-CSRF-Token': principalCsrf,
    },
    body: JSON.stringify({ certificateId: scholarshipId }),
  });
  test('15. Principal successfully approves Scholarship Certificate (200 OK)', () => {
    assert.strictEqual(principalApproveSchRes.status, 200);
  });

  // 6. Download Restrictions on Rejected Certificates
  console.log('\n--- 6. Testing Download Integrity on Rejected Certificates ---');
  const downloadRejectedRes = await fetch(`${BASE_URL}/portal/certificates/${leavingId}/download`, {
    headers: { Cookie: teacherCookies },
  });
  test('16. Downloading a Rejected certificate is strictly blocked with 400 Bad Request', () => {
    assert.strictEqual(downloadRejectedRes.status, 400);
  });

  // 7. Approved Certificate Download & Idempotency
  console.log('\n--- 7. Testing Approved Certificate Download & Idempotency ---');
  const downloadApproveRes1 = await fetch(`${BASE_URL}/portal/certificates/${bonafideId}/download`, {
    headers: { Cookie: teacherCookies },
  });
  const downloadApproveData1 = await downloadApproveRes1.json();
  if (downloadApproveRes1.status !== 200) {
    console.error('Download Error:', downloadApproveRes1.status, downloadApproveData1);
  }
  test('17. Authorized Teacher downloads Approved certificate with filled template data', () => {
    assert.strictEqual(downloadApproveRes1.status, 200);
    assert.strictEqual(downloadApproveData1.success, true);
    assert.strictEqual(downloadApproveData1.data.certificate.certificateNo, bonafideNo);
    assert.strictEqual(downloadApproveData1.data.downloadCount, 1);
    console.log('Filled Body is:', downloadApproveData1.data.filledBody);
    assert(downloadApproveData1.data.filledBody.includes('पाटील वेदांत सचिन'));
    assert(downloadApproveData1.data.filledBody.includes('1351'));
  });

  // Re-download certificate - ensures duplicate certificate numbers are NEVER created!
  const downloadApproveRes2 = await fetch(`${BASE_URL}/portal/certificates/${bonafideId}/download`, {
    headers: { Cookie: teacherCookies },
  });
  const downloadApproveData2 = await downloadApproveRes2.json();
  test('18. Re-downloading certificate preserves certificateNo and increments downloadCount (Idempotent)', () => {
    assert.strictEqual(downloadApproveRes2.status, 200);
    assert.strictEqual(downloadApproveData2.data.certificate.certificateNo, bonafideNo);
    assert.strictEqual(downloadApproveData2.data.downloadCount, 2);
  });

  // 8. PDF/Print View Generation
  console.log('\n--- 8. Testing Official PDF/Print View Generation ---');
  const printPdfRes = await fetch(`${BASE_URL}/portal/certificates/${bonafideId}/pdf`, {
    headers: { Cookie: principalCookies },
  });
  const printPdfHtml = await printPdfRes.text();
  test('19. PDF/Print endpoint returns complete, printable official document with CSS & seal', () => {
    assert.strictEqual(printPdfRes.status, 200);
    assert(printPdfHtml.includes('<!DOCTYPE html>'));
    assert(printPdfHtml.includes('जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.'));
    assert(printPdfHtml.includes(bonafideNo));
    assert(printPdfHtml.includes('पाटील वेदांत सचिन'));
    assert(printPdfHtml.includes('@media print'));
    assert(printPdfHtml.includes('ZP SEAL'));
  });

  // 9. Certificate Settings (Principal Only)
  console.log('\n--- 9. Testing Certificate Settings Configuration (Principal Only) ---');

  // Fetch current config
  const getConfigRes = await fetch(`${BASE_URL}/portal/certificates/config`, {
    headers: { Cookie: principalCookies },
  });
  const getConfigData = await getConfigRes.json();
  test('20. Principal can fetch active certificate template configurations', () => {
    assert.strictEqual(getConfigRes.status, 200);
    assert(getConfigData.data.templates.bonafide);
    assert(getConfigData.data.templates.leaving);
    assert(getConfigData.data.templates.scholarship);
  });

  // Update config with purple swatch and custom header
  const updateConfigRes = await fetch(`${BASE_URL}/portal/certificates/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: principalCookies,
      'X-CSRF-Token': principalCsrf,
    },
    body: JSON.stringify({
      activeTemplate: 'Bonafide Certificate',
      templates: {
        bonafide: {
          header: 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु. (सुवर्ण महोत्सवी वर्ष)',
          accentColor: 'purple',
          showBorder: true,
          showSeal: true,
        },
      },
    }),
  });
  const updateConfigData = await updateConfigRes.json();
  test('21. Principal updates Bonafide template with custom header and purple accent color swatch', () => {
    assert.strictEqual(updateConfigRes.status, 200);
    assert.strictEqual(updateConfigData.data.templates.bonafide.accentColor, 'purple');
    assert(updateConfigData.data.templates.bonafide.header.includes('सुवर्ण महोत्सवी वर्ष'));
  });

  // Restore default settings
  const restoreRes = await fetch(`${BASE_URL}/portal/certificates/config/restore-default`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: principalCookies,
      'X-CSRF-Token': principalCsrf,
    },
    body: JSON.stringify({}),
  });
  const restoreData = await restoreRes.json();
  test('22. Principal can restore certificate templates to factory defaults', () => {
    assert.strictEqual(restoreRes.status, 200);
    assert.strictEqual(restoreData.data.templates.bonafide.accentColor, 'green');
    assert.strictEqual(restoreData.data.templates.bonafide.header, 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.');
  });

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, 0 FAILED   `);
  console.log('====================================================\n');
}

runCertificatesTests().catch((err) => {
  console.error('\n❌ Fatal Test Runner Error:', err);
  process.exit(1);
});
