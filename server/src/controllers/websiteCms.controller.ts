import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SchoolWebsiteConfig } from '../models/SchoolWebsiteConfig.model';
import { Notice } from '../models/Notice.model';
import { GalleryAlbum } from '../models/GalleryAlbum.model';
import { Scholarship } from '../models/Scholarship.model';
import { User } from '../models/User.model';
import { Teacher } from '../models/Teacher.model';
import { MediaAsset } from '../models/MediaAsset.model';
import { AuditLog } from '../models/AuditLog.model';
import fs from 'fs';
import path from 'path';

/**
 * Helper to ensure a default SchoolWebsiteConfig document exists
 */
export const getOrCreateConfig = async () => {
  let config = await SchoolWebsiteConfig.findOne();
  if (!config) {
    config = await SchoolWebsiteConfig.create({});
  }
  return config;
};

/**
 * 1. GET /api/portal/website/config
 * Retrieves complete CMS settings, notices, albums, and stats for the Principal
 */
export const getCmsConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getOrCreateConfig();
    const notices = await Notice.find().sort({ isImportant: -1, date: -1 });
    const albums = await GalleryAlbum.find().sort({ createdAt: -1 });
    const scholarships = await Scholarship.find().select('schemeName code isPublic isActive beneficiaryGroup category');
    const teachers = await User.find({ role: 'teacher', isActive: true }).select('name designation avatar teacherProfile phone');
    const mediaCount = await MediaAsset.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        config,
        notices,
        albums,
        scholarships,
        teachers,
        stats: {
          totalNotices: notices.length,
          publishedNotices: notices.filter((n) => n.isActive).length,
          totalAlbums: albums.length,
          publishedAlbums: albums.filter((a) => a.isActive).length,
          totalMedia: mediaCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. PUT /api/portal/website/school-info
 * Updates School Information, facilities, quick facts, contact info
 */
export const updateSchoolInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getOrCreateConfig();
    const {
      name,
      marathiName,
      udiseCode,
      logoUrl,
      establishedYear,
      management,
      address,
      phone,
      email,
      timings,
      introduction,
      vision,
      mission,
      facilities,
      quickFacts,
    } = req.body;

    if (name) config.schoolInfo.name = name.trim();
    if (marathiName) config.schoolInfo.marathiName = marathiName.trim();
    if (udiseCode) config.schoolInfo.udiseCode = udiseCode.trim();
    if (logoUrl) config.schoolInfo.logoUrl = logoUrl.trim();
    if (establishedYear) config.schoolInfo.establishedYear = establishedYear.trim();
    if (management) config.schoolInfo.management = management.trim();
    if (address) config.schoolInfo.address = address.trim();
    if (phone) config.schoolInfo.phone = phone.trim();
    if (email) config.schoolInfo.email = email.trim();
    if (timings) config.schoolInfo.timings = timings.trim();
    if (introduction) config.schoolInfo.introduction = introduction.trim();
    if (vision) config.schoolInfo.vision = vision.trim();
    if (mission) config.schoolInfo.mission = mission.trim();
    if (Array.isArray(facilities)) config.schoolInfo.facilities = facilities;
    if (Array.isArray(quickFacts)) config.schoolInfo.quickFacts = quickFacts;

    config.updatedBy = req.user?.name || 'मुख्याध्यापक';
    await config.save();

    await AuditLog.create({
      action: 'UPDATE_SCHOOL_INFO',
      entityType: 'WebsiteCMS',
      entityId: config._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: 'मुख्याध्यापकांनी शाळेची सर्वसाधारण माहिती, सोयी-सुविधा व महत्त्वाचे तथ्य अद्ययावत केले.',
    });

    res.status(200).json({
      success: true,
      message: 'शाळेची माहिती व सोयी-सुविधा सार्वजनिक संकेतस्थळावर यशस्वीरीत्या अद्ययावत झाल्या!',
      data: config.schoolInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PUT /api/portal/website/principal-message
 * Updates Headmaster message, photo, designation, and display name
 */
export const updatePrincipalMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getOrCreateConfig();
    const { displayName, designation, qualification, photo, message } = req.body;

    if (displayName) config.principalMessage.displayName = displayName.trim();
    if (designation) config.principalMessage.designation = designation.trim();
    if (qualification) config.principalMessage.qualification = qualification.trim();
    if (photo) config.principalMessage.photo = photo.trim();
    if (message) config.principalMessage.message = message.trim();

    config.updatedBy = req.user?.name || 'मुख्याध्यापक';
    await config.save();

    await AuditLog.create({
      action: 'UPDATE_PRINCIPAL_MESSAGE',
      entityType: 'WebsiteCMS',
      entityId: config._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: 'मुख्याध्यापकांचा अधिकृत संदेश व छायाचित्र संकेतस्थळावर अद्ययावत केले.',
    });

    res.status(200).json({
      success: true,
      message: 'मुख्याध्यापक संदेश व छायाचित्र यशस्वीरीत्या अद्ययावत झाले!',
      data: config.principalMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/portal/website/academics
 * Updates available classes, medium of instruction, and official textbook links
 */
export const updateAcademicsConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getOrCreateConfig();
    const { availableClasses, mediumOfInstruction, academicDetails, textbookLinks } = req.body;

    if (Array.isArray(availableClasses)) config.academics.availableClasses = availableClasses;
    if (mediumOfInstruction) config.academics.mediumOfInstruction = mediumOfInstruction.trim();
    if (academicDetails) config.academics.academicDetails = academicDetails.trim();
    if (Array.isArray(textbookLinks)) config.academics.textbookLinks = textbookLinks;

    config.updatedBy = req.user?.name || 'मुख्याध्यापक';
    await config.save();

    await AuditLog.create({
      action: 'UPDATE_ACADEMICS_CONFIG',
      entityType: 'WebsiteCMS',
      entityId: config._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: 'अभ्यासक्रम, शिक्षण माध्यम व बालभारती ई-पुस्तक लिंक्स अद्ययावत केल्या.',
    });

    res.status(200).json({
      success: true,
      message: 'अभ्यासक्रम माहिती व पाठ्यपुस्तक लिंक्स यशस्वीरीत्या अद्ययावत झाल्या!',
      data: config.academics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. PUT /api/portal/website/admissions-config
 * Updates admission guidelines, required documents, dates, and online form toggle
 */
export const updateAdmissionsConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getOrCreateConfig();
    const { isFormOpen, academicYear, processDescription, requiredDocuments, startDate, endDate } = req.body;

    if (isFormOpen !== undefined) config.admissionsConfig.isFormOpen = Boolean(isFormOpen);
    if (academicYear) config.admissionsConfig.academicYear = academicYear.trim();
    if (processDescription) config.admissionsConfig.processDescription = processDescription.trim();
    if (Array.isArray(requiredDocuments)) config.admissionsConfig.requiredDocuments = requiredDocuments;
    if (startDate) config.admissionsConfig.startDate = new Date(startDate);
    if (endDate) config.admissionsConfig.endDate = new Date(endDate);

    config.updatedBy = req.user?.name || 'मुख्याध्यापक';
    await config.save();

    await AuditLog.create({
      action: 'UPDATE_ADMISSIONS_CONFIG',
      entityType: 'WebsiteCMS',
      entityId: config._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `प्रवेश प्रक्रिया मार्गदर्शक तत्त्वे व ऑनलाइन फॉर्म स्थिती (${config.admissionsConfig.isFormOpen ? 'सुरू' : 'बंद'}) अद्ययावत केली.`,
    });

    res.status(200).json({
      success: true,
      message: 'प्रवेश प्रक्रिया व कागदपत्रे मार्गदर्शक तत्त्वे यशस्वीरीत्या अद्ययावत झाली!',
      data: config.admissionsConfig,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Notice CMS Management (Create, Edit, Publish/Unpublish, Archive)
 */
export const createCmsNotice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, content, category = 'GENERAL', isImportant = false, isActive = true } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'शीर्षक व मजकूर आवश्यक आहे.' });
      return;
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category,
      isImportant: Boolean(isImportant),
      isActive: Boolean(isActive),
      publishedBy: req.user?.name || 'मुख्याध्यापक कार्यालय',
      date: new Date(),
    });

    await AuditLog.create({
      action: 'CREATE_NOTICE',
      entityType: 'Notice',
      entityId: notice._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `नवीन परिपत्रक '${notice.title}' (${notice.isActive ? 'प्रकाशित' : 'मसुदा'}) तयार केले.`,
    });

    res.status(201).json({
      success: true,
      message: `परिपत्रक '${notice.title}' यशस्वीरीत्या ${notice.isActive ? 'प्रकाशित' : 'मसुदा म्हणून जतन'} केले!`,
      data: notice,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCmsNotice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category, isImportant, isActive } = req.body;

    const notice = await Notice.findById(id);
    if (!notice) {
      res.status(404).json({ success: false, message: 'परिपत्रक आढळले नाही.' });
      return;
    }

    if (title) notice.title = title.trim();
    if (content) notice.content = content.trim();
    if (category) notice.category = category;
    if (isImportant !== undefined) notice.isImportant = Boolean(isImportant);
    if (isActive !== undefined) notice.isActive = Boolean(isActive);

    await notice.save();

    await AuditLog.create({
      action: 'UPDATE_NOTICE',
      entityType: 'Notice',
      entityId: notice._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `परिपत्रक '${notice.title}' अद्ययावत केले (स्थिती: ${notice.isActive ? 'प्रकाशित' : 'अप्रकाशित'}).`,
    });

    res.status(200).json({
      success: true,
      message: `परिपत्रक अद्ययावत केले (${notice.isActive ? 'प्रकाशित' : 'अप्रकाशित / मसुदा'})!`,
      data: notice,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCmsNotice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      res.status(404).json({ success: false, message: 'परिपत्रक आढळले नाही.' });
      return;
    }

    const title = notice.title;
    await notice.deleteOne();

    await AuditLog.create({
      action: 'DELETE_NOTICE',
      entityType: 'Notice',
      entityId: id,
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `परिपत्रक '${title}' हटवले / अभिलेखबद्ध केले.`,
    });

    res.status(200).json({
      success: true,
      message: 'परिपत्रक यशस्वीरीत्या हटवले गेले!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Gallery CMS Management (Create album, Add photos, Publish/Archive)
 */
export const createCmsGalleryAlbum = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      marathiTitle = title,
      category = 'उपक्रम',
      year = '2026-27',
      description = '',
      coverImage,
      images = [],
      isActive = true,
    } = req.body;

    if (!title || !coverImage) {
      res.status(400).json({ success: false, message: 'अल्बम नाव व मुखपृष्ठ छायाचित्र आवश्यक आहेत.' });
      return;
    }

    const normalizedImages = Array.isArray(images)
      ? images.map((img: any) => {
          if (typeof img === 'string') {
            return {
              src: img,
              caption: title,
              marathiCaption: marathiTitle || title,
            };
          }
          return {
            src: img.src || '',
            caption: img.caption || title,
            marathiCaption: img.marathiCaption || marathiTitle || title,
          };
        })
      : [];

    const album = await GalleryAlbum.create({
      title: title.trim(),
      marathiTitle: (marathiTitle || title).trim(),
      category: (category || 'उपक्रम').trim(),
      year: (year || '2026-27').trim(),
      description: (description || '').trim(),
      coverImage: coverImage.trim(),
      images: normalizedImages,
      isActive: Boolean(isActive),
    });

    await AuditLog.create({
      action: 'CREATE_GALLERY_ALBUM',
      entityType: 'GalleryAlbum',
      entityId: album._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `नवीन छायाचित्र अल्बम '${album.marathiTitle}' (${album.images.length} फोटो) तयार केला.`,
    });

    res.status(201).json({
      success: true,
      message: `अल्बम '${album.marathiTitle}' यशस्वीरीत्या तयार केला!`,
      data: album,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCmsGalleryAlbum = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, marathiTitle, category, year, description, coverImage, images, isActive } = req.body;

    const album = await GalleryAlbum.findById(id);
    if (!album) {
      res.status(404).json({ success: false, message: 'अल्बम आढळला नाही.' });
      return;
    }

    if (title) album.title = title.trim();
    if (marathiTitle) album.marathiTitle = marathiTitle.trim();
    if (category) album.category = category.trim();
    if (year) album.year = year.trim();
    if (description !== undefined) album.description = description.trim();
    if (coverImage) album.coverImage = coverImage.trim();
    if (Array.isArray(images)) {
      album.images = images.map((img: any) => {
        if (typeof img === 'string') {
          return {
            src: img,
            caption: title || album.title,
            marathiCaption: marathiTitle || album.marathiTitle,
          };
        }
        return {
          src: img.src || '',
          caption: img.caption || title || album.title,
          marathiCaption: img.marathiCaption || marathiTitle || album.marathiTitle,
        };
      });
    }
    if (isActive !== undefined) album.isActive = Boolean(isActive);

    await album.save();

    await AuditLog.create({
      action: 'UPDATE_GALLERY_ALBUM',
      entityType: 'GalleryAlbum',
      entityId: album._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `छायाचित्र अल्बम '${album.marathiTitle}' अद्ययावत केला (स्थिती: ${album.isActive ? 'प्रकाशित' : 'अप्रकाशित'}).`,
    });

    res.status(200).json({
      success: true,
      message: `अल्बम '${album.marathiTitle}' यशस्वीरीत्या अद्ययावत झाला!`,
      data: album,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Scholarship Visibility Management
 */
export const toggleScholarshipVisibility = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const scholarship = await Scholarship.findById(id);
    if (!scholarship) {
      res.status(404).json({ success: false, message: 'शिष्यवृत्ती योजना आढळली नाही.' });
      return;
    }

    scholarship.isPublic = Boolean(isPublic);
    await scholarship.save();

    await AuditLog.create({
      action: 'UPDATE_SCHOLARSHIP_VISIBILITY',
      entityType: 'Scholarship',
      entityId: scholarship._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `योजना '${scholarship.schemeName}' ची सार्वजनिक दृश्यमानता (${scholarship.isPublic ? 'सक्रिय' : 'लपवली'}) केली.`,
    });

    res.status(200).json({
      success: true,
      message: `शिष्यवृत्ती योजना '${scholarship.schemeName}' ची सार्वजनिक दृश्यमानता अद्ययावत केली!`,
      data: {
        _id: scholarship._id,
        isPublic: scholarship.isPublic,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Teacher Public Profile CMS Management
 */
export const updateTeacherPublicProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { avatar, qualification, subjectSpecialization } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'शिक्षक खाते आढळले नाही.' });
      return;
    }

    if (avatar) user.avatar = avatar.trim();
    if (!user.teacherProfile) user.teacherProfile = {};
    if (qualification) user.teacherProfile.qualification = qualification.trim();
    if (Array.isArray(subjectSpecialization)) user.teacherProfile.subjectSpecialization = subjectSpecialization;

    await user.save();

    res.status(200).json({
      success: true,
      message: `शिक्षक '${user.name}' यांची सार्वजनिक प्रोफाइल माहिती अद्ययावत झाली!`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Media Assets & Validated Upload Endpoint
 */
export const getMediaAssets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If no media assets in DB, index existing suitable images from imgs folder
    const count = await MediaAsset.countDocuments();
    if (count === 0) {
      const defaultAssets = [
        { title: 'मुख्याध्यापक छायाचित्र', fileName: 'principal.jpeg', category: 'principal', url: '/imgs/principal.jpeg' },
        { title: 'शाळा इमारत १', fileName: 'school1.jpg', category: 'school', url: '/imgs/school1.jpg' },
        { title: 'शाळा इमारत २', fileName: 'school2.jpg', category: 'school', url: '/imgs/school2.jpg' },
        { title: 'शाळा मैदान', fileName: 'playground.jpg', category: 'school', url: '/imgs/playground.jpg' },
        { title: 'वृक्षारोपण मोहीम', fileName: 'plantation1.jpg', category: 'activity', url: '/imgs/plantation1.jpg' },
        { title: 'स्वच्छता अभियान', fileName: 'cleaning.jpg', category: 'activity', url: '/imgs/cleaning.jpg' },
        { title: 'आरोग्य तपासणी शिबीर', fileName: 'health_checkup.jpg', category: 'activity', url: '/imgs/health_checkup.jpg' },
        { title: 'शालेय सहल', fileName: 'trip.jpg', category: 'gallery', url: '/imgs/trip.jpg' },
        { title: 'राखी स्पर्धा', fileName: 'rakshabandhan.jpg', category: 'gallery', url: '/imgs/rakshabandhan.jpg' },
        { title: 'रंगोळी स्पर्धा', fileName: 'rangoli_comp.jpg', category: 'gallery', url: '/imgs/rangoli_comp.jpg' },
        { title: 'विद्यार्थी उपक्रम', fileName: 'activity.jpg', category: 'activity', url: '/imgs/activity.jpg' },
        { title: 'ग्रंथालय व पुस्तके', fileName: 'books.jpg', category: 'school', url: '/imgs/books.jpg' },
      ];

      for (const asset of defaultAssets) {
        await MediaAsset.create({
          title: asset.title,
          originalName: asset.fileName,
          fileName: asset.fileName,
          url: asset.url,
          mimeType: 'image/jpeg',
          sizeBytes: 250000,
          category: asset.category,
          uploadedBy: 'प्रशासक',
        });
      }
    }

    const assets = await MediaAsset.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validated Media Upload Handler
 */
export const uploadMediaAsset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, fileName, category = 'gallery', base64Data, mimeType = 'image/jpeg' } = req.body;

    if (!title || !fileName || !base64Data) {
      res.status(400).json({ success: false, message: 'शीर्षक, फाईल नाव व डेटा आवश्यक आहेत.' });
      return;
    }

    // Validation: Image MIME types only
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMime.includes(mimeType.toLowerCase())) {
      res.status(400).json({ success: false, message: 'केवळ JPEG, PNG किंवा WEBP छायाचित्रे अनुमत आहेत.' });
      return;
    }

    // Compute approximate file size from base64
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, message: 'फाईल आकार ५ MB पेक्षा कमी असावा.' });
      return;
    }

    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const uploadDir = path.join(__dirname, '../../../client/public/imgs/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/imgs/uploads/${safeFileName}`;

    const asset = await MediaAsset.create({
      title: title.trim(),
      originalName: fileName,
      fileName: safeFileName,
      url: publicUrl,
      mimeType,
      sizeBytes: buffer.length,
      category,
      uploadedBy: req.user?.name || 'मुख्याध्यापक',
    });

    await AuditLog.create({
      action: 'UPLOAD_MEDIA',
      entityType: 'MediaAsset',
      entityId: asset._id.toString(),
      performedBy: req.user?.name || 'मुख्याध्यापक',
      performedByRole: 'principal',
      details: `नवीन छायाचित्र '${asset.title}' (आकार: ${Math.round(buffer.length / 1024)} KB) अपलोड केले.`,
    });

    res.status(201).json({
      success: true,
      message: 'छायाचित्र यशस्वीरीत्या अपलोड झाले!',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. CMS Audit Logs
 */
export const getCmsAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await AuditLog.find({
      entityType: { $in: ['WebsiteCMS', 'Notice', 'GalleryAlbum', 'Scholarship', 'MediaAsset', 'User'] },
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
