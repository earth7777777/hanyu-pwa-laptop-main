import { useMemo, useRef, useState, type ChangeEvent } from 'react';

type JsonRecord = Record<string, unknown>;

type Status = 'idle' | 'loading' | 'ok' | 'error';

type EvidenceEntry = {
  id: string;
  action: string;
  method: string;
  ok: boolean;
  time: string;
  request: JsonRecord;
  response: unknown;
  error: string;
};

type SummaryLine = {
  id: string;
  source_item_code: string;
  grade_usability: string;
  qty: string;
  source_batch_no: string;
  remarks: string;
};

type ValidationCase = {
  id: string;
  title: string;
  expectation: string;
};

const API_PREFIX = '/api/method/hanyu_warehouse.api.v1.';
const CONTRACT_VERSION = 'v1';
const LEGACY_INBOUND_API =
  '/api/method/hanyu_warehouse.api.v1.vision_to_draft.create_rm_inbound_draft_from_receipt';

const VALIDATION_CASES: ValidationCase[] = [
  {
    id: 'case-1',
    title: 'Case 1 - coded outbound',
    expectation: 'Pallet path works and submit/post succeeds.',
  },
  {
    id: 'case-2',
    title: 'Case 2 - manual outbound',
    expectation: 'Manual submit works and source_location_id is required.',
  },
  {
    id: 'case-3',
    title: 'Case 3 - insufficient stock',
    expectation: 'INSUFFICIENT_STOCK is surfaced clearly.',
  },
  {
    id: 'case-4',
    title: 'Case 4 - machine required',
    expectation: 'Missing machine is blocked when machine-required is enabled.',
  },
  {
    id: 'case-5',
    title: 'Case 5 - destination reroute',
    expectation: 'Reroute shows readable from->to trace and keeps quantity unchanged.',
  },
  {
    id: 'case-6',
    title: 'Case 6 - recycle batch identity',
    expectation: 'Recycle summary submit generates selectable recycle batches.',
  },
  {
    id: 'case-7',
    title: 'Case 7 - repeated recycle process',
    expectation: 'Same batch can apply repeated process events and show accumulated cost.',
  },
  {
    id: 'case-8',
    title: 'Case 8 - recycle scrap closing',
    expectation: 'Recycle scrap closes the batch and shows loss amount from backend.',
  },
];

function nowIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function pretty(value: unknown) {
  if (value === null || value === undefined) return '// EMPTY';
  return JSON.stringify(value, null, 2);
}

function getCsrfToken() {
  const fromWindow =
    typeof window !== 'undefined' &&
    typeof (window as Window & { csrf_token?: string }).csrf_token === 'string'
      ? (window as Window & { csrf_token?: string }).csrf_token ?? ''
      : '';

  if (fromWindow) return fromWindow;

  const fromMeta =
    typeof document !== 'undefined'
      ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
      : '';

  return fromMeta;
}

function parseServerMessages(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed[0];
    }
  } catch {
    return value;
  }
  return '';
}

function extractErrorCode(data: unknown) {
  const record = asRecord(data);
  const code = record?.error_code;
  return typeof code === 'string' ? code : '';
}

function extractErrorMessage(data: unknown) {
  const record = asRecord(data);
  if (!record) return '';

  const direct = record.error;
  if (typeof direct === 'string' && direct.trim()) return direct;

  const message = record.message;
  if (typeof message === 'string' && message.trim()) return message;

  const serverMessages = parseServerMessages(record._server_messages);
  if (serverMessages) return serverMessages;

  const exc = record.exc;
  if (typeof exc === 'string' && exc.trim()) return exc;

  return '';
}

function extractContractVersion(data: unknown) {
  const record = asRecord(data);
  const value = record?.contract_version;
  return typeof value === 'string' ? value : '';
}

function extractPalletId(data: unknown) {
  const record = asRecord(data);
  const pallet = asRecord(record?.pallet);
  const value = pallet?.name;
  return typeof value === 'string' ? value : '';
}

function extractDocName(data: unknown, key: string) {
  const record = asRecord(data);
  const nested = asRecord(record?.[key]);
  const name = nested?.name;
  return typeof name === 'string' ? name : '';
}

async function callMethod(
  method: string,
  payload: JsonRecord,
  options?: { httpMethod?: 'POST' | 'GET' }
) {
  const httpMethod = options?.httpMethod ?? 'POST';
  const path = `${API_PREFIX}${method}`;

  const requestPayload: JsonRecord = {
    contract_version: CONTRACT_VERSION,
    ...payload,
  };

  const csrfToken = getCsrfToken();
  let res: Response;

  if (httpMethod === 'GET') {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(requestPayload)) {
      if (value === undefined || value === null) continue;
      search.set(key, String(value));
    }

    res = await fetch(`${path}?${search.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Frappe-CSRF-Token': csrfToken,
      },
    });
  } else {
    res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(requestPayload),
    });
  }

  const raw = await res.json();
  const data = raw?.message ?? raw;
  const record = asRecord(data);
  const okFlag = !record || record.ok !== false;
  const ok = res.ok && okFlag;

  const errorCode = extractErrorCode(data);
  const errorMessage = extractErrorMessage(data) || `HTTP ${res.status}`;
  const contractVersion = extractContractVersion(data);

  return {
    ok,
    requestPayload,
    status: res.status,
    data,
    errorCode,
    errorMessage,
    contractVersion,
  };
}

async function callLegacyInbound(payload: JsonRecord) {
  const csrfToken = getCsrfToken();
  const res = await fetch(LEGACY_INBOUND_API, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Frappe-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json();
  const data = raw?.message ?? raw;
  const record = asRecord(data);
  const okFlag = !!record?.ok;

  return {
    ok: res.ok && okFlag,
    status: res.status,
    data,
    errorMessage: extractErrorMessage(data) || `HTTP ${res.status}`,
  };
}

function statusBadge(status: Status) {
  if (status === 'loading') return 'text-cyan-300 border-cyan-700 bg-cyan-950/40';
  if (status === 'ok') return 'text-emerald-300 border-emerald-700 bg-emerald-950/40';
  if (status === 'error') return 'text-rose-300 border-rose-700 bg-rose-950/40';
  return 'text-slate-300 border-slate-700 bg-slate-900';
}

function newSummaryLine(): SummaryLine {
  return {
    id: makeId('line'),
    source_item_code: '',
    grade_usability: '',
    qty: '',
    source_batch_no: '',
    remarks: '',
  };
}

export default function App() {
  const [globalStatus, setGlobalStatus] = useState<Status>('idle');
  const [globalHint, setGlobalHint] = useState('');
  const [activeView, setActiveView] = useState<'s5' | 'legacy'>('s5');

  const [legacyStatus, setLegacyStatus] = useState<Status>('idle');
  const [legacyError, setLegacyError] = useState('');
  const [legacyDraftName, setLegacyDraftName] = useState('');
  const [legacyReceiptPhoto, setLegacyReceiptPhoto] = useState('');
  const [legacyUploading, setLegacyUploading] = useState(false);
  const [legacyExceptionReason, setLegacyExceptionReason] = useState('');
  const [legacyVision, setLegacyVision] = useState<unknown>(null);
  const [legacyMeta, setLegacyMeta] = useState<unknown>(null);
  const legacyFileInputRef = useRef<HTMLInputElement | null>(null);

  const [legacyF01, setLegacyF01] = useState('');
  const [legacyF02, setLegacyF02] = useState('');
  const [legacyF03, setLegacyF03] = useState('');
  const [legacyF04, setLegacyF04] = useState('');
  const [legacyF05, setLegacyF05] = useState('');
  const [legacyF06, setLegacyF06] = useState('');
  const [legacyF07, setLegacyF07] = useState('');
  const [legacyF08, setLegacyF08] = useState('');
  const [legacyF09, setLegacyF09] = useState(nowIsoDateTimeLocal());
  const [legacyF10, setLegacyF10] = useState('');
  const [legacyF11, setLegacyF11] = useState('');
  const [legacyF12, setLegacyF12] = useState('');
  const [legacyF13, setLegacyF13] = useState('');
  const [legacyF14, setLegacyF14] = useState('');
  const [legacyF15, setLegacyF15] = useState('');
  const [legacyF16, setLegacyF16] = useState('');
  const [legacyF17, setLegacyF17] = useState('');

  const [evidenceLog, setEvidenceLog] = useState<EvidenceEntry[]>([]);

  const [palletCode, setPalletCode] = useState('');
  const [palletIdF17, setPalletIdF17] = useState('');
  const [palletResult, setPalletResult] = useState<unknown>(null);
  const [palletBusy, setPalletBusy] = useState(false);
  const [palletError, setPalletError] = useState('');

  const [itemCode, setItemCode] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [qty, setQty] = useState('');
  const [uom, setUom] = useState('kg');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [postingDate, setPostingDate] = useState(nowIsoDate());

  const [machineRequired, setMachineRequired] = useState(true);
  const [machineId, setMachineId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [purpose, setPurpose] = useState('');

  const [outboundDraftName, setOutboundDraftName] = useState('');
  const [outboundResult, setOutboundResult] = useState<unknown>(null);
  const [outboundBusy, setOutboundBusy] = useState(false);
  const [outboundError, setOutboundError] = useState('');

  const [submittedOutboundIds, setSubmittedOutboundIds] = useState<string[]>([]);

  const [rerouteOutboundId, setRerouteOutboundId] = useState('');
  const [rerouteToMachineId, setRerouteToMachineId] = useState('');
  const [rerouteToWorkOrderId, setRerouteToWorkOrderId] = useState('');
  const [rerouteToPurpose, setRerouteToPurpose] = useState('');
  const [rerouteReason, setRerouteReason] = useState('');
  const [rerouteResult, setRerouteResult] = useState<unknown>(null);
  const [rerouteBusy, setRerouteBusy] = useState(false);
  const [rerouteError, setRerouteError] = useState('');

  const [summaryPostingDate, setSummaryPostingDate] = useState(nowIsoDate());
  const [summaryMachineId, setSummaryMachineId] = useState('');
  const [summaryShift, setSummaryShift] = useState('');
  const [summaryRemarks, setSummaryRemarks] = useState('');
  const [summaryLines, setSummaryLines] = useState<SummaryLine[]>([newSummaryLine()]);
  const [summaryName, setSummaryName] = useState('');
  const [summaryResult, setSummaryResult] = useState<unknown>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [generatedBatches, setGeneratedBatches] = useState<string[]>([]);

  const [processBatchId, setProcessBatchId] = useState('');
  const [processType, setProcessType] = useState('');
  const [processTotalCost, setProcessTotalCost] = useState('');
  const [processRemarks, setProcessRemarks] = useState('');
  const [processName, setProcessName] = useState('');
  const [processResult, setProcessResult] = useState<unknown>(null);
  const [processBusy, setProcessBusy] = useState(false);
  const [processError, setProcessError] = useState('');

  const [scrapBatchId, setScrapBatchId] = useState('');
  const [scrapReason, setScrapReason] = useState('');
  const [scrapResult, setScrapResult] = useState<unknown>(null);
  const [scrapBusy, setScrapBusy] = useState(false);
  const [scrapError, setScrapError] = useState('');

  const [validationStatusMap, setValidationStatusMap] = useState<Record<string, 'pending' | 'pass' | 'fail'>>(
    () => Object.fromEntries(VALIDATION_CASES.map((c) => [c.id, 'pending']))
  );

  const [validationEvidenceMap, setValidationEvidenceMap] = useState<Record<string, string>>(
    () => Object.fromEntries(VALIDATION_CASES.map((c) => [c.id, '']))
  );

  const [validationNoteMap, setValidationNoteMap] = useState<Record<string, string>>(
    () => Object.fromEntries(VALIDATION_CASES.map((c) => [c.id, '']))
  );

  const batchOptions = useMemo(() => {
    const source = [
      ...generatedBatches,
      processBatchId.trim(),
      scrapBatchId.trim(),
    ].filter(Boolean);
    return Array.from(new Set(source));
  }, [generatedBatches, processBatchId, scrapBatchId]);

  function appendEvidence(action: string, method: string, ok: boolean, request: JsonRecord, response: unknown, error = '') {
    const entry: EvidenceEntry = {
      id: makeId('ev'),
      action,
      method,
      ok,
      request,
      response,
      error,
      time: new Date().toISOString(),
    };

    setEvidenceLog((prev) => [entry, ...prev]);
    return entry.id;
  }

  function updateValidationStatus(caseId: string, status: 'pending' | 'pass' | 'fail') {
    setValidationStatusMap((prev) => ({ ...prev, [caseId]: status }));
  }

  function updateValidationEvidence(caseId: string, evidenceId: string) {
    setValidationEvidenceMap((prev) => ({ ...prev, [caseId]: evidenceId }));
  }

  function updateValidationNote(caseId: string, note: string) {
    setValidationNoteMap((prev) => ({ ...prev, [caseId]: note }));
  }

  function validateOutboundBeforeDraft() {
    const hasPallet = !!palletIdF17.trim() || !!palletCode.trim();

    if (!hasPallet) {
      if (!itemCode.trim()) return 'item_code is required for manual outbound';
      if (!batchNo.trim()) return 'batch_no is required for manual outbound';
      if (!qty.trim()) return 'qty is required for manual outbound';
      if (!sourceLocationId.trim()) return 'source_location_id is required for manual outbound';
    }

    if (machineRequired && !machineId.trim()) {
      return 'machine_id is required when machine-required is enabled';
    }

    return '';
  }

  function buildOutboundPayload() {
    const payload: JsonRecord = {
      posting_date: postingDate.trim() || undefined,
      machine_id: machineId.trim() || undefined,
      work_order_id: workOrderId.trim() || undefined,
      purpose: purpose.trim() || undefined,
      uom: uom.trim() || undefined,
    };

    if (palletIdF17.trim()) payload.pallet_id = palletIdF17.trim();

    if (itemCode.trim()) payload.item_code = itemCode.trim();
    if (batchNo.trim()) payload.batch_no = batchNo.trim();
    if (qty.trim()) payload.qty = qty.trim();
    if (sourceLocationId.trim()) payload.source_location_id = sourceLocationId.trim();

    return payload;
  }

  async function handlePalletLookup() {
    const code = palletCode.trim();
    if (!code) {
      setPalletError('pallet_code is required');
      return;
    }

    setPalletBusy(true);
    setPalletError('');
    setGlobalStatus('loading');
    setGlobalHint('Running pallet.get_by_code ...');

    try {
      const result = await callMethod('pallet.get_by_code', { pallet_code: code }, { httpMethod: 'GET' });
      const evidenceId = appendEvidence(
        'Outbound pallet scan',
        'pallet.get_by_code',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setPalletResult(result.data);

      if (!result.ok) {
        setGlobalStatus('error');
        setPalletError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const palletId = extractPalletId(result.data);
      if (palletId) setPalletIdF17(palletId);

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Pallet lookup ok, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setGlobalStatus('error');
      setPalletError(err instanceof Error ? err.message : 'pallet.get_by_code failed');
      setGlobalHint('pallet.get_by_code failed before response parse');
    } finally {
      setPalletBusy(false);
    }
  }

  async function handleOutboundCreateDraft() {
    const preCheck = validateOutboundBeforeDraft();
    if (preCheck) {
      setOutboundError(preCheck);
      setGlobalStatus('error');
      setGlobalHint(preCheck);
      return;
    }

    setOutboundBusy(true);
    setOutboundError('');
    setGlobalStatus('loading');
    setGlobalHint('Running rm_outbound.create_draft ...');

    try {
      const payload = buildOutboundPayload();
      const result = await callMethod('rm_outbound.create_draft', payload);

      const evidenceId = appendEvidence(
        'Outbound create draft',
        'rm_outbound.create_draft',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setOutboundResult(result.data);

      if (!result.ok) {
        setGlobalStatus('error');
        setOutboundError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const name = extractDocName(result.data, 'rm_outbound');
      if (name) {
        setOutboundDraftName(name);
      }

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Outbound draft created, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setGlobalStatus('error');
      setOutboundError(err instanceof Error ? err.message : 'rm_outbound.create_draft failed');
      setGlobalHint('rm_outbound.create_draft failed before response parse');
    } finally {
      setOutboundBusy(false);
    }
  }

  async function handleOutboundSubmitAndPost() {
    setOutboundBusy(true);
    setOutboundError('');
    setGlobalStatus('loading');

    try {
      const outboundName = outboundDraftName.trim();

      if (!outboundName) {
        const message = 'rm_outbound draft name is required before submit/post';
        setOutboundError(message);
        setGlobalStatus('error');
        setGlobalHint(message);
        return;
      }

      const submitResult = await callMethod('rm_outbound.submit_and_post', {
        rm_outbound: outboundName,
      });

      const evidenceId = appendEvidence(
        'Outbound submit and post',
        'rm_outbound.submit_and_post',
        submitResult.ok,
        submitResult.requestPayload,
        submitResult.data,
        submitResult.ok ? '' : `${submitResult.errorCode} ${submitResult.errorMessage}`.trim()
      );

      setOutboundResult(submitResult.data);

      if (!submitResult.ok) {
        const errorLabel = submitResult.errorCode || 'ERROR';
        const suffix = submitResult.errorCode === 'INSUFFICIENT_STOCK' ? ' (clear backend stock error)' : '';
        setGlobalStatus('error');
        setOutboundError(`${errorLabel} ${submitResult.errorMessage}${suffix}`.trim());
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const name = extractDocName(submitResult.data, 'rm_outbound') || outboundName;
      if (name) {
        setSubmittedOutboundIds((prev) => Array.from(new Set([name, ...prev])));
      }

      const contractHint = submitResult.contractVersion
        ? `response contract_version=${submitResult.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Submit/post success, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setGlobalStatus('error');
      setOutboundError(err instanceof Error ? err.message : 'rm_outbound.submit_and_post failed');
      setGlobalHint('rm_outbound.submit_and_post failed before response parse');
    } finally {
      setOutboundBusy(false);
    }
  }

  async function handleRerouteSubmit() {
    const outboundId = rerouteOutboundId.trim();
    const toMachine = rerouteToMachineId.trim();
    const reason = rerouteReason.trim();

    if (!outboundId) {
      setRerouteError('submitted outbound record is required');
      return;
    }
    if (!toMachine) {
      setRerouteError('new machine is required');
      return;
    }
    if (!reason) {
      setRerouteError('reason is required');
      return;
    }

    setRerouteBusy(true);
    setRerouteError('');
    setGlobalStatus('loading');
    setGlobalHint('Running rm_outbound.reroute ...');

    try {
      const payload: JsonRecord = {
        rm_outbound: outboundId,
        to_machine_id: toMachine,
        reason,
      };

      if (rerouteToWorkOrderId.trim()) payload.to_work_order_id = rerouteToWorkOrderId.trim();
      if (rerouteToPurpose.trim()) payload.to_purpose = rerouteToPurpose.trim();

      const result = await callMethod('rm_outbound.reroute', payload);
      const evidenceId = appendEvidence(
        'Outbound destination reroute',
        'rm_outbound.reroute',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setRerouteResult(result.data);

      if (!result.ok) {
        setGlobalStatus('error');
        setRerouteError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Reroute success (trace action), ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setGlobalStatus('error');
      setRerouteError(err instanceof Error ? err.message : 'rm_outbound.reroute failed');
      setGlobalHint('rm_outbound.reroute failed before response parse');
    } finally {
      setRerouteBusy(false);
    }
  }

  function buildSummaryLinesPayload() {
    return summaryLines
      .filter((line) => line.source_item_code.trim() && line.grade_usability.trim() && line.qty.trim())
      .map((line) => ({
        row_id: line.id,
        source_machine_id: summaryMachineId.trim() || undefined,
        shift: summaryShift.trim() || undefined,
        source_item_code: line.source_item_code.trim(),
        source_batch_no: line.source_batch_no.trim() || undefined,
        source_qty: line.qty.trim(),
        grade_usability: line.grade_usability.trim(),
      }));
  }

  function validateSummaryInput() {
    if (!summaryMachineId.trim()) return 'machine_id is required';
    if (!summaryShift.trim()) return 'shift is required';
    if (!summaryPostingDate.trim()) return 'date/posting_date is required';

    const lines = buildSummaryLinesPayload();
    if (!lines.length) return 'at least one recycle summary line is required';

    return '';
  }

  async function handleSummaryCreateDraft() {
    const preCheck = validateSummaryInput();
    if (preCheck) {
      setSummaryError(preCheck);
      return;
    }

    setSummaryBusy(true);
    setSummaryError('');
    setGlobalStatus('loading');
    setGlobalHint('Running recycle_summary.create_draft ...');

    try {
      const payload: JsonRecord = {
        posting_date: summaryPostingDate.trim(),
        remarks: summaryRemarks.trim() || undefined,
        summary_lines: buildSummaryLinesPayload(),
      };

      const result = await callMethod('recycle_summary.create_draft', payload);
      const evidenceId = appendEvidence(
        'Recycle summary create draft',
        'recycle_summary.create_draft',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setSummaryResult(result.data);

      if (!result.ok) {
        setGlobalStatus('error');
        setSummaryError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const name = extractDocName(result.data, 'recycle_summary');
      if (name) setSummaryName(name);

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Recycle summary draft created, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setGlobalStatus('error');
      setSummaryError(err instanceof Error ? err.message : 'recycle_summary.create_draft failed');
      setGlobalHint('recycle_summary.create_draft failed before response parse');
    } finally {
      setSummaryBusy(false);
    }
  }

  async function handleSummarySubmitAndGenerate() {
    setSummaryBusy(true);
    setSummaryError('');
    setGlobalStatus('loading');

    try {
      let recycleSummaryId = summaryName.trim();

      if (!recycleSummaryId) {
        const preCheck = validateSummaryInput();
        if (preCheck) {
          setSummaryError(preCheck);
          setGlobalStatus('error');
          setGlobalHint(preCheck);
          return;
        }

        const createResult = await callMethod('recycle_summary.create_draft', {
          posting_date: summaryPostingDate.trim(),
          remarks: summaryRemarks.trim() || undefined,
          summary_lines: buildSummaryLinesPayload(),
        });

        const createEvidenceId = appendEvidence(
          'Recycle summary create draft (auto before submit)',
          'recycle_summary.create_draft',
          createResult.ok,
          createResult.requestPayload,
          createResult.data,
          createResult.ok ? '' : `${createResult.errorCode} ${createResult.errorMessage}`.trim()
        );

        if (!createResult.ok) {
          setSummaryResult(createResult.data);
          setSummaryError(`${createResult.errorCode || 'ERROR'} ${createResult.errorMessage}`.trim());
          setGlobalStatus('error');
          setGlobalHint(`Auto summary draft failed, evidence: ${createEvidenceId}`);
          return;
        }

        recycleSummaryId = extractDocName(createResult.data, 'recycle_summary');
        if (!recycleSummaryId) {
          setSummaryError('Cannot resolve recycle_summary name from create_draft response');
          setGlobalStatus('error');
          setGlobalHint(`Auto summary draft missing name, evidence: ${createEvidenceId}`);
          return;
        }

        setSummaryName(recycleSummaryId);
      }

      const result = await callMethod('recycle_summary.submit_and_generate_batches', {
        recycle_summary: recycleSummaryId,
      });

      const evidenceId = appendEvidence(
        'Recycle summary submit and generate batches',
        'recycle_summary.submit_and_generate_batches',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setSummaryResult(result.data);

      if (!result.ok) {
        setSummaryError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalStatus('error');
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const record = asRecord(result.data);
      const generated = Array.isArray(record?.generated_batches) ? record.generated_batches : [];
      const names = generated
        .map((item) => asRecord(item)?.name)
        .filter((name): name is string => typeof name === 'string' && !!name.trim());

      if (names.length) {
        setGeneratedBatches((prev) => Array.from(new Set([...prev, ...names])));
      }

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Recycle batches generated, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'recycle_summary.submit_and_generate_batches failed');
      setGlobalStatus('error');
      setGlobalHint('recycle_summary.submit_and_generate_batches failed before response parse');
    } finally {
      setSummaryBusy(false);
    }
  }

  function validateProcessInput() {
    if (!processBatchId.trim()) return 'recycle_batch_id is required';
    if (!processType.trim()) return 'process_type is required';
    if (!processTotalCost.trim()) return 'total_cost is required';
    return '';
  }

  async function handleProcessCreateDraft() {
    const preCheck = validateProcessInput();
    if (preCheck) {
      setProcessError(preCheck);
      return;
    }

    setProcessBusy(true);
    setProcessError('');
    setGlobalStatus('loading');
    setGlobalHint('Running recycle_process.create_draft ...');

    try {
      const result = await callMethod('recycle_process.create_draft', {
        recycle_batch_id: processBatchId.trim(),
        process_type: processType.trim(),
        total_cost: processTotalCost.trim(),
        remarks: processRemarks.trim() || undefined,
      });

      const evidenceId = appendEvidence(
        'Recycle process create draft',
        'recycle_process.create_draft',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setProcessResult(result.data);

      if (!result.ok) {
        setProcessError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalStatus('error');
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const name = extractDocName(result.data, 'recycle_process');
      if (name) setProcessName(name);

      setGeneratedBatches((prev) => Array.from(new Set([processBatchId.trim(), ...prev])));

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Recycle process draft created, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'recycle_process.create_draft failed');
      setGlobalStatus('error');
      setGlobalHint('recycle_process.create_draft failed before response parse');
    } finally {
      setProcessBusy(false);
    }
  }

  async function handleProcessSubmitAndApply() {
    setProcessBusy(true);
    setProcessError('');
    setGlobalStatus('loading');

    try {
      let recycleProcessId = processName.trim();

      if (!recycleProcessId) {
        const preCheck = validateProcessInput();
        if (preCheck) {
          setProcessError(preCheck);
          setGlobalStatus('error');
          setGlobalHint(preCheck);
          return;
        }

        const createResult = await callMethod('recycle_process.create_draft', {
          recycle_batch_id: processBatchId.trim(),
          process_type: processType.trim(),
          total_cost: processTotalCost.trim(),
          remarks: processRemarks.trim() || undefined,
        });

        const createEvidenceId = appendEvidence(
          'Recycle process create draft (auto before submit)',
          'recycle_process.create_draft',
          createResult.ok,
          createResult.requestPayload,
          createResult.data,
          createResult.ok ? '' : `${createResult.errorCode} ${createResult.errorMessage}`.trim()
        );

        if (!createResult.ok) {
          setProcessResult(createResult.data);
          setProcessError(`${createResult.errorCode || 'ERROR'} ${createResult.errorMessage}`.trim());
          setGlobalStatus('error');
          setGlobalHint(`Auto process draft failed, evidence: ${createEvidenceId}`);
          return;
        }

        recycleProcessId = extractDocName(createResult.data, 'recycle_process');
        if (!recycleProcessId) {
          setProcessError('Cannot resolve recycle_process name from create_draft response');
          setGlobalStatus('error');
          setGlobalHint(`Auto process draft missing name, evidence: ${createEvidenceId}`);
          return;
        }

        setProcessName(recycleProcessId);
      }

      const result = await callMethod('recycle_process.submit_and_apply', {
        recycle_process: recycleProcessId,
      });

      const evidenceId = appendEvidence(
        'Recycle process submit and apply',
        'recycle_process.submit_and_apply',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setProcessResult(result.data);

      if (!result.ok) {
        setProcessError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalStatus('error');
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const batch = asRecord(asRecord(result.data)?.recycle_batch);
      const batchName = typeof batch?.name === 'string' ? batch.name : '';
      if (batchName) {
        setGeneratedBatches((prev) => Array.from(new Set([batchName, ...prev])));
      }

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Recycle process applied, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'recycle_process.submit_and_apply failed');
      setGlobalStatus('error');
      setGlobalHint('recycle_process.submit_and_apply failed before response parse');
    } finally {
      setProcessBusy(false);
    }
  }

  async function handleScrapSubmitAndClose() {
    const batchId = scrapBatchId.trim();
    const reason = scrapReason.trim();

    if (!batchId) {
      setScrapError('recycle_batch_id is required');
      return;
    }

    if (!reason) {
      setScrapError('reason is required');
      return;
    }

    setScrapBusy(true);
    setScrapError('');
    setGlobalStatus('loading');
    setGlobalHint('Running recycle_scrap.submit_and_close ...');

    try {
      const result = await callMethod('recycle_scrap.submit_and_close', {
        recycle_batch_id: batchId,
        reason,
      });

      const evidenceId = appendEvidence(
        'Recycle scrap submit and close',
        'recycle_scrap.submit_and_close',
        result.ok,
        result.requestPayload,
        result.data,
        result.ok ? '' : `${result.errorCode} ${result.errorMessage}`.trim()
      );

      setScrapResult(result.data);

      if (!result.ok) {
        setScrapError(`${result.errorCode || 'ERROR'} ${result.errorMessage}`.trim());
        setGlobalStatus('error');
        setGlobalHint(`Evidence saved: ${evidenceId}`);
        return;
      }

      const batch = asRecord(asRecord(result.data)?.recycle_batch);
      const batchName = typeof batch?.name === 'string' ? batch.name : '';
      if (batchName) {
        setGeneratedBatches((prev) => Array.from(new Set([batchName, ...prev])));
      }

      const contractHint = result.contractVersion
        ? `response contract_version=${result.contractVersion}`
        : 'response contract_version missing';

      setGlobalStatus('ok');
      setGlobalHint(`Recycle scrap closed by official path, ${contractHint}, evidence: ${evidenceId}`);
    } catch (err) {
      setScrapError(err instanceof Error ? err.message : 'recycle_scrap.submit_and_close failed');
      setGlobalStatus('error');
      setGlobalHint('recycle_scrap.submit_and_close failed before response parse');
    } finally {
      setScrapBusy(false);
    }
  }

  async function handleLegacyFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLegacyUploading(true);
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
        setLegacyReceiptPhoto(data.file_url);
      } else {
        setLegacyError('photo upload failed');
      }
    } catch {
      setLegacyError('photo upload failed');
    } finally {
      setLegacyUploading(false);
      e.currentTarget.value = '';
    }
  }

  async function handleLegacyInboundSubmit() {
    const f01 = legacyF01.trim();
    const f02 = legacyF02.trim();
    const f08 = legacyF08.trim();
    const exceptionReason = legacyExceptionReason.trim();
    const receiptPhoto = legacyReceiptPhoto.trim();

    if (!f01 || !f02 || !f08) {
      setLegacyStatus('error');
      setLegacyError('f01, f02, f08 are required');
      return;
    }

    if (!receiptPhoto && !exceptionReason) {
      setLegacyStatus('error');
      setLegacyError('receipt_photo or exception_reason is required');
      return;
    }

    const overrides: JsonRecord = {};
    if (f01) overrides.f01 = f01;
    if (f02) overrides.f02 = f02;
    if (legacyF03.trim()) overrides.f03 = legacyF03.trim();
    if (legacyF04.trim()) overrides.f04 = legacyF04.trim();
    if (legacyF05.trim()) overrides.f05 = legacyF05.trim();
    if (legacyF06.trim()) overrides.f06 = legacyF06.trim();
    if (legacyF07.trim()) overrides.f07 = legacyF07.trim();
    if (f08) overrides.f08 = f08;
    if (legacyF09.trim()) overrides.f09 = legacyF09.trim();
    if (legacyF10.trim()) overrides.f10 = legacyF10.trim();
    if (legacyF11.trim()) overrides.f11 = legacyF11.trim();
    if (legacyF12.trim()) overrides.f12 = legacyF12.trim();
    if (legacyF13.trim()) overrides.f13 = legacyF13.trim();
    if (legacyF14.trim()) overrides.f14 = legacyF14.trim();
    if (legacyF15.trim()) overrides.f15 = legacyF15.trim();
    if (legacyF16.trim()) overrides.f16 = legacyF16.trim();
    if (legacyF17.trim()) overrides.f17 = legacyF17.trim();

    setLegacyStatus('loading');
    setLegacyError('');
    setLegacyDraftName('');
    setLegacyVision(null);
    setLegacyMeta(null);

    try {
      const result = await callLegacyInbound({
        receipt_photo: receiptPhoto,
        exception_reason: exceptionReason,
        overrides,
      });
      const dataRecord = asRecord(result.data);

      if (!result.ok) {
        setLegacyStatus('error');
        setLegacyError(result.errorMessage);
        setLegacyVision(dataRecord?.vision ?? null);
        setLegacyMeta(dataRecord?.meta ?? null);
        return;
      }

      const draftRecord = asRecord(dataRecord?.draft);
      const draftName =
        (typeof dataRecord?.draft === 'string' ? dataRecord?.draft : '') ||
        (typeof draftRecord?.name === 'string' ? draftRecord.name : '');

      setLegacyStatus('ok');
      setLegacyDraftName(draftName);
      setLegacyVision(dataRecord?.vision ?? null);
      setLegacyMeta(dataRecord?.meta ?? null);
    } catch (err) {
      setLegacyStatus('error');
      setLegacyError(err instanceof Error ? err.message : 'legacy inbound submit failed');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-semibold">Batch 4 - S5 Frontend Closure Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Outbound + reroute + recycle + adversarial validation (frontend only).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded border text-xs uppercase tracking-wider ${statusBadge(globalStatus)}`}>
              status: {globalStatus}
            </span>
            <span className="text-xs text-slate-300">{globalHint || 'Ready'}</span>
          </div>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6 space-y-3">
          <p className="text-sm text-slate-300">PWA Entry</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveView('legacy')}
              className={`rounded border px-3 py-2 text-sm ${
                activeView === 'legacy'
                  ? 'border-cyan-700 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              Legacy Inbound
            </button>
            <button
              onClick={() => setActiveView('s5')}
              className={`rounded border px-3 py-2 text-sm ${
                activeView === 's5'
                  ? 'border-cyan-700 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              S5 Console
            </button>
          </div>
        </section>

        {activeView === 's5' ? (
          <>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">A. Outbound Page</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Scan Area - pallet_code</label>
              <input
                value={palletCode}
                onChange={(e) => setPalletCode(e.target.value)}
                placeholder="scan pallet code"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePalletLookup}
                  disabled={palletBusy}
                  className="rounded border border-cyan-700 bg-cyan-950/40 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {palletBusy ? 'Looking up...' : 'pallet.get_by_code'}
                </button>
                <input
                  value={palletIdF17}
                  onChange={(e) => setPalletIdF17(e.target.value)}
                  placeholder="f17 / pallet_id"
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>
              {palletError && <p className="text-sm text-rose-300">{palletError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Manual Fallback Area (no pallet)</label>
              <input
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="item_code"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="batch_no"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="qty"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                />
                <input
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  placeholder="uom"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>
              <input
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                placeholder="source_location_id (required for manual)"
                className="w-full rounded border border-amber-700 bg-slate-950 px-3 py-2"
              />
              <p className="text-xs text-amber-300">
                Manual outbound requires source_location_id before submit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Destination Area</label>
              <input
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                placeholder="machine_id"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                placeholder="work_order_id"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="purpose"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Submit Area</label>
              <input
                value={outboundDraftName}
                onChange={(e) => setOutboundDraftName(e.target.value)}
                placeholder="rm_outbound draft name (required for submit/post)"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
                type="date"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={machineRequired}
                  onChange={(e) => setMachineRequired(e.target.checked)}
                />
                machine_id required on frontend (config-driven guard)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOutboundCreateDraft}
                  disabled={outboundBusy}
                  className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {outboundBusy ? 'Working...' : 'Create Draft'}
                </button>
                <button
                  onClick={handleOutboundSubmitAndPost}
                  disabled={outboundBusy}
                  className="rounded border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm disabled:opacity-50"
                >
                  {outboundBusy ? 'Posting...' : 'Submit and Post'}
                </button>
              </div>
              <p className="text-xs text-slate-400">No frontend stock simulation. Backend is source of truth.</p>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-3 space-y-2">
            <p className="text-xs text-slate-400">Outbound draft name: {outboundDraftName || 'none'}</p>
            {outboundError && <p className="text-sm text-rose-300">{outboundError}</p>}
            <pre className="text-xs overflow-auto">{pretty(outboundResult)}</pre>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400 mb-2">pallet.get_by_code response snapshot</p>
            <pre className="text-xs overflow-auto">{pretty(palletResult)}</pre>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">B. Destination Reroute Entry</h2>
          <p className="text-sm text-slate-400">Trace action only. Quantity is not editable here.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">submitted outbound selector</label>
              <select
                value={rerouteOutboundId}
                onChange={(e) => setRerouteOutboundId(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="">-- select submitted outbound --</option>
                {submittedOutboundIds.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                value={rerouteOutboundId}
                onChange={(e) => setRerouteOutboundId(e.target.value)}
                placeholder="or input rm_outbound name"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={rerouteToMachineId}
                onChange={(e) => setRerouteToMachineId(e.target.value)}
                placeholder="new machine_id"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <textarea
                value={rerouteReason}
                onChange={(e) => setRerouteReason(e.target.value)}
                placeholder="reason"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">optional target fields</label>
              <input
                value={rerouteToWorkOrderId}
                onChange={(e) => setRerouteToWorkOrderId(e.target.value)}
                placeholder="to_work_order_id"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={rerouteToPurpose}
                onChange={(e) => setRerouteToPurpose(e.target.value)}
                placeholder="to_purpose"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />

              <button
                onClick={handleRerouteSubmit}
                disabled={rerouteBusy}
                className="rounded border border-cyan-700 bg-cyan-950/40 px-3 py-2 text-sm disabled:opacity-50"
              >
                {rerouteBusy ? 'Submitting...' : 'Submit reroute'}
              </button>

              {rerouteError && <p className="text-sm text-rose-300">{rerouteError}</p>}
              <p className="text-xs text-slate-400">Result should show readable from-&gt;to trace from backend response.</p>
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-3">
            <pre className="text-xs overflow-auto">{pretty(rerouteResult)}</pre>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">C. Recycle Page</h2>

          <div className="rounded border border-slate-800 bg-slate-950 p-3 space-y-4">
            <h3 className="font-medium">C1. Recycle Summary Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={summaryMachineId}
                onChange={(e) => setSummaryMachineId(e.target.value)}
                placeholder="machine_id"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
              <input
                value={summaryShift}
                onChange={(e) => setSummaryShift(e.target.value)}
                placeholder="shift"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
              <input
                value={summaryPostingDate}
                onChange={(e) => setSummaryPostingDate(e.target.value)}
                type="date"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
            </div>

            <textarea
              value={summaryRemarks}
              onChange={(e) => setSummaryRemarks(e.target.value)}
              placeholder="remarks (optional)"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 min-h-[70px]"
            />

            <div className="space-y-3">
              {summaryLines.map((line, idx) => (
                <div key={line.id} className="rounded border border-slate-700 bg-slate-900 p-3 space-y-2">
                  <p className="text-xs text-slate-400">line {idx + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      value={line.source_item_code}
                      onChange={(e) =>
                        setSummaryLines((prev) =>
                          prev.map((x) => (x.id === line.id ? { ...x, source_item_code: e.target.value } : x))
                        )
                      }
                      placeholder="source_item_code"
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                    <input
                      value={line.grade_usability}
                      onChange={(e) =>
                        setSummaryLines((prev) =>
                          prev.map((x) => (x.id === line.id ? { ...x, grade_usability: e.target.value } : x))
                        )
                      }
                      placeholder="grade_usability"
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                    <input
                      value={line.qty}
                      onChange={(e) =>
                        setSummaryLines((prev) =>
                          prev.map((x) => (x.id === line.id ? { ...x, qty: e.target.value } : x))
                        )
                      }
                      placeholder="qty"
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                    <input
                      value={line.source_batch_no}
                      onChange={(e) =>
                        setSummaryLines((prev) =>
                          prev.map((x) => (x.id === line.id ? { ...x, source_batch_no: e.target.value } : x))
                        )
                      }
                      placeholder="source_batch_no (optional)"
                      className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                    />
                  </div>
                  <input
                    value={line.remarks}
                    onChange={(e) =>
                      setSummaryLines((prev) =>
                        prev.map((x) => (x.id === line.id ? { ...x, remarks: e.target.value } : x))
                      )
                    }
                    placeholder="remarks (optional)"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                  <button
                    onClick={() => setSummaryLines((prev) => prev.filter((x) => x.id !== line.id))}
                    disabled={summaryLines.length <= 1}
                    className="rounded border border-slate-700 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    Remove line
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSummaryLines((prev) => [...prev, newSummaryLine()])}
                className="rounded border border-slate-700 px-3 py-2 text-sm"
              >
                Add line
              </button>
              <button
                onClick={handleSummaryCreateDraft}
                disabled={summaryBusy}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm disabled:opacity-50"
              >
                {summaryBusy ? 'Working...' : 'Create Draft'}
              </button>
              <button
                onClick={handleSummarySubmitAndGenerate}
                disabled={summaryBusy}
                className="rounded border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm disabled:opacity-50"
              >
                {summaryBusy ? 'Submitting...' : 'Submit and Generate Batches'}
              </button>
            </div>

            <p className="text-xs text-slate-400">recycle_summary name: {summaryName || 'none'}</p>
            {summaryError && <p className="text-sm text-rose-300">{summaryError}</p>}
            <pre className="text-xs overflow-auto">{pretty(summaryResult)}</pre>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-3 space-y-3">
            <h3 className="font-medium">C2. Recycle Process Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={processBatchId}
                onChange={(e) => setProcessBatchId(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              >
                <option value="">-- select recycle batch --</option>
                {batchOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                value={processBatchId}
                onChange={(e) => setProcessBatchId(e.target.value)}
                placeholder="or input recycle_batch_id"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
              <input
                value={processType}
                onChange={(e) => setProcessType(e.target.value)}
                placeholder="process_type"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
              <input
                value={processTotalCost}
                onChange={(e) => setProcessTotalCost(e.target.value)}
                placeholder="total_cost (required)"
                className="rounded border border-amber-700 bg-slate-900 px-3 py-2"
              />
            </div>
            <textarea
              value={processRemarks}
              onChange={(e) => setProcessRemarks(e.target.value)}
              placeholder="remarks (optional)"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 min-h-[70px]"
            />
            <p className="text-xs text-slate-400">cost_breakdown is intentionally not required in Batch 4.</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleProcessCreateDraft}
                disabled={processBusy}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm disabled:opacity-50"
              >
                {processBusy ? 'Working...' : 'Create Draft'}
              </button>
              <button
                onClick={handleProcessSubmitAndApply}
                disabled={processBusy}
                className="rounded border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm disabled:opacity-50"
              >
                {processBusy ? 'Applying...' : 'Submit and Apply'}
              </button>
            </div>
            <p className="text-xs text-slate-400">recycle_process name: {processName || 'none'}</p>
            {processError && <p className="text-sm text-rose-300">{processError}</p>}
            <pre className="text-xs overflow-auto">{pretty(processResult)}</pre>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-3 space-y-3">
            <h3 className="font-medium">C3. Recycle Scrap Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={scrapBatchId}
                onChange={(e) => setScrapBatchId(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              >
                <option value="">-- select recycle batch --</option>
                {batchOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                value={scrapBatchId}
                onChange={(e) => setScrapBatchId(e.target.value)}
                placeholder="or input recycle_batch_id"
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
            </div>

            <textarea
              value={scrapReason}
              onChange={(e) => setScrapReason(e.target.value)}
              placeholder="reason"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 min-h-[70px]"
            />

            <button
              onClick={handleScrapSubmitAndClose}
              disabled={scrapBusy}
              className="rounded border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm disabled:opacity-50"
            >
              {scrapBusy ? 'Closing...' : 'Submit and Close'}
            </button>

            <p className="text-xs text-slate-400">Official close path only: recycle_scrap.submit_and_close.</p>
            {scrapError && <p className="text-sm text-rose-300">{scrapError}</p>}
            <pre className="text-xs overflow-auto">{pretty(scrapResult)}</pre>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">D. Full-Chain Adversarial Validation + Evidence</h2>
          <p className="text-sm text-slate-400">
            Use the tracker below to record pass/fail and bind each case to an evidence entry id.
          </p>

          <div className="space-y-3">
            {VALIDATION_CASES.map((item) => {
              const status = validationStatusMap[item.id];
              return (
                <div key={item.id} className="rounded border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.expectation}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${
                        status === 'pass'
                          ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
                          : status === 'fail'
                            ? 'border-rose-700 bg-rose-950/40 text-rose-300'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      value={validationEvidenceMap[item.id] || ''}
                      onChange={(e) => updateValidationEvidence(item.id, e.target.value)}
                      className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    >
                      <option value="">-- select evidence id --</option>
                      {evidenceLog.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.id} | {ev.action}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateValidationStatus(item.id, 'pass')}
                        className="rounded border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm"
                      >
                        Mark pass
                      </button>
                      <button
                        onClick={() => updateValidationStatus(item.id, 'fail')}
                        className="rounded border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm"
                      >
                        Mark fail
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={validationNoteMap[item.id] || ''}
                    onChange={(e) => updateValidationNote(item.id, e.target.value)}
                    placeholder="notes / screenshot path / record id"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 min-h-[70px]"
                  />
                </div>
              );
            })}
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 p-3 space-y-2">
            <p className="font-medium">Evidence Log (request/response snapshots)</p>
            <div className="max-h-[420px] overflow-auto space-y-3">
              {evidenceLog.length === 0 && <p className="text-sm text-slate-400">No evidence yet.</p>}
              {evidenceLog.map((entry) => (
                <div key={entry.id} className="rounded border border-slate-700 bg-slate-900 p-3 space-y-2">
                  <p className="text-xs text-slate-300">
                    {entry.id} | {entry.time} | {entry.action} | {entry.method} |{' '}
                    {entry.ok ? 'ok' : 'error'}
                  </p>
                  {!entry.ok && entry.error && <p className="text-xs text-rose-300">{entry.error}</p>}
                  <details>
                    <summary className="cursor-pointer text-xs text-slate-300">request</summary>
                    <pre className="text-xs overflow-auto">{pretty(entry.request)}</pre>
                  </details>
                  <details>
                    <summary className="cursor-pointer text-xs text-slate-300">response</summary>
                    <pre className="text-xs overflow-auto">{pretty(entry.response)}</pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>
          </>
        ) : (
          <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 md:p-6 space-y-4">
            <h2 className="text-lg font-medium">Legacy Inbound</h2>
            <p className="text-sm text-slate-400">Recovered inbound key form area (coexists with S5 Console).</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">receipt_photo upload</label>
                <input
                  ref={legacyFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleLegacyFileUpload}
                  className="hidden"
                />
                <div
                  onDoubleClick={() => legacyFileInputRef.current?.click()}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 min-h-[42px] flex items-center justify-between gap-2 cursor-pointer"
                  title="Double-click to choose photo"
                >
                  <span className="text-sm text-slate-300 truncate">
                    {legacyReceiptPhoto || 'double-click to upload receipt photo'}
                  </span>
                  <button
                    type="button"
                    onClick={() => legacyFileInputRef.current?.click()}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                  >
                    Choose
                  </button>
                </div>
                {legacyUploading && <p className="text-xs text-cyan-300">uploading...</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">exception_reason (required if no photo)</label>
                <input
                  value={legacyExceptionReason}
                  onChange={(e) => setLegacyExceptionReason(e.target.value)}
                  placeholder="exception_reason (required if no photo)"
                  className="rounded border border-amber-700 bg-slate-950 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={legacyF01}
                onChange={(e) => setLegacyF01(e.target.value)}
                placeholder="f01 material (required)"
                className="rounded border border-amber-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF02}
                onChange={(e) => setLegacyF02(e.target.value)}
                placeholder="f02 supplier (required)"
                className="rounded border border-amber-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF03}
                onChange={(e) => setLegacyF03(e.target.value)}
                placeholder="f03 invoice no"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF04}
                onChange={(e) => setLegacyF04(e.target.value)}
                placeholder="f04 gross weight"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF05}
                onChange={(e) => setLegacyF05(e.target.value)}
                placeholder="f05 package qty"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF06}
                onChange={(e) => setLegacyF06(e.target.value)}
                placeholder="f06 batch no"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF07}
                onChange={(e) => setLegacyF07(e.target.value)}
                placeholder="f07 plate no"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF08}
                onChange={(e) => setLegacyF08(e.target.value)}
                placeholder="f08 location (required)"
                className="rounded border border-amber-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF09}
                onChange={(e) => setLegacyF09(e.target.value)}
                type="datetime-local"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF10}
                onChange={(e) => setLegacyF10(e.target.value)}
                placeholder="f10 delivery weight / exception note"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF11}
                onChange={(e) => setLegacyF11(e.target.value)}
                placeholder="f11 remarks"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF12}
                onChange={(e) => setLegacyF12(e.target.value)}
                placeholder="f12 external bag code"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <select
                value={legacyF13}
                onChange={(e) => setLegacyF13(e.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <option value="">f13 source type</option>
                <option value="新料">新料</option>
                <option value="回料">回料</option>
              </select>
              <input
                value={legacyF14}
                onChange={(e) => setLegacyF14(e.target.value)}
                placeholder="f14 regrind class"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF15}
                onChange={(e) => setLegacyF15(e.target.value)}
                placeholder="f15 internal batch"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF16}
                onChange={(e) => setLegacyF16(e.target.value)}
                placeholder="f16 pkg track"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
              <input
                value={legacyF17}
                onChange={(e) => setLegacyF17(e.target.value)}
                placeholder="f17 pallet_id"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={handleLegacyInboundSubmit}
                disabled={legacyStatus === 'loading'}
                className="rounded border border-cyan-700 bg-cyan-950/40 px-3 py-2 text-sm disabled:opacity-50"
              >
                {legacyStatus === 'loading' ? 'Submitting...' : 'Submit Legacy Inbound'}
              </button>
              <span className={`px-2 py-1 rounded border text-xs ${statusBadge(legacyStatus)}`}>
                status: {legacyStatus}
              </span>
              <span className="text-xs text-slate-400">draft: {legacyDraftName || 'none'}</span>
            </div>

            {legacyError && <p className="text-sm text-rose-300">{legacyError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400 mb-2">vision response</p>
                <pre className="text-xs overflow-auto">{pretty(legacyVision)}</pre>
              </div>
              <div className="rounded border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400 mb-2">meta response</p>
                <pre className="text-xs overflow-auto">{pretty(legacyMeta)}</pre>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
