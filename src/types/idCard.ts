export type CategoryType = 'school' | 'college' | 'corporate' | 'event' | 'custom';

export interface IDCardField {
  key: string;
  label: string;
  value: string;
  enabled: boolean;
}

export interface IDCardConfig {
  category: CategoryType;
  institutionName: string;
  institutionAddress: string;
  layout: 'vertical' | 'horizontal';
  cardShape: 'rounded' | 'rectangular';
  headerColor: string;
  footerColor: string;
  photoSize: number;
  fields: IDCardField[];
  profilePhoto: string | null;
  institutionLogo: string | null;
  authorizedSignature: string | null;
  backgroundImage: string | null;
  showQRCode: boolean;
  signatoryTitle: string;
}

export const categoryLabels: Record<CategoryType, string> = {
  school: 'School',
  college: 'College',
  corporate: 'Corporate',
  event: 'Event / Organization',
  custom: 'Custom',
};

export const getDefaultFields = (category: CategoryType): IDCardField[] => {
  const baseFields: Record<string, IDCardField[]> = {
    school: [
      { key: 'name', label: 'Student Name', value: '', enabled: true },
      { key: 'rollNo', label: 'Roll No', value: '', enabled: true },
      { key: 'class', label: 'Class/Section', value: '', enabled: true },
      { key: 'grNo', label: 'GR No', value: '', enabled: true },
      { key: 'dob', label: 'Date of Birth', value: '', enabled: true },
      { key: 'bloodGroup', label: 'Blood Group', value: '', enabled: true },
      { key: 'phone', label: 'Phone', value: '', enabled: true },
      { key: 'address', label: 'Address', value: '', enabled: false },
      { key: 'academicYear', label: 'Academic Year', value: '', enabled: false },
      { key: 'emergencyContact', label: 'Emergency Contact', value: '', enabled: false },
    ],
    college: [
      { key: 'name', label: 'Student Name', value: '', enabled: true },
      { key: 'enrollmentNo', label: 'Enrollment No', value: '', enabled: true },
      { key: 'department', label: 'Department', value: '', enabled: true },
      { key: 'course', label: 'Course', value: '', enabled: true },
      { key: 'dob', label: 'Date of Birth', value: '', enabled: true },
      { key: 'bloodGroup', label: 'Blood Group', value: '', enabled: true },
      { key: 'phone', label: 'Phone', value: '', enabled: true },
      { key: 'address', label: 'Address', value: '', enabled: false },
      { key: 'academicYear', label: 'Academic Year', value: '', enabled: false },
      { key: 'emergencyContact', label: 'Emergency Contact', value: '', enabled: false },
    ],
    corporate: [
      { key: 'name', label: 'Employee Name', value: '', enabled: true },
      { key: 'employeeId', label: 'Employee ID', value: '', enabled: true },
      { key: 'designation', label: 'Designation', value: '', enabled: true },
      { key: 'department', label: 'Department', value: '', enabled: true },
      { key: 'dob', label: 'Date of Birth', value: '', enabled: true },
      { key: 'bloodGroup', label: 'Blood Group', value: '', enabled: true },
      { key: 'phone', label: 'Phone', value: '', enabled: true },
      { key: 'joiningYear', label: 'Joining Year', value: '', enabled: false },
      { key: 'address', label: 'Address', value: '', enabled: false },
      { key: 'emergencyContact', label: 'Emergency Contact', value: '', enabled: false },
    ],
    event: [
      { key: 'name', label: 'Attendee Name', value: '', enabled: true },
      { key: 'participantId', label: 'Participant ID', value: '', enabled: true },
      { key: 'role', label: 'Role', value: '', enabled: true },
      { key: 'organization', label: 'Organization', value: '', enabled: true },
      { key: 'phone', label: 'Phone', value: '', enabled: true },
      { key: 'email', label: 'Email', value: '', enabled: false },
      { key: 'eventDate', label: 'Event Date', value: '', enabled: false },
    ],
    custom: [
      { key: 'name', label: 'Full Name', value: '', enabled: true },
      { key: 'idNumber', label: 'ID Number', value: '', enabled: true },
      { key: 'designation', label: 'Designation', value: '', enabled: true },
      { key: 'department', label: 'Department', value: '', enabled: true },
      { key: 'dob', label: 'Date of Birth', value: '', enabled: false },
      { key: 'bloodGroup', label: 'Blood Group', value: '', enabled: false },
      { key: 'phone', label: 'Phone', value: '', enabled: false },
      { key: 'address', label: 'Address', value: '', enabled: false },
    ],
  };
  return baseFields[category];
};

export const signatoryTitles: Record<CategoryType, string> = {
  school: 'Principal',
  college: 'Dean',
  corporate: 'HR Manager',
  event: 'Organizer',
  custom: 'Authorized Signatory',
};
