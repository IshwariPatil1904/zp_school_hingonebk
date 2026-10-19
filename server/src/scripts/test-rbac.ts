const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log('   STARTING AUTOMATED RBAC & SECURITY TEST SUITE   ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Test Unauthenticated Request (401 Expected)
    const unauthRes = await fetch(`${BASE_URL}/auth/me`);
    assert(unauthRes.status === 401, '1. Unauthenticated /api/auth/me returns 401 Unauthorized');

    // 2. Test Login as Teacher
    console.log('\n--- Testing Teacher Authentication & Permissions ---');
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'teacher.pawar', password: 'Teacher@123' }),
    });
    const teacherLoginData = await teacherLoginRes.json();
    assert(teacherLoginRes.status === 200, '2. Teacher login succeeds with username');
    assert(teacherLoginData.data.user.role === 'teacher', '3. Teacher user role is strictly "teacher"');

    // Extract cookie from Set-Cookie header
    const teacherCookies = teacherLoginRes.headers.getSetCookie?.() || [];
    const teacherCookieHeader = teacherCookies.map((c: string) => c.split(';')[0]).join('; ');
    const teacherCsrfToken = teacherLoginData.data.csrfToken;

    // 3. Test Session Restoration as Teacher
    const teacherMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: teacherCookieHeader },
    });
    const teacherMeData = await teacherMeRes.json();
    assert(teacherMeRes.status === 200 && teacherMeData.data.user.username === 'teacher.pawar', '4. Teacher session restoration returns active profile');
    assert(teacherMeData.data.permissions.includes('students:view'), '5. Teacher has "students:view" permission');
    assert(!teacherMeData.data.permissions.includes('students:admit'), '6. Teacher DOES NOT have "students:admit" permission');

    // 4. Test Authorized Teacher Requests
    const teacherStudentsRes = await fetch(`${BASE_URL}/portal/students`, {
      headers: { Cookie: teacherCookieHeader },
    });
    assert(teacherStudentsRes.status === 200, '7. Teacher can view authorized student directory (200 OK)');

    const teacherFinanceViewRes = await fetch(`${BASE_URL}/portal/finance`, {
      headers: { Cookie: teacherCookieHeader },
    });
    const teacherFinanceData = await teacherFinanceViewRes.json();
    assert(teacherFinanceViewRes.status === 200 && teacherFinanceData.readOnly === true, '8. Teacher can view finance ledger in readOnly mode');

    const teacherCertReqRes = await fetch(`${BASE_URL}/portal/certificates/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ studentName: 'पाटील वेदांत सचिन', type: 'Bonafide Certificate' }),
    });
    assert(teacherCertReqRes.status === 201, '9. Teacher can submit certificate request (201 Created)');

    // 5. Test Teacher Unauthorized Requests (403 Expected)
    console.log('\n--- Testing Teacher RBAC Restrictions (403 Enforcement) ---');
    const teacherAdmitRes = await fetch(`${BASE_URL}/portal/students/admit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ studentName: 'Unauthorized Student', grade: 'Class 1' }),
    });
    assert(teacherAdmitRes.status === 403, '10. Teacher admitting student rejected with 403 Forbidden');

    const teacherPromoteRes = await fetch(`${BASE_URL}/portal/students/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ fromClass: 'Class 1', toClass: 'Class 2' }),
    });
    assert(teacherPromoteRes.status === 403, '11. Teacher promoting student rejected with 403 Forbidden');

    const teacherExpenseRes = await fetch(`${BASE_URL}/portal/finance/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ title: 'Unauthorized Expense', amount: 5000 }),
    });
    assert(teacherExpenseRes.status === 403, '12. Teacher editing financial records rejected with 403 Forbidden');

    const teacherRosterRes = await fetch(`${BASE_URL}/portal/teachers`, {
      headers: { Cookie: teacherCookieHeader },
    });
    assert(teacherRosterRes.status === 403, '13. Teacher viewing staff roster rejected with 403 Forbidden');

    const teacherApproveCertRes = await fetch(`${BASE_URL}/portal/certificates/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ certificateId: 'CERT-001' }),
    });
    assert(teacherApproveCertRes.status === 403, '14. Teacher approving certificates rejected with 403 Forbidden');

    const teacherConfigCertRes = await fetch(`${BASE_URL}/portal/certificates/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({}),
    });
    assert(teacherConfigCertRes.status === 403, '15. Teacher configuring certificates rejected with 403 Forbidden');

    const teacherWebRes = await fetch(`${BASE_URL}/portal/website`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookieHeader,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ announcement: 'Hacked' }),
    });
    assert(teacherWebRes.status === 403, '16. Teacher updating website content rejected with 403 Forbidden');

    // 6. Test Login as Principal & Permissions
    console.log('\n--- Testing Principal Authentication & Full Administrative Access ---');
    const principalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'principal@zphingone.edu.in', password: 'Principal@123' }),
    });
    const principalLoginData = await principalLoginRes.json();
    assert(principalLoginRes.status === 200, '17. Principal login succeeds with email');
    assert(principalLoginData.data.user.role === 'principal', '18. Principal user role is strictly "principal"');

    const principalCookies = principalLoginRes.headers.getSetCookie?.() || [];
    const principalCookieHeader = principalCookies.map((c: string) => c.split(';')[0]).join('; ');
    const principalCsrfToken = principalLoginData.data.csrfToken;

    // Principal Authorized Endpoints
    const principalAdmitRes = await fetch(`${BASE_URL}/portal/students/admit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookieHeader,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ studentName: 'सुरेश पाटील', grade: 'इयत्ता १ ली' }),
    });
    assert(principalAdmitRes.status === 201, '19. Principal can admit student (201 Created)');

    const principalPromoteRes = await fetch(`${BASE_URL}/portal/students/promote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookieHeader,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ fromClass: 'इयत्ता १ ली', toClass: 'इयत्ता २ री' }),
    });
    assert(principalPromoteRes.status === 200, '20. Principal can promote students (200 OK)');

    const principalExpenseRes = await fetch(`${BASE_URL}/portal/finance/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookieHeader,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ title: 'प्रयोगशाळा उपकरणे खरेदी', amount: 4500 }),
    });
    assert(principalExpenseRes.status === 201, '21. Principal can record and approve expense (201 Created)');

    const principalApproveCertRes = await fetch(`${BASE_URL}/portal/certificates/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookieHeader,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ certificateId: 'CERT-2026-089' }),
    });
    assert(principalApproveCertRes.status === 200, '22. Principal can approve certificate (200 OK)');

    const principalTeachersRes = await fetch(`${BASE_URL}/portal/teachers`, {
      headers: { Cookie: principalCookieHeader },
    });
    const principalTeachersData = await principalTeachersRes.json();
    assert(principalTeachersRes.status === 200 && principalTeachersData.data.length > 0, '23. Principal can view teacher staff roster');

    // 7. Test Password Change
    console.log('\n--- Testing Password Change Endpoint ---');
    const changePassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookieHeader,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({ currentPassword: 'Principal@123', newPassword: 'NewPrincipal@2026' }),
    });
    assert(changePassRes.status === 200, '24. Password change succeeds with valid current password');

    // Revert password back to Principal@123
    const changePassData = await changePassRes.json();
    const revertCsrf = changePassData.data?.csrfToken || principalCsrfToken;
    const tokenCookie = principalCookies.find((c: string) => c.startsWith('token='))?.split(';')[0] || '';
    const revertCookieHeader = `${tokenCookie}; csrfToken=${revertCsrf}`;

    const revertPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: revertCookieHeader,
        'X-CSRF-Token': revertCsrf,
      },
      body: JSON.stringify({ currentPassword: 'NewPrincipal@2026', newPassword: 'Principal@123' }),
    });
    assert(revertPassRes.status === 200, '25. Password safely reverted back to Principal@123');

    // 8. Test CSRF Protection
    console.log('\n--- Testing CSRF Protection ---');
    const forgedRes = await fetch(`${BASE_URL}/portal/students/admit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookieHeader,
        'X-CSRF-Token': 'invalid_forged_token',
      },
      body: JSON.stringify({ studentName: 'Forged Request' }),
    });
    assert(forgedRes.status === 403, '26. Invalid CSRF token rejected with 403 Forbidden');

    console.log('\n====================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED   `);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runTests();

export {};
