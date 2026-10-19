import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Teacher } from '../models/Teacher.model';
import { AuditLog } from '../models/AuditLog.model';

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];

/**
 * 1. GET /api/portal/my-profile
 * Fetches current authenticated staff member profile (Principal or Teacher)
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized session.' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }

    // If teacher, fetch linked teacher document if exists
    let teacherDoc = null;
    if (user.role === 'teacher') {
      teacherDoc = await Teacher.findOne({
        $or: [{ linkedUserId: user._id }, { email: user.email }],
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        designation: user.designation,
        phone: user.phone || teacherDoc?.contactPhone || '',
        dateOfBirth: user.dateOfBirth || teacherDoc?.dateOfBirth,
        residentialAddress: user.residentialAddress || teacherDoc?.residentialAddress || '',
        bloodGroup: user.bloodGroup || teacherDoc?.bloodGroup || 'B+',
        avatar: user.avatar || '',
        teacherProfile: user.teacherProfile || {
          employeeId: teacherDoc?.employeeId || '',
          qualification: teacherDoc?.qualification || '',
          assignedClasses: teacherDoc?.assignedClasses || [],
          subjectSpecialization: teacherDoc?.subjectSpecialization || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. PUT /api/portal/my-profile
 * Updates permitted personal fields: name, phone, dateOfBirth, residentialAddress, bloodGroup.
 * Strictly prevents role escalation, permission changes, or username modifications.
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized session.' });
      return;
    }

    const {
      name,
      phone,
      dateOfBirth,
      residentialAddress,
      bloodGroup,
      avatar,
      // Malicious/escalation attempts:
      role: attemptedRole,
      permissions: attemptedPermissions,
      username: attemptedUsername,
    } = req.body;

    // Strict RBAC Guard: Role and permissions cannot be changed through profile form
    if (attemptedRole && attemptedRole !== req.user.role) {
      res.status(403).json({
        success: false,
        message: 'सुरक्षा प्रतिबंध: प्रोफाइल फॉर्मद्वारे वापरकर्ता पद (Role) किंवा परवानग्या बदलता येत नाहीत.',
      });
      return;
    }

    // Input Validations
    if (name && typeof name === 'string' && name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'कृपया वैध पूर्ण नाव प्रविष्ट करा.' });
      return;
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\s+/g, '').replace('+91', '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        res.status(400).json({ success: false, message: 'कृपया वैध १० अंकी मोबाईल क्रमांक प्रविष्ट करा.' });
        return;
      }
    }

    if (bloodGroup && !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      res.status(400).json({ success: false, message: 'कृपया वैध रक्तगट निवडा.' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Update permitted fields
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (residentialAddress !== undefined) user.residentialAddress = String(residentialAddress).trim();
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (avatar !== undefined) user.avatar = String(avatar).trim();

    await user.save();

    // If teacher, synchronize personal fields to linked Teacher document
    if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({
        $or: [{ linkedUserId: user._id }, { email: user.email }],
      });
      if (teacher) {
        if (name) teacher.name = name.trim();
        if (phone) teacher.contactPhone = String(phone).trim();
        if (dateOfBirth) teacher.dateOfBirth = new Date(dateOfBirth);
        if (residentialAddress) teacher.residentialAddress = String(residentialAddress).trim();
        if (bloodGroup) teacher.bloodGroup = bloodGroup as any;
        await teacher.save();
      }
    }

    // Record audit log
    await AuditLog.create({
      action: 'UPDATE_PROFILE',
      entityType: 'User',
      entityId: user._id.toString(),
      performedBy: user.name,
      performedByRole: user.role,
      details: `${user.role === 'principal' ? 'मुख्याध्यापक' : 'शिक्षक'} यांनी वैयक्तिक प्रोफाइल अद्ययावत केले.`,
    });

    res.status(200).json({
      success: true,
      message: 'आपली प्रोफाइल माहिती यशस्वीरीत्या जतन करण्यात आली!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        designation: user.designation,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        residentialAddress: user.residentialAddress,
        bloodGroup: user.bloodGroup,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
