
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  Calendar, 
  X,
  Plus,
  Folder as FolderIcon,
  File as FileIcon,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  Save,
  ArrowLeft,
  MapPin,
  Loader2,
  GraduationCap,
  MonitorPlay,
  User,
  AlertTriangle,
  CalendarDays,
  RefreshCw,
  Copy,
  DollarSign,
  Phone,
  Mail,
  Home,
  Edit,
  Camera,
  ZoomIn,
  RotateCcw,
  Check,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  Course, 
  CourseDiscipline, 
  CourseTopic, 
  ModuleIndex, 
  FileNode, 
  Teacher, 
  ScheduleEvent,
  VideoStatus,
  MaterialStatus,
  StudioLocation,
  CourseType,
  CourseCategory,
  DayOfWeek,
  PresentialConfig,
  PresentialClassSession
} from './types';

// Firebase Imports
import { db, storage } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

import { INITIAL_PRESENTIAL_CONFIG, HOLIDAYS, INITIAL_TEACHER_FORM } from './constants';

// --- HELPERS ---

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatWhatsAppLink = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/55${clean}`;
};

// --- COMPONENTS ---

const ConfirmationDialog = ({ open, title, message, onConfirm, onCancel }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors font-medium">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-insanus-red text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const InputDialog = ({ open, title, initialValue, onConfirm, onCancel }: { open: boolean; title: string; initialValue: string; onConfirm: (val: string) => void; onCancel: () => void; }) => {
  const [val, setVal] = useState(initialValue);
  useEffect(() => { setVal(initialValue); }, [open, initialValue]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            <input 
                autoFocus
                type="text" 
                className="w-full bg-black border border-gray-700 rounded p-3 text-white mb-4 outline-none focus:border-insanus-red transition-colors"
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onConfirm(val)}
                placeholder="Digite aqui..."
            />
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium">Cancelar</button>
                <button onClick={() => onConfirm(val)} className="flex-1 py-2 bg-insanus-red text-white font-bold rounded-lg hover:bg-red-700">Salvar</button>
            </div>
        </div>
    </div>
  );
}

// 0. Avatar Editor
const AvatarEditor = ({ imageSrc, onCancel, onSave }: { imageSrc: string, onCancel: () => void, onSave: (blob: Blob) => void }) => {
    const [userZoom, setUserZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [baseScale, setBaseScale] = useState(1); 
    const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const imageRef = useRef<HTMLImageElement>(null);
    const EDITOR_SIZE = 280; 
    const OUTPUT_SIZE = 400; 

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const nW = img.naturalWidth;
        const nH = img.naturalHeight;
        setNaturalSize({ w: nW, h: nH });
        const scaleW = EDITOR_SIZE / nW;
        const scaleH = EDITOR_SIZE / nH;
        const scale = Math.max(scaleW, scaleH); 
        setBaseScale(scale);
        setUserZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || !imageRef.current || naturalSize.w === 0) return;

        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;

        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        const ratio = OUTPUT_SIZE / EDITOR_SIZE;
        ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
        ctx.translate(position.x * ratio, position.y * ratio);
        const totalScale = baseScale * userZoom * ratio;
        ctx.scale(totalScale, totalScale);
        ctx.drawImage(imageRef.current, -naturalSize.w / 2, -naturalSize.h / 2);

        canvas.toBlob((blob) => {
            if (blob) onSave(blob);
        }, 'image/jpeg', 0.95);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-insanus-panel border border-gray-700 rounded-xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Edit size={20}/> Ajustar Foto</h3>
                <div 
                    className="relative overflow-hidden bg-black border-2 border-dashed border-gray-700 cursor-move touch-none select-none rounded-lg"
                    style={{ width: EDITOR_SIZE, height: EDITOR_SIZE }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div className="w-full h-full flex items-center justify-center overflow-visible">
                        <img 
                            ref={imageRef}
                            src={imageSrc} 
                            alt="Crop target"
                            onLoad={onImgLoad}
                            draggable={false}
                            style={{ 
                                maxWidth: 'none', 
                                maxHeight: 'none',
                                transform: `translate(${position.x}px, ${position.y}px) scale(${baseScale * userZoom})`,
                                transformOrigin: 'center center',
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                        />
                    </div>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 48%, rgba(0,0,0,0.85) 50%)' }}></div>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                         <div className="w-[96%] h-[96%] rounded-full border-2 border-insanus-red opacity-60 shadow-[0_0_15px_rgba(220,38,38,0.4)]"></div>
                    </div>
                </div>

                <div className="w-full mt-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <ZoomIn size={20} className="text-gray-400"/>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="3" 
                            step="0.05" 
                            value={userZoom} 
                            onChange={(e) => setUserZoom(parseFloat(e.target.value))}
                            className="flex-1 accent-insanus-red h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <button onClick={() => { setUserZoom(1); setPosition({x:0, y:0}); }} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg">
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 w-full mt-6">
                    <button onClick={onCancel} className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"><Check size={18}/> Confirmar</button>
                </div>
            </div>
        </div>
    );
};

// 1. Sidebar
const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Projetos (Turmas)', icon: BookOpen },
    { id: 'files', label: 'Banco de Materiais', icon: FileText },
    { id: 'schedule', label: 'Agenda de Gravações', icon: Calendar },
    { id: 'team', label: 'Equipe & Professores', icon: Users },
  ];

  return (
    <div className="w-64 h-screen bg-insanus-dark border-r border-insanus-panel flex flex-col sticky top-0">
      <div className="p-6 border-b border-insanus-panel">
        <h1 className="text-2xl font-bold tracking-tighter text-white">
          INSANUS <span className="text-insanus-red">MGR</span>
        </h1>
        <p className="text-xs text-insanus-gray mt-1 uppercase tracking-widest">Pedagógico</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-insanus-red/10 text-insanus-red border border-insanus-red/20' 
                  : 'text-gray-400 hover:bg-insanus-panel hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-insanus-red' : 'group-hover:text-white'} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-insanus-panel">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-insanus-red flex items-center justify-center font-bold text-white">A</div>
          <div>
            <p className="text-sm font-medium text-white">Administrador</p>
            <p className="text-xs text-insanus-gray">Sessão Ativa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. File Manager
const FileManager = ({ files, onSelectFile }: { files: FileNode[], onSelectFile?: (file: FileNode) => void }) => {
    const [currentPath, setCurrentPath] = useState<string[]>(['root']);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{open: boolean, id: string}>({open: false, id: ''});
    
    const currentFolderId = currentPath[currentPath.length - 1];

    const currentFiles = useMemo(() => {
        return files.filter(f => f.parentId === currentFolderId);
    }, [files, currentFolderId]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
        await addDoc(collection(db, "files"), {
            name: newFolderName,
            type: 'FOLDER',
            parentId: currentFolderId,
            url: ''
        });
        setNewFolderName('');
        } catch (e) {
        console.error("Erro ao criar pasta: ", e);
        alert("Erro ao criar pasta");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setUploading(true);
        try {
            const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            await addDoc(collection(db, "files"), {
            name: file.name,
            type: 'FILE',
            parentId: currentFolderId,
            url: downloadURL
            });
        } catch (error) {
            console.error("Erro no upload:", error);
            alert("Erro ao fazer upload do arquivo.");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
        }
    };

    const confirmDeletion = async () => {
        if (!confirmDelete.id) return;
        try {
            await deleteDoc(doc(db, "files", confirmDelete.id));
        } catch (e) {
            alert("Erro ao excluir");
        } finally {
            setConfirmDelete({open: false, id: ''});
        }
    };

    const breadcrumbs = useMemo(() => {
        let path: {id: string, name: string}[] = [];
        currentPath.forEach(id => {
        if (id === 'root') path.push({id: 'root', name: 'Raiz'});
        else {
            const folder = files.find(f => f.id === id);
            if (folder) path.push({id: folder.id, name: folder.name});
        }
        });
        return path;
    }, [currentPath, files]);

  return (
    <div className="bg-insanus-panel rounded-xl border border-gray-800 h-full flex flex-col overflow-hidden">
      <ConfirmationDialog 
        open={confirmDelete.open} 
        title="Excluir Arquivo/Pasta" 
        message="Tem certeza? Isso excluirá o registro permanentemente do sistema." 
        onConfirm={confirmDeletion} 
        onCancel={() => setConfirmDelete({open: false, id: ''})} 
      />

      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-insanus-dark/50">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight size={14} />}
              <button onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))} className="hover:text-white transition-colors">
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
           <input type="text" placeholder="Nova Pasta" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="bg-insanus-black border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none" />
           <button onClick={handleCreateFolder} className="text-insanus-red hover:text-white"><Plus size={16}/></button>
           <label className="cursor-pointer bg-insanus-red text-white px-3 py-1 rounded text-xs flex items-center gap-2">
             {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Upload PDF
             <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
           </label>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-4">
          {currentFiles.map(node => (
            <div key={node.id} className="group relative p-4 rounded-lg border border-gray-800 bg-insanus-black hover:border-insanus-red/50 cursor-pointer flex flex-col items-center gap-2"
              onClick={() => node.type === 'FOLDER' ? setCurrentPath([...currentPath, node.id]) : (onSelectFile ? onSelectFile(node) : window.open(node.url, '_blank'))}>
              <button onClick={(e) => {e.stopPropagation(); setConfirmDelete({open: true, id: node.id})}} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
              {node.type === 'FOLDER' ? <FolderIcon size={40} className="text-gray-500" /> : <FileIcon size={40} className="text-insanus-red" />}
              <span className="text-xs text-center text-gray-300 truncate w-full">{node.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 3. Presential Course Detail View (WITH ACCORDION, EDIT MODAL & DELETE)
interface PresentialDetailProps {
  course: Course;
  onUpdate: (c: Course) => Promise<void>;
  onBack: () => void;
  teachers: Teacher[];
}

const PresentialCourseDetail = ({ course, onUpdate, onBack, teachers }: PresentialDetailProps) => {
    const [activeTab, setActiveTab] = useState<'EDITAL' | 'CALENDARIO' | 'FINANCEIRO'>('EDITAL');
    const [localCourse, setLocalCourse] = useState(course);
    const [expandedDisciplines, setExpandedDisciplines] = useState<string[]>([]);
    const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [generatingSchedule, setGeneratingSchedule] = useState(false);
    const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
    
    const cfg = localCourse.presentialConfig || INITIAL_PRESENTIAL_CONFIG;

    const [newItemModal, setNewItemModal] = useState<{
        open: boolean;
        mode: 'ADD' | 'EDIT';
        type: 'DISCIPLINE' | 'TOPIC' | 'MODULE';
        dId?: string;
        tId?: string;
        itemId?: string;
        value: string;
    }>({ open: false, mode: 'ADD', type: 'DISCIPLINE', value: '' });

    useEffect(() => {
        setLocalCourse(course);
    }, [course]);

    const handleSave = async () => {
        setSaving(true);
        try {
          await onUpdate(localCourse);
          alert('Dados da Turma Presencial salvos!');
        } catch (e) {
          console.error(e);
          alert('Erro ao salvar.');
        } finally {
          setSaving(false);
        }
    };

    const generateSchedule = async () => {
        setConfirmDialog({
            open: true,
            title: "Gerar Grade Automática",
            message: "Isso irá sobrescrever a grade atual. Deseja continuar?",
            onConfirm: () => {
                setConfirmDialog(prev => ({...prev, open: false}));
                runScheduleGeneration();
            }
        });
    };

    const runScheduleGeneration = async () => {
        setGeneratingSchedule(true);

        const dayMap: Record<string, number> = {
            'DOMINGO': 0, 'SEGUNDA': 1, 'TERCA': 2, 'QUARTA': 3, 'QUINTA': 4, 'SEXTA': 5, 'SABADO': 6
        };
        const allowedDays = cfg.daysOfWeek.map(d => dayMap[d]);

        const classQueue: any[] = [];
        localCourse.disciplines.forEach(d => {
            d.topics.forEach(t => {
                t.modules.forEach(m => {
                    if (m.isSelectedForPresential) {
                        const slots = m.requiredClasses || 1;
                        for(let i=0; i<slots; i++) {
                            classQueue.push({
                                disciplineId: d.id,
                                topicId: t.id,
                                moduleId: m.id,
                                teacherId: m.presentialTeacherId || t.teacherId || '',
                                color: d.color,
                                moduleName: m.name,
                                topicName: t.name,
                                disciplineName: d.name
                            });
                        }
                    }
                });
            });
        });

        const newSchedule: PresentialClassSession[] = [];
        let currentDate = new Date(cfg.startDate);
        currentDate.setHours(12,0,0,0); 

        let meetingCount = 0;
        let queueIndex = 0;
        const maxIterations = 365; 
        let iterations = 0;

        while (meetingCount < cfg.totalMeetings && iterations < maxIterations) {
            const dayOfWeek = currentDate.getDay(); // 0-6
            const dateStr = currentDate.toISOString().split('T')[0];
            
            let isDayAllowed = allowedDays.includes(dayOfWeek);
            const isHoliday = HOLIDAYS.includes(dateStr);
            if (cfg.skipRedHolidays && isHoliday) isDayAllowed = false;

            if (isDayAllowed) {
                meetingCount++;
                for (let slot = 0; slot < cfg.classesPerMeeting; slot++) {
                    if (queueIndex < classQueue.length) {
                        const item = classQueue[queueIndex];
                        newSchedule.push({
                            id: Date.now() + Math.random().toString(), 
                            date: dateStr,
                            dayOfWeek: Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek) as DayOfWeek,
                            meetingNumber: meetingCount,
                            disciplineId: item.disciplineId,
                            topicId: item.topicId,
                            moduleId: item.moduleId,
                            teacherId: item.teacherId,
                            status: 'SCHEDULED',
                            isHoliday: false,
                            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                            isRecorded: cfg.hasClassroomRecording
                        });
                        queueIndex++;
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
            iterations++;
        }

        const updatedCourse = { ...localCourse, presentialSchedule: newSchedule };
        setLocalCourse(updatedCourse);
        await onUpdate(updatedCourse);
        setGeneratingSchedule(false);
    };

    const { consumedMeetings, totalModulesSelected, costAdditional } = useMemo(() => {
        let slotsUsed = 0;
        let modulesCount = 0;
        localCourse.disciplines.forEach(d => {
            d.topics.forEach(t => {
                t.modules.forEach(m => {
                    if (m.isSelectedForPresential) {
                        modulesCount++;
                        slotsUsed += (m.requiredClasses || 1); 
                    }
                });
            });
        });
        const meetingsNeeded = Math.ceil(slotsUsed / cfg.classesPerMeeting);
        let additional = 0;
        if (meetingsNeeded > cfg.totalMeetings) {
            const extraMeetings = meetingsNeeded - cfg.totalMeetings;
            const extraHours = extraMeetings * cfg.meetingDurationHours;
            additional = extraHours * cfg.hourlyRate;
            if(cfg.hasClassroomRecording) additional *= (1 + (cfg.commissionRecording / 100));
        }
        return { consumedMeetings: meetingsNeeded, totalModulesSelected: modulesCount, costAdditional: additional };
    }, [localCourse, cfg]);

    const projectedCost = useMemo(() => {
        const totalHours = cfg.totalMeetings * cfg.meetingDurationHours;
        let baseCost = totalHours * cfg.hourlyRate;
        if (cfg.hasClassroomRecording) baseCost += baseCost * (cfg.commissionRecording / 100);
        return baseCost + costAdditional;
    }, [cfg, costAdditional]);

    const getModuleInfo = (mId: string, dId: string) => {
        const d = localCourse.disciplines.find(x => x.id === dId);
        let mName = 'Módulo';
        let dColor = d?.color || '#333';
        let dName = d?.name || '';
        let tName = '';
        if(d) {
            for(const t of d.topics) {
                const m = t.modules.find(mod => mod.id === mId);
                if(m) {
                    mName = m.name;
                    tName = t.name;
                    break;
                }
            }
        }
        return { mName, tName, dName, dColor };
    };

    const getTeacherInfo = (tId: string) => teachers.find(t => t.id === tId);

    const scheduleByMeeting = useMemo(() => {
        if (!localCourse.presentialSchedule) return [];
        const groups: Record<number, PresentialClassSession[]> = {};
        localCourse.presentialSchedule.forEach(sess => {
            if (!groups[sess.meetingNumber]) groups[sess.meetingNumber] = [];
            groups[sess.meetingNumber].push(sess);
        });
        return Object.values(groups).sort((a,b) => a[0].meetingNumber - b[0].meetingNumber);
    }, [localCourse.presentialSchedule]);

    const toggleDiscipline = (id: string) => {
        setExpandedDisciplines(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleTopic = (id: string) => {
        setExpandedTopics(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // --- DIALOGS ---
    const openAddDiscipline = () => setNewItemModal({ open: true, mode: 'ADD', type: 'DISCIPLINE', value: '' });
    const openAddTopic = (dId: string) => setNewItemModal({ open: true, mode: 'ADD', type: 'TOPIC', dId, value: '' });
    const openAddModule = (dId: string, tId: string) => setNewItemModal({ open: true, mode: 'ADD', type: 'MODULE', dId, tId, value: '' });
    
    const openEditTopic = (dId: string, tId: string, currentName: string) => {
        setNewItemModal({ open: true, mode: 'EDIT', type: 'TOPIC', dId, itemId: tId, value: currentName });
    };

    const openEditModule = (dId: string, tId: string, mId: string, currentName: string) => {
        setNewItemModal({ open: true, mode: 'EDIT', type: 'MODULE', dId, tId, itemId: mId, value: currentName });
    };

    const deleteDiscipline = (dId: string) => {
        setConfirmDialog({
            open: true,
            title: "Excluir Disciplina",
            message: "Tem certeza que deseja excluir esta disciplina e todo seu conteúdo?",
            onConfirm: () => {
                setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.filter(d => d.id !== dId)
                }));
                setConfirmDialog(prev => ({...prev, open: false}));
            }
        });
    };

    const deleteTopic = (dId: string, tId: string) => {
        setConfirmDialog({
            open: true,
            title: "Excluir Assunto",
            message: "Tem certeza que deseja excluir este assunto e seus módulos?",
            onConfirm: () => {
                setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.map(d => d.id === dId ? {
                        ...d,
                        topics: d.topics.filter(t => t.id !== tId)
                    } : d)
                }));
                setConfirmDialog(prev => ({...prev, open: false}));
            }
        });
    };

    const deleteModule = (dId: string, tId: string, mId: string) => {
        setConfirmDialog({
            open: true,
            title: "Excluir Módulo",
            message: "Tem certeza que deseja excluir este módulo?",
            onConfirm: () => {
                setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.map(d => d.id === dId ? {
                        ...d,
                        topics: d.topics.map(t => t.id === tId ? {
                            ...t,
                            modules: t.modules.filter(m => m.id !== mId)
                        } : t)
                    } : d)
                }));
                setConfirmDialog(prev => ({...prev, open: false}));
            }
        });
    };

    const handleConfirmAddItem = () => {
        if (!newItemModal.value.trim()) return;
        
        if (newItemModal.mode === 'ADD') {
            if (newItemModal.type === 'DISCIPLINE') {
                 const newD: CourseDiscipline = { id: Date.now().toString(), name: newItemModal.value, topics: [], color: '#3b82f6' };
                 setLocalCourse(prev => ({...prev, disciplines: [...prev.disciplines, newD]}));
            } else if (newItemModal.type === 'TOPIC' && newItemModal.dId) {
                 const newT: CourseTopic = { id: Date.now().toString(), name: newItemModal.value, modules: [] };
                 setExpandedTopics(prev => [...prev, newT.id]);
                 setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.map(d => d.id === newItemModal.dId ? {...d, topics: [...d.topics, newT]} : d)
                }));
            } else if (newItemModal.type === 'MODULE' && newItemModal.dId && newItemModal.tId) {
                 const newM: ModuleIndex = {
                    id: Date.now().toString(),
                    name: newItemModal.value,
                    videoStatus: VideoStatus.PENDING,
                    pdfStatus: MaterialStatus.PENDING,
                    questionStatus: MaterialStatus.PENDING,
                    requiredClasses: 1, 
                    isSelectedForPresential: false
                };
                setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.map(d => d.id === newItemModal.dId ? {
                        ...d,
                        topics: d.topics.map(t => t.id === newItemModal.tId ? {...t, modules: [...t.modules, newM]} : t)
                    } : d)
                }));
            }
        } else if (newItemModal.mode === 'EDIT') {
            if (newItemModal.type === 'TOPIC' && newItemModal.dId && newItemModal.itemId) {
                setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.map(d => d.id === newItemModal.dId ? {
                        ...d,
                        topics: d.topics.map(t => t.id === newItemModal.itemId ? { ...t, name: newItemModal.value } : t)
                    } : d)
                }));
            } else if (newItemModal.type === 'MODULE' && newItemModal.dId && newItemModal.tId && newItemModal.itemId) {
                setLocalCourse(prev => ({
                    ...prev,
                    disciplines: prev.disciplines.map(d => d.id === newItemModal.dId ? {
                        ...d,
                        topics: d.topics.map(t => t.id === newItemModal.tId ? {
                            ...t,
                            modules: t.modules.map(m => m.id === newItemModal.itemId ? { ...m, name: newItemModal.value } : m)
                        } : t)
                    } : d)
                }));
            }
        }

        setNewItemModal({ ...newItemModal, open: false });
    }

    const handleMoveTopic = (dId: string, tId: string, direction: 'UP' | 'DOWN') => {
        setLocalCourse(prev => {
            const newDisciplines = [...prev.disciplines];
            const dIndex = newDisciplines.findIndex(d => d.id === dId);
            if (dIndex === -1) return prev;
            
            const discipline = { ...newDisciplines[dIndex] };
            const topics = [...discipline.topics];
            const tIndex = topics.findIndex(t => t.id === tId);
            if (tIndex === -1) return prev;

            if (direction === 'UP' && tIndex > 0) {
                [topics[tIndex], topics[tIndex - 1]] = [topics[tIndex - 1], topics[tIndex]];
            } else if (direction === 'DOWN' && tIndex < topics.length - 1) {
                [topics[tIndex], topics[tIndex + 1]] = [topics[tIndex + 1], topics[tIndex]];
            }

            discipline.topics = topics;
            newDisciplines[dIndex] = discipline;
            return { ...prev, disciplines: newDisciplines };
        });
    };

    const updateModule = (dId: string, tId: string, mId: string, updates: Partial<ModuleIndex>) => {
        setLocalCourse(prev => ({
            ...prev,
            disciplines: prev.disciplines.map(d => d.id === dId ? {
                ...d,
                topics: d.topics.map(t => t.id === tId ? {
                    ...t,
                    modules: t.modules.map(m => m.id === mId ? {...m, ...updates} : m)
                } : t)
            } : d)
        }));
    };

    const updateLocalConfig = (key: keyof PresentialConfig, value: any) => {
        setLocalCourse(prev => ({
            ...prev,
            presentialConfig: { ...prev.presentialConfig!, [key]: value }
        }));
    };

    return (
        <div className="h-full flex flex-col bg-insanus-black">
             <ConfirmationDialog 
                open={confirmDialog.open} 
                title={confirmDialog.title} 
                message={confirmDialog.message} 
                onConfirm={confirmDialog.onConfirm} 
                onCancel={() => setConfirmDialog(prev => ({...prev, open: false}))} 
             />

             {/* Header */}
             <div className="p-6 border-b border-gray-800 bg-insanus-dark flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full text-white"><ArrowLeft /></button>
                    <div>
                        <div className="flex items-center gap-2 group">
                            <h2 className="text-2xl font-bold text-white">{localCourse.name}</h2>
                            <button onClick={() => setIsEditInfoModalOpen(true)} className="text-gray-500 hover:text-white transition-colors" title="Editar Informações da Turma">
                                <Edit size={16} />
                            </button>
                            <span className="bg-green-900 text-green-400 text-xs px-2 py-0.5 rounded border border-green-700">PRESENCIAL</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {cfg.location}</span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {cfg.shift} ({cfg.startTime})</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button onClick={() => setActiveTab('EDITAL')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'EDITAL' ? 'bg-insanus-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Edital & Seleção</button>
                     <button onClick={() => setActiveTab('CALENDARIO')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'CALENDARIO' ? 'bg-insanus-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Calendário</button>
                     <button onClick={() => setActiveTab('FINANCEIRO')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'FINANCEIRO' ? 'bg-insanus-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Financeiro</button>
                     <button onClick={handleSave} disabled={saving} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-2 ml-4">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar
                     </button>
                </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 relative">
                
                {/* 1. EDITAL TAB */}
                {activeTab === 'EDITAL' && (
                    <div className="space-y-6">
                        {/* Summary Bar */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                             <div className="bg-insanus-panel p-4 rounded-xl border border-gray-800">
                                 <p className="text-xs text-gray-400 uppercase">Encontros Totais</p>
                                 <p className="text-2xl font-bold text-white">{cfg.totalMeetings}</p>
                             </div>
                             <div className={`bg-insanus-panel p-4 rounded-xl border ${consumedMeetings > cfg.totalMeetings ? 'border-red-500' : 'border-gray-800'}`}>
                                 <p className="text-xs text-gray-400 uppercase">Encontros Consumidos</p>
                                 <p className={`text-2xl font-bold ${consumedMeetings > cfg.totalMeetings ? 'text-red-500' : 'text-blue-400'}`}>
                                     {consumedMeetings} <span className="text-sm text-gray-500">/ {cfg.totalMeetings}</span>
                                 </p>
                             </div>
                             <div className="bg-insanus-panel p-4 rounded-xl border border-gray-800">
                                 <p className="text-xs text-gray-400 uppercase">Tópicos Selecionados</p>
                                 <p className="text-2xl font-bold text-white">{totalModulesSelected}</p>
                             </div>
                             {costAdditional > 0 && (
                                <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/50">
                                    <p className="text-xs text-red-400 uppercase">Custo Adicional (Estouro)</p>
                                    <p className="text-2xl font-bold text-red-500">{formatCurrency(costAdditional)}</p>
                                </div>
                             )}
                        </div>

                        {/* Disciplines List */}
                        {localCourse.disciplines.map(d => (
                            <div key={d.id} className="border border-insanus-panel rounded-xl bg-insanus-dark/50 overflow-hidden">
                                <div className="p-4 bg-insanus-panel/50 flex items-center justify-between cursor-pointer" onClick={() => toggleDiscipline(d.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: d.color }}></div>
                                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                            {expandedDisciplines.includes(d.id) ? <ChevronDown size={20}/> : <ChevronRight size={20} />} 
                                            {d.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={d.color || '#ffffff'}
                                            onClick={e => e.stopPropagation()}
                                            onChange={(e) => {
                                                const newColor = e.target.value;
                                                setLocalCourse(prev => ({
                                                    ...prev,
                                                    disciplines: prev.disciplines.map(disc => disc.id === d.id ? {...disc, color: newColor} : disc)
                                                }));
                                            }}
                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                        />
                                        <button onClick={(e) => {e.stopPropagation(); openAddTopic(d.id)}} className="text-xs bg-black border border-gray-700 hover:border-insanus-red px-3 py-1 rounded text-gray-300">
                                            + Assunto
                                        </button>
                                        <button onClick={(e) => {e.stopPropagation(); deleteDiscipline(d.id)}} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Excluir Disciplina">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {expandedDisciplines.includes(d.id) && (
                                    <div className="p-4 space-y-4">
                                        {d.topics.map((t, tIndex) => (
                                            <div key={t.id} className="border border-gray-800 rounded-lg overflow-hidden bg-black/20">
                                                {/* Header do Tópico (Acordeão) */}
                                                <div 
                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors group"
                                                    onClick={() => toggleTopic(t.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {expandedTopics.includes(t.id) ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                                                        <h4 className="font-bold text-gray-200">{t.name}</h4>
                                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                            {tIndex > 0 && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleMoveTopic(d.id, t.id, 'UP') }} className="text-gray-500 hover:text-white" title="Mover para cima">
                                                                    <ArrowUp size={12} />
                                                                </button>
                                                            )}
                                                            {tIndex < d.topics.length - 1 && (
                                                                <button onClick={(e) => { e.stopPropagation(); handleMoveTopic(d.id, t.id, 'DOWN') }} className="text-gray-500 hover:text-white" title="Mover para baixo">
                                                                    <ArrowDown size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); openEditTopic(d.id, t.id, t.name) }}
                                                            className="text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                                            title="Editar Nome"
                                                        >
                                                            <Edit size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); deleteTopic(d.id, t.id) }}
                                                            className="text-gray-500 hover:text-red-500 ml-1"
                                                            title="Excluir Assunto"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); openAddModule(d.id, t.id) }} className="text-insanus-red text-xs hover:underline">+ Módulo</button>
                                                </div>

                                                {/* Conteúdo do Tópico (Módulos) */}
                                                {expandedTopics.includes(t.id) && (
                                                    <div className="p-3 bg-black/40 border-t border-gray-800 space-y-2">
                                                        {t.modules.length === 0 && (
                                                            <p className="text-center text-xs text-gray-600 italic">Nenhum módulo cadastrado neste assunto.</p>
                                                        )}
                                                        {t.modules.map(m => (
                                                            <div key={m.id} className={`group p-3 rounded border flex items-center justify-between transition-colors ${m.isSelectedForPresential ? 'bg-blue-900/20 border-blue-500/50' : 'bg-black/60 border-gray-800'}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={m.isSelectedForPresential || false}
                                                                        onChange={(e) => updateModule(d.id, t.id, m.id, { isSelectedForPresential: e.target.checked })}
                                                                        className="w-5 h-5 accent-insanus-red rounded cursor-pointer"
                                                                    />
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-bold text-white">{m.name}</p>
                                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button 
                                                                                    onClick={() => openEditModule(d.id, t.id, m.id, m.name)}
                                                                                    className="text-gray-500 hover:text-blue-400"
                                                                                    title="Editar Módulo"
                                                                                >
                                                                                    <Edit size={12} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={(e) => { e.stopPropagation(); deleteModule(d.id, t.id, m.id) }}
                                                                                    className="text-gray-500 hover:text-red-500"
                                                                                    title="Excluir Módulo"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <label className="text-[10px] text-gray-400">Qtd. Aulas:</label>
                                                                            <input 
                                                                                type="number" 
                                                                                min="1"
                                                                                className="bg-black border border-gray-700 rounded w-12 text-center text-xs text-white"
                                                                                value={m.requiredClasses}
                                                                                onChange={(e) => updateModule(d.id, t.id, m.id, { requiredClasses: parseInt(e.target.value) || 1 })}
                                                                            />
                                                                            <span className="text-[10px] text-gray-500">(1 Aula = {((cfg.meetingDurationHours * 60) / cfg.classesPerMeeting)}min)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-2">
                                                                    <select 
                                                                        className="bg-black border border-gray-700 text-xs text-gray-400 rounded p-1 w-32"
                                                                        value={m.presentialTeacherId || ''}
                                                                        onChange={(e) => updateModule(d.id, t.id, m.id, { presentialTeacherId: e.target.value })}
                                                                    >
                                                                        <option value="">Professor...</option>
                                                                        {teachers.map(tr => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={openAddDiscipline} className="w-full py-4 border-2 border-dashed border-gray-800 text-gray-500 hover:text-white hover:border-insanus-red rounded-xl">+ Adicionar Disciplina</button>
                    </div>
                )}

                {/* 2. CALENDAR TAB */}
                {activeTab === 'CALENDARIO' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><CalendarDays /> Grade de Horários</h3>
                            <button 
                                onClick={generateSchedule}
                                disabled={generatingSchedule}
                                className="bg-insanus-red hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-900/20"
                            >
                                {generatingSchedule ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
                                Gerar Grade Automática
                            </button>
                        </div>

                        {scheduleByMeeting.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <CalendarDays size={64} className="mb-4 opacity-20" />
                                <p className="text-center max-w-md">
                                    Nenhuma grade gerada ainda. Configure os tópicos no edital e clique em "Gerar Grade Automática".
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {scheduleByMeeting.map((sessions, idx) => {
                                        const first = sessions[0];
                                        const dateParts = first.date.split('-');
                                        const displayDate = `${dateParts[2]}/${dateParts[1]}`;

                                        return (
                                            <div key={idx} className="bg-insanus-panel border border-gray-800 rounded-xl overflow-hidden group hover:border-insanus-red/30 transition-all">
                                                <div className="bg-black/40 p-3 border-b border-gray-800 flex justify-between items-center">
                                                    <div>
                                                        <span className="text-xs text-gray-500 font-bold uppercase block">{first.dayOfWeek}</span>
                                                        <span className="text-lg font-bold text-white">{displayDate}</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-gray-800 group-hover:text-insanus-red/20 transition-colors">#{first.meetingNumber}</span>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {sessions.map((sess, sIdx) => {
                                                        const info = getModuleInfo(sess.moduleId, sess.disciplineId);
                                                        const teacher = getTeacherInfo(sess.teacherId);
                                                        
                                                        return (
                                                            <div key={sIdx} className="bg-black/20 p-2 rounded border border-gray-800/50 flex gap-2">
                                                                <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: info.dColor }}></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] uppercase font-bold text-gray-400 truncate">{info.dName}</p>
                                                                    <p className="text-xs font-bold text-white truncate" title={info.mName}>{info.mName}</p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <User size={10} className="text-gray-500" />
                                                                        <span className={`text-[10px] truncate ${teacher ? 'text-blue-300' : 'text-red-400'}`}>
                                                                            {teacher ? teacher.name : 'Sem Prof.'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. FINANCIAL TAB */}
                {activeTab === 'FINANCEIRO' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white mb-4">Planejamento Financeiro da Turma</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-insanus-panel p-6 rounded-xl border border-gray-800">
                                <p className="text-sm text-gray-400 uppercase font-bold mb-2">Custo Previsto (Base)</p>
                                <p className="text-3xl font-bold text-white">{formatCurrency(projectedCost)}</p>
                                <div className="mt-4 space-y-1 text-xs text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Hora/Aula Base:</span>
                                        <span>{formatCurrency(cfg.hourlyRate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Carga Horária Total:</span>
                                        <span>{cfg.totalMeetings * cfg.meetingDurationHours}h</span>
                                    </div>
                                    {cfg.hasClassroomRecording && (
                                        <div className="flex justify-between text-green-400">
                                            <span>+ {cfg.commissionRecording}% Gravação:</span>
                                            <span>Ativo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-insanus-panel p-6 rounded-xl border border-gray-800">
                                <p className="text-sm text-gray-400 uppercase font-bold mb-2">Custo Mensal (Atual)</p>
                                <p className="text-3xl font-bold text-blue-400">{formatCurrency(projectedCost / 3)}</p> 
                                <p className="text-xs text-gray-500 mt-2">* Média estimada (rateio)</p>
                            </div>
                            <div className="bg-insanus-panel p-6 rounded-xl border border-gray-800">
                                <p className="text-sm text-gray-400 uppercase font-bold mb-2">Estrutura de Comissão</p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between border-b border-gray-700 pb-1">
                                        <span>Gravação Sala:</span>
                                        <span className="font-bold text-white">{cfg.commissionRecording}%</span>
                                    </li>
                                    <li className="flex justify-between border-b border-gray-700 pb-1">
                                        <span>Substituição:</span>
                                        <span className="font-bold text-white">{cfg.commissionSubstitution}%</span>
                                    </li>
                                    <li className="flex justify-between border-b border-gray-700 pb-1">
                                        <span>Fim de Semana/Feriado:</span>
                                        <span className="font-bold text-white">{cfg.commissionWeekend}%</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        {costAdditional > 0 && (
                            <div className="bg-red-900/10 border border-red-900 p-4 rounded-xl flex items-center gap-4">
                                <AlertTriangle className="text-red-500" size={32} />
                                <div>
                                    <h4 className="font-bold text-red-500">Alerta de Custo Adicional</h4>
                                    <p className="text-sm text-red-200">
                                        O planejamento atual excede a quantidade de encontros contratados em {consumedMeetings - cfg.totalMeetings} encontros.
                                        Isso gera um custo extra projetado de <strong>{formatCurrency(costAdditional)}</strong>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* NEW ITEM MODAL (Discipline/Topic/Module) */}
                {newItemModal.open && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {newItemModal.mode === 'ADD' ? <Plus size={18}/> : <Edit size={18}/>} 
                                    {newItemModal.mode === 'ADD' ? 'Adicionar' : 'Editar'} {newItemModal.type === 'DISCIPLINE' ? 'Disciplina' : newItemModal.type === 'TOPIC' ? 'Assunto' : 'Módulo'}
                                </h3>
                                <button onClick={() => setNewItemModal({...newItemModal, open: false})} className="text-gray-400 hover:text-white"><X /></button>
                             </div>
                             <input 
                                autoFocus
                                type="text"
                                placeholder="Digite o nome..."
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white mb-4 outline-none focus:border-insanus-red"
                                value={newItemModal.value}
                                onChange={(e) => setNewItemModal({...newItemModal, value: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddItem()}
                             />
                             <button onClick={handleConfirmAddItem} className="w-full bg-insanus-red hover:bg-red-700 py-3 rounded font-bold text-white">
                                 {newItemModal.mode === 'ADD' ? 'Adicionar' : 'Salvar Alteração'}
                             </button>
                        </div>
                    </div>
                )}

                {/* EDIT COURSE INFO MODAL */}
                {isEditInfoModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-4xl shadow-2xl my-8 flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-insanus-panel z-10">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Edit className="text-insanus-red" /> Editar Configurações da Turma
                                </h3>
                                <button onClick={() => setIsEditInfoModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Nome do Projeto</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-insanus-red outline-none"
                                            value={localCourse.name}
                                            onChange={(e) => setLocalCourse(prev => ({...prev, name: e.target.value}))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Categoria</label>
                                        <select 
                                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white"
                                            value={localCourse.category}
                                            onChange={(e) => setLocalCourse(prev => ({...prev, category: e.target.value as CourseCategory}))}
                                        >
                                            <option value="CONCURSO">Concurso Público</option>
                                            <option value="ENEM">ENEM</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                        <h4 className="text-green-500 font-bold mb-4 flex items-center gap-2"><MapPin size={16}/> Configurações de Polo</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Localidade</label>
                                                <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                                    value={cfg.location}
                                                    onChange={(e) => updateLocalConfig('location', e.target.value)}
                                                >
                                                    <option value="RIO_BRANCO">Rio Branco</option>
                                                    <option value="PORTO_VELHO">Porto Velho</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Sub-tipo</label>
                                                <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                                    value={cfg.subType}
                                                    onChange={(e) => updateLocalConfig('subType', e.target.value)}
                                                >
                                                    <option value="PRE_EDITAL">Pré-Edital</option>
                                                    <option value="POS_EDITAL">Pós-Edital</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Modalidade</label>
                                                <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                                    value={cfg.modality}
                                                    onChange={(e) => updateLocalConfig('modality', e.target.value)}
                                                >
                                                    <option value="REGULAR">Regular</option>
                                                    <option value="INTENSIVO">Intensivo</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                checked={cfg.hasClassroomRecording}
                                                onChange={(e) => updateLocalConfig('hasClassroomRecording', e.target.checked)}
                                                className="w-4 h-4 accent-green-500"
                                            />
                                            <span className="text-sm text-white">Haverá gravação da sala de aula?</span>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                        <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><Clock size={16}/> Estrutura da Turma</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Total Encontros</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.totalMeetings}
                                                    onChange={(e) => updateLocalConfig('totalMeetings', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Duração Encontro (h)</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.meetingDurationHours}
                                                    onChange={(e) => updateLocalConfig('meetingDurationHours', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Aulas/Encontro</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.classesPerMeeting}
                                                    onChange={(e) => updateLocalConfig('classesPerMeeting', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Início (Horário)</label>
                                                <input type="time" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.startTime}
                                                    onChange={(e) => updateLocalConfig('startTime', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Dias da Semana</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'].map(day => (
                                                        <button 
                                                            key={day}
                                                            className={`px-2 py-1 text-[10px] rounded border ${cfg.daysOfWeek.includes(day as DayOfWeek) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-500'}`}
                                                            onClick={() => {
                                                                const current = cfg.daysOfWeek;
                                                                const updated = current.includes(day as DayOfWeek) ? current.filter(d => d !== day) : [...current, day as DayOfWeek];
                                                                updateLocalConfig('daysOfWeek', updated);
                                                            }}
                                                        >
                                                            {day.substring(0,3)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 justify-center">
                                                <label className="flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={cfg.allowWeekend} onChange={e => updateLocalConfig('allowWeekend', e.target.checked)} className="accent-blue-500" />
                                                    Usar Fim de Semana (Reserva)
                                                </label>
                                                <label className="flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={cfg.skipRedHolidays} onChange={e => updateLocalConfig('skipRedHolidays', e.target.checked)} className="accent-blue-500" />
                                                    Pular Feriados (Folga)
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                        <h4 className="text-yellow-500 font-bold mb-4 flex items-center gap-2"><DollarSign size={16}/> Remuneração (Hora/Aula)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Valor Base (R$)</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.hourlyRate}
                                                    onChange={(e) => updateLocalConfig('hourlyRate', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">% Gravação</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.commissionRecording}
                                                    onChange={(e) => updateLocalConfig('commissionRecording', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">% Substituição</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.commissionSubstitution}
                                                    onChange={(e) => updateLocalConfig('commissionSubstitution', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">% Fim de Semana</label>
                                                <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                                    value={cfg.commissionWeekend}
                                                    onChange={(e) => updateLocalConfig('commissionWeekend', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        onClick={() => setIsEditInfoModalOpen(false)}
                                        className="bg-insanus-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold"
                                    >
                                        Concluir Edição
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

// 4. Online Course Detail View
const CourseDetail = ({ 
    course, 
    onUpdate, 
    onBack
}: { 
    course: Course, 
    onUpdate: (c: Course) => Promise<void>, 
    onBack: () => void
}) => {
    const [expandedDisciplines, setExpandedDisciplines] = useState<string[]>([]);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
    const [inputDialog, setInputDialog] = useState({ open: false, title: '', value: '', onConfirm: (v: string) => {} });
  
    const toggleDiscipline = (id: string) => {
        setExpandedDisciplines(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
  
    const addDiscipline = async () => {
        setInputDialog({
            open: true,
            title: "Nome da Disciplina",
            value: "",
            onConfirm: async (name) => {
                if(!name) return;
                const newD: CourseDiscipline = { id: Date.now().toString(), name, topics: [] };
                await onUpdate({...course, disciplines: [...course.disciplines, newD]});
                setInputDialog(prev => ({...prev, open: false}));
            }
        });
    };
  
    const addTopic = async (dId: string) => {
        setInputDialog({
            open: true,
            title: "Nome do Assunto",
            value: "",
            onConfirm: async (name) => {
                if(!name) return;
                const updatedDisciplines = course.disciplines.map(d => {
                    if(d.id === dId) {
                        return { ...d, topics: [...d.topics, { id: Date.now().toString(), name, modules: [] }] };
                    }
                    return d;
                });
                await onUpdate({...course, disciplines: updatedDisciplines});
                setInputDialog(prev => ({...prev, open: false}));
            }
        });
    };
  
    const addModule = async (dId: string, tId: string) => {
        setInputDialog({
            open: true,
            title: "Nome do Módulo",
            value: "",
            onConfirm: async (name) => {
                if(!name) return;
                const updatedDisciplines = course.disciplines.map(d => {
                    if(d.id === dId) {
                        return {
                            ...d,
                            topics: d.topics.map(t => {
                                if(t.id === tId) {
                                    return {
                                        ...t,
                                        modules: [...t.modules, {
                                            id: Date.now().toString(),
                                            name,
                                            videoStatus: VideoStatus.PENDING,
                                            pdfStatus: MaterialStatus.PENDING,
                                            questionStatus: MaterialStatus.PENDING
                                        }]
                                    };
                                }
                                return t;
                            })
                        };
                    }
                    return d;
                });
                await onUpdate({...course, disciplines: updatedDisciplines});
                setInputDialog(prev => ({...prev, open: false}));
            }
        });
    };
  
    const updateModuleStatus = async (dId: string, tId: string, mId: string, field: string, value: any) => {
        const updatedDisciplines = course.disciplines.map(d => {
            if(d.id === dId) {
                return {
                    ...d,
                    topics: d.topics.map(t => {
                        if(t.id === tId) {
                            return {
                                ...t,
                                modules: t.modules.map(m => {
                                    if(m.id === mId) return { ...m, [field]: value };
                                    return m;
                                })
                            };
                        }
                        return t;
                    })
                };
            }
            return d;
        });
        await onUpdate({...course, disciplines: updatedDisciplines});
    };

    const deleteDiscipline = (dId: string) => {
        setConfirmDialog({
            open: true,
            title: "Excluir Disciplina",
            message: "Excluir disciplina e todo seu conteúdo?",
            onConfirm: async () => {
                const updatedDisciplines = course.disciplines.filter(d => d.id !== dId);
                await onUpdate({...course, disciplines: updatedDisciplines});
                setConfirmDialog(prev => ({...prev, open: false}));
            }
        });
    };

    const deleteTopic = (dId: string, tId: string) => {
        setConfirmDialog({
            open: true,
            title: "Excluir Assunto",
            message: "Excluir assunto e seus módulos?",
            onConfirm: async () => {
                const updatedDisciplines = course.disciplines.map(d => {
                    if(d.id === dId) {
                        return { ...d, topics: d.topics.filter(t => t.id !== tId) };
                    }
                    return d;
                });
                await onUpdate({...course, disciplines: updatedDisciplines});
                setConfirmDialog(prev => ({...prev, open: false}));
            }
        });
    };

    const deleteModule = (dId: string, tId: string, mId: string) => {
        setConfirmDialog({
            open: true,
            title: "Excluir Módulo",
            message: "Tem certeza que deseja excluir este módulo?",
            onConfirm: async () => {
                const updatedDisciplines = course.disciplines.map(d => {
                    if(d.id === dId) {
                        return {
                            ...d,
                            topics: d.topics.map(t => {
                                if(t.id === tId) {
                                    return { ...t, modules: t.modules.filter(m => m.id !== mId) };
                                }
                                return t;
                            })
                        };
                    }
                    return d;
                });
                await onUpdate({...course, disciplines: updatedDisciplines});
                setConfirmDialog(prev => ({...prev, open: false}));
            }
        });
    };
  
    return (
        <div className="h-full flex flex-col bg-insanus-black">
            <ConfirmationDialog 
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({...prev, open: false}))}
            />
            <InputDialog 
                open={inputDialog.open}
                title={inputDialog.title}
                initialValue={inputDialog.value}
                onConfirm={inputDialog.onConfirm}
                onCancel={() => setInputDialog(prev => ({...prev, open: false}))}
            />

            <div className="p-6 border-b border-gray-800 bg-insanus-dark flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full text-white"><ArrowLeft /></button>
                    <h2 className="text-2xl font-bold text-white">{course.name} <span className="text-sm font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded ml-2">ONLINE</span></h2>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 {course.disciplines.map(d => (
                     <div key={d.id} className="border border-insanus-panel rounded-xl bg-insanus-dark/50 overflow-hidden">
                         <div className="p-4 bg-insanus-panel/50 flex items-center justify-between cursor-pointer" onClick={() => toggleDiscipline(d.id)}>
                             <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                 {expandedDisciplines.includes(d.id) ? <ChevronDown size={20}/> : <ChevronRight size={20} />} 
                                 {d.name}
                             </h3>
                             <div className="flex items-center gap-2">
                                <button onClick={(e) => {e.stopPropagation(); addTopic(d.id)}} className="text-xs bg-black border border-gray-700 hover:border-insanus-red px-3 py-1 rounded text-gray-300">
                                    + Assunto
                                </button>
                                <button onClick={(e) => {e.stopPropagation(); deleteDiscipline(d.id)}} className="p-2 text-gray-500 hover:text-red-500" title="Excluir Disciplina">
                                    <Trash2 size={16} />
                                </button>
                             </div>
                         </div>
                         
                         {expandedDisciplines.includes(d.id) && (
                             <div className="p-4 space-y-4">
                                 {d.topics.map(t => (
                                     <div key={t.id} className="pl-4 border-l-2 border-gray-800">
                                         <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-200">{t.name}</h4>
                                                <button onClick={() => deleteTopic(d.id, t.id)} className="text-gray-500 hover:text-red-500 ml-2" title="Excluir Assunto">
                                                    <Trash2 size={14} />
                                                </button>
                                             </div>
                                             <button onClick={() => addModule(d.id, t.id)} className="text-insanus-red text-xs hover:underline">+ Módulo</button>
                                         </div>
                                         <div className="space-y-2">
                                             {t.modules.map(m => (
                                                 <div key={m.id} className="bg-black/40 border border-gray-800 rounded p-3 flex items-center justify-between">
                                                     <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-white">{m.name}</span>
                                                        <button onClick={() => deleteModule(d.id, t.id, m.id)} className="text-gray-600 hover:text-red-500 ml-2" title="Excluir Módulo">
                                                            <Trash2 size={12} />
                                                        </button>
                                                     </div>
                                                     <div className="flex gap-4">
                                                         <select 
                                                             value={m.videoStatus}
                                                             onChange={(e) => updateModuleStatus(d.id, t.id, m.id, 'videoStatus', e.target.value)}
                                                             className={`text-[10px] bg-transparent border-none ${m.videoStatus === 'PUBLICADO' ? 'text-green-500' : 'text-yellow-500'}`}
                                                         >
                                                             {Object.values(VideoStatus).map(s => <option key={s} value={s} className="bg-black text-gray-300">{s}</option>)}
                                                         </select>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 ))}
                 <button onClick={addDiscipline} className="w-full py-4 border-2 border-dashed border-gray-800 text-gray-500 hover:text-white hover:border-insanus-red rounded-xl">+ Adicionar Disciplina</button>
            </div>
        </div>
    );
};

// 5. Main App
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState<{
      name: string;
      type: CourseType;
      category: CourseCategory;
      presentialConfig: PresentialConfig;
  }>({
    name: '',
    type: 'ONLINE',
    category: 'CONCURSO',
    presentialConfig: INITIAL_PRESENTIAL_CONFIG
  });

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherFormData, setTeacherFormData] = useState<Omit<Teacher, 'id'>>(INITIAL_TEACHER_FORM);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [appConfirm, setAppConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newScheduleData, setNewScheduleData] = useState({
      date: '',
      time: '',
      location: 'RIO_BRANCO' as StudioLocation,
      courseId: '',
      disciplineId: '',
      topicId: '',
      moduleId: ''
  });

  const selectedScheduleCourse = courses.find(c => c.id === newScheduleData.courseId);
  const selectedScheduleDiscipline = selectedScheduleCourse?.disciplines.find(d => d.id === newScheduleData.disciplineId);
  const selectedScheduleTopic = selectedScheduleDiscipline?.topics.find(t => t.id === newScheduleData.topicId);
  const selectedScheduleModule = selectedScheduleTopic?.modules.find(m => m.id === newScheduleData.moduleId);
  
  const selectedTeacher = useMemo(() => {
     if (!selectedScheduleTopic) return null;
     const tId = selectedScheduleModule?.presentialTeacherId || selectedScheduleTopic.teacherId;
     return teachers.find(t => t.id === tId);
  }, [selectedScheduleTopic, selectedScheduleModule, teachers]);


  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => setCourses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Course))));
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => setTeachers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Teacher))));
    const unsubFiles = onSnapshot(collection(db, 'files'), (snap) => setFiles(snap.docs.map(d => ({ ...d.data(), id: d.id } as FileNode))));
    const unsubSchedule = onSnapshot(collection(db, 'schedules'), (snap) => setSchedule(snap.docs.map(d => ({ ...d.data(), id: d.id } as ScheduleEvent))));
    return () => { unsubCourses(); unsubTeachers(); unsubFiles(); unsubSchedule(); };
  }, []);

  const handleUpdateCourse = async (updated: Course) => {
    try {
      const docRef = doc(db, 'courses', updated.id);
      const { id, ...data } = updated;
      await updateDoc(docRef, data as any);
      setSelectedCourse(updated);
    } catch (e) {
      console.error("Error updating course", e);
      throw e;
    }
  };

  const updatePresentialConfig = (key: keyof PresentialConfig, value: any) => {
      setNewCourseData(prev => ({
          ...prev,
          presentialConfig: { ...prev.presentialConfig, [key]: value }
      }));
  };

  const handleSubmitCreateCourse = async () => {
    if (!newCourseData.name.trim()) return alert("Por favor, insira o nome da turma.");
    setCreatingCourse(true);
    try {
      const payload: any = {
        name: newCourseData.name,
        type: newCourseData.type,
        category: newCourseData.category,
        disciplines: []
      };
      
      if (newCourseData.type === 'PRESENCIAL') {
          payload.presentialConfig = newCourseData.presentialConfig;
      }

      await addDoc(collection(db, "courses"), payload);
      setIsCreateCourseModalOpen(false);
      setNewCourseData({ 
          name: '', 
          type: 'ONLINE', 
          category: 'CONCURSO', 
          presentialConfig: INITIAL_PRESENTIAL_CONFIG 
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao criar turma no banco de dados.");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleOpenNewTeacher = () => {
      setTeacherFormData(INITIAL_TEACHER_FORM);
      setEditingTeacherId(null);
      setIsTeacherModalOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
      const { id, ...data } = teacher;
      setTeacherFormData(data);
      setEditingTeacherId(id);
      setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async () => {
      if(!teacherFormData.name) return alert("Nome obrigatório");
      try {
          if (editingTeacherId) {
              await updateDoc(doc(db, "teachers", editingTeacherId), teacherFormData);
          } else {
              await addDoc(collection(db, "teachers"), teacherFormData);
          }
          setTeacherFormData(INITIAL_TEACHER_FORM);
          setEditingTeacherId(null);
          setIsTeacherModalOpen(false);
      } catch(e) {
          console.error(e);
          alert("Erro ao salvar professor");
      }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = () => {
              setCropImageSrc(reader.result as string);
              e.target.value = '';
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCropComplete = async (blob: Blob) => {
      setCropImageSrc(null); 
      setUploadingAvatar(true);
      try {
          const filename = `avatars/${Date.now()}_cropped.jpg`;
          const storageRef = ref(storage, filename);
          const snapshot = await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(snapshot.ref);
          setTeacherFormData(prev => ({ ...prev, avatarUrl: url }));
      } catch (err) {
          console.error("Erro ao enviar imagem", err);
          alert("Erro ao enviar imagem");
      } finally {
          setUploadingAvatar(false);
      }
  };

  const handleSaveSchedule = async () => {
      if (!newScheduleData.date || !newScheduleData.time) return alert("Preencha data e hora");
      if (!newScheduleData.moduleId) return alert("Selecione um módulo");

      if (newScheduleData.location !== 'HOME') {
          const conflict = schedule.find(s => 
              s.date === newScheduleData.date && 
              s.time === newScheduleData.time && 
              s.location === newScheduleData.location
          );
          if (conflict) {
              return alert(`Conflito! Já existe gravação agendada no ${newScheduleData.location === 'RIO_BRANCO' ? 'Estúdio Rio Branco' : 'Estúdio PVH'} neste horário.`);
          }
      }

      try {
          await addDoc(collection(db, "schedules"), {
              date: newScheduleData.date,
              time: newScheduleData.time,
              location: newScheduleData.location,
              
              courseId: newScheduleData.courseId,
              courseName: selectedScheduleCourse?.name || '',
              disciplineId: newScheduleData.disciplineId,
              disciplineName: selectedScheduleDiscipline?.name || '',
              topicId: newScheduleData.topicId,
              topicName: selectedScheduleTopic?.name || '',
              moduleId: newScheduleData.moduleId,
              moduleName: selectedScheduleModule?.name || '',
              teacherId: selectedTeacher?.id || '',
              teacherName: selectedTeacher?.name || 'Sem Professor'
          });

          if (selectedScheduleCourse) {
              const updatedDisciplines = selectedScheduleCourse.disciplines.map(d => {
                  if (d.id === newScheduleData.disciplineId) {
                      return {
                          ...d,
                          topics: d.topics.map(t => {
                              if (t.id === newScheduleData.topicId) {
                                  return {
                                      ...t,
                                      modules: t.modules.map(m => {
                                          if (m.id === newScheduleData.moduleId) {
                                              return { ...m, videoStatus: VideoStatus.SCHEDULED };
                                          }
                                          return m;
                                      })
                                  };
                              }
                              return t;
                          })
                      };
                  }
                  return d;
              });
              
              const docRef = doc(db, 'courses', selectedScheduleCourse.id);
              await updateDoc(docRef, { disciplines: updatedDisciplines });
          }

          setIsScheduleModalOpen(false);
          setNewScheduleData({ date: '', time: '', location: 'RIO_BRANCO', courseId: '', disciplineId: '', topicId: '', moduleId: '' });
      } catch (e) {
          console.error(e);
          alert("Erro ao agendar");
      }
  };

  const addSubject = () => {
      if(newSubject && !teacherFormData.subjects.includes(newSubject)) {
          setTeacherFormData(prev => ({
              ...prev,
              subjects: [...prev.subjects, newSubject],
              primarySubject: prev.primarySubject || newSubject
          }));
          setNewSubject('');
      }
  };

  const handleDeleteCourse = (id: string) => {
      setAppConfirm({
        open: true,
        title: "Excluir Projeto de Turma",
        message: "Tem certeza? Isso apagará todas as disciplinas e agendamentos relacionados.",
        onConfirm: async () => {
             try {
                await deleteDoc(doc(db, "courses", id));
                if(selectedCourse?.id === id) setSelectedCourse(null);
            } catch (e) {
                alert("Erro ao excluir");
            } finally {
                setAppConfirm(prev => ({...prev, open: false}));
            }
        }
      });
  };
  
  const handleDuplicateCourse = async (id: string) => {
      const original = courses.find(c => c.id === id);
      if (original) {
        const copy = { ...original, name: `${original.name} (Cópia)` };
        const { id: _, ...data } = copy;
        await addDoc(collection(db, "courses"), data);
      }
  };

  const renderContent = () => {
    if (selectedCourse) {
      if (selectedCourse.type === 'PRESENCIAL') {
        return (
            <PresentialCourseDetail 
                course={selectedCourse} 
                onUpdate={handleUpdateCourse} 
                onBack={() => setSelectedCourse(null)}
                teachers={teachers}
            />
        );
      } else {
        return (
            <CourseDetail 
                course={selectedCourse} 
                onUpdate={handleUpdateCourse} 
                onBack={() => setSelectedCourse(null)}
            />
        );
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return (
            <div className="p-6 text-white">
                <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-insanus-panel to-insanus-dark border border-gray-800 p-6 rounded-xl relative overflow-hidden">
                        <BookOpen size={64} className="absolute top-0 right-0 p-4 opacity-10" />
                        <h3 className="text-gray-400 font-medium mb-2 uppercase text-xs">Projetos Ativos</h3>
                        <p className="text-4xl font-bold text-white">{courses.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-insanus-panel to-insanus-dark border border-gray-800 p-6 rounded-xl relative overflow-hidden">
                        <FileText size={64} className="absolute top-0 right-0 p-4 opacity-10" />
                        <h3 className="text-gray-400 font-medium mb-2 uppercase text-xs">Materiais no Banco</h3>
                        <p className="text-4xl font-bold text-white">{files.filter(f => f.type === 'FILE').length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-insanus-panel to-insanus-dark border border-gray-800 p-6 rounded-xl relative overflow-hidden">
                        <Video size={64} className="absolute top-0 right-0 p-4 opacity-10" />
                        <h3 className="text-gray-400 font-medium mb-2 uppercase text-xs">Gravações Agendadas</h3>
                        <p className="text-4xl font-bold text-insanus-red">{schedule.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-insanus-panel to-insanus-dark border border-gray-800 p-6 rounded-xl relative overflow-hidden">
                        <Users size={64} className="absolute top-0 right-0 p-4 opacity-10" />
                        <h3 className="text-gray-400 font-medium mb-2 uppercase text-xs">Professores</h3>
                        <p className="text-4xl font-bold text-white">{teachers.length}</p>
                    </div>
                </div>
            </div>
        );
      case 'courses':
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Projetos & Turmas</h2>
              <button 
                onClick={() => setIsCreateCourseModalOpen(true)}
                className="bg-insanus-red text-white px-4 py-2 rounded font-bold hover:bg-red-700 flex items-center gap-2"
              >
                <Plus size={18}/> Nova Turma
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length === 0 && (
                  <p className="text-gray-500 col-span-full text-center py-10">Nenhuma turma cadastrada. Crie uma nova turma.</p>
              )}
              {courses.map(course => (
                <div key={course.id} onClick={() => setSelectedCourse(course)} className="bg-insanus-panel border border-gray-800 p-6 rounded-xl hover:border-insanus-red cursor-pointer group transition-all relative">
                   <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg ${course.type === 'ONLINE' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>
                      {course.type === 'ONLINE' ? <MonitorPlay size={24} /> : <Users size={24} />}
                    </div>
                    {course.presentialConfig?.location && (
                       <span className="text-xs font-bold bg-gray-800 text-gray-400 px-2 py-1 rounded">
                         {course.presentialConfig.location === 'RIO_BRANCO' ? 'RB' : 'PVH'}
                       </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-insanus-red transition-colors">{course.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{course.category} • {course.disciplines?.length || 0} Disciplinas</p>
                  
                  {course.presentialSchedule && (
                     <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {course.presentialSchedule.length} Aulas</span>
                        <span className="flex items-center gap-1"><Users size={12}/> Presencial</span>
                     </div>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); handleDuplicateCourse(course.id); }} className="p-1.5 bg-black/50 rounded hover:text-white text-gray-400"><Copy size={14}/></button>
                     <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} className="p-1.5 bg-black/50 rounded hover:text-red-500 text-gray-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="p-8 h-screen pb-24">
            <h2 className="text-2xl font-bold text-white mb-6">Banco de Materiais</h2>
            <div className="h-full">
               <FileManager files={files} />
            </div>
          </div>
        );
      case 'schedule':
          return (
              <div className="p-8 h-screen pb-24 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Agenda de Gravações (Estúdios)</h2>
                      <button 
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="bg-insanus-red text-white px-4 py-2 rounded font-bold hover:bg-red-700 flex items-center gap-2"
                      >
                          <Plus size={18}/> Novo Agendamento
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                      {['RIO_BRANCO', 'PORTO_VELHO', 'HOME'].map(loc => (
                          <div key={loc} className="bg-insanus-panel border border-gray-800 rounded-xl flex flex-col">
                              <div className="p-4 border-b border-gray-800 bg-insanus-dark">
                                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                      {loc === 'HOME' ? <Home size={18}/> : <Video size={18}/>}
                                      {loc === 'RIO_BRANCO' ? 'Estúdio Rio Branco' : loc === 'PORTO_VELHO' ? 'Estúdio Porto Velho' : 'Home Studio'}
                                  </h3>
                              </div>
                              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                                  {schedule.filter(s => s.location === loc).map(ev => (
                                      <div key={ev.id} className="bg-black/40 border border-gray-700 p-3 rounded-lg">
                                          <div className="flex justify-between items-start mb-2">
                                            <p className="text-white font-bold text-lg">{new Date(ev.date).toLocaleDateString()} - {ev.time}</p>
                                            <button onClick={() => deleteDoc(doc(db, "schedules", ev.id))} className="text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                                          </div>
                                          
                                          <div className="space-y-1">
                                            {ev.moduleName ? (
                                                <>
                                                    <p className="text-xs text-insanus-red font-bold uppercase">{ev.courseName}</p>
                                                    <p className="text-xs text-gray-300">{ev.disciplineName} &gt; {ev.topicName}</p>
                                                    <p className="text-sm font-bold text-white">{ev.moduleName}</p>
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/50">
                                                        <User size={12} className="text-gray-500"/>
                                                        <span className="text-xs text-blue-300">{ev.teacherName || 'Sem Professor'}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Agendamento Manual: {ev.moduleId}</p>
                                            )}
                                          </div>
                                      </div>
                                  ))}
                                  {schedule.filter(s => s.location === loc).length === 0 && (
                                      <p className="text-center text-gray-500 text-sm py-4">Sem agendamentos.</p>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      case 'team':
         return (
             <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Professores & Equipe</h2>
                    <button 
                        onClick={handleOpenNewTeacher}
                        className="bg-insanus-red text-white px-4 py-2 rounded font-bold hover:bg-red-700 flex items-center gap-2"
                    >
                        <Plus size={18}/> Novo Professor
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {teachers.map(t => (
                         <div key={t.id} className="bg-insanus-panel p-4 rounded-xl border border-gray-800 flex items-center gap-4 relative group">
                             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditTeacher(t)} className="p-1.5 bg-black/50 rounded hover:text-blue-400 text-gray-400"><Edit size={14}/></button>
                                <button onClick={() => deleteDoc(doc(db, "teachers", t.id))} className="p-1.5 bg-black/50 rounded hover:text-red-500 text-gray-400"><Trash2 size={14}/></button>
                             </div>
                             <div className="w-24 h-24 rounded-full bg-insanus-red flex items-center justify-center font-bold text-white text-2xl overflow-hidden shrink-0">
                                 {t.avatarUrl ? <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover"/> : t.name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-bold text-white text-lg">{t.name}</h4>
                                 <p className="text-sm text-gray-400">{t.primarySubject}</p>
                                 <div className="flex gap-2 mt-2">
                                     {t.whatsapp && <a href={formatWhatsAppLink(t.whatsapp)} target="_blank" className="text-green-500 hover:text-green-400"><Phone size={16}/></a>}
                                     <a href={`mailto:${t.email}`} className="text-blue-500 hover:text-blue-400"><Mail size={16}/></a>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-insanus-black min-h-screen text-gray-100 font-sans">
      <ConfirmationDialog 
        open={appConfirm.open}
        title={appConfirm.title}
        message={appConfirm.message}
        onConfirm={appConfirm.onConfirm}
        onCancel={() => setAppConfirm(prev => ({...prev, open: false}))}
      />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}

        {cropImageSrc && (
            <AvatarEditor 
                imageSrc={cropImageSrc} 
                onCancel={() => setCropImageSrc(null)}
                onSave={handleCropComplete}
            />
        )}
        
        {isScheduleModalOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-md p-6 flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar size={20}/> Agendar Gravação</h3>
                        <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                    </div>
                    <div className="space-y-4 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Data</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                    value={newScheduleData.date}
                                    onChange={(e) => setNewScheduleData({...newScheduleData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Hora</label>
                                <input 
                                    type="time" 
                                    className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                    value={newScheduleData.time}
                                    onChange={(e) => setNewScheduleData({...newScheduleData, time: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Local da Gravação</label>
                            <select 
                                className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                value={newScheduleData.location}
                                onChange={(e) => setNewScheduleData({...newScheduleData, location: e.target.value as StudioLocation})}
                            >
                                <option value="RIO_BRANCO">Estúdio Rio Branco</option>
                                <option value="PORTO_VELHO">Estúdio Porto Velho</option>
                                <option value="HOME">Home Studio (Professor)</option>
                            </select>
                            {newScheduleData.location === 'HOME' && (
                                <p className="text-[10px] text-green-500 mt-1">* Não gera conflito de horário com estúdios.</p>
                            )}
                        </div>
                        
                        <div className="border-t border-gray-700 my-4 pt-4">
                             <label className="text-xs text-insanus-red uppercase font-bold block mb-2">Seleção do Conteúdo (Online)</label>
                             
                             <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 block mb-1">Projeto de Turma</label>
                                    <select 
                                        className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                        value={newScheduleData.courseId}
                                        onChange={(e) => setNewScheduleData(prev => ({ ...prev, courseId: e.target.value, disciplineId: '', topicId: '', moduleId: '' }))}
                                    >
                                        <option value="">Selecione a Turma...</option>
                                        {courses.filter(c => c.type === 'ONLINE').map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {newScheduleData.courseId && (
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Disciplina</label>
                                        <select 
                                            className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                            value={newScheduleData.disciplineId}
                                            onChange={(e) => setNewScheduleData(prev => ({ ...prev, disciplineId: e.target.value, topicId: '', moduleId: '' }))}
                                        >
                                            <option value="">Selecione a Disciplina...</option>
                                            {selectedScheduleCourse?.disciplines.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {newScheduleData.disciplineId && (
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Assunto</label>
                                        <select 
                                            className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                            value={newScheduleData.topicId}
                                            onChange={(e) => setNewScheduleData(prev => ({ ...prev, topicId: e.target.value, moduleId: '' }))}
                                        >
                                            <option value="">Selecione o Assunto...</option>
                                            {selectedScheduleDiscipline?.topics.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {newScheduleData.topicId && (
                                    <div>
                                        <label className="text-[10px] text-gray-500 block mb-1">Módulo</label>
                                        <select 
                                            className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                            value={newScheduleData.moduleId}
                                            onChange={(e) => setNewScheduleData(prev => ({ ...prev, moduleId: e.target.value }))}
                                        >
                                            <option value="">Selecione o Módulo...</option>
                                            {selectedScheduleTopic?.modules.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                             </div>
                        </div>

                        {selectedScheduleModule && (
                             <div className="bg-gray-800/50 p-3 rounded border border-gray-700 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {selectedTeacher?.avatarUrl ? <img src={selectedTeacher.avatarUrl} className="w-full h-full object-cover"/> : <User size={20}/>}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase">Professor Responsável</p>
                                        <p className="font-bold text-white text-sm">{selectedTeacher?.name || 'Não atribuído'}</p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-700 flex items-center gap-2 text-xs text-yellow-500">
                                    <AlertTriangle size={12} />
                                    <span>Status mudará para: <strong>AGENDADO</strong></span>
                                </div>
                             </div>
                        )}

                        <button onClick={handleSaveSchedule} className="w-full bg-insanus-red hover:bg-red-700 py-3 rounded font-bold text-white mt-4">
                            Confirmar Agendamento
                        </button>
                    </div>
                </div>
            </div>
        )}

         {isCreateCourseModalOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-4xl shadow-2xl my-8 flex flex-col max-h-[90vh]">
                   <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-insanus-panel z-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Plus className="text-insanus-red" /> Novo Projeto
                    </h3>
                    <button onClick={() => setIsCreateCourseModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Nome do Projeto</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Polícia Civil - Agente 2024"
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-insanus-red outline-none"
                                value={newCourseData.name}
                                onChange={(e) => setNewCourseData({...newCourseData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Tipo de Turma</label>
                            <div className="flex gap-2">
                                <button onClick={() => setNewCourseData({...newCourseData, type: 'ONLINE'})} className={`flex-1 py-3 rounded-lg border font-bold flex items-center justify-center gap-2 ${newCourseData.type === 'ONLINE' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400'}`}>
                                    <MonitorPlay size={18}/> Online
                                </button>
                                <button onClick={() => setNewCourseData({...newCourseData, type: 'PRESENCIAL'})} className={`flex-1 py-3 rounded-lg border font-bold flex items-center justify-center gap-2 ${newCourseData.type === 'PRESENCIAL' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-700 text-gray-400'}`}>
                                    <GraduationCap size={18}/> Presencial
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Categoria</label>
                            <select 
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white"
                                value={newCourseData.category}
                                onChange={(e) => setNewCourseData({...newCourseData, category: e.target.value as CourseCategory})}
                            >
                                <option value="CONCURSO">Concurso Público</option>
                                <option value="ENEM">ENEM</option>
                            </select>
                        </div>
                    </div>

                    {newCourseData.type === 'PRESENCIAL' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                <h4 className="text-green-500 font-bold mb-4 flex items-center gap-2"><MapPin size={16}/> Configurações de Polo</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Localidade</label>
                                        <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                            value={newCourseData.presentialConfig.location}
                                            onChange={(e) => updatePresentialConfig('location', e.target.value)}
                                        >
                                            <option value="RIO_BRANCO">Rio Branco</option>
                                            <option value="PORTO_VELHO">Porto Velho</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Sub-tipo</label>
                                        <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                            value={newCourseData.presentialConfig.subType}
                                            onChange={(e) => updatePresentialConfig('subType', e.target.value)}
                                        >
                                            <option value="PRE_EDITAL">Pré-Edital</option>
                                            <option value="POS_EDITAL">Pós-Edital</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Modalidade</label>
                                        <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm"
                                            value={newCourseData.presentialConfig.modality}
                                            onChange={(e) => updatePresentialConfig('modality', e.target.value)}
                                        >
                                            <option value="REGULAR">Regular</option>
                                            <option value="INTENSIVO">Intensivo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={newCourseData.presentialConfig.hasClassroomRecording}
                                        onChange={(e) => updatePresentialConfig('hasClassroomRecording', e.target.checked)}
                                        className="w-4 h-4 accent-green-500"
                                    />
                                    <span className="text-sm text-white">Haverá gravação da sala de aula?</span>
                                </div>
                            </div>

                            <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><Clock size={16}/> Estrutura da Turma</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Total Encontros</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.totalMeetings}
                                            onChange={(e) => updatePresentialConfig('totalMeetings', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Duração Encontro (h)</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.meetingDurationHours}
                                            onChange={(e) => updatePresentialConfig('meetingDurationHours', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Aulas/Encontro</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.classesPerMeeting}
                                            onChange={(e) => updatePresentialConfig('classesPerMeeting', parseInt(e.target.value))}
                                        />
                                        <span className="text-[10px] text-gray-500">{(newCourseData.presentialConfig.meetingDurationHours / newCourseData.presentialConfig.classesPerMeeting).toFixed(1)}h por aula</span>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Início (Horário)</label>
                                        <input type="time" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.startTime}
                                            onChange={(e) => updatePresentialConfig('startTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Dias da Semana</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA'].map(day => (
                                                <button 
                                                    key={day}
                                                    className={`px-2 py-1 text-[10px] rounded border ${newCourseData.presentialConfig.daysOfWeek.includes(day as DayOfWeek) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-500'}`}
                                                    onClick={() => {
                                                        const current = newCourseData.presentialConfig.daysOfWeek;
                                                        const updated = current.includes(day as DayOfWeek) ? current.filter(d => d !== day) : [...current, day as DayOfWeek];
                                                        updatePresentialConfig('daysOfWeek', updated);
                                                    }}
                                                >
                                                    {day.substring(0,3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 justify-center">
                                         <label className="flex items-center gap-2 text-xs">
                                             <input type="checkbox" checked={newCourseData.presentialConfig.allowWeekend} onChange={e => updatePresentialConfig('allowWeekend', e.target.checked)} className="accent-blue-500" />
                                             Usar Fim de Semana (Reserva)
                                         </label>
                                         <label className="flex items-center gap-2 text-xs">
                                             <input type="checkbox" checked={newCourseData.presentialConfig.skipRedHolidays} onChange={e => updatePresentialConfig('skipRedHolidays', e.target.checked)} className="accent-blue-500" />
                                             Pular Feriados (Folga)
                                         </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
                                <h4 className="text-yellow-500 font-bold mb-4 flex items-center gap-2"><DollarSign size={16}/> Remuneração (Hora/Aula)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Valor Base (R$)</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.hourlyRate}
                                            onChange={(e) => updatePresentialConfig('hourlyRate', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">% Gravação</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.commissionRecording}
                                            onChange={(e) => updatePresentialConfig('commissionRecording', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">% Substituição</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.commissionSubstitution}
                                            onChange={(e) => updatePresentialConfig('commissionSubstitution', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">% Fim de Semana</label>
                                        <input type="number" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                            value={newCourseData.presentialConfig.commissionWeekend}
                                            onChange={(e) => updatePresentialConfig('commissionWeekend', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                     <div className="p-6 pt-0 flex gap-3">
                        <button 
                          onClick={() => setIsCreateCourseModalOpen(false)} 
                          className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded-lg font-medium"
                          disabled={creatingCourse}
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSubmitCreateCourse} 
                          className="flex-1 py-3 bg-white text-black hover:bg-gray-200 font-bold rounded-lg flex items-center justify-center gap-2"
                          disabled={creatingCourse}
                        >
                          {creatingCourse ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                          Criar Projeto
                        </button>
                      </div>
                  </div>
                </div>
              </div>
            )}

            {isTeacherModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-insanus-panel border border-gray-700 rounded-xl w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{editingTeacherId ? 'Editar Professor' : 'Cadastrar Professor'}</h3>
                            <button onClick={() => { setIsTeacherModalOpen(false); setEditingTeacherId(null); }}><X /></button>
                        </div>
                        
                        <div className="flex justify-center mb-6">
                           <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-insanus-red group bg-gray-800 flex items-center justify-center">
                              {teacherFormData.avatarUrl ? (
                                  <img src={teacherFormData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                  <User size={48} className="text-gray-500" />
                              )}
                              
                              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                  {uploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
                                  <span className="text-[10px] text-white mt-1">Alterar Foto</span>
                                  <input type="file" className="hidden" onChange={handleAvatarSelect} accept="image/*" disabled={uploadingAvatar} />
                              </label>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Nome Completo</label>
                                <input type="text" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                    value={teacherFormData.name}
                                    onChange={(e) => setTeacherFormData({...teacherFormData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Email</label>
                                    <input type="email" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                        value={teacherFormData.email}
                                        onChange={(e) => setTeacherFormData({...teacherFormData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">WhatsApp</label>
                                    <input type="text" className="w-full bg-black border border-gray-700 rounded p-2 text-white" 
                                        value={teacherFormData.whatsapp}
                                        onChange={(e) => setTeacherFormData({...teacherFormData, whatsapp: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Segmento</label>
                                    <select className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                        value={teacherFormData.segment}
                                        onChange={(e) => setTeacherFormData({...teacherFormData, segment: e.target.value as any})}
                                    >
                                        <option value="CONCURSO">Concurso</option>
                                        <option value="ENEM">ENEM</option>
                                        <option value="AMBOS">Ambos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Localidade Base</label>
                                    <select className="w-full bg-black border border-gray-700 rounded p-2 text-white"
                                        value={teacherFormData.location}
                                        onChange={(e) => setTeacherFormData({...teacherFormData, location: e.target.value as any})}
                                    >
                                        <option value="RIO_BRANCO">Rio Branco</option>
                                        <option value="PORTO_VELHO">Porto Velho</option>
                                        <option value="AMBOS">Ambos</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Disciplinas</label>
                                <div className="flex gap-2">
                                    <input type="text" className="flex-1 bg-black border border-gray-700 rounded p-2 text-white" 
                                        placeholder="Nova disciplina..."
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                                    />
                                    <button onClick={addSubject} className="bg-gray-700 hover:bg-gray-600 px-4 rounded text-white">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {teacherFormData.subjects.map(sub => (
                                        <span key={sub} className="bg-insanus-red px-2 py-1 rounded text-xs text-white">{sub}</span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleSaveTeacher} disabled={uploadingAvatar} className="w-full bg-insanus-red hover:bg-red-700 py-3 rounded font-bold text-white mt-4">
                                {editingTeacherId ? 'Salvar Alterações' : 'Cadastrar Professor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
      </main>
    </div>
  );
};

export default App;