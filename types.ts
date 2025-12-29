
export type CourseType = 'ONLINE' | 'PRESENCIAL';
export type CourseCategory = 'ENEM' | 'CONCURSO';
export type StudioLocation = 'RIO_BRANCO' | 'PORTO_VELHO' | 'HOME';

// --- ONLINE SPECIFIC ---
export enum VideoStatus {
  PENDING = 'PENDENTE',
  SCHEDULED = 'AGENDADO',
  RECORDED = 'GRAVADO',
  PARTIAL = 'PARCIAL',
  DELAYED = 'ATRASADO',
  EDITED = 'EDITADO',
  PUBLISHED = 'PUBLICADO'
}

export enum MaterialStatus {
  PENDING = 'PENDENTE',
  IN_PRODUCTION = 'EM_PRODUCAO',
  CONCLUDED = 'CONCLUIDO',
  PUBLISHED = 'PUBLICADO'
}

export interface FileNode {
  id: string;
  name: string;
  type: 'FOLDER' | 'FILE';
  parentId: string | null;
  url?: string;
}

// --- TEACHER TYPES ---

export type TeacherSegment = 'CONCURSO' | 'ENEM' | 'AMBOS';
export type TeacherLocation = 'RIO_BRANCO' | 'PORTO_VELHO' | 'AMBOS';
export type Shift = 'MANHA' | 'TARDE' | 'NOITE';
export type DayOfWeek = 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'DOMINGO';

export interface AvailabilitySlot {
  day: DayOfWeek;
  shift: Shift;
}

export interface TeacherPreferences {
  concurso: [AvailabilitySlot | null, AvailabilitySlot | null, AvailabilitySlot | null]; // 1st, 2nd, 3rd options
  enem: [AvailabilitySlot | null, AvailabilitySlot | null, AvailabilitySlot | null];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  whatsapp: string; // Only numbers
  avatarUrl?: string;
  
  // Professional
  segment: TeacherSegment;
  
  // Locations (Only relevant if Concurso or Ambos)
  location: TeacherLocation;
  primaryLocation?: 'RIO_BRANCO' | 'PORTO_VELHO'; // Required if location is AMBOS
  
  // Subjects
  subjects: string[];
  primarySubject: string;

  // Employment
  isPublicServant: boolean;
  isShiftWorker?: boolean; // Plantão

  // Availability
  preferences: TeacherPreferences;
  weekendAvailability: {
    saturday: boolean;
    sunday: boolean;
  };
}

// --- SCHEDULE & CURRICULUM ---

export interface ScheduleEvent {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  time: string; // HH:mm
  location: StudioLocation;
  
  // Context Data
  courseId: string;
  courseName?: string;
  disciplineId: string;
  disciplineName?: string;
  topicId: string;
  topicName?: string;
  moduleId: string;
  moduleName?: string;
  teacherId?: string;
  teacherName?: string;
}

export interface ModuleIndex {
  id: string;
  name: string;
  
  // Video Control
  videoStatus: VideoStatus;
  videoUrl?: string;
  videoDuration?: number;
  scheduleId?: string;
  recordingNotes?: string;

  // Material Control
  pdfStatus: MaterialStatus;
  linkedPdfId?: string;
  pdfNotes?: string;

  // Question List Control
  questionStatus: MaterialStatus;
  linkedQuestionPdfId?: string;
  questionNotes?: string;

  // PRESENCIAL SPECIFIC
  requiredClasses?: number; // How many "slots" of class this module takes
  isSelectedForPresential?: boolean; // If true, it's included in the course planning
  presentialTeacherId?: string; // Specific teacher for this module in this course
  disciplineColor?: string; // Visual color for calendar
}

export interface CourseTopic {
  id: string;
  name: string;
  teacherId?: string; // Default teacher
  modules: ModuleIndex[];
}

export interface CourseDiscipline {
  id: string;
  name: string;
  color?: string; // Hex color for calendar
  topics: CourseTopic[];
}

// --- PRESENCIAL COURSE CONFIGURATION ---

export interface PresentialConfig {
  location: 'RIO_BRANCO' | 'PORTO_VELHO';
  subType: 'PRE_EDITAL' | 'POS_EDITAL';
  modality: 'REGULAR' | 'INTENSIVO';
  hasClassroomRecording: boolean;
  
  // Structure
  totalMeetings: number; // Ex: 60 encontros
  meetingDurationHours: number; // Ex: 3 horas
  classesPerMeeting: number; // Ex: 2 aulas (então 1h30 cada)
  breakCount: number;
  breakDurationMinutes: number;
  
  // Time & Date
  shift: Shift;
  startTime: string; // HH:mm
  daysOfWeek: DayOfWeek[]; // ['SEGUNDA', 'QUARTA', 'SEXTA']
  allowWeekend: boolean; // "Soldado de reserva"
  startDate: string; // YYYY-MM-DD
  desiredEndDate?: string;
  skipRedHolidays: boolean;

  // Finance (Commissions defined per course)
  hourlyRate: number;
  commissionRecording: number; // %
  commissionSubstitution: number; // %
  commissionWeekend: number; // %
}

export interface PresentialClassSession {
  id: string; // Unique ID
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  meetingNumber: number; // 1 to totalMeetings
  
  // Content
  disciplineId: string;
  topicId: string;
  moduleId: string; // Which module is being taught
  teacherId: string;
  
  // Status
  isHoliday?: boolean;
  isWeekend?: boolean;
  isSubstitution?: boolean;
  isRecorded?: boolean; // Inherits from course config, but can be toggled
  
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
}

export interface Course {
  id: string;
  name: string;
  type: CourseType;
  category: CourseCategory;
  coverImage?: string;
  folderId?: string | null;
  deadline?: string; // For Online
  
  disciplines: CourseDiscipline[];
  
  // Presential Specific Data
  presentialConfig?: PresentialConfig;
  presentialSchedule?: PresentialClassSession[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}
