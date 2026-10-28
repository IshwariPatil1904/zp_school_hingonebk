import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { User } from '../models/User.model';

export const runBootstrap = async (): Promise<void> => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      console.log('[Bootstrap] Connecting to MongoDB:', ENV.MONGODB_URI);
      await mongoose.connect(ENV.MONGODB_URI);
    }

    const principalName = ENV.BOOTSTRAP_PRINCIPAL_NAME || 'Shri. S. R. Patil';
    const principalEmail = (ENV.BOOTSTRAP_PRINCIPAL_EMAIL || 'principal@zphingone.edu.in').toLowerCase().trim();
    const principalUsername = (ENV.BOOTSTRAP_PRINCIPAL_USERNAME || 'principal').toLowerCase().trim();
    const principalPassword = ENV.BOOTSTRAP_PRINCIPAL_PASSWORD;

    if (!principalPassword) {
      throw new Error('BOOTSTRAP_PRINCIPAL_PASSWORD is required to initialize the initial principal account.');
    }

    const existingPrincipal = await User.findOne({ role: 'principal' });

    if (existingPrincipal) {
      console.log(`[Bootstrap] Principal account already exists: ${existingPrincipal.email} (${existingPrincipal.username})`);
    } else {
      console.log('[Bootstrap] No principal account found. Initializing primary administrative account...');

      const principalData = {
        name: principalName,
        email: principalEmail,
        username: principalUsername,
        password: principalPassword,
        role: 'principal' as const,
        phone: '+91 98234 56789',
        designation: 'Headmaster / मुख्याध्यापक',
        avatar: '/imgs/principal.jpeg',
        isActive: true,
      };

      await User.create(principalData);
      console.log(`[Bootstrap] Successfully created Principal account: ${principalData.email}`);
    }

    const teacherPassword = ENV.BOOTSTRAP_TEACHER_PASSWORD;
    if (!teacherPassword) {
      throw new Error('BOOTSTRAP_TEACHER_PASSWORD is required to initialize teacher demo accounts.');
    }

    const teachers = [
      {
        name: 'Smt. K. N. Pawar',
        email: 'teacher.pawar@zphingone.edu.in',
        username: 'teacher.pawar',
        password: teacherPassword,
        role: 'teacher' as const,
        phone: '+91 98765 43210',
        designation: 'Senior Primary Teacher (इयत्ता १ व २)',
        avatar: '',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2015-0812',
          qualification: 'M.A., D.Ed. (मराठी माध्यम)',
          joiningDate: new Date('2015-06-15'),
          assignedClasses: ['इयत्ता १ ली', 'इयत्ता २ री'],
          subjectSpecialization: ['मराठी', 'परिसर अभ्यास', 'हस्तकला'],
        },
      },
      {
        name: 'Shri. R. V. Shinde',
        email: 'teacher.shinde@zphingone.edu.in',
        username: 'teacher.shinde',
        password: teacherPassword,
        role: 'teacher' as const,
        phone: '+91 98111 22233',
        designation: 'Science & Mathematics Specialist (इयत्ता ३ व ४)',
        avatar: '',
        isActive: true,
        teacherProfile: {
          employeeId: 'SEV-2018-0433',
          qualification: 'B.Sc., B.Ed. (गणित व विज्ञान)',
          joiningDate: new Date('2018-08-01'),
          assignedClasses: ['इयत्ता ३ री', 'इयत्ता ४ थी'],
          subjectSpecialization: ['गणित', 'सामान्य विज्ञान', 'इंग्रजी'],
        },
      },
    ];

    for (const t of teachers) {
      const exists = await User.findOne({ email: t.email });
      if (!exists) {
        await User.create(t);
        console.log(`[Bootstrap] Created Teacher account: ${t.email}`);
      }
    }

    console.log('[Bootstrap] Staff role initialization complete.');
  } catch (error) {
    console.error('[Bootstrap] Error during bootstrap:', error);
    throw error;
  }
};

// If run directly from terminal
if (require.main === module) {
  runBootstrap()
    .then(() => {
      console.log('[Bootstrap] Exiting gracefully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Bootstrap] Fatal error:', err);
      process.exit(1);
    });
}
