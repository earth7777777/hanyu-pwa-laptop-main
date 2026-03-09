import { useMemo, useState } from 'react';
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2,
  QrCode,
  Ticket,
  Fingerprint,
  Activity,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Cpu,
  Radio,
  Hash,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StatusState = 'idle' | 'loading' | 'ok' | 'warn' | 'error';

type VisionData = Record<string, unknown> | null;
type MetaData = Record<string, unknown> | null;

type ApiSuccess = {
  ok: true;
  vision?: Record<string, unknown>;
  draft?: string | { name?: string;[key: string]: unknown };
  meta?: Record<string, unknown>;
};

type ApiFailure = {
  ok?: false;
  stage?: string;
  error?: string;
  vision?: Record<string, unknown>;
};

type ApiResponse = ApiSuccess | ApiFailure;

const API_URL =
  '/api/method/hanyu_warehouse.api.v1.vision_to_draft.create_rm_inbound_draft_from_receipt';

function getCsrfToken() {
  const fromWindow =
    typeof window !== 'undefined' &&
      typeof (window as Window & { csrf_token?: string }).csrf_token === 'string'
      ? (window as Window & { csrf_token?: string }).csrf_token
      : '';

  if (fromWindow) return fromWindow;

  const fromMeta =
    typeof document !== 'undefined'
      ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
      : '';

  if (fromMeta) return fromMeta;

  return '';
}
export default function App() {
  const [status, setStatus] = useState<StatusState>('idle');
  const [isVisionCollapsed, setIsVisionCollapsed] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  const [f01, setF01] = useState('');
  const [f02, setF02] = useState('');
  const [f03, setF03] = useState('');
  const [f04, setF04] = useState('');
  const [f05, setF05] = useState('');
  const [f06, setF06] = useState('');
  const [f07, setF07] = useState('');
  const [f08, setF08] = useState('');
  const [f09, setF09] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  });
  const [f10, setF10] = useState('');
  const [f11, setF11] = useState('');
  const [f12, setF12] = useState('');
  const [f13, setF13] = useState('');
  const [f14, setF14] = useState('');
  const [f15, setF15] = useState('');
  const [f16, setF16] = useState('');

  const [visionData, setVisionData] = useState<VisionData>(null);
  const [draftName, setDraftName] = useState('');
  const [metaData, setMetaData] = useState<MetaData>(null);
  const [errorText, setErrorText] = useState('');

  const overrides = useMemo(
    () => ({
      f01: f01.trim(),
      f02: f02.trim(),
      f03: f03.trim(),
      f04: f04.trim(),
      f05: f05.trim(),
      f06: f06.trim(),
      f07: f07.trim(),
      f08: f08.trim(),
      f09: f09.trim(),
      f10: f10.trim(),
      f11: f11.trim(),
      f12: f12.trim(),
      f13: f13.trim(),
      f14: f14.trim(),
      f15: f15.trim(),
      f16: f16.trim(),
    }),
    [f01, f02, f03, f04, f05, f06, f07, f08, f09, f10, f11, f12, f13, f14, f15, f16]
  );

  const prettyVision = useMemo(() => {
    if (!visionData) return '// NO_VISION_DATA';
    return JSON.stringify(visionData, null, 2);
  }, [visionData]);

  const prettyMeta = useMemo(() => {
    if (!metaData) return '// NO_META_DATA';
    return JSON.stringify(metaData, null, 2);
  }, [metaData]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const csrfToken = getCsrfToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', '1');
      const res = await fetch('/api/method/upload_file', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Frappe-CSRF-Token': csrfToken },
        body: formData,
      });
      const raw = await res.json();
      const data = raw?.message ?? raw;
      if (res.ok && data?.file_url) {
        setFileUrl(data.file_url);
      }
    } catch {
      // upload failed
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    const finalExceptionReason = hasPhoto ? exceptionReason.trim() : exceptionReason.trim();

    if (!hasPhoto && !finalExceptionReason) {
      setStatus('warn');
      setErrorText('未上传照片时，必须填写异常说明。');
      return;
    }

    if (f15.trim() && !window.confirm(`已填写内部批次号：${f15.trim()}，确认提交？`)) {
      return;
    }


    setStatus('loading');
    setErrorText('');
    setDraftName('');
    setVisionData(null);
    setMetaData(null);

    const payload = {
      receipt_photo: hasPhoto ? fileUrl : '',
      exception_reason: finalExceptionReason,
      overrides,
    };

    try {
      const csrfToken = getCsrfToken();

      const res = await fetch(API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Frappe-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.json();
      const data: ApiResponse = raw?.message ?? raw;

      if (!res.ok) {
        setStatus('error');
        setErrorText(`HTTP ${res.status}`);
        if (data && typeof data === 'object' && 'vision' in data) {
          setVisionData(data.vision ?? null);
        }
        return;
      }

      if (data?.ok) {
        setStatus('ok');
        setVisionData(data.vision ?? null);
        setDraftName(
          typeof data.draft === 'string'
            ? data.draft
            : typeof data.draft === 'object' && data.draft !== null && 'name' in data.draft
              ? String(data.draft.name ?? '')
              : ''
        );
        setMetaData(data.meta ?? null);
        return;
      }

      setStatus('error');
      setErrorText(data?.error || '接口返回失败');
      setVisionData(data?.vision ?? null);
    } catch (err) {
      setStatus('error');
      setErrorText(err instanceof Error ? err.message : '网络或接口异常');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-mono text-xs tracking-[0.2em] text-cyan-400">HANYU::ORBITAL</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-3 py-1 font-mono text-[10px] uppercase tracking-widest border rounded',
                status === 'idle' && 'text-slate-400 border-slate-700 bg-slate-900',
                status === 'loading' && 'text-cyan-300 border-cyan-900 bg-cyan-950/30',
                status === 'ok' && 'text-emerald-300 border-emerald-900 bg-emerald-950/30',
                status === 'warn' && 'text-amber-300 border-amber-900 bg-amber-950/30',
                status === 'error' && 'text-rose-300 border-rose-900 bg-rose-950/30'
              )}
            >
              STATUS: {status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-12 space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-light tracking-tight text-white mb-2 flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            V5.T-Terminal
          </h1>
          <p className="font-mono text-xs text-slate-500 tracking-wider uppercase">
            Stage S4 // Vision Bridge Live Wiring
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 space-y-6">
            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div className="p-5 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">01</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-400" />
                    BRIDGE_INPUT
                  </h2>
                </div>
                <button
                  onClick={() => setHasPhoto((prev) => !prev)}
                  className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 tracking-widest uppercase border border-cyan-900/50 bg-cyan-950/30 px-2 py-1 rounded"
                >
                  {hasPhoto ? 'MODE: OPTICAL' : 'MODE: MANUAL_LOG'}
                </button>
              </div>

              <div className="p-6 space-y-4">
                {hasPhoto ? (
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] text-cyan-500 uppercase tracking-widest">
                      RECEIPT_PHOTO
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900 transition-all"
                    />
                    {uploading && <p className="font-mono text-xs text-cyan-400">上传中...</p>}
                    {fileUrl && <p className="font-mono text-xs text-emerald-400">已上传: {fileUrl}</p>}
                  </div>
                ) : (
                  <div className="border border-slate-800 border-dashed bg-slate-950/50 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <Fingerprint className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div className="w-full space-y-3">
                        <div>
                          <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">
                            MANUAL_BYPASS
                          </p>
                          <p className="font-mono text-[10px] text-slate-600 mt-1">
                            未上传照片时，必须填写异常说明。
                          </p>
                        </div>
                        <textarea
                          value={exceptionReason}
                          onChange={(e) => setExceptionReason(e.target.value)}
                          placeholder="请输入未拍照原因..."
                          className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900 transition-all min-h-[100px] resize-none placeholder:text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasPhoto && (
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                      EXCEPTION_REASON (OPTIONAL)
                    </label>
                    <textarea
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      placeholder="有异常可填写，无异常可留空。"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900 transition-all min-h-[80px] resize-none placeholder:text-slate-700"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
                onClick={() => setIsVisionCollapsed((prev) => !prev)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">02</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    NEURAL_VISION_OUTPUT
                  </h2>
                  {visionData ? (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-mono text-[10px] rounded">
                      LIVE_DATA
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[10px] rounded">
                      EMPTY
                    </span>
                  )}
                </div>
                {isVisionCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>

              <div
                className={cn(
                  'border-t border-slate-800 bg-[#0a0f1c] transition-all duration-300 overflow-hidden',
                  isVisionCollapsed ? 'max-h-0' : 'max-h-[560px]'
                )}
              >
                <div className="p-6 font-mono text-xs sm:text-sm">
                  <pre className="text-cyan-600/60 leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
                    {`// API   : ${API_URL}\n// STATE : ${status}\n`}
                    <span className="text-cyan-400">{prettyVision}</span>
                  </pre>
                </div>
              </div>
            </section>

            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div className="p-5 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">03</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    DATA_CALIBRATION
                  </h2>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'f01', label: 'SYS.F01_MATERIAL', value: f01, set: setF01, placeholder: '入库物料' },
                  { id: 'f02', label: 'SYS.F02_SUPPLIER', value: f02, set: setF02, placeholder: '供应商' },
                  { id: 'f03', label: 'SYS.F03_INVOICE_NO', value: f03, set: setF03, placeholder: '送货单号' },
                  { id: 'f04', label: 'SYS.F04_GROSS_WEIGHT', value: f04, set: setF04, placeholder: '实测毛重(吨)' },
                  { id: 'f05', label: 'SYS.F05_PACKAGE_QTY', value: f05, set: setF05, placeholder: '包数/袋数' },
                  { id: 'f06', label: 'SYS.F06_BATCH_NO', value: f06, set: setF06, placeholder: '厂家批号' },
                  { id: 'f07', label: 'SYS.F07_PLATE_NO', value: f07, set: setF07, placeholder: '车牌号' },

                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                    />
                  </div>
                ))}

                <div className="space-y-2 bg-cyan-950/10 p-3 rounded border border-cyan-900/20 relative">
                  <div className="absolute -top-2 -right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <label className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest pl-1">
                    SYS.F08_LOCATION
                  </label>
                  <input
                    type="text"
                    value={f08}
                    onChange={(e) => setF08(e.target.value)}
                    placeholder="库位"
                    className="w-full bg-slate-950 border border-cyan-900/50 rounded px-3 py-2 font-mono text-sm text-cyan-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-900 transition-colors shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F09_INPUT_TIME
                  </label>
                  <input
                    type="datetime-local"
                    value={f09}
                    onChange={(e) => setF09(e.target.value)}
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F10_DELIVERY_WEIGHT
                  </label>
                  <input
                    type="text"
                    value={f10}
                    onChange={(e) => setF10(e.target.value)}
                    placeholder="送货重量(吨)"
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F11_REMARKS
                  </label>
                  <input
                    type="text"
                    value={f11}
                    onChange={(e) => setF11(e.target.value)}
                    placeholder="备注说明"
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F12_EXT_BAG_CODE
                  </label>
                  <input
                    type="text"
                    value={f12}
                    onChange={(e) => setF12(e.target.value)}
                    placeholder="外部袋码 / 条码"
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F13_SOURCE_TYPE
                  </label>
                  <select
                    value={f13}
                    onChange={(e) => setF13(e.target.value)}
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  >
                    <option value="">-- 来源类型 --</option>
                    <option value="新料">新料</option>
                    <option value="回料">回料</option>
                  </select>
                </div>

                {f13 === '回料' && (
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                      SYS.F14_REGRIND_CLASS
                    </label>
                    <input
                      type="text"
                      value={f14}
                      onChange={(e) => setF14(e.target.value)}
                      placeholder="回料分类"
                      className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F15_INTERNAL_BATCH
                  </label>
                  <input
                    type="text"
                    value={f15}
                    onChange={(e) => setF15(e.target.value)}
                    placeholder="内部批次号"
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                    SYS.F16_PKG_TRACK
                  </label>
                  <input
                    type="text"
                    value={f16}
                    onChange={(e) => setF16(e.target.value)}
                    placeholder="包级追踪标记"
                    className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                  />
                </div>


              </div>
            </section>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div className="p-5 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">04</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    META_PAYLOAD
                  </h2>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded p-3">
                  <p className="font-mono text-[9px] text-slate-500 tracking-widest uppercase mb-2">
                    META_RETURN
                  </p>
                  <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                    {prettyMeta}
                  </pre>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500/50" />
                  <QrCode className="w-5 h-5 text-slate-500" />
                  <div className="flex-1">
                    <p className="font-mono text-[9px] text-slate-500 tracking-widest uppercase">
                      PKG_CODE (外袋码)
                    </p>
                    <p className="font-mono text-sm text-slate-300 mt-1">
                      {String((metaData?.external_bag_code as string) || 'AWAITING_RETURN')}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-start gap-3">
                  <Ticket className="w-4 h-4 text-slate-600 mt-0.5" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-500 tracking-widest uppercase mb-1">
                      LINKED_TICKET (回料关联)
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      阶段四只回传预埋信息，不落库，不闭环。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div className="p-5 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">05</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : status === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    SUBMIT_TERMINAL
                  </h2>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <button
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                  className="w-full rounded-lg px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] border transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-950/40 border-cyan-800 text-cyan-200 hover:bg-cyan-900/50"
                >
                  {status === 'loading' ? 'SUBMITTING...' : 'POST_TO_BRIDGE'}
                </button>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    RESULT
                  </p>

                  {status === 'idle' && (
                    <p className="text-sm text-slate-400">等待提交。</p>
                  )}

                  {status === 'loading' && (
                    <p className="text-sm text-cyan-300">正在调用桥接口并创建草稿...</p>
                  )}

                  {status === 'ok' && (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-300">提交成功，草稿已创建。</p>
                      <p className="font-mono text-xs text-slate-300 break-all">
                        draft: {draftName || 'EMPTY_DRAFT_NAME'}
                      </p>
                    </div>
                  )}

                  {status === 'warn' && (
                    <p className="text-sm text-amber-300">{errorText || '请补齐必要字段。'}</p>
                  )}

                  {status === 'error' && (
                    <p className="text-sm text-rose-300">{errorText || '提交失败。'}</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}