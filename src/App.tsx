import { useState } from 'react';
import {
  Camera, AlertCircle, CheckCircle2,
  Loader2, QrCode, Ticket, Fingerprint, Activity,
  ChevronDown, ChevronRight, HardDrive, Cpu, Radio, Hash
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StatusState = 'idle' | 'loading' | 'ok' | 'warn' | 'error';

export default function App() {
  const [status, setStatus] = useState<StatusState>('idle');
  const [isVisionCollapsed, setIsVisionCollapsed] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(true);

  // Mock Vision Response
  const mockVisionData = {
    sys_id: "SYS-9902A",
    document_type: "receipt",
    confidence: 0.98,
    entities: {
      supplier: "浙江涵宇新材料",
      date: "2026-03-05",
      amount: "15,420.00",
      items: [
        { name: "HDPE 颗粒", quantity: 500, unit: "kg" }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden">

      {/* Top Status Bar (Fixed) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-mono text-xs tracking-[0.2em] text-cyan-400">HANYU::ORBITAL</span>
          </div>

          <div className="flex items-center gap-1">
            {(['idle', 'loading', 'ok', 'warn', 'error'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors border border-transparent rounded",
                  status === s
                    ? "bg-slate-800 text-white border-slate-700 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-12 space-y-6">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-light tracking-tight text-white mb-2 flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            V5.T-Terminal
          </h1>
          <p className="font-mono text-xs text-slate-500 tracking-wider uppercase">
            Location: SHA-WH-01 // Initializing entry protocol...
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* Main Column */}
          <div className="xl:col-span-8 space-y-6">

            {/* 01. 凭证采集 */}
            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div className="p-5 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">01</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-400" />
                    IMAGE_CAPTURE
                  </h2>
                </div>
                <button
                  onClick={() => setHasPhoto(!hasPhoto)}
                  className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 tracking-widest uppercase border border-cyan-900/50 bg-cyan-950/30 px-2 py-1 rounded"
                >
                  {hasPhoto ? "MODE: MANUAL_LOG" : "MODE: OPTICAL"}
                </button>
              </div>

              <div className="p-6">
                {hasPhoto ? (
                  <div className="border border-slate-800 border-dashed bg-slate-950/50 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-800 hover:bg-cyan-950/10 transition-all">
                    <Fingerprint className="w-8 h-8 text-slate-600 mb-3" />
                    <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">Awaiting Optical Input</p>
                    <p className="font-mono text-[10px] text-slate-600 mt-2">SYS.RECEIPT_PHOTO (JPG/PNG)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] text-cyan-500 uppercase tracking-widest flex justify-between">
                      <span>EXCEPTION_REASON</span>
                      <span className="text-rose-500/80">REQUIRED*</span>
                    </label>
                    <textarea
                      placeholder="Input bypass authorization reason..."
                      className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900 transition-all min-h-[100px] resize-none placeholder:text-slate-700"
                    ></textarea>
                  </div>
                )}
              </div>
            </section>

            {/* 02. Vision 识别结果 */}
            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
                onClick={() => setIsVisionCollapsed(!isVisionCollapsed)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-500 tracking-wider">02</span>
                  <h2 className="text-sm font-medium tracking-wide text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    NEURAL_VISION_OUTPUT
                  </h2>
                  <span className="ml-2 px-2 py-0.5 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 font-mono text-[10px] rounded">
                    CONF_98%
                  </span>
                </div>
                {isVisionCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>

              <div className={cn(
                "border-t border-slate-800 bg-[#0a0f1c] transition-all duration-300 overflow-hidden",
                isVisionCollapsed ? "max-h-0" : "max-h-[500px]"
              )}>
                <div className="p-6 font-mono text-xs sm:text-sm">
                  <pre className="text-cyan-600/60 leading-relaxed overflow-x-auto">
                    {`// SYS_ID   : ${mockVisionData.sys_id}
// TIMESTAMP: ${new Date().toISOString()}
`}
                    <span className="text-cyan-400">{JSON.stringify(mockVisionData, null, 2)}</span>
                  </pre>
                </div>
              </div>
            </section>

            {/* 03. 主字段校对区 */}
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
                  { id: 'f_supplier', label: 'SYS.F01_SUPPLIER', val: '浙江涵宇新材料' },
                  { id: 'f_amount', label: 'SYS.F04_AMOUNT', val: '15420.00' },
                  { id: 'f_date', label: 'SYS.F02_DATE', val: '2026-03-05' },
                ].map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      defaultValue={field.val}
                      className="w-full bg-slate-950 border-b border-slate-800 px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-950/80 transition-colors"
                    />
                  </div>
                ))}

                {/* 强调 f08 库位 */}
                <div className="space-y-2 bg-cyan-950/10 p-3 rounded border border-cyan-900/20 relative">
                  <div className="absolute -top-2 -right-2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <label className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                    SYS.F08_LOCATION
                  </label>
                  <input
                    type="text"
                    defaultValue="A-04-02"
                    className="w-full bg-slate-950 border border-cyan-900/50 rounded px-3 py-2 font-mono text-sm text-cyan-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-900 transition-colors shadow-inner"
                  />
                </div>
              </div>
            </section>

          </div>

          {/* Sidebar Column */}
          <div className="xl:col-span-4 space-y-6">

            {/* 04. 预埋区 (meta) */}
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
                <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500/50" />
                  <QrCode className="w-5 h-5 text-slate-500" />
                  <div className="flex-1">
                    <p className="font-mono text-[9px] text-slate-500 tracking-widest uppercase">PKG_CODE (外袋码)</p>
                    <input
                      type="text"
                      placeholder="SCAN_REQUIRED..."
                      className="w-full bg-transparent border-none p-0 font-mono text-sm text-slate-300 focus:outline-none focus:ring-0 mt-1 placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {/* Return Material Ticket */}
                <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-start gap-3">
                  <Ticket className="w-4 h-4 text-slate-600 mt-0.5" />
                  <div>
                    <p className="font-mono text-[9px] text-slate-500 tracking-widest uppercase mb-1">LINKED_TICKET (回料关联)</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      当前未绑定回料单。若需做回料退库，请先扫描对应的出库码。
                    </p>
                  </div>
                </div>

                {/* Visual filler for other 3 cards to make it 5 total */}
                {[
                  { label: "BATCH_ID", val: "AWAITING_GEN" },
                  { label: "OPERATOR", val: "OP-449" },
                  { label: "TERMINAL", val: "WH-A-01" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 px-1 border-b border-slate-800/50 last:border-0">
                    <span className="font-mono text-[10px] text-slate-500">{item.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">{item.val}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 05. 提交结果区 */}
            <section className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-cyan-500 transition-colors duration-500" />

              <div className="p-6 flex flex-col items-center justify-center border-b border-slate-800/50">
                <span className="font-mono text-[10px] text-cyan-500 tracking-[0.3em] uppercase mb-2">TARGET_ID</span>
                <span className="font-mono text-3xl font-light text-white tracking-widest">DRF-88A92B</span>
              </div>

              <div className="p-6 space-y-6">

                {/* Dynamic Status Output */}
                <div className={cn(
                  "min-h-[80px] p-4 rounded border font-mono text-xs leading-relaxed transition-all duration-300",
                  status === 'idle' && "bg-slate-950 border-slate-800 text-slate-400",
                  status === 'loading' && "bg-cyan-950/20 border-cyan-900/50 text-cyan-400",
                  status === 'ok' && "bg-emerald-950/20 border-emerald-900/50 text-emerald-400",
                  status === 'warn' && "bg-amber-950/20 border-amber-900/50 text-amber-400",
                  status === 'error' && "bg-rose-950/20 border-rose-900/50 text-rose-400",
                )}>
                  {status === 'idle' && (
                    <div className="flex gap-2">
                      <span className="text-slate-600">&gt;</span>
                      <span>请核对以上字段，确认无误后点击提交保存至系统。_</span>
                    </div>
                  )}

                  {status === 'loading' && (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <div>
                        <div>[UPLOADING] 验证字段并写入数据库...</div>
                      </div>
                    </div>
                  )}

                  {status === 'ok' && (
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-white mb-1">保存成功</div>
                        <div className="opacity-80">数据已成功同步至云端。</div>
                      </div>
                    </div>
                  )}

                  {status === 'warn' && (
                    <div className="flex gap-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-white mb-1">系统警告：金额异常</div>
                        <div className="opacity-80">识别总计与单项之和不匹配，是否强制保存？</div>
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex gap-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-white mb-1">提交失败：网络超时</div>
                        <div className="opacity-80">[Err 504] 无法连接到回库校验接口，请重试。</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  disabled={status === 'loading'}
                  className={cn(
                    "w-full py-4 uppercase tracking-[0.2em] font-mono text-xs font-bold transition-all relative overflow-hidden group/btn",
                    status === 'loading'
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border-t border-slate-700"
                      : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                  )}
                >
                  {status === 'loading' && (
                    <div className="absolute inset-0 w-full h-full">
                      <div className="w-1/2 h-full bg-slate-700/50 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  )}
                  {status === 'loading' ? 'TRANSMITTING...' : 'EXECUTE_SYNC'}
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
