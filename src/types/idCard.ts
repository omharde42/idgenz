export type CategoryType = 'school' | 'college' | 'corporate' | 'event' | 'custom';

export type CardSizeType = 
  | 'cr80' 
  | 'cr79' 
  | 'cr100' 
  | 'iso-a8' 
  | 'iso-b8' 
  | 'half-credit' 
  | 'military' 
  | 'key-tag' 
  | 'oversized' 
  | 'custom-square'
  | 'school-student'
  | 'school-teacher';

export interface CardSizeOption {
  id: CardSizeType;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const cardSizeOptions: CardSizeOption[] = [
  { id: 'school-student', label: 'School Student', width: 306, height: 192, description: '3.2" × 2" - Student ID Card' },
  { id: 'school-teacher', label: 'School Teacher', width: 324, height: 204, description: '3.375" × 2.125" - Teacher/Staff ID' },
  { id: 'cr80', label: 'CR80 (Standard)', width: 324, height: 204, description: '3.375" × 2.125" - Credit Card Size' },
  { id: 'cr79', label: 'CR79', width: 316, height: 200, description: '3.303" × 2.051" - Slightly Smaller' },
  { id: 'cr100', label: 'CR100', width: 372, height: 252, description: '3.88" × 2.63" - Large Format' },
  { id: 'iso-a8', label: 'ISO A8', width: 396, height: 280, description: '52mm × 74mm - International Standard' },
  { id: 'iso-b8', label: 'ISO B8', width: 468, height: 330, description: '62mm × 88mm - International B8' },
  { id: 'half-credit', label: 'Half Credit Card', width: 162, height: 204, description: '1.69" × 2.125" - Compact' },
  { id: 'military', label: 'Military CAC', width: 324, height: 204, description: '3.375" × 2.125" - US Military Standard' },
  { id: 'key-tag', label: 'Key Tag', width: 252, height: 108, description: '2.63" × 1.125" - Keychain Size' },
  { id: 'oversized', label: 'Oversized', width: 432, height: 288, description: '4.5" × 3" - Large Badge' },
  { id: 'custom-square', label: 'Square Badge', width: 288, height: 288, description: '3" × 3" - Square Format' },
];

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
  cardSize: CardSizeType;
  headerColor: string;
  footerColor: string;
  textColor: string;
  photoSize: number;
  fields: IDCardField[];
  profilePhoto: string | null;
  institutionLogo: string | null;
  authorizedSignature: string | null;
  backgroundImage: string | null;
  showQRCode: boolean;
  signatoryTitle: string;
}

export const textColorOptions = [
  { color: '#000000', name: 'Black' },
  { color: '#1a1a1a', name: 'Charcoal' },
  { color: '#333333', name: 'Dark Gray' },
  { color: '#4a4a4a', name: 'Gray' },
  { color: '#666666', name: 'Medium Gray' },
  { color: '#ffffff', name: 'White' },
  { color: '#1e40af', name: 'Blue' },
  { color: '#1d4ed8', name: 'Royal Blue' },
  { color: '#2563eb', name: 'Bright Blue' },
  { color: '#0284c7', name: 'Sky Blue' },
  { color: '#0891b2', name: 'Cyan' },
  { color: '#14532d', name: 'Dark Green' },
  { color: '#166534', name: 'Forest Green' },
  { color: '#15803d', name: 'Green' },
  { color: '#059669', name: 'Emerald' },
  { color: '#0d9488', name: 'Teal' },
  { color: '#7c2d12', name: 'Brown' },
  { color: '#9a3412', name: 'Burnt Orange' },
  { color: '#c2410c', name: 'Orange' },
  { color: '#dc2626', name: 'Red' },
  { color: '#b91c1c', name: 'Dark Red' },
  { color: '#be123c', name: 'Rose' },
  { color: '#9333ea', name: 'Purple' },
  { color: '#7c3aed', name: 'Violet' },
  { color: '#6366f1', name: 'Indigo' },
  { color: '#d97706', name: 'Amber' },
  { color: '#ca8a04', name: 'Yellow' },
  { color: '#65a30d', name: 'Lime' },
];

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
  college: 'Director',
  corporate: 'Director',
  event: 'Director',
  custom: 'Director',
};

export const defaultCardSizes: Record<CategoryType, CardSizeType> = {
  school: 'school-student',
  college: 'cr80',
  corporate: 'cr80',
  event: 'cr80',
  custom: 'cr80',
};
