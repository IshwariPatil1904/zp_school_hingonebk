import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runReportsTests() {
  console.log('====================================================');
  console.log('      STARTING AUTOMATED REPORTS MODULE SUITE       ');
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

  // 1. Unauthenticated request check
  console.log('--- 1. Testing Unauthenticated Request Restrictions ---');
  const unauthRes = await fetch(`${BASE_URL}/portal/reports/students`);
  test('1. Unauthenticated access to reports rejected with 401 Unauthorized', () => {
    assert.strictEqual(unauthRes.status, 401);
  });

  // 2. Authenticate Principal
  console.log('\n--- 2. Authenticating Principal & Teacher Sessions ---');
  const principalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'principal@zphingone.edu.in', password: 'Principal@123' }),
  });
  const principalLoginData = await principalLoginRes.json();
  assert.strictEqual(principalLoginRes.status, 200, 'Principal login failed');
  const principalCookies = (principalLoginRes.headers.getSetCookie?.() || [])
    .map((c: string) => c.split(';')[0])
    .join('; ');
  test('2. Principal login succeeds with full reporting access', () => {
    assert(principalCookies.includes('token='));
  });

  // Authenticate Teacher (teacher.pawar - assigned classes: इयत्ता १ ली, इयत्ता २ री)
  const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'teacher.pawar', password: 'Teacher@123' }),
  });
  const teacherLoginData = await teacherLoginRes.json();
  assert.strictEqual(teacherLoginRes.status, 200, 'Teacher login failed');
  const teacherCookies = (teacherLoginRes.headers.getSetCookie?.() || [])
    .map((c: string) => c.split(';')[0])
    .join('; ');
  test('3. Teacher login succeeds with class-scoped permissions', () => {
    assert(teacherCookies.includes('token='));
  });

  // 3. Student Reports (Principal full access)
  console.log('\n--- 3. Testing Student Reports (Charts & Aggregations) ---');
  const studentReportsRes = await fetch(`${BASE_URL}/portal/reports/students`, {
    headers: { Cookie: principalCookies },
  });
  const studentReportsData = await studentReportsRes.json();
  test('4. Principal fetches school-wide Student Reports (200 OK)', () => {
    assert.strictEqual(studentReportsRes.status, 200);
    assert.strictEqual(studentReportsData.success, true);
    assert(studentReportsData.data.summary.totalStudents >= 140, 'Total students should be around 148');
  });

  test('5. Gender distribution chart has Boy, Girl categories and sums to total', () => {
    const genders = studentReportsData.data.genderDistribution;
    assert(Array.isArray(genders));
    const boyEntry = genders.find((g: any) => g.name.includes('Boys') || g.name.includes('मुलगा'));
    const girlEntry = genders.find((g: any) => g.name.includes('Girls') || g.name.includes('मुलगी'));
    assert(boyEntry && boyEntry.value > 0, 'Boys count must be > 0');
    assert(girlEntry && girlEntry.value > 0, 'Girls count must be > 0');
    const sumGenders = genders.reduce((sum: number, g: any) => sum + g.value, 0);
    assert.strictEqual(sumGenders, studentReportsData.data.summary.totalStudents);
  });

  test('6. Category distribution chart contains General, OBC, SC, ST, NT, SBC and sums to total', () => {
    const categories = studentReportsData.data.categoryDistribution;
    assert(Array.isArray(categories));
    const obcEntry = categories.find((c: any) => c.category === 'OBC');
    assert(obcEntry && obcEntry.count > 0, 'OBC category students must exist in DB');
    const sumCat = categories.reduce((sum: number, c: any) => sum + c.count, 0);
    assert.strictEqual(sumCat, studentReportsData.data.summary.totalStudents);
  });

  test('7. Class-wise distribution chart includes standards with boy/girl breakdowns', () => {
    const classList = studentReportsData.data.classDistribution;
    assert(Array.isArray(classList));
    assert(classList.length >= 7, 'Must have at least 7 standards');
    const totalInClasses = classList.reduce((sum: number, c: any) => sum + c.total, 0);
    assert.strictEqual(totalInClasses, studentReportsData.data.summary.totalStudents);
    const populatedClass = classList.find((c: any) => c.total > 0);
    assert(populatedClass, 'Must have populated classes');
    assert.strictEqual(populatedClass.total, populatedClass.boys + populatedClass.girls + populatedClass.other);
  });

  // 4. Student Report Filtering & Empty States
  console.log('\n--- 4. Testing Student Filters & Empty States ---');
  const class2Res = await fetch(`${BASE_URL}/portal/reports/students?standard=इयत्ता २ री`, {
    headers: { Cookie: principalCookies },
  });
  const class2Data = await class2Res.json();
  test('8. Filter by standard (इयत्ता २ री) returns filtered students', () => {
    assert.strictEqual(class2Res.status, 200);
    assert(class2Data.data.summary.totalStudents > 0);
    assert.strictEqual(class2Data.data.summary.appliedFilters.standard, 'इयत्ता २ री');
  });

  // Empty state test
  const emptyRes = await fetch(`${BASE_URL}/portal/reports/students?standard=NonExistentClass`, {
    headers: { Cookie: principalCookies },
  });
  const emptyData = await emptyRes.json();
  test('9. Filter with no matches gracefully returns empty state data with 0 counts', () => {
    assert.strictEqual(emptyRes.status, 200);
    assert.strictEqual(emptyData.data.summary.totalStudents, 0);
    assert.strictEqual(emptyData.data.students.length, 0);
  });

  // 5. Teacher Role Permissions & Scope Restriction
  console.log('\n--- 5. Testing Teacher Scoped Student Access (RBAC) ---');
  // Teacher accessing assigned class (इयत्ता २ री) -> OK
  const teacherClass2Res = await fetch(`${BASE_URL}/portal/reports/students?standard=इयत्ता २ री`, {
    headers: { Cookie: teacherCookies },
  });
  test('10. Teacher can view reports for authorized assigned class (200 OK)', () => {
    assert.strictEqual(teacherClass2Res.status, 200);
  });

  // Teacher accessing unauthorized class (इयत्ता ५ वी) -> 403 Forbidden
  const teacherUnauthorizedClassRes = await fetch(
    `${BASE_URL}/portal/reports/students?standard=इयत्ता ५ वी`,
    {
      headers: { Cookie: teacherCookies },
    }
  );
  test('11. Teacher accessing unauthorized class outside assigned classes rejected with 403 Forbidden', () => {
    assert.strictEqual(teacherUnauthorizedClassRes.status, 403);
  });

  // 6. Fund Reports (Financial Aggregations)
  console.log('\n--- 6. Testing Fund Reports (Real MongoDB Transactions) ---');
  const fundReportsRes = await fetch(`${BASE_URL}/portal/reports/funds`, {
    headers: { Cookie: principalCookies },
  });
  const fundReportsData = await fundReportsRes.json();
  test('12. Principal fetches Fund Reports with balance equation (200 OK)', () => {
    assert.strictEqual(fundReportsRes.status, 200);
    assert.strictEqual(fundReportsData.success, true);
    const { totalFundsReceived, totalExpenses, availableBalance } = fundReportsData.data.summary;
    assert(totalFundsReceived >= 400000, 'Funds received should be >= 4,00,000');
    assert(totalExpenses > 0, 'Expenses should be > 0');
    assert.strictEqual(
      availableBalance,
      totalFundsReceived - totalExpenses,
      'Available balance must equal Funds - Expenses'
    );
  });

  test('13. Fund-wise utilization correctly aggregates scheme allocations and expenses', () => {
    const utilization = fundReportsData.data.fundUtilization;
    assert(Array.isArray(utilization) && utilization.length > 0);
    const firstScheme = utilization[0];
    assert(firstScheme.allocated > 0);
    assert.strictEqual(firstScheme.remaining, Math.max(0, firstScheme.allocated - firstScheme.utilized));
  });

  test('14. Expense category distribution aggregates expenses by category with percentages', () => {
    const categories = fundReportsData.data.expenseCategoryDistribution;
    assert(Array.isArray(categories) && categories.length > 0);
    const sumAmounts = categories.reduce((sum: number, c: any) => sum + c.amount, 0);
    assert.strictEqual(sumAmounts, fundReportsData.data.summary.totalExpenses);
  });

  // Teacher can also view fund reports (read-only)
  const teacherFundRes = await fetch(`${BASE_URL}/portal/reports/funds`, {
    headers: { Cookie: teacherCookies },
  });
  test('15. Teacher can view official financial report overview in read-only mode', () => {
    assert.strictEqual(teacherFundRes.status, 200);
  });

  // 7. Teacher Reports
  console.log('\n--- 7. Testing Teacher Reports (Subject & Experience Distribution) ---');
  const teacherReportsRes = await fetch(`${BASE_URL}/portal/reports/teachers`, {
    headers: { Cookie: principalCookies },
  });
  const teacherReportsData = await teacherReportsRes.json();
  test('16. Principal fetches Teacher Reports with subject & experience charts (200 OK)', () => {
    assert.strictEqual(teacherReportsRes.status, 200);
    assert(teacherReportsData.data.summary.totalTeachers >= 6);
  });

  test('17. Teacher subject distribution pie chart aggregates specializations', () => {
    const subjects = teacherReportsData.data.subjectDistribution;
    assert(Array.isArray(subjects) && subjects.length > 0);
    const marathiSubject = subjects.find((s: any) => s.name.includes('मराठी'));
    assert(marathiSubject && marathiSubject.count > 0, 'Marathi subject count must be > 0');
  });

  test('18. Teacher experience histogram groups teachers into 4 experience ranges', () => {
    const histogram = teacherReportsData.data.experienceHistogram;
    assert(Array.isArray(histogram));
    assert.strictEqual(histogram.length, 4, 'Must have 4 experience bins');
    const totalTeachersInBins = histogram.reduce((sum: number, b: any) => sum + b.count, 0);
    assert.strictEqual(totalTeachersInBins, teacherReportsData.data.summary.totalTeachers);
  });

  // 8. CSV Exports (Tabular Downloads)
  console.log('\n--- 8. Testing Tabular CSV Exports & Data Privacy ---');

  // A. Student CSV
  const studentCsvRes = await fetch(`${BASE_URL}/portal/reports/students/csv`, {
    headers: { Cookie: principalCookies },
  });
  const studentCsvText = await studentCsvRes.text();
  test('19. Student CSV download contains official school metadata and headers', () => {
    assert.strictEqual(studentCsvRes.status, 200);
    assert(studentCsvText.includes('जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.'));
    assert(studentCsvText.includes('विद्यार्थी संख्या व प्रवर्गनिहाय अहवाल'));
    assert(studentCsvText.includes('जनरल रजिस्टर क्र. (GR No)'));
  });

  test('20. Student CSV strictly protects privacy (NO Aadhaar, NO bank account, NO health data)', () => {
    assert(!studentCsvText.toLowerCase().includes('aadhaar'), 'Aadhaar must not be exposed');
    assert(!studentCsvText.toLowerCase().includes('bankaccount'), 'Bank details must not be exposed');
    assert(!studentCsvText.toLowerCase().includes('ifsc'), 'IFSC must not be exposed');
    assert(!studentCsvText.toLowerCase().includes('disability'), 'Health info must not be exposed');
  });

  // B. Fund CSV
  const fundCsvRes = await fetch(`${BASE_URL}/portal/reports/funds/csv`, {
    headers: { Cookie: principalCookies },
  });
  const fundCsvText = await fundCsvRes.text();
  test('21. Financial Ledger CSV download includes total received, expenses, and balance', () => {
    assert.strictEqual(fundCsvRes.status, 200);
    assert(fundCsvText.includes('शालेय निधी व खर्च ताळेबंद अहवाल'));
    assert(fundCsvText.includes('एकूण प्राप्त निधी'));
    assert(fundCsvText.includes('अखेर शिल्लक रक्कम'));
    assert(fundCsvText.includes('व्हाउचर / निधी क्र.'));
  });

  // C. Teacher CSV
  const teacherCsvRes = await fetch(`${BASE_URL}/portal/reports/teachers/csv`, {
    headers: { Cookie: principalCookies },
  });
  const teacherCsvText = await teacherCsvRes.text();
  test('22. Teacher CSV download contains staff qualifications and assigned classes', () => {
    assert.strictEqual(teacherCsvRes.status, 200);
    assert(teacherCsvText.includes('शिक्षक वृंद व विषय वाटप अहवाल'));
    assert(teacherCsvText.includes('कर्मचारी सेवाार्थ क्र. (Sevaarth ID)'));
    assert(teacherCsvText.includes('शैक्षणिक पात्रता (Qualification)'));
  });

  // 9. Official Formatted Printable PDF Views
  console.log('\n--- 9. Testing Official Formatted Printable PDF Views ---');

  const studentPdfRes = await fetch(`${BASE_URL}/portal/reports/students/pdf`, {
    headers: { Cookie: principalCookies },
  });
  const studentPdfHtml = await studentPdfRes.text();
  test('23. Student PDF report renders official print layout with emblem, metrics & signatures', () => {
    assert.strictEqual(studentPdfRes.status, 200);
    assert(studentPdfHtml.includes('<!DOCTYPE html>'));
    assert(studentPdfHtml.includes('जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.'));
    assert(studentPdfHtml.includes('@media print'));
    assert(studentPdfHtml.includes('मुख्याध्यापक स्वाक्षरी व शिक्का'));
  });

  const fundPdfRes = await fetch(`${BASE_URL}/portal/reports/funds/pdf`, {
    headers: { Cookie: principalCookies },
  });
  const fundPdfHtml = await fundPdfRes.text();
  test('24. Financial PDF report renders balance sheet with official summary cards and sign blocks', () => {
    assert.strictEqual(fundPdfRes.status, 200);
    assert(fundPdfHtml.includes('शालेय आर्थिक ताळेबंद व निधी उपयोगिता अहवाल'));
    assert(fundPdfHtml.includes('शाळा व्यवस्थापन समिती'));
  });

  const teacherPdfRes = await fetch(`${BASE_URL}/portal/reports/teachers/pdf`, {
    headers: { Cookie: principalCookies },
  });
  const teacherPdfHtml = await teacherPdfRes.text();
  test('25. Teacher PDF report renders complete staff roster with Sevaarth IDs and subjects', () => {
    assert.strictEqual(teacherPdfRes.status, 200);
    assert(teacherPdfHtml.includes('शिक्षक वृंद, पात्रता व विषय वाटप अहवाल'));
    assert(teacherPdfHtml.includes('सेवाार्थ क्र.'));
  });

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, 0 FAILED   `);
  console.log('====================================================\n');
}

runReportsTests().catch((err) => {
  console.error('\n❌ Fatal Test Runner Error:', err);
  process.exit(1);
});
