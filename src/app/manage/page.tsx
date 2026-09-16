'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  QrCode, 
  Printer, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getStudents, saveStudents, subscribeToSyncEvents, resetMockData, updateStudentPin, resetStudentPinToDefault } from '@/lib/storage';
import { downloadStudentTemplate, parseStudentExcelFile } from '@/lib/exportExcel';
import { Student } from '@/types';
import TeacherAuthGuard from '@/components/TeacherAuthGuard';
import { KeyRound, Sparkles, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

const NETLIFY_URL = 'https://student-ab2.netlify.app';
const PUBLIC_TUNNEL_URL = 'https://classical-meal-adequate-mia.trycloudflare.com';
const LOCAL_WIFI_URL = 'http://10.95.25.25:3000';

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [grade, setGrade] = useState(3);
  const [classNum, setClassNum] = useState(2);
  const [studentNum, setStudentNum] = useState(21);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [pin, setPin] = useState('1234');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // QR Code Real Generation States
  const [qrUrl, setQrUrl] = useState(NETLIFY_URL);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isEditingQrUrl, setIsEditingQrUrl] = useState(false);
  const [isPrintPosterOpen, setIsPrintPosterOpen] = useState(false);

  const loadData = () => {
    setStudents(getStudents());
  };

  useEffect(() => {
    loadData();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // If accessed through a public domain or tunnel, use origin; if accessed on localhost, default to Netlify production URL
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      setQrUrl(origin);
    } else {
      setQrUrl(NETLIFY_URL);
    }

    const unsubscribe = subscribeToSyncEvents(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#121212',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('QR code generation failed:', err);
    });
  }, [qrUrl]);

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const studentPin = pin.trim() || '1234';

    if (editingStudent) {
      const updated = students.map(s => 
        s.id === editingStudent.id 
          ? { ...s, grade, classNum, studentNum, name, phone, parentPhone, pin: studentPin } 
          : s
      );
      saveStudents(updated);
      setEditingStudent(null);
    } else {
      const newStd: Student = {
        id: `std-${grade}${classNum.toString().padStart(2, '0')}${studentNum.toString().padStart(2, '0')}-${Date.now().toString(36)}`,
        grade,
        classNum,
        studentNum,
        name,
        phone,
        parentPhone,
        pin: studentPin,
      };
      saveStudents([...students, newStd]);
    }

    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setParentPhone('');
    setPin('1234');
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('해당 학생을 명단에서 삭제하시겠습니까?')) {
      const updated = students.filter(s => s.id !== id);
      saveStudents(updated);
      loadData();
    }
  };

  const handleClearAllStudents = () => {
    if (confirm(`현재 등록된 모든 학생 명단(${students.length}명)을 완전히 비우시겠습니까?\n새로운 학생 엑셀 명단을 업로드하기 전에 유용합니다.`)) {
      saveStudents([]);
      loadData();
      alert('모든 학생 명단이 비워졌습니다. (0명)');
    }
  };

  const handleResetStudentPin = (s: Student) => {
    if (confirm(`${s.name} 학생의 비밀번호를 기본값(1234)으로 초기화하시겠습니까?`)) {
      resetStudentPinToDefault(s.id);
      loadData();
      alert(`${s.name} 학생의 비밀번호가 1234로 초기화되었습니다.`);
    }
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setGrade(s.grade);
    setClassNum(s.classNum);
    setStudentNum(s.studentNum);
    setName(s.name);
    setPhone(s.phone || '');
    setParentPhone(s.parentPhone || '');
    setPin(s.pin || '1234');
    setIsAddModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('엑셀 파일을 읽는 중...');
      const parsed = await parseStudentExcelFile(file);
      if (parsed.length === 0) {
        alert('유효한 학생 데이터가 없습니다. 양식을 확인해주세요.');
        setUploadStatus(null);
        return;
      }

      const newStudents: Student[] = parsed.map((p, idx) => ({
        id: `std-${p.grade}${p.classNum.toString().padStart(2, '0')}${p.studentNum.toString().padStart(2, '0')}-${idx}`,
        ...p,
      }));

      saveStudents(newStudents);
      setUploadStatus(`총 ${newStudents.length}명의 학생 명단이 성공적으로 업로드되었습니다!`);
      loadData();
      setTimeout(() => setUploadStatus(null), 4000);
    } catch {
      alert('엑셀 파일 분석 중 오류가 발생했습니다.');
      setUploadStatus(null);
    }
  };

  return (
    <TeacherAuthGuard>
      <main className="min-h-[calc(100vh-4.5rem)] bg-[#fbfaf9] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="family-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge-pill badge-stone text-[11px]">
                학급 명단 관리
              </span>
              <span className="badge-pill badge-mint text-[11px]">
                총 {students.length}명
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mt-2 tracking-tight">
              학급 학생 명단 및 QR 관리
            </h2>
            <p className="text-xs text-[#7e7e7d] mt-1">
              엑셀 일괄 업로드로 학생 명단을 등록하거나, 교실 비치용 QR 안내문을 인쇄할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadStudentTemplate}
              className="btn-sand-pill text-xs py-2 px-3"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00ca48]" />
              <span>양식 다운로드</span>
            </button>

            <label className="btn-sand-pill text-xs py-2 px-3 cursor-pointer">
              <Upload className="w-4 h-4 text-[#0086fc]" />
              <span>엑셀 업로드</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                setEditingStudent(null);
                setName('');
                setPhone('');
                setParentPhone('');
                setIsAddModalOpen(true);
              }}
              className="btn-dark-pill text-xs py-2 px-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>학생 직접 추가</span>
            </button>

            {students.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllStudents}
                className="text-xs py-2 px-3 rounded-full border border-[#ff3e00]/40 text-[#ff3e00] hover:bg-[#fff0eb] font-semibold transition-colors flex items-center gap-1.5"
                title="등록된 전체 학생 명단 비우기"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>명단 비우기</span>
              </button>
            )}
          </div>
        </div>

        {uploadStatus && (
          <div className="p-3.5 bg-[#e6fbf1] text-[#00ca48] border border-[#e5d5c3] rounded-[10px] flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{uploadStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Roster Table (2 Cols) */}
          <div className="lg:col-span-2 family-card">
            <h3 className="text-base font-bold text-[#121212] mb-4">
              3학년 2반 학생 목록 ({students.length}명)
            </h3>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#fcfbf9] border-b border-[#f2f0ed]">
                  <tr className="text-[#7e7e7d] font-semibold">
                    <th className="py-3 px-3">번호</th>
                    <th className="py-3 px-3">이름</th>
                    <th className="py-3 px-3">비밀번호</th>
                    <th className="py-3 px-3">학생 연락처</th>
                    <th className="py-3 px-3">학부모 연락처</th>
                    <th className="py-3 px-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f0ed]">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#7e7e7d]">
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-[#121212]">등록된 학생이 없습니다 (0명)</p>
                          <p className="text-xs text-[#7e7e7d]">
                            상단의 <strong>[엑셀 업로드]</strong> 또는 <strong>[학생 직접 추가]</strong> 버튼을 눌러 새 명단을 등록해주세요.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-[#fcfbf9]">
                        <td className="py-3 px-3 font-semibold text-[#7e7e7d]">{s.studentNum}번</td>
                        <td className="py-3 px-3 font-bold text-[#121212]">{s.name}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono bg-[#f2f0ed] px-1.5 py-0.5 rounded text-[11px] font-bold text-[#121212]">
                              {s.pin || '1234'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResetStudentPin(s)}
                              className="text-[10px] text-[#ff3e00] hover:underline px-1 py-0.5 rounded hover:bg-[#fff0eb]"
                              title="비밀번호 1234로 초기화"
                            >
                              초기화
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#7e7e7d]">{s.phone || '-'}</td>
                        <td className="py-3 px-3 text-[#7e7e7d]">{s.parentPhone || '-'}</td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-[#7e7e7d] hover:text-[#121212] rounded-lg hover:bg-[#f2f0ed]"
                            title="수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-[#7e7e7d] hover:text-[#ff3e00] rounded-lg hover:bg-[#fff0eb]"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Classroom QR Code Card (1 Col) */}
          <div className="family-card flex flex-col justify-between bg-[#ffffff]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f0ed]">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-[#ff3e00]" />
                  <h4 className="font-bold text-sm text-[#121212]">교실 부착용 QR 안내문</h4>
                </div>
                {qrUrl.includes('trycloudflare.com') ? (
                  <span className="badge-pill bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-[10px] font-bold">
                    🌐 LTE/5G 모바일 즉시접속
                  </span>
                ) : qrUrl.includes('localhost') || qrUrl.includes('127.0.0.1') ? (
                  <span className="badge-pill bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] text-[10px] font-bold">
                    ⚠️ PC 전용 (스마트폰 불가)
                  </span>
                ) : (
                  <span className="badge-pill bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] text-[10px] font-bold">
                    📶 Wi-Fi 전용
                  </span>
                )}
              </div>

              <div className="mt-4 text-center">
                {/* Real High-Resolution Scannable QR Code */}
                <div className="w-48 h-48 bg-white rounded-[12px] border-2 border-[#121212] p-2.5 mx-auto flex flex-col items-center justify-center shadow-xs">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="학생 모바일 결석계 접속 QR 코드"
                      className="w-full h-full object-contain rounded-[4px]"
                    />
                  ) : (
                    <div className="text-xs text-[#7e7e7d] flex items-center justify-center">
                      QR 코드 생성 중...
                    </div>
                  )}
                </div>

                <h5 className="font-bold text-sm text-[#121212] mt-3">
                  "스마트폰 기본 카메라로 스캔하세요"
                </h5>
                <p className="text-xs text-[#7e7e7d] mt-1 leading-relaxed">
                  교실 결석신고서 서류함 옆에 부착해 두시면, 학생들이 카메라로 즉시 스캔하여 <strong>수령 및 제출 핑</strong>을 1초 만에 보낼 수 있습니다.
                </p>

                {/* QR Target URL & Quick Switcher */}
                <div className="mt-3.5 p-2.5 bg-[#fcfbf9] rounded-[8px] border border-[#f2f0ed] text-left text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#474645]">QR 연결 주소 (URL)</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingQrUrl(!isEditingQrUrl)}
                      className="text-[10px] text-[#0086fc] hover:underline font-semibold"
                    >
                      {isEditingQrUrl ? '완료' : '직접 입력'}
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setQrUrl(NETLIFY_URL)}
                      className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${
                        qrUrl === NETLIFY_URL 
                          ? 'bg-[#00c7b7] text-white font-bold shadow-xs' 
                          : 'bg-[#e6faf8] text-[#008f84] hover:bg-[#cbf5f1]'
                      }`}
                      title="Netlify 공식 배포 웹 주소"
                    >
                      🚀 student-ab2.netlify.app (공식 배포)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrUrl(PUBLIC_TUNNEL_URL)}
                      className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${
                        qrUrl === PUBLIC_TUNNEL_URL 
                          ? 'bg-[#137333] text-white font-bold shadow-xs' 
                          : 'bg-[#e6f4ea] text-[#137333] hover:bg-[#ceead6]'
                      }`}
                      title="스마트폰 LTE/5G 임시 터널 접속"
                    >
                      🌐 공용 모바일 터널
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrUrl(LOCAL_WIFI_URL)}
                      className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${
                        qrUrl === LOCAL_WIFI_URL 
                          ? 'bg-[#1a73e8] text-white font-bold shadow-xs' 
                          : 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]'
                      }`}
                      title="학교 Wi-Fi 망 내 접속"
                    >
                      📶 교내 Wi-Fi
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrUrl(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}
                      className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${
                        qrUrl.includes('localhost') 
                          ? 'bg-[#5f6368] text-white font-bold shadow-xs' 
                          : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'
                      }`}
                      title="내 컴퓨터 브라우저 전용"
                    >
                      💻 Localhost
                    </button>
                  </div>

                  {isEditingQrUrl ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={qrUrl}
                        onChange={(e) => setQrUrl(e.target.value)}
                        placeholder="예: https://... 또는 http://192.168.0.x:3000"
                        className="w-full p-2 bg-white border border-[#e5d5c3] rounded-[6px] text-xs font-mono"
                      />
                    </div>
                  ) : (
                    <p className="font-mono text-[11px] text-[#121212] truncate bg-white p-1.5 rounded border border-[#f2f0ed]">
                      {qrUrl}
                    </p>
                  )}

                  {/* Warning if localhost is selected */}
                  {(qrUrl.includes('localhost') || qrUrl.includes('127.0.0.1')) && (
                    <p className="text-[10px] text-[#c5221f] mt-1.5 leading-snug bg-[#fce8e6] p-1.5 rounded border border-[#fad2cf]">
                      ⚠️ <strong>주의:</strong> localhost 주소는 스마트폰으로 스캔하면 "사이트에 접근할 수 없음" 오류가 발생합니다. 위의 <strong>[🌐 공용 모바일 (권장)]</strong>을 선택해주세요!
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f2f0ed] grid grid-cols-2 gap-2">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download="횡성여고_결석알리미_QR코드.png"
                  className="btn-sand-pill py-2 text-xs flex items-center justify-center space-x-1"
                  title="QR 코드 이미지 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>QR 이미지 저장</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsPrintPosterOpen(true)}
                className="btn-dark-pill py-2 text-xs flex items-center justify-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>안내문 인쇄</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="family-card max-w-sm w-full p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f2f0ed]">
              <h3 className="font-bold text-base text-[#121212]">
                {editingStudent ? '학생 정보 수정' : '신규 학생 추가'}
              </h3>
              <span className="badge-pill badge-mint text-[10px]">
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-[#474645] mb-1">학년</label>
                  <input
                    type="number"
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#474645] mb-1">반</label>
                  <input
                    type="number"
                    value={classNum}
                    onChange={(e) => setClassNum(Number(e.target.value))}
                    className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#474645] mb-1">번호</label>
                  <input
                    type="number"
                    value={studentNum}
                    onChange={(e) => setStudentNum(Number(e.target.value))}
                    className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#474645] mb-1">학생 성명</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성명 입력"
                  className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#474645] mb-1">학생 연락처</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#474645] mb-1">학부모 연락처</label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-[#474645]">학생 로그인 비밀번호 (4자리)</label>
                  <button
                    type="button"
                    onClick={() => setPin('1234')}
                    className="text-[10px] text-[#0086fc] hover:underline font-semibold"
                  >
                    1234로 리셋
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="기본값: 1234"
                  className="w-full p-2 bg-[#fbfaf9] border border-[#e5d5c3] rounded-[8px] font-mono font-bold text-center"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-sand-pill text-xs py-2 px-3"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-dark-pill text-xs py-2 px-4"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Classroom QR Poster Modal */}
      {isPrintPosterOpen && (
        <div className="fixed inset-0 z-50 bg-[#121212]/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="family-card max-w-lg w-full p-6 sm:p-8 bg-white shadow-2xl animate-in fade-in space-y-6">
            
            {/* Poster Header */}
            <div className="text-center border-b pb-4 border-[#f2f0ed]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff8e8] text-[#d48f00] text-xs font-bold border border-[#ffcd6c]/50 mb-2">
                <span>🌸</span>
                <span>횡성여자고등학교 출결 알리미</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#121212] tracking-tight">
                3학년 2반 결석신고서 QR 코드
              </h2>
              <p className="text-xs text-[#7e7e7d] mt-1">
                교실 서류함 옆 부착용 안내 포스터
              </p>
            </div>

            {/* Large High-Res QR Code */}
            <div className="text-center space-y-3">
              <div className="w-60 h-60 bg-white rounded-[16px] border-4 border-[#121212] p-3 mx-auto shadow-md flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="교실 부착용 QR 코드"
                    className="w-full h-full object-contain rounded-[4px]"
                  />
                ) : (
                  <span className="text-xs text-[#7e7e7d]">생성 중...</span>
                )}
              </div>
              <div className="inline-block bg-[#121212] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
                📷 스마트폰 기본 카메라로 스캔하세요!
              </div>
            </div>

            {/* 3 Step Instruction Guide */}
            <div className="bg-[#fcfbf9] rounded-[12px] p-4 border border-[#e5d5c3] space-y-2 text-xs text-[#343433]">
              <h4 className="font-bold text-sm text-[#121212] flex items-center gap-1.5 pb-1 border-b border-[#f2f0ed]">
                <span>📋</span>
                <span>이용 방법 안내</span>
              </h4>
              <div className="space-y-2 text-[#474645]">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <span>스마트폰 카메라로 QR 코드를 스캔하여 <strong>학번과 비밀번호(기본: 1234)</strong>로 로그인합니다. (1회 로그인 후 유지)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <span>서류함에서 <strong>결석신고서</strong>를 1장 챙긴 후 앱에서 <strong>[1단계: 결석신고서 챙겼어요]</strong>를 누릅니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <span>자필 작성 및 증빙서류를 동봉하여 제출함에 넣고 앱에서 <strong>[제출함에 넣었어요! 핑]</strong>을 누르면 끝!</span>
                </div>
              </div>
            </div>

            {/* Poster URL footer info */}
            <div className="text-center text-[11px] text-[#7e7e7d] font-mono bg-[#fcfbf9] py-1.5 px-3 rounded-lg border border-[#f2f0ed]">
              🌐 모바일 접속 주소: <span className="font-bold text-[#121212]">{qrUrl}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f2f0ed]">
              <button
                type="button"
                onClick={() => setIsPrintPosterOpen(false)}
                className="btn-sand-pill text-xs py-2 px-4"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-dark-pill text-xs py-2 px-5 flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>포스터 인쇄하기 (A4)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      </main>
    </TeacherAuthGuard>
  );
}
