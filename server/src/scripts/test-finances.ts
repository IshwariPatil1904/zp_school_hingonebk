/**
 * Automated Test Suite: Complete Financial Management Module
 * Tests calculations, permissions, overspending prevention, controlled reversals, and transaction integrity.
 */

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('================================================================');
  console.log('   AUTOMATED TEST SUITE: FINANCIAL MANAGEMENT MODULE (ZP SCHOOL)');
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
    // 1. Authenticate Principal and Teacher
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
    // 2. Financial Summary Calculation from DB Transactions
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Dynamic Financial Summary & Balance Calculations ---');

    const summaryRes = await fetch(`${BASE_URL}/portal/finance`, {
      headers: { Cookie: principalCookieHeader },
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200, 'Financial summary endpoint returns 200 OK');

    const { totalFundsReceived, totalExpenses, availableBalance } = summaryData.data;
    assert(totalFundsReceived >= 495000, `Total funds received calculated correctly from DB: ₹${totalFundsReceived.toLocaleString('en-IN')}`);
    assert(totalExpenses >= 236400, `Total expenses calculated correctly from DB: ₹${totalExpenses.toLocaleString('en-IN')}`);
    assert(
      availableBalance === totalFundsReceived - totalExpenses,
      `Available balance matches equation (Funds - Expenses): ₹${availableBalance.toLocaleString('en-IN')} (${totalFundsReceived} - ${totalExpenses} = ${availableBalance})`
    );
    assert(summaryData.data.schemesSummary.length >= 4, 'Scheme-wise grant utilization breakdown returned');

    // -------------------------------------------------------------
    // 3. View Funds (List, Search, Pagination, Transaction History)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing View Funds Endpoint with Filters & History ---');

    const fundsRes = await fetch(`${BASE_URL}/portal/finance/funds?limit=10`, {
      headers: { Cookie: principalCookieHeader },
    });
    const fundsData = await fundsRes.json();
    assert(fundsRes.status === 200, 'Funds list returns 200 OK');
    assert(fundsData.data.length >= 4, `Found ${fundsData.data.length} registered government grants`);

    const firstFund = fundsData.data[0];
    assert(!!firstFund.fundId && !!firstFund.schemeType && !!firstFund.issuedBy, 'Fund ID, scheme, and issuing authority exist');
    assert(!!firstFund.issueDate && !!firstFund.expiryDate, 'Issue date and expiry/deadline dates exist');
    assert(Array.isArray(firstFund.transactionHistory), 'Fund contains associated transaction/expense history');

    // Search filter
    const searchFundRes = await fetch(`${BASE_URL}/portal/finance/funds?search=MDM`, {
      headers: { Cookie: principalCookieHeader },
    });
    const searchFundData = await searchFundRes.json();
    assert(searchFundData.data.length > 0 && searchFundData.data[0].fundId === 'FND-2026-002', 'Search by fund ID/scheme successfully filters funds');

    // -------------------------------------------------------------
    // 4. Add Fund (Validation, Dates, Unique Fund ID, Persistence)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Add Fund with Validation & Unique Fund ID ---');

    const testFundId = `TEST-FND-${Date.now().toString().slice(-4)}`;

    // 4.1 Validate Expiry Date cannot be earlier than Issue Date
    const invalidDateFundRes = await fetch(`${BASE_URL}/portal/finance/funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        schemeType: 'ICT & Digital Classroom Grant',
        fundId: testFundId,
        amount: 25000,
        issuedBy: 'Zilla Parishad Jalgaon',
        issueDate: '2026-10-15',
        expiryDate: '2026-10-10', // Invalid: before issueDate
      }),
    });
    assert(invalidDateFundRes.status === 400, 'Rejects fund when expiry date is earlier than issue date (400 Bad Request)');

    // 4.2 Add Valid Fund by Principal
    const validFundRes = await fetch(`${BASE_URL}/portal/finance/funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        schemeType: 'ICT & Digital Classroom Grant',
        fundId: testFundId,
        amount: 30000,
        issuedBy: 'Samagra Shiksha State Office, Maharashtra',
        issueDate: '2026-10-15',
        expiryDate: '2027-03-31',
        notes: 'विद्यार्थी टॅबलेट व स्मार्ट टीव्ही इन्स्टॉलेशन निधी',
      }),
    });
    const validFundData = await validFundRes.json();
    assert(validFundRes.status === 201, `Principal successfully added new fund: ${validFundData.message}`);
    assert(validFundData.data.fundId === testFundId, 'Persisted Fund ID matches submitted value in MongoDB');

    // 4.3 Validate Duplicate Fund ID Rejection
    const duplicateFundRes = await fetch(`${BASE_URL}/portal/finance/funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        schemeType: 'ICT & Digital Classroom Grant',
        fundId: testFundId, // Duplicate
        amount: 30000,
        issuedBy: 'Zilla Parishad Jalgaon',
        issueDate: '2026-10-15',
        expiryDate: '2027-03-31',
      }),
    });
    assert(duplicateFundRes.status === 400, 'Rejects duplicate Fund ID with 400 error to ensure unique identifier integrity');

    // -------------------------------------------------------------
    // 5. Add Expense, Financial Integrity & Overspending Prevention
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Expense Recording, Overspending Policy & Duplicate Prevention ---');

    // 5.1 Overspending Policy: Reject expense exceeding fund remaining balance
    const overspendRes = await fetch(`${BASE_URL}/portal/finance/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        purpose: 'अतिखर्च प्रयत्न (Exceeding Fund Limit Test)',
        amount: 50000, // Available in test fund is only 30000
        billNumber: 'INV-OVER-01',
        vendorName: 'टेस्ट विक्रेता',
        category: 'Digital Infrastructure',
        billDate: '2026-10-16',
        associatedFundId: testFundId,
      }),
    });
    assert(overspendRes.status === 400, 'Financial integrity: Rejects expense exceeding fund balance (Negative balance prevented)');

    // 5.2 Valid Expense Recording
    const testBillNo = `BILL-TEST-${Date.now().toString().slice(-4)}`;
    const validExpenseRes = await fetch(`${BASE_URL}/portal/finance/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        purpose: 'टॅबलेट मेन्टेनन्स व HDMI अडॅप्टर खरेदी',
        amount: 5000,
        billNumber: testBillNo,
        vendorName: 'साई कॉम्प्युटर्स, जळगाव',
        category: 'Digital Infrastructure',
        billDate: '2026-10-16',
        associatedFundId: testFundId,
        notes: 'स्मार्ट क्लासरूम उपक्रम',
      }),
    });
    const validExpenseData = await validExpenseRes.json();
    assert(validExpenseRes.status === 201, `Principal successfully approved expense: ${validExpenseData.message}`);
    const createdExpenseId = validExpenseData.data._id;

    // Verify fund utilization updated in MongoDB
    const updatedFundRes = await fetch(`${BASE_URL}/portal/finance/funds?search=${testFundId}`, {
      headers: { Cookie: principalCookieHeader },
    });
    const updatedFundData = await updatedFundRes.json();
    const updatedFund = updatedFundData.data[0];
    assert(updatedFund.utilizedAmount === 5000, `Fund utilization updated: ₹${updatedFund.utilizedAmount} utilized`);
    assert(updatedFund.remainingAmount === 25000, `Fund remaining balance adjusted: ₹${updatedFund.remainingAmount} remaining`);

    // 5.3 Duplicate Bill Submission Prevention
    const duplicateBillRes = await fetch(`${BASE_URL}/portal/finance/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({
        purpose: 'Duplicate Bill Submission',
        amount: 2000,
        billNumber: testBillNo, // Duplicate bill for same vendor
        vendorName: 'साई कॉम्प्युटर्स, जळगाव',
        category: 'Digital Infrastructure',
        billDate: '2026-10-16',
        associatedFundId: testFundId,
      }),
    });
    assert(duplicateBillRes.status === 400, 'Prevents duplicate bill number submission from the same vendor');

    // -------------------------------------------------------------
    // 6. Controlled Transaction Reversal (Audit Trail & Balance Restoration)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Controlled Transaction Reversal (No Hard Deletes) ---');

    // 6.1 Reversal without reason -> 400 Bad Request
    const noReasonReversalRes = await fetch(`${BASE_URL}/portal/finance/reverse/${createdExpenseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({ reason: '' }),
    });
    assert(noReasonReversalRes.status === 400, 'Reversal requires a mandatory official reason (400 Bad Request)');

    // 6.2 Valid Controlled Reversal
    const validReversalRes = await fetch(`${BASE_URL}/portal/finance/reverse/${createdExpenseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': principalCsrf,
        Cookie: principalCookieHeader,
      },
      body: JSON.stringify({ reason: 'विक्रेत्याने देयकात त्रुटी असल्याने बिल बदलून दिले.' }),
    });
    const validReversalData = await validReversalRes.json();
    assert(validReversalRes.status === 200, `Expense successfully reversed: ${validReversalData.message}`);
    assert(validReversalData.data.status === 'Reversed', 'Expense marked as Reversed without hard deletion');

    // Verify fund balance restored in MongoDB
    const restoredFundRes = await fetch(`${BASE_URL}/portal/finance/funds?search=${testFundId}`, {
      headers: { Cookie: principalCookieHeader },
    });
    const restoredFundData = await restoredFundRes.json();
    assert(restoredFundData.data[0].utilizedAmount === 0, 'Fund utilized amount was cleanly restored after reversal (₹0)');
    assert(restoredFundData.data[0].remainingAmount === 30000, 'Fund remaining balance restored to original allocation (₹30,000)');

    // -------------------------------------------------------------
    // 7. Role-Based Access Control (RBAC): Teacher Read-Only Enforcement
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing RBAC: Teacher Read-Only Access vs Principal Management ---');

    // 7.1 Teacher can read finances, funds, and expenses
    const teacherFinanceRes = await fetch(`${BASE_URL}/portal/finance`, {
      headers: { Cookie: teacherCookieHeader },
    });
    const teacherFinanceData = await teacherFinanceRes.json();
    assert(teacherFinanceRes.status === 200, 'Teacher can view financial summary (200 OK)');
    assert(teacherFinanceData.data.readOnly === true, 'Teacher response flags readOnly: true');

    const teacherFundsRes = await fetch(`${BASE_URL}/portal/finance/funds`, {
      headers: { Cookie: teacherCookieHeader },
    });
    assert(teacherFundsRes.status === 200, 'Teacher can view funds list (200 OK)');

    const teacherExpensesRes = await fetch(`${BASE_URL}/portal/finance/expenses`, {
      headers: { Cookie: teacherCookieHeader },
    });
    assert(teacherExpensesRes.status === 200, 'Teacher can view expenses list (200 OK)');

    // 7.2 Teacher cannot add fund -> 403 Forbidden
    const teacherAddFundRes = await fetch(`${BASE_URL}/portal/finance/funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({
        schemeType: 'Unauthorized Grant',
        fundId: 'UNAUTH-FND',
        amount: 10000,
        issuedBy: 'Teacher Test',
        issueDate: '2026-10-15',
        expiryDate: '2027-03-31',
      }),
    });
    assert(teacherAddFundRes.status === 403, 'Server enforces RBAC: Teacher cannot add funds (403 Forbidden)');

    // 7.3 Teacher cannot record expense -> 403 Forbidden
    const teacherRecordExpenseRes = await fetch(`${BASE_URL}/portal/finance/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({
        purpose: 'Unauthorized Expense',
        amount: 1000,
        billNumber: 'UNAUTH-BILL',
        vendorName: 'Test Vendor',
        category: 'Maintenance',
        billDate: '2026-10-16',
        associatedFundId: 'FND-2026-001',
      }),
    });
    assert(teacherRecordExpenseRes.status === 403, 'Server enforces RBAC: Teacher cannot record expenses (403 Forbidden)');

    // 7.4 Teacher cannot reverse transaction -> 403 Forbidden
    const teacherReverseRes = await fetch(`${BASE_URL}/portal/finance/reverse/${createdExpenseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': teacherCsrf,
        Cookie: teacherCookieHeader,
      },
      body: JSON.stringify({ reason: 'Teacher attempting reversal' }),
    });
    assert(teacherReverseRes.status === 403, 'Server enforces RBAC: Teacher cannot reverse transactions (403 Forbidden)');

    // -------------------------------------------------------------
    // 8. CSV Export
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing CSV Export Endpoint ---');

    const csvRes = await fetch(`${BASE_URL}/portal/finance/export/csv`, {
      headers: { Cookie: principalCookieHeader },
    });
    const csvText = await csvRes.text();
    assert(csvRes.status === 200, 'CSV export endpoint returns 200 OK');
    assert(Boolean(csvRes.headers.get('content-type')?.includes('text/csv')), 'Content-Type is text/csv');
    assert(csvText.includes('Voucher No') && csvText.includes('Amount (INR)'), 'CSV contains proper financial column headers');
    assert(csvText.includes('CR-2026-01') && csvText.includes('EXP-2026-01'), 'CSV contains live transaction ledger records');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`   FINANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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
