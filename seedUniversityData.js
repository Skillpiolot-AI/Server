/**
 * seedUniversityData.js
 * Seeds realistic Teachers and Students for SkillPilot University of Technology
 * Covers: User, Student, TeacherAccess, StudentActivity schemas fully
 * Run: node seedUniversityData.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const University = require('./models/University');
const Student = require('./models/Student');
const TeacherAccess = require('./models/TeacherAccess');
const StudentActivity = require('./models/StudentActivity');

// ─── Constants ───────────────────────────────────────────────────────────────
const UNIVERSITY_ID = '69b7a8fa8a332f70dba085c4';
const UNI_ADMIN_EMAIL = 'uniadmin@sput.skillpilot.dev';
const DEFAULT_TEACHER_PASS = 'Teacher@2024!';
const DEFAULT_STUDENT_PASS = 'Student@2024!';

const DEPT = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA'];
const YEARS = ['2021', '2022', '2023', '2024'];
const BATCHES = ['2021-2025', '2022-2026', '2023-2027', '2024-2028'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const OS_LIST = ['Windows 11', 'macOS Ventura', 'Ubuntu 22.04', 'Android 14', 'iOS 17'];
const CITIES = ['Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'Chennai'];
const IPS = ['192.168.1.', '10.0.0.', '172.16.0.', '203.0.113.'];
const ACTIVITY_TYPES = [
  'login',
  'logout',
  'profile_access',
  'course_access',
  'assignment_submit',
  'grade_view',
  'library_access',
  'lab_access',
  'portal_navigation',
  'file_download',
  'quiz_attempt',
  'video_watch',
  'schedule_view',
  'attendance_mark',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dp = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));
const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const uid = () => Math.random().toString(36).substring(2, 10);

// ─── Teacher Data ─────────────────────────────────────────────────────────────
const TEACHERS = [
  {
    name: 'Dr. Priya Sharma',
    dept: 'Computer Science',
    reg: 'TCH-CS-001',
    email: 'priya.sharma@sput.skillpilot.dev',
    specialization: 'Machine Learning & AI',
    exp: 12,
  },
  {
    name: 'Prof. Ankit Verma',
    dept: 'Information Technology',
    reg: 'TCH-IT-002',
    email: 'ankit.verma@sput.skillpilot.dev',
    specialization: 'Database Systems & Cloud',
    exp: 8,
  },
  {
    name: 'Dr. Sneha Kulkarni',
    dept: 'Electronics',
    reg: 'TCH-EC-003',
    email: 'sneha.kulkarni@sput.skillpilot.dev',
    specialization: 'VLSI Design & Embedded Sys',
    exp: 10,
  },
  {
    name: 'Prof. Rajiv Nair',
    dept: 'Mechanical',
    reg: 'TCH-ME-004',
    email: 'rajiv.nair@sput.skillpilot.dev',
    specialization: 'Thermodynamics & Fluid Mech',
    exp: 15,
  },
  {
    name: 'Dr. Meena Pillai',
    dept: 'Civil',
    reg: 'TCH-CV-005',
    email: 'meena.pillai@sput.skillpilot.dev',
    specialization: 'Structural Engineering',
    exp: 9,
  },
  {
    name: 'Prof. Suresh Gupta',
    dept: 'Computer Science',
    reg: 'TCH-CS-006',
    email: 'suresh.gupta@sput.skillpilot.dev',
    specialization: 'Algorithms & Competitive Prog',
    exp: 7,
  },
  {
    name: 'Dr. Lakshmi Iyer',
    dept: 'Information Technology',
    reg: 'TCH-IT-007',
    email: 'lakshmi.iyer@sput.skillpilot.dev',
    specialization: 'Cybersecurity & Networks',
    exp: 11,
  },
  {
    name: 'Prof. Vikram Singh',
    dept: 'Electronics',
    reg: 'TCH-EC-008',
    email: 'vikram.singh@sput.skillpilot.dev',
    specialization: 'Signal Processing & IoT',
    exp: 6,
  },
];

// ─── Student Data ─────────────────────────────────────────────────────────────
const STUDENTS = [
  // CS - 2021 Batch
  {
    name: 'Arjun Mehta',
    dept: 'Computer Science',
    roll: 'CS21001',
    email: 'arjun.mehta@sput.skillpilot.dev',
    year: '2021',
    course: 'B.Tech',
    gpa: 8.7,
    att: 88,
  },
  {
    name: 'Pooja Rao',
    dept: 'Computer Science',
    roll: 'CS21002',
    email: 'pooja.rao@sput.skillpilot.dev',
    year: '2021',
    course: 'B.Tech',
    gpa: 9.1,
    att: 92,
  },
  {
    name: 'Karan Joshi',
    dept: 'Computer Science',
    roll: 'CS21003',
    email: 'karan.joshi@sput.skillpilot.dev',
    year: '2021',
    course: 'B.Tech',
    gpa: 7.4,
    att: 75,
  },
  {
    name: 'Ananya Desai',
    dept: 'Computer Science',
    roll: 'CS21004',
    email: 'ananya.desai@sput.skillpilot.dev',
    year: '2021',
    course: 'B.Tech',
    gpa: 8.2,
    att: 83,
  },
  {
    name: 'Rohan Patil',
    dept: 'Computer Science',
    roll: 'CS21005',
    email: 'rohan.patil@sput.skillpilot.dev',
    year: '2021',
    course: 'B.Tech',
    gpa: 6.9,
    att: 68,
    suspended: true,
    suspReason: 'Academic misconduct during mid-term examination',
  },
  // IT - 2022 Batch
  {
    name: 'Shreya Kapoor',
    dept: 'Information Technology',
    roll: 'IT22001',
    email: 'shreya.kapoor@sput.skillpilot.dev',
    year: '2022',
    course: 'B.Tech',
    gpa: 8.5,
    att: 90,
  },
  {
    name: 'Nikhil Bansal',
    dept: 'Information Technology',
    roll: 'IT22002',
    email: 'nikhil.bansal@sput.skillpilot.dev',
    year: '2022',
    course: 'B.Tech',
    gpa: 7.8,
    att: 80,
  },
  {
    name: 'Prachi Tiwari',
    dept: 'Information Technology',
    roll: 'IT22003',
    email: 'prachi.tiwari@sput.skillpilot.dev',
    year: '2022',
    course: 'BCA',
    gpa: 9.0,
    att: 95,
  },
  {
    name: 'Amit Kumar',
    dept: 'Information Technology',
    roll: 'IT22004',
    email: 'amit.kumar@sput.skillpilot.dev',
    year: '2022',
    course: 'BCA',
    gpa: 7.2,
    att: 72,
  },
  // EC - 2022 Batch
  {
    name: 'Divya Reddy',
    dept: 'Electronics',
    roll: 'EC22001',
    email: 'divya.reddy@sput.skillpilot.dev',
    year: '2022',
    course: 'B.Tech',
    gpa: 8.0,
    att: 85,
  },
  {
    name: 'Siddharth Nair',
    dept: 'Electronics',
    roll: 'EC22002',
    email: 'siddharth.nair@sput.skillpilot.dev',
    year: '2022',
    course: 'B.Tech',
    gpa: 7.6,
    att: 78,
  },
  // ME - 2023 Batch
  {
    name: 'Rahul Srivastava',
    dept: 'Mechanical',
    roll: 'ME23001',
    email: 'rahul.srivastava@sput.skillpilot.dev',
    year: '2023',
    course: 'B.Tech',
    gpa: 7.9,
    att: 82,
  },
  {
    name: 'Kavya Menon',
    dept: 'Mechanical',
    roll: 'ME23002',
    email: 'kavya.menon@sput.skillpilot.dev',
    year: '2023',
    course: 'B.Tech',
    gpa: 8.4,
    att: 87,
  },
  // CV - 2023 Batch
  {
    name: 'Aditya Pandey',
    dept: 'Civil',
    roll: 'CV23001',
    email: 'aditya.pandey@sput.skillpilot.dev',
    year: '2023',
    course: 'B.Tech',
    gpa: 7.3,
    att: 76,
    suspended: true,
    suspReason: 'Repeated absence from labs without prior notice',
  },
  {
    name: 'Sneha Bhatt',
    dept: 'Civil',
    roll: 'CV23002',
    email: 'sneha.bhatt@sput.skillpilot.dev',
    year: '2023',
    course: 'B.Tech',
    gpa: 8.8,
    att: 91,
  },
  // CS - 2023 Batch (MCA)
  {
    name: 'Vivek Sharma',
    dept: 'Computer Science',
    roll: 'CS23MCA1',
    email: 'vivek.sharma@sput.skillpilot.dev',
    year: '2023',
    course: 'MCA',
    gpa: 8.6,
    att: 89,
  },
  {
    name: 'Ishaan Malik',
    dept: 'Computer Science',
    roll: 'CS23MCA2',
    email: 'ishaan.malik@sput.skillpilot.dev',
    year: '2023',
    course: 'MCA',
    gpa: 9.2,
    att: 96,
  },
  // IT - 2024 Batch (Freshers)
  {
    name: 'Riya Chaudhary',
    dept: 'Information Technology',
    roll: 'IT24001',
    email: 'riya.chaudhary@sput.skillpilot.dev',
    year: '2024',
    course: 'B.Tech',
    gpa: 8.1,
    att: 84,
  },
  {
    name: 'Mohit Agarwal',
    dept: 'Information Technology',
    roll: 'IT24002',
    email: 'mohit.agarwal@sput.skillpilot.dev',
    year: '2024',
    course: 'B.Tech',
    gpa: 7.7,
    att: 79,
  },
  {
    name: 'Tanvi Singh',
    dept: 'Information Technology',
    roll: 'IT24003',
    email: 'tanvi.singh@sput.skillpilot.dev',
    year: '2024',
    course: 'B.Tech',
    gpa: 8.9,
    att: 93,
  },
];

// ─── Main Seeder ─────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB\n');

    // Fetch university and uniAdmin
    const university = await University.findById(UNIVERSITY_ID);
    if (!university) {
      console.error('University not found. Aborting.');
      process.exit(1);
    }

    const uniAdmin = await User.findOne({ email: UNI_ADMIN_EMAIL });
    if (!uniAdmin) {
      console.error('UniAdmin user not found. Aborting.');
      process.exit(1);
    }

    console.log(`University: ${university.name}`);
    console.log(`UniAdmin:   ${uniAdmin.name}\n`);

    const teacherPassword = await bcrypt.hash(DEFAULT_TEACHER_PASS, 10);
    const studentPassword = await bcrypt.hash(DEFAULT_STUDENT_PASS, 10);

    // ── 1. Seed Teachers ─────────────────────────────────────────────────────
    console.log('=== Seeding Teachers ===');
    const teacherUsers = [];
    const teacherCredentials = [];

    for (const t of TEACHERS) {
      const existing = await User.findOne({ email: t.email });
      if (existing) {
        console.log(`  [SKIP] Teacher already exists: ${t.name}`);
        teacherUsers.push(existing);
        continue;
      }

      const teacherUser = new User({
        username: t.reg,
        name: t.name,
        email: t.email,
        password: teacherPassword,
        role: 'UniTeach',
        universityId: university._id,
        registrationNumber: t.reg,
        isVerified: true,
        isActive: true,
        lastLogin: daysAgo(randInt(0, 7)),
        createdAt: daysAgo(randInt(60, 365)),
      });
      await teacherUser.save();
      teacherUsers.push(teacherUser);
      teacherCredentials.push({ identifier: t.reg, password: DEFAULT_TEACHER_PASS });
      console.log(`  [OK] Created teacher: ${t.name} (${t.reg})`);
    }

    // Create TeacherAccess record for all seeded teachers
    const existingTA = await TeacherAccess.findOne({ university: university._id, isActive: true });
    if (!existingTA) {
      const ta = new TeacherAccess({
        university: university._id,
        accessMethod: 'registration',
        registrationNumbers: TEACHERS.map(t => t.reg),
        emails: TEACHERS.map(t => t.email),
        passwordMethod: 'manual',
        defaultPassword: DEFAULT_TEACHER_PASS,
        generatedCredentials: teacherCredentials,
        isActive: true,
        createdBy: uniAdmin._id,
        createdAt: daysAgo(90),
      });
      await ta.save();
      console.log(`  [OK] TeacherAccess record created (${teacherCredentials.length} teachers)\n`);
    } else {
      console.log('  [SKIP] TeacherAccess record already exists\n');
    }

    // ── 2. Seed Students ─────────────────────────────────────────────────────
    console.log('=== Seeding Students ===');
    const studentDocs = [];

    for (const s of STUDENTS) {
      const existing = await User.findOne({ email: s.email });
      let studentUser = existing;

      if (!existing) {
        // Use validateBeforeSave:false because studentProfile will be patched after Student is created
        studentUser = new User({
          username: s.roll,
          name: s.name,
          email: s.email,
          password: studentPassword,
          role: 'Student',
          universityId: university._id,
          registrationNumber: s.roll,
          isVerified: true,
          isActive: !s.suspended,
          lastLogin: daysAgo(randInt(0, 14)),
          createdAt: daysAgo(randInt(100, 400)),
        });
        await studentUser.save({ validateBeforeSave: false });
        console.log(`  [OK] Created student user: ${s.name} (${s.roll})`);
      } else {
        console.log(`  [SKIP] Student user already exists: ${s.name}`);
      }

      // Check if Student profile already exists
      const existingStudent = await Student.findOne({ userId: studentUser._id });
      if (existingStudent) {
        console.log(`  [SKIP] Student profile already exists: ${s.name}`);
        studentDocs.push(existingStudent);
        continue;
      }

      // Determine batch from year
      const batchMap = {
        2021: '2021-2025',
        2022: '2022-2026',
        2023: '2023-2027',
        2024: '2024-2028',
      };
      const admDate = new Date(`${s.year}-08-01`);
      const gradDate = new Date(`${parseInt(s.year) + 4}-06-01`);

      const studentDoc = new Student({
        userId: studentUser._id,
        department: s.dept,
        year: s.year,
        course: s.course,
        rollNumber: s.roll,
        batch: batchMap[s.year] || '2021-2025',
        universityId: university._id,
        academicStatus: s.suspended ? 'active' : 'active',
        isSuspended: !!s.suspended,
        suspensionDetails: s.suspended
          ? {
              reason: s.suspReason,
              suspendedAt: daysAgo(randInt(3, 20)),
              suspendedBy: uniAdmin._id,
              suspendedByName: uniAdmin.name,
              until: new Date(Date.now() + randInt(3, 14) * 24 * 60 * 60 * 1000),
              isActive: true,
            }
          : {},
        portalAccess: {
          canAccessLibrary: !s.suspended,
          canAccessLabs: !s.suspended,
          canAccessCourses: true,
          canSubmitAssignments: !s.suspended,
          canViewGrades: true,
          restrictedAreas: s.suspended
            ? [
                {
                  area: 'Lab Access',
                  reason: 'Suspension in effect',
                  restrictedAt: daysAgo(5),
                  restrictedBy: uniAdmin.name,
                },
              ]
            : [],
        },
        performance: {
          currentGPA: s.gpa,
          totalCredits: parseInt(s.year) <= 2022 ? randInt(120, 160) : randInt(40, 100),
          completedCredits: parseInt(s.year) <= 2022 ? randInt(90, 120) : randInt(20, 60),
          attendancePercentage: s.att,
        },
        contactInfo: {
          alternateEmail: `${s.roll.toLowerCase()}@gmail.com`,
          parentName: `${s.name.split(' ')[1] || 'Kumar'} Sr.`,
          parentPhone: `+91 98${randInt(10000000, 99999999)}`,
          parentEmail: `parent.${s.roll.toLowerCase()}@gmail.com`,
          address: {
            street: `${randInt(1, 200)}, Sector ${randInt(1, 50)}`,
            city: rand(CITIES),
            state: rand(['Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Tamil Nadu']),
            zipCode: String(randInt(400001, 600099)),
            country: 'India',
          },
        },
        enrollment: {
          admissionDate: admDate,
          expectedGraduation: gradDate,
          enrollmentType: 'full_time',
        },
        adminNotes: [
          {
            note: `Student enrolled via university portal. Registration: ${s.roll}`,
            addedBy: uniAdmin._id,
            addedByName: uniAdmin.name,
            category: 'general',
            isImportant: false,
            addedAt: admDate,
          },
          ...(s.gpa >= 8.5
            ? [
                {
                  note: `High achiever — GPA ${s.gpa}. Recommended for excellence award consideration.`,
                  addedBy: uniAdmin._id,
                  addedByName: uniAdmin.name,
                  category: 'academic',
                  isImportant: true,
                  addedAt: daysAgo(randInt(10, 50)),
                },
              ]
            : []),
          ...(s.suspended
            ? [
                {
                  note: `Disciplinary action taken: ${s.suspReason}`,
                  addedBy: uniAdmin._id,
                  addedByName: uniAdmin.name,
                  category: 'disciplinary',
                  isImportant: true,
                  addedAt: daysAgo(randInt(3, 20)),
                },
              ]
            : []),
        ],
        createdBy: uniAdmin._id,
        createdAt: admDate,
        updatedAt: daysAgo(randInt(1, 30)),
      });

      await studentDoc.save();

      // Back-patch studentProfile reference on the User document
      if (!existing) {
        await User.findByIdAndUpdate(studentUser._id, { studentProfile: studentDoc._id });
      }

      studentDocs.push(studentDoc);
      console.log(
        `  [OK] Created student profile: ${s.name} | GPA ${s.gpa} | Att ${s.att}%${s.suspended ? ' [SUSPENDED]' : ''}`
      );
    }

    // ── 3. Seed Student Activities ────────────────────────────────────────────
    console.log('\n=== Seeding Student Activities ===');

    for (let i = 0; i < studentDocs.length; i++) {
      const stDoc = studentDocs[i];
      const stUser = await User.findById(stDoc.userId);
      const numActivities = randInt(8, 18);
      let prevActivityId = null;

      for (let j = 0; j < numActivities; j++) {
        const actType = rand(ACTIVITY_TYPES);
        const ts = daysAgo(randInt(0, 30));
        const sessionStart = new Date(ts.getTime() - randInt(5, 60) * 60000);
        const sessionEnd = new Date(ts.getTime() + randInt(5, 120) * 60000);
        const browser = rand(BROWSERS);
        const os = rand(OS_LIST);
        const city = rand(CITIES);
        const ipBase = rand(IPS);
        const ip = `${ipBase}${randInt(1, 254)}`;
        const isMobile = os.includes('Android') || os.includes('iOS');
        const sessionId = `sess_${uid()}_${j}`;

        const act = new StudentActivity({
          studentId: stDoc._id,
          userId: stUser._id,
          universityId: university._id,
          sessionId,
          activityType: actType,
          details: {
            loginMethod:
              actType === 'login' ? rand(['username', 'email', 'registration']) : undefined,
            loginSuccess: actType === 'login' ? Math.random() > 0.1 : undefined,
            logoutReason: actType === 'logout' ? rand(['manual', 'timeout']) : undefined,
            courseName: ['course_access', 'assignment_submit'].includes(actType)
              ? `${stDoc.department} Core ${randInt(101, 401)}`
              : undefined,
            assignmentName:
              actType === 'assignment_submit'
                ? `Assignment ${randInt(1, 8)} - Unit ${randInt(1, 4)}`
                : undefined,
            gradeViewed:
              actType === 'grade_view'
                ? `${['A', 'A+', 'B+', 'B', 'C'][randInt(0, 4)]} (${randInt(55, 98)}/100)`
                : undefined,
            pageAccessed:
              actType === 'portal_navigation'
                ? rand(['/dashboard', '/courses', '/library', '/grades', '/schedule', '/profile'])
                : undefined,
            timeSpent: actType === 'portal_navigation' ? randInt(30, 900) : undefined,
            fileName:
              actType === 'file_download'
                ? `${rand(['Lecture', 'Notes', 'Lab_Manual', 'Syllabus'])}_${randInt(1, 10)}.pdf`
                : undefined,
            quizName:
              actType === 'quiz_attempt'
                ? `Quiz ${randInt(1, 5)} - ${stDoc.department}`
                : undefined,
            scoreObtained: actType === 'quiz_attempt' ? randInt(10, 25) : undefined,
            maxScore: actType === 'quiz_attempt' ? 25 : undefined,
            timeSpentOnQuiz: actType === 'quiz_attempt' ? randInt(10, 30) : undefined,
          },
          ipAddress: ip,
          userAgent: `Mozilla/5.0 (${os}) AppleWebKit/537.36 ${browser}/10${randInt(0, 9)}`,
          deviceInfo: {
            deviceType: isMobile ? 'mobile' : 'desktop',
            browser,
            operatingSystem: os,
            screenResolution: isMobile ? '390x844' : rand(['1920x1080', '1440x900', '1366x768']),
          },
          location: {
            country: 'India',
            region: rand(['Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Tamil Nadu']),
            city,
            timezone: 'Asia/Kolkata',
          },
          status: actType === 'login' && Math.random() < 0.05 ? 'failed' : 'success',
          securityFlags: {
            suspiciousActivity: false,
            multipleLocationAccess: false,
            unusualTimeAccess: ts.getHours() < 5 || ts.getHours() > 23,
            repeatedFailedAttempts: false,
          },
          timestamp: ts,
          sessionStartTime: sessionStart,
          sessionEndTime: sessionEnd,
          academicYear: '2024-2025',
          semester: 'Spring',
          previousActivityId: prevActivityId,
        });

        await act.save();
        prevActivityId = act._id;
      }
      console.log(`  [OK] ${numActivities} activities logged for ${stUser.name}`);
    }

    // ── 4. Summary ────────────────────────────────────────────────────────────
    console.log('\n========================================');
    console.log('SEED COMPLETE — Summary');
    console.log('========================================');
    console.log(`University:    ${university.name}`);
    console.log(`Teachers:      ${TEACHERS.length} (password: ${DEFAULT_TEACHER_PASS})`);
    console.log(`Students:      ${STUDENTS.length} (password: ${DEFAULT_STUDENT_PASS})`);
    const suspended = STUDENTS.filter(s => s.suspended).length;
    console.log(`Suspended:     ${suspended} students`);
    const activities = await StudentActivity.countDocuments({ universityId: university._id });
    console.log(`Activities:    ${activities} records`);
    console.log('\nCredentials for testing:');
    STUDENTS.slice(0, 3).forEach(s => console.log(`  ${s.email}  |  ${DEFAULT_STUDENT_PASS}`));
    TEACHERS.slice(0, 3).forEach(t => console.log(`  ${t.email}  |  ${DEFAULT_TEACHER_PASS}`));
    console.log('========================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Seed error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
