import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User.model';
import { Teacher } from '../models/Teacher.model';
import { SchoolWebsiteConfig } from '../models/SchoolWebsiteConfig.model';

const updateStaffNames = async (): Promise<void> => {
  if (!process.argv.includes('--confirm')) {
    throw new Error('This updates existing MongoDB records. Re-run with -- --confirm after verifying MONGODB_URI points to the intended database.');
  }

  try {
    await connectDB();

    const principal = await User.findOne({ role: 'principal' });
    const teacher = await User.findOne({
      role: 'teacher',
      $or: [{ username: 'teacher.pawar' }, { email: 'teacher.pawar@zphingone.edu.in' }],
    });

    if (!principal || !teacher) {
      throw new Error('Could not find both the existing principal and teacher accounts. No staff records were changed.');
    }

    principal.name = 'Ajaykumar Patil';
    teacher.name = 'Ujwala Pawar';

    const teacherRecord = await Teacher.findOne({
      $or: [{ linkedUserId: teacher._id }, { email: teacher.email }],
    });

    const websiteConfig = await SchoolWebsiteConfig.findOne();
    if (websiteConfig) {
      websiteConfig.principalMessage.displayName = 'Ajaykumar Patil';
    }

    await Promise.all([
      principal.save(),
      teacher.save(),
      teacherRecord ? Teacher.updateOne({ _id: teacherRecord._id }, { $set: { name: 'Ujwala Pawar' } }) : Promise.resolve(),
      websiteConfig?.save(),
    ]);

    console.log('Updated principal and teacher display names. Usernames, email addresses, passwords, and other staff data were unchanged.');
    if (!teacherRecord) {
      console.warn('No linked Teacher roster record was found for the teacher account; the account name was updated.');
    }
    if (!websiteConfig) {
      console.warn('No school website config exists yet; its default principal name is Ajaykumar Patil.');
    }
  } finally {
    await mongoose.disconnect();
  }
};

updateStaffNames().catch((error: unknown) => {
  console.error('[Staff name update] Failed:', error);
  process.exitCode = 1;
});
