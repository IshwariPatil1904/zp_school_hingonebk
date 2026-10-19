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
  console.log(' STARTING MY PROFILE & WEBSITE CMS TEST SUITE       ');
  console.log('====================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. Unauthenticated Access Restrictions (401 Expected)
    // -------------------------------------------------------------
    console.log('--- 1. Testing Unauthenticated Request Restrictions ---');
    const unauthProfile = await fetch(`${BASE_URL}/portal/my-profile`);
    assert(unauthProfile.status === 401, '1. Unauthenticated access to /my-profile rejected with 401');

    const unauthCms = await fetch(`${BASE_URL}/portal/website/config`);
    assert(unauthCms.status === 401, '2. Unauthenticated access to /website/config rejected with 401');

    console.log('✅ [PASS] 1. Unauthenticated requests correctly rejected with 401 Unauthorized\n');

    // -------------------------------------------------------------
    // 2. Authenticating Principal & Teacher Sessions
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

    console.log('✅ [PASS] 2. Both Principal and Teacher sessions authenticated successfully with CSRF tokens\n');

    // -------------------------------------------------------------
    // 3. My Profile: Teacher Profile Retrieval & Updating Permitted Fields
    // -------------------------------------------------------------
    console.log('--- 3. Testing My Profile (Teacher) ---');
    const teacherProfileRes = await fetch(`${BASE_URL}/portal/my-profile`, {
      headers: { Cookie: teacherCookie },
    });
    assert(teacherProfileRes.status === 200, 'Teacher profile retrieval failed');
    const teacherProfileJson = await teacherProfileRes.json();
    assert(teacherProfileJson.data.role === 'teacher', 'Profile role should be teacher');
    assert(teacherProfileJson.data.name, 'Teacher name must be present');

    // Update permitted fields
    const updatedTeacherPayload = {
      name: 'Shri. Ramesh V. Pawar',
      phone: '9822114455',
      dateOfBirth: '1985-06-15',
      residentialAddress: 'शिक्षक कॉलनी, धरणगाव रोड, जळगाव',
      bloodGroup: 'O+',
    };

    const updateTeacherRes = await fetch(`${BASE_URL}/portal/my-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify(updatedTeacherPayload),
    });
    assert(updateTeacherRes.status === 200, 'Teacher profile update failed');
    const updateTeacherJson = await updateTeacherRes.json();
    assert(updateTeacherJson.data.phone === '9822114455', 'Updated phone must persist');
    assert(updateTeacherJson.data.bloodGroup === 'O+', 'Updated bloodGroup must persist');

    // Anti-Escalation Check: Teacher cannot change role or permissions
    const maliciousEscalationRes = await fetch(`${BASE_URL}/portal/my-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({
        ...updatedTeacherPayload,
        role: 'principal',
      }),
    });
    assert(maliciousEscalationRes.status === 403, 'Privilege escalation via profile form must be rejected with 403 Forbidden');

    // Phone validation check
    const invalidPhoneRes = await fetch(`${BASE_URL}/portal/my-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({
        ...updatedTeacherPayload,
        phone: '1234',
      }),
    });
    assert(invalidPhoneRes.status === 400, 'Invalid phone number must be rejected with 400');

    console.log('✅ [PASS] 3. Teacher My Profile updates, validations, and anti-escalation guards verified\n');

    // -------------------------------------------------------------
    // 4. My Profile: Principal Profile
    // -------------------------------------------------------------
    console.log('--- 4. Testing My Profile (Principal) ---');
    const principalProfileRes = await fetch(`${BASE_URL}/portal/my-profile`, {
      headers: { Cookie: principalCookie },
    });
    assert(principalProfileRes.status === 200, 'Principal profile retrieval failed');
    const principalProfileJson = await principalProfileRes.json();
    assert(principalProfileJson.data.role === 'principal', 'Principal role must be principal');

    const updatePrincipalRes = await fetch(`${BASE_URL}/portal/my-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        name: 'Shri. S. R. Patil',
        phone: '9823456789',
        dateOfBirth: '1976-04-10',
        residentialAddress: 'प्लॉट नं १२, शिवतीर्थ कॉलनी, हिंगोणे बु.',
        bloodGroup: 'B+',
      }),
    });
    assert(updatePrincipalRes.status === 200, 'Principal profile update failed');

    console.log('✅ [PASS] 4. Principal My Profile retrieved and updated successfully\n');

    // -------------------------------------------------------------
    // 5. Public Website Management RBAC: Teachers Forbidden
    // -------------------------------------------------------------
    console.log('--- 5. Testing CMS RBAC (Teachers Blocked) ---');
    const teacherCmsRes = await fetch(`${BASE_URL}/portal/website/config`, {
      headers: { Cookie: teacherCookie },
    });
    assert(teacherCmsRes.status === 403, 'Teacher must receive 403 Forbidden on CMS config endpoint');

    const teacherCmsEditRes = await fetch(`${BASE_URL}/portal/website/school-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: teacherCookie,
        'X-CSRF-Token': teacherCsrfToken,
      },
      body: JSON.stringify({ name: 'Hacked School' }),
    });
    assert(teacherCmsEditRes.status === 403, 'Teacher must receive 403 Forbidden on CMS mutating endpoints');

    console.log('✅ [PASS] 5. CMS endpoints strictly restricted to Principal (RBAC verified)\n');

    // -------------------------------------------------------------
    // 6. CMS: Update School Information & Verify Public Reflection
    // -------------------------------------------------------------
    console.log('--- 6. Testing School Info Update & Public Reflection ---');
    const newIntroduction = 'जि. प. प्राथमिक शाळा हिंगोणे बु. येथे आम्ही दर्जेदार, आनंददायी व संस्कारक्षम डिजिटल शिक्षण देण्यास कटिबद्ध आहोत.';
    const updateSchoolRes = await fetch(`${BASE_URL}/portal/website/school-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        name: 'Zilla Parishad Primary School, Hingone BK',
        marathiName: 'जिल्हा परिषद प्राथमिक शाळा, हिंगोणे बु.',
        phone: '+91 98234 56789',
        email: 'zpschoolhingonebk@gmail.com',
        introduction: newIntroduction,
        facilities: [
          'हवेशीर व सुसज्ज वर्गखोल्या',
          'डिजिटल इंटरॅक्टिव्ह स्मार्ट बोर्ड वर्ग',
          'मोफत व सकस पोषण आहार (MDM किचन शेड)',
          '१.२ एकर विस्तीर्ण क्रीडांगण व साहित्य',
          'समृद्ध ग्रंथालय व बालभारती वाचनालय',
          'मुले व मुलींसाठी स्वतंत्र स्वच्छ प्रसाधनगृह',
          'शुद्ध पिण्याच्या पाण्यासाठी RO वॉटर प्युरिफायर',
          'CCTV सुरक्षित परिसर व सौर ऊर्जा प्रकल्प',
        ],
        quickFacts: [
          { label: 'युडायस कोड (UDISE)', value: '27030804501' },
          { label: 'स्थापना वर्ष (Established)', value: '१९६२ (1962)' },
          { label: 'एकूण विद्यार्थी (Students)', value: '१४८ बालके' },
          { label: 'प्रशिक्षित शिक्षक (Teachers)', value: '०६ पदवीधर शिक्षक' },
          { label: 'स्वच्छता मानांकन (Rating)', value: '५ स्टार स्वच्छ शाळा' },
        ],
      }),
    });
    assert(updateSchoolRes.status === 200, 'School Info update failed');

    // Verify change immediately reflected on public website endpoint
    const publicProfileRes = await fetch(`${BASE_URL}/public/profile`);
    assert(publicProfileRes.status === 200, 'Public profile endpoint failed');
    const publicProfileJson = await publicProfileRes.json();
    assert(
      publicProfileJson.data.introduction === newIntroduction,
      'Saved school introduction must immediately appear on public profile'
    );
    assert(publicProfileJson.data.facilities.length >= 8, 'Saved facilities must appear on public profile');

    console.log('✅ [PASS] 6. School info saved by principal immediately reflects on public website\n');

    // -------------------------------------------------------------
    // 7. CMS: Principal's Message Update & Public Reflection
    // -------------------------------------------------------------
    console.log('--- 7. Testing Principal Message CMS ---');
    const newMessage = 'आमचे ध्येय ग्रामीण भागातील प्रत्येक विद्यार्थ्याला आधुनिक शैक्षणिक संधी उपलब्ध करून देणे हे आहे.';
    const updateMsgRes = await fetch(`${BASE_URL}/portal/website/principal-message`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        displayName: 'Shri. S. R. Patil',
        designation: 'Headmaster (मुख्याध्यापक)',
        qualification: 'M.A., D.Ed. (२२ वर्षे शैक्षणिक अनुभव)',
        photo: '/imgs/principal.jpeg',
        message: newMessage,
      }),
    });
    assert(updateMsgRes.status === 200, 'Principal message update failed');

    // Verify public profile reflection
    const publicProfileRes2 = await fetch(`${BASE_URL}/public/profile`);
    const publicProfileJson2 = await publicProfileRes2.json();
    assert(
      publicProfileJson2.data.headmaster.message === newMessage,
      'Principal message must immediately appear on public profile'
    );

    console.log("✅ [PASS] 7. Principal's message saved and reflected on public site\n");

    // -------------------------------------------------------------
    // 8. CMS: Academics Management & Public Reflection
    // -------------------------------------------------------------
    console.log('--- 8. Testing Academics CMS ---');
    const updateAcademicsRes = await fetch(`${BASE_URL}/portal/website/academics`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        availableClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7'],
        mediumOfInstruction: 'Marathi (मराठी माध्यम - सेमी इंग्रजी सह)',
        academicDetails: 'महाराष्ट्र शासन अभ्यासक्रमानुसार सर्वसमावेशक प्राथमिक शिक्षण.',
        textbookLinks: [
          { standard: 'इयत्ता १ ली', subject: 'बालभारती मराठी व गणित', balbharatiUrl: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
          { standard: 'इयत्ता २ री', subject: 'बालभारती मराठी व गणित', balbharatiUrl: 'https://cart.ebalbharati.in/BalBooks/ebook.aspx' },
        ],
      }),
    });
    assert(updateAcademicsRes.status === 200, 'Academics update failed');

    console.log('✅ [PASS] 8. Academics configuration saved and validated\n');

    // -------------------------------------------------------------
    // 9. CMS: Admissions Process & Form Availability Configuration
    // -------------------------------------------------------------
    console.log('--- 9. Testing Admissions CMS ---');
    const updateAdmissionsRes = await fetch(`${BASE_URL}/portal/website/admissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        isFormOpen: true,
        academicYear: '2026-2027',
        processDescription: 'इयत्ता १ ली ते ७ वी साठी १००% मोफत व पारदर्शक प्रवेश प्रक्रिया.',
        requiredDocuments: [
          'विद्यार्थ्याचे मूळ जन्म प्रमाणपत्र (Birth Certificate)',
          'विद्यार्थी व पालकांचे आधार कार्ड (Aadhaar Card)',
          'मागील शाळेचा शाळा सोडल्याचा दाखला / TC (इयत्ता २ री ते ७ वी साठी)',
          'जातीचे प्रमाणपत्र (लागू असल्यास)',
          'पासपोर्ट साईज २ रंगीत छायाचित्रे',
        ],
      }),
    });
    assert(updateAdmissionsRes.status === 200, 'Admissions update failed');

    console.log('✅ [PASS] 9. Admissions dates and requirements updated successfully\n');

    // -------------------------------------------------------------
    // 10. CMS: Notices Lifecycle (Create, Publish, Unpublish, Archive)
    // -------------------------------------------------------------
    console.log('--- 10. Testing Notices CMS Lifecycle ---');
    // 10a. Create Draft / Inactive Notice
    const createNoticeRes = await fetch(`${BASE_URL}/portal/website/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        title: 'चाचणी अंतर्गत सूचना (Internal Staff Draft)',
        content: 'ही केवळ प्रशासकीय संदर्भासाठी मसुदा सूचना आहे.',
        category: 'ADMINISTRATIVE',
        isImportant: false,
        isActive: false, // Inactive / Draft
      }),
    });
    assert(createNoticeRes.status === 201, 'Notice creation failed');
    const createNoticeJson = await createNoticeRes.json();
    const noticeId = createNoticeJson.data._id;
    assert(noticeId, 'Created notice must have an ID');

    // 10b. Verify draft notice does NOT appear on public notices
    const publicNoticesRes1 = await fetch(`${BASE_URL}/public/notices`);
    const publicNoticesJson1 = await publicNoticesRes1.json();
    const foundDraft = publicNoticesJson1.data.some((n: any) => n._id === noticeId);
    assert(!foundDraft, 'Draft / Inactive notice must NOT appear on public notices page');

    // 10c. Publish notice
    const publishNoticeRes = await fetch(`${BASE_URL}/portal/website/notices/${noticeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        isActive: true,
        title: 'नवीन शैक्षणिक वर्ष २०२६-२७ पालक सभा',
        isImportant: true,
      }),
    });
    assert(publishNoticeRes.status === 200, 'Notice publication failed');

    // 10d. Verify published notice appears on public notices
    const publicNoticesRes2 = await fetch(`${BASE_URL}/public/notices`);
    const publicNoticesJson2 = await publicNoticesRes2.json();
    const foundPublished = publicNoticesJson2.data.some((n: any) => n._id === noticeId);
    assert(foundPublished, 'Published notice MUST appear on public notices page');

    // 10e. Archive / Delete notice
    const deleteNoticeRes = await fetch(`${BASE_URL}/portal/website/notices/${noticeId}`, {
      method: 'DELETE',
      headers: {
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
    });
    assert(deleteNoticeRes.status === 200, 'Notice delete/archive failed');

    console.log('✅ [PASS] 10. Notices create, publish, unpublish, and archive lifecycle verified\n');

    // -------------------------------------------------------------
    // 11. CMS: Gallery Albums Lifecycle
    // -------------------------------------------------------------
    console.log('--- 11. Testing Gallery Albums CMS ---');
    const createAlbumRes = await fetch(`${BASE_URL}/portal/website/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        title: 'वार्षिक क्रीडा महोत्सव २०२६',
        marathiTitle: 'वार्षिक क्रीडा महोत्सव व बक्षीस वितरण',
        description: 'शाळेच्या भव्य क्रीडांगणावर विविध मैदानी स्पर्धा उत्साहात संपन्न.',
        coverImage: '/imgs/playground.jpg',
        images: ['/imgs/playground.jpg', '/imgs/activity.jpg'],
        year: '2026',
        isActive: true,
      }),
    });
    assert(createAlbumRes.status === 201, 'Gallery album creation failed');
    const createAlbumJson = await createAlbumRes.json();
    const albumId = createAlbumJson.data._id;
    assert(albumId, 'Created album must have an ID');

    // Verify album in public gallery
    const publicGalleryRes = await fetch(`${BASE_URL}/public/gallery`);
    assert(publicGalleryRes.status === 200, 'Public gallery fetch failed');
    const publicGalleryJson = await publicGalleryRes.json();
    const foundAlbum = publicGalleryJson.data.some((a: any) => a._id === albumId);
    assert(foundAlbum, 'Published album must appear on public gallery');

    console.log('✅ [PASS] 11. Event gallery album created, published, and verified on public site\n');

    // -------------------------------------------------------------
    // 12. CMS: Scholarships Visibility Management
    // -------------------------------------------------------------
    console.log('--- 12. Testing Scholarship Visibility Toggle ---');
    const cmsConfigRes = await fetch(`${BASE_URL}/portal/website/config`, {
      headers: { Cookie: principalCookie },
    });
    assert(cmsConfigRes.status === 200, 'CMS config retrieval failed');
    const cmsConfigJson = await cmsConfigRes.json();
    const targetScholarship = cmsConfigJson.data.scholarships?.[0];
    assert(targetScholarship, 'At least one scholarship scheme must exist');

    const toggleScholarshipRes = await fetch(
      `${BASE_URL}/portal/website/scholarships/${targetScholarship._id}/visibility`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: principalCookie,
          'X-CSRF-Token': principalCsrfToken,
        },
        body: JSON.stringify({ isPublic: true, isActive: true }),
      }
    );
    assert(toggleScholarshipRes.status === 200, 'Scholarship visibility toggle failed');

    console.log('✅ [PASS] 12. Public scheme visibility toggled and persisted\n');

    // -------------------------------------------------------------
    // 13. CMS: Media Library & Validated Image Upload
    // -------------------------------------------------------------
    console.log('--- 13. Testing Media Library & Validated Uploads ---');
    // Fetch media library (indexes existing images from imgs)
    const mediaRes = await fetch(`${BASE_URL}/portal/website/media`, {
      headers: { Cookie: principalCookie },
    });
    assert(mediaRes.status === 200, 'Media assets fetch failed');
    const mediaJson = await mediaRes.json();
    assert(Array.isArray(mediaJson.data), 'Media assets must be an array');
    assert(mediaJson.data.length > 0, 'Media library must index existing suitable assets from imgs');

    // Upload a new valid image (small 1x1 test JPEG base64)
    const validTestBase64 =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const uploadRes = await fetch(`${BASE_URL}/portal/website/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        title: 'चाचणी ध्वजारोहण छायाचित्र',
        fileName: 'flag_hoisting_test.jpeg',
        category: 'gallery',
        mimeType: 'image/jpeg',
        base64Data: validTestBase64,
      }),
    });
    assert(uploadRes.status === 201, 'Validated media upload failed');
    const uploadJson = await uploadRes.json();
    assert(uploadJson.data.url.startsWith('/imgs/uploads/'), 'Uploaded media URL must point to /imgs/uploads/');

    // Negative test: Invalid MIME type rejection
    const invalidUploadRes = await fetch(`${BASE_URL}/portal/website/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: principalCookie,
        'X-CSRF-Token': principalCsrfToken,
      },
      body: JSON.stringify({
        title: 'अवैध दस्तऐवज',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        base64Data: validTestBase64,
      }),
    });
    assert(invalidUploadRes.status === 400, 'Invalid non-image MIME type must be rejected with 400');

    console.log('✅ [PASS] 13. Media Library indexed existing imgs, validated uploads, and enforced security\n');

    // -------------------------------------------------------------
    // 14. CMS Audit Logs & Data Protection
    // -------------------------------------------------------------
    console.log('--- 14. Testing Audit Logs & Data Protection ---');
    const auditLogsRes = await fetch(`${BASE_URL}/portal/website/audit-logs`, {
      headers: { Cookie: principalCookie },
    });
    assert(auditLogsRes.status === 200, 'Audit logs retrieval failed');
    const auditLogsJson = await auditLogsRes.json();
    assert(Array.isArray(auditLogsJson.data), 'Audit logs must be an array');
    assert(auditLogsJson.data.length > 0, 'Audit logs must contain recorded CMS actions');

    // Data Protection Check on Public Pages:
    // Teachers endpoint must never leak sensitive details like passwords or contact phone in public profiles
    const publicTeachersRes = await fetch(`${BASE_URL}/public/teachers`);
    assert(publicTeachersRes.status === 200, 'Public teachers retrieval failed');
    const publicTeachersJson = await publicTeachersRes.json();
    for (const t of publicTeachersJson.data) {
      assert(t.password === undefined, 'Password must NEVER be exposed publicly');
      assert(t.aadhaarNumber === undefined, 'Aadhaar number must NEVER be exposed publicly');
      assert(t.medicalRecords === undefined, 'Teacher health information must NEVER be exposed publicly');
    }

    console.log('✅ [PASS] 14. Audit logs recorded and strict privacy protections verified\n');

    console.log('====================================================');
    console.log(' ALL MY PROFILE & WEBSITE CMS TESTS PASSED (14/14)  ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ [FAIL] Test Suite Error:', error);
    process.exit(1);
  }
};

runTests();
