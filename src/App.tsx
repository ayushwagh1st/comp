import { useEffect, useMemo, useState } from "react"

type Screen = "board" | "profile" | "deduction"
type CaseStatus = "OPEN" | "IN PROGRESS" | "SOLVED"
type Classification = "Supporting" | "Contradictory" | "Unresolved"
type EvidenceState = "CONFIRMED" | "SUSPICIOUS" | "INFERENCE" | "UNRESOLVED"
type AgentState = "Ready" | "Investigating" | "Complete" | "Error"

interface Evidence {
  id: string
  title: string
  category: string
  description: string
  time?: string
  state: EvidenceState
  related: string[]
  notes: string
  glyph: string
}

interface Suspect {
  id: string
  name: string
  role: string
  initials: string
  alibi: string
  location: string
  clue: string
  summary: string
  supporting: string[]
  contradictory: string[]
  accent: string
}

interface Connection {
  id: string
  evidenceId: string
  suspectId: string
  rationale: string
  classification: Classification
  source: "USER CONFIRMED" | "AI SUGGESTED"
}

interface Report {
  question: string
  facts: string[]
  supporting: string[]
  contradictory: string[]
  timeline: string[]
  comparisons: string[]
  unresolved: string[]
  nextAction: string
  conclusion: string
  mode: "DEMO MODE"
}

interface PersistedState {
  status: CaseStatus
  connections: Connection[]
  report: Report | null
  deduction: { suspectId: string; explanation: string } | null
  notes: Record<string, string>
}

const evidence: Evidence[] = [
  {
    id: "E-01",
    title: "The Display Case",
    category: "SCENE RECORD",
    description:
      "The sapphire's display case was opened at 9:13 PM without visible forced entry. The lock was intact, indicating use of a key or a non-destructive method.",
    time: "9:13 PM",
    state: "CONFIRMED",
    related: ["S-01", "S-02", "S-03", "S-04", "S-05"],
    notes:
      "No splintering, scoring, or damaged tumblers. Access—not force—is the central question.",
    glyph: "◇",
  },
  {
    id: "E-02",
    title: "Service-Key Register",
    category: "ACCESS LOG",
    description:
      "The service register records Thomas Grey receiving the spare display-room key at 8:55 PM. No return time was entered before the theft.",
    time: "8:55 PM",
    state: "SUSPICIOUS",
    related: ["S-01"],
    notes:
      "The signature is consistent with Grey's prior entries. The key's chain of custody remains incomplete.",
    glyph: "⚿",
  },
  {
    id: "E-03",
    title: "Kitchen Ledger",
    category: "STAFF RECORD",
    description:
      "The kitchen ledger records Thomas Grey as absent from the kitchen between 9:10 PM and 9:20 PM, contradicting his claim that he remained there.",
    time: "9:10–9:20 PM",
    state: "CONFIRMED",
    related: ["S-01"],
    notes:
      "Two staff initials corroborate the notation. This interval contains the 9:13 PM opening.",
    glyph: "≡",
  },
  {
    id: "E-04",
    title: "Stage Photograph",
    category: "PHOTOGRAPH",
    description:
      "A time-stamped photograph places Marcus Reed on stage during the critical period. His stage wire remains relevant to method, but the image supports his alibi.",
    time: "9:12 PM",
    state: "CONFIRMED",
    related: ["S-04"],
    notes:
      "The stage clock and photographer's plate agree. The image has no visible splice.",
    glyph: "▣",
  },
  {
    id: "E-05",
    title: "Ballroom Photograph",
    category: "PHOTOGRAPH",
    description:
      "A time-stamped photograph supports Eleanor Vale's claim that she was giving a toast in the ballroom at 9:14 PM.",
    time: "9:14 PM",
    state: "CONFIRMED",
    related: ["S-05"],
    notes:
      "Multiple guests appear in the same frame. Her access is real, but presence at the scene is not established.",
    glyph: "▧",
  },
  {
    id: "E-06",
    title: "Muddy Footprint",
    category: "TRACE EVIDENCE",
    description:
      "Footprints were discovered near the display room. Their tread does not match Clara Finch's shoes, weakening the initial suspicion against her.",
    state: "UNRESOLVED",
    related: ["S-03"],
    notes:
      "The print is size 10 with a work-boot tread. Finch's shoes are size 6 with a smooth leather sole.",
    glyph: "◖",
  },
]

const suspects: Suspect[] = [
  {
    id: "S-01",
    name: "Thomas Grey",
    role: "Head Butler",
    initials: "TG",
    alibi: "Claims he remained in the kitchen throughout the critical period.",
    location: "Kitchen corridor · last verified 8:58 PM",
    clue: "He signed for the spare display-room key at 8:55 PM.",
    summary:
      "Trusted staff member with direct access and a documented gap in his alibi.",
    supporting: [],
    contradictory: ["E-02", "E-03"],
    accent: "umber",
  },
  {
    id: "S-02",
    name: "Dr. Mira Sen",
    role: "Gemologist",
    initials: "MS",
    alibi: "Claims she was examining gemstones in the study.",
    location: "West study · seen shortly after 9:15 PM",
    clue: "A gem-testing instrument from her inventory was found near the display room.",
    summary:
      "Her expertise and misplaced instrument warrant inquiry, but neither establishes access or presence.",
    supporting: [],
    contradictory: [],
    accent: "blue",
  },
  {
    id: "S-03",
    name: "Clara Finch",
    role: "Journalist",
    initials: "CF",
    alibi: "Claims she was taking notes in the conservatory.",
    location: "Conservatory · seen at approximately 9:16 PM",
    clue: "Muddy footprints near the display initially appeared consistent with her route.",
    summary:
      "The physical comparison weakens the footprint theory; her precise 9:13 PM location is unverified.",
    supporting: ["E-06"],
    contradictory: [],
    accent: "olive",
  },
  {
    id: "S-04",
    name: "Marcus Reed",
    role: "Magician",
    initials: "MR",
    alibi: "Claims he was performing on stage before the assembled guests.",
    location: "Main stage · photographed at 9:12 PM",
    clue: "Thin wire among his stage equipment raises a question about the opening method.",
    summary:
      "The wire suggests a possible method, while a verified photograph strongly supports his alibi.",
    supporting: ["E-04"],
    contradictory: [],
    accent: "wine",
  },
  {
    id: "S-05",
    name: "Eleanor Vale",
    role: "Party Host",
    initials: "EV",
    alibi: "Claims she was giving a toast in the ballroom.",
    location: "Ballroom dais · photographed at 9:14 PM",
    clue: "Her host's access record confirms she could enter the display room.",
    summary:
      "She had authorized access, but the ballroom photograph supports her account during the opening.",
    supporting: ["E-05"],
    contradictory: [],
    accent: "plum",
  },
]

const initialConnections: Connection[] = [
  {
    id: "seed-e04-s04",
    evidenceId: "E-04",
    suspectId: "S-04",
    rationale: "Time-stamped stage image supports Reed's alibi.",
    classification: "Supporting",
    source: "AI SUGGESTED",
  },
  {
    id: "seed-e05-s05",
    evidenceId: "E-05",
    suspectId: "S-05",
    rationale: "Ballroom image places Vale away from the display at 9:14 PM.",
    classification: "Supporting",
    source: "AI SUGGESTED",
  },
  {
    id: "seed-e06-s03",
    evidenceId: "E-06",
    suspectId: "S-03",
    rationale:
      "The tread mismatch contradicts the theory that Finch left the print.",
    classification: "Contradictory",
    source: "AI SUGGESTED",
  },
]

const defaultState: PersistedState = {
  status: "OPEN",
  connections: initialConnections,
  report: null,
  deduction: null,
  notes: {},
}

const STORAGE_KEY = "221b-case-047"

function loadState(): PersistedState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    if (!parsed || !["OPEN", "IN PROGRESS", "SOLVED"].includes(parsed.status))
      return defaultState
    return {
      status: parsed.status,
      connections: Array.isArray(parsed.connections)
        ? parsed.connections
        : initialConnections,
      report: parsed.report || null,
      deduction: parsed.deduction || null,
      notes:
        parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
    }
  } catch {
    return defaultState
  }
}

function Icon({
  name,
}: {
  name: "search" | "link" | "brain" | "file" | "arrow" | "x" | "reset"
}) {
  const paths: Record<string, string> = {
    search: "M11 4a7 7 0 1 0 4.9 12L21 21l-1.4-1.4-3.7-3.7A7 7 0 0 0 11 4Z",
    link: "M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2",
    brain:
      "M9.5 4A3.5 3.5 0 0 0 6 7.5c0 .3 0 .6.1.8A3.5 3.5 0 0 0 5 15a4 4 0 0 0 4 4h1V5.5A1.5 1.5 0 0 0 8.5 4M14.5 4A3.5 3.5 0 0 1 18 7.5c0 .3 0 .6-.1.8A3.5 3.5 0 0 1 19 15a4 4 0 0 1-4 4h-1V5.5A1.5 1.5 0 0 1 15.5 4",
    file: "M6 3h8l4 4v14H6V3Zm8 0v5h5M9 12h6M9 16h6",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    x: "m6 6 12 12M18 6 6 18",
    reset: "M4 4v6h6M5.5 16a8 8 0 1 0 .5-9",
  }
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

function Button({
  children,
  onClick,
  variant = "brass",
  disabled,
  type = "button",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "brass" | "ghost" | "danger" | "paper"
  disabled?: boolean
  type?: "button" | "submit"
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

function Portrait({
  suspect,
  large = false,
}: {
  suspect: Suspect
  large?: boolean
}) {
  return (
    <div
      className={`portrait portrait-${suspect.accent} ${
        large ? "portrait-large" : ""
      }`}
      aria-label={`Portrait of ${suspect.name}`}
    >
      <div className="portrait-light" />
      <div className="portrait-head" />
      <div className="portrait-body" />
      <div className="portrait-initials">{suspect.initials}</div>
      <div className="photo-noise" />
    </div>
  )
}

function StateTag({ state }: { state: EvidenceState }) {
  return (
    <span className={`state-tag state-${state.toLowerCase()}`}>{state}</span>
  )
}

function App() {
  const [persisted, setPersisted] = useState<PersistedState>(loadState)
  const [screen, setScreen] = useState<Screen>("board")
  const [selectedSuspectId, setSelectedSuspectId] = useState("S-01")
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  )
  const [modal, setModal] =
    useState<"evidence" | "archive" | "agent" | "report" | "connect" | "reset" | "status" | null>(
      null,
    )
  const [agentState, setAgentState] = useState<AgentState>("Ready")
  const [agentLog, setAgentLog] = useState<string[]>([])
  const [connectSuspect, setConnectSuspect] = useState("S-01")
  const [connectClass, setConnectClass] = useState<Classification>("Unresolved")
  const [connectRationale, setConnectRationale] = useState("")
  const [deductionSuspect, setDeductionSuspect] = useState("")
  const [deductionText, setDeductionText] = useState("")
  const [deductionError, setDeductionError] = useState("")
  const [confirmDeduction, setConfirmDeduction] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }, [persisted])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const selectedEvidence =
    evidence.find((item) => item.id === selectedEvidenceId) || null
  const selectedSuspect =
    suspects.find((item) => item.id === selectedSuspectId) || suspects[0]
  const deductionChoice = suspects.find((item) => item.id === deductionSuspect)

  const setStatus = (status: CaseStatus) =>
    setPersisted((current) => ({ ...current, status }))

  const beginInvestigation = () => {
    if (persisted.status === "OPEN") setStatus("IN PROGRESS")
  }

  const navigate = (next: Screen, suspectId?: string) => {
    beginInvestigation()
    if (suspectId) setSelectedSuspectId(suspectId)
    setScreen(next)
    setModal(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const inspectEvidence = (id: string) => {
    beginInvestigation()
    setSelectedEvidenceId(id)
    setModal("evidence")
  }

  const openConnect = (evidenceId?: string, suspectId?: string) => {
    if (evidenceId) setSelectedEvidenceId(evidenceId)
    if (suspectId) setConnectSuspect(suspectId)
    else if (selectedSuspectId) setConnectSuspect(selectedSuspectId)
    setConnectRationale("")
    setConnectClass("Unresolved")
    setModal("connect")
  }

  const addConnection = () => {
    if (!selectedEvidenceId || !connectRationale.trim()) return
    const duplicate = persisted.connections.some(
      (connection) =>
        connection.evidenceId === selectedEvidenceId &&
        connection.suspectId === connectSuspect,
    )
    if (duplicate) {
      setToast("That evidence–suspect connection already exists.")
      return
    }
    const connection: Connection = {
      id: `user-${selectedEvidenceId}-${connectSuspect}`,
      evidenceId: selectedEvidenceId,
      suspectId: connectSuspect,
      rationale: connectRationale.trim(),
      classification: connectClass,
      source: "USER CONFIRMED",
    }
    setPersisted((current) => ({
      ...current,
      status: current.status === "OPEN" ? "IN PROGRESS" : current.status,
      connections: [...current.connections, connection],
    }))
    setModal(null)
    setToast("Connection pinned to the case board.")
  }

  const updateConnection = (id: string) => {
    setPersisted((current) => ({
      ...current,
      connections: current.connections.map((connection) =>
        connection.id === id
          ? {
              ...connection,
              classification:
                connection.classification === "Supporting"
                  ? "Contradictory"
                  : connection.classification === "Contradictory"
                    ? "Unresolved"
                    : "Supporting",
              source: "USER CONFIRMED",
            }
          : connection,
      ),
    }))
  }

  const removeConnection = (id: string) => {
    setPersisted((current) => ({
      ...current,
      connections: current.connections.filter(
        (connection) => connection.id !== id,
      ),
    }))
    setToast("Connection removed.")
  }

  const runInvestigation = () => {
    beginInvestigation()
    setModal("agent")
    setAgentState("Investigating")
    setAgentLog([])
    const steps = [
      "inspect_evidence: loaded E-01 through E-06",
      "compare_timeline: isolated the 9:10–9:20 PM critical window",
      "inspect_suspect: retrieved five alibis and access claims",
      "list_connections: compared user and suggested associations",
      "propose_connection: evaluated E-02 and E-03 against S-01",
      "prepare_investigation_report: assembled grounded findings",
    ]
    steps.forEach((step, index) => {
      window.setTimeout(
        () => setAgentLog((current) => [...current, step]),
        450 * (index + 1),
      )
    })
    window.setTimeout(
      () => {
        const report: Report = {
          question:
            "Whose account conflicts most directly with the verified theft timeline?",
          facts: [
            "The display opened without force at 9:13 PM (E-01).",
            "Thomas Grey received the spare key at 8:55 PM (E-02).",
            "Grey was absent from the kitchen from 9:10–9:20 PM (E-03).",
          ],
          supporting: ["E-01", "E-02", "E-03"],
          contradictory: ["E-04", "E-05", "E-06"],
          timeline: [
            "8:55 PM — Grey signs for spare key (E-02).",
            "9:10–9:20 PM — Grey absent from claimed location (E-03).",
            "9:13 PM — Display case opens (E-01).",
            "9:12/9:14 PM — Reed and Vale photographed elsewhere (E-04, E-05).",
          ],
          comparisons: [
            "Grey: access plus an alibi contradiction overlaps the opening.",
            "Sen: suspicious instrument, but no recorded access or timeline contradiction.",
            "Finch: footprint comparison weakens the initial theory.",
            "Reed and Vale: access or method questions remain, while photographs support their alibis.",
          ],
          unresolved: [
            "Who returned or retained the spare key after 9:13 PM?",
            "How did Dr. Sen's instrument reach the corridor?",
            "Who made the unmatched work-boot print?",
          ],
          nextAction:
            "Confirm E-02 and E-03 as connections to Thomas Grey, then question him about the unlogged key return.",
          conclusion:
            "The strongest current explanation is Thomas Grey: E-02 establishes access and E-03 directly contradicts his alibi during E-01's critical minute. This is a reasoned lead, not an automatic verdict.",
          mode: "DEMO MODE",
        }
        const proposals: Connection[] = [
          {
            id: "ai-e02-s01",
            evidenceId: "E-02",
            suspectId: "S-01",
            rationale:
              "Grey received the spare key before the case was opened.",
            classification: "Unresolved",
            source: "AI SUGGESTED",
          },
          {
            id: "ai-e03-s01",
            evidenceId: "E-03",
            suspectId: "S-01",
            rationale:
              "The ledger conflicts with Grey's kitchen alibi during the critical window.",
            classification: "Contradictory",
            source: "AI SUGGESTED",
          },
        ]
        setPersisted((current) => ({
          ...current,
          status: current.status === "OPEN" ? "IN PROGRESS" : current.status,
          report,
          connections: [
            ...current.connections,
            ...proposals.filter(
              (proposal) =>
                !current.connections.some(
                  (connection) =>
                    connection.evidenceId === proposal.evidenceId &&
                    connection.suspectId === proposal.suspectId,
                ),
            ),
          ],
        }))
        setAgentState("Complete")
      },
      450 * (steps.length + 1),
    )
  }

  const confirmSuggested = (id: string) => {
    setPersisted((current) => ({
      ...current,
      connections: current.connections.map((connection) =>
        connection.id === id
          ? { ...connection, source: "USER CONFIRMED" }
          : connection,
      ),
    }))
    setToast("AI suggestion confirmed by investigator.")
  }

  const submitDeduction = () => {
    if (!deductionSuspect) {
      setDeductionError("Select a suspect before proceeding.")
      return
    }
    if (!deductionText.trim()) {
      setDeductionError("Record your reasoning before proceeding.")
      return
    }
    setDeductionError("")
    setConfirmDeduction(true)
  }

  const finalizeDeduction = () => {
    setPersisted((current) => ({
      ...current,
      status: "SOLVED",
      deduction: {
        suspectId: deductionSuspect,
        explanation: deductionText.trim(),
      },
    }))
    setConfirmDeduction(false)
    setToast("Case file sealed. Deduction recorded.")
  }

  const resetCase = () => {
    localStorage.removeItem(STORAGE_KEY)
    setPersisted(defaultState)
    setScreen("board")
    setSelectedEvidenceId(null)
    setSelectedSuspectId("S-01")
    setDeductionSuspect("")
    setDeductionText("")
    setAgentState("Ready")
    setAgentLog([])
    setModal(null)
    setToast("CASE-047 restored to its original state.")
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <TopBar
        status={persisted.status}
        screen={screen}
        agentState={agentState}
        onNavigate={navigate}
        onArchive={() => setModal("archive")}
        onReset={() => setModal("reset")}
        onStatus={() => setModal("status")}
      />

      <main>
        {screen === "board" && (
          <BoardScreen
            status={persisted.status}
            connections={persisted.connections}
            selectedEvidenceId={selectedEvidenceId}
            onInspect={inspectEvidence}
            onSuspect={(id) => navigate("profile", id)}
            onConnect={(id) => {
              setSelectedEvidenceId(id)
              setToast("Clue selected. Choose a suspect portrait.")
            }}
            onSuspectConnect={(id) => {
              if (!selectedEvidenceId) {
                setToast("Select an evidence card first.")
                return
              }
              openConnect(selectedEvidenceId, id)
            }}
            onAnalyse={runInvestigation}
            onReport={() => setModal(persisted.report ? "report" : "agent")}
            onDeduction={() => navigate("deduction")}
          />
        )}
        {screen === "profile" && (
          <ProfileScreen
            suspect={selectedSuspect}
            connections={persisted.connections.filter(
              (connection) => connection.suspectId === selectedSuspect.id,
            )}
            report={persisted.report}
            notes={persisted.notes[selectedSuspect.id] || ""}
            onNote={(value) =>
              setPersisted((current) => ({
                ...current,
                notes: { ...current.notes, [selectedSuspect.id]: value },
              }))
            }
            onInspect={inspectEvidence}
            onConnect={() => openConnect(undefined, selectedSuspect.id)}
            onAgent={runInvestigation}
            onBack={() => navigate("board")}
            onChangeSuspect={setSelectedSuspectId}
            onRemove={removeConnection}
            onUpdate={updateConnection}
          />
        )}
        {screen === "deduction" && (
          <DeductionScreen
            selectedId={deductionSuspect}
            onSelect={(id) => {
              setDeductionSuspect(id)
              setDeductionError("")
            }}
            choice={deductionChoice}
            connections={persisted.connections}
            explanation={deductionText}
            onExplanation={setDeductionText}
            error={deductionError}
            onSubmit={submitDeduction}
            deduction={persisted.deduction}
            onReset={() => setModal("reset")}
            onBack={() => navigate("board")}
          />
        )}
      </main>

      {modal === "evidence" && selectedEvidence && (
        <EvidenceModal
          item={selectedEvidence}
          connections={persisted.connections.filter(
            (connection) => connection.evidenceId === selectedEvidence.id,
          )}
          onClose={() => setModal(null)}
          onConnect={() => openConnect(selectedEvidence.id)}
          onViewSuspect={(id) => navigate("profile", id)}
          onRemove={removeConnection}
          onUpdate={updateConnection}
        />
      )}
      {modal === "archive" && (
        <ArchiveModal
          onClose={() => setModal(null)}
          onInspect={inspectEvidence}
        />
      )}
      {modal === "connect" && (
        <ConnectModal
          evidenceId={selectedEvidenceId}
          suspectId={connectSuspect}
          classification={connectClass}
          rationale={connectRationale}
          onEvidence={setSelectedEvidenceId}
          onSuspect={setConnectSuspect}
          onClassification={setConnectClass}
          onRationale={setConnectRationale}
          onAdd={addConnection}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "agent" && (
        <AgentModal
          state={agentState}
          logs={agentLog}
          report={persisted.report}
          onRun={runInvestigation}
          onReport={() => setModal("report")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "report" && persisted.report && (
        <ReportModal
          report={persisted.report}
          connections={persisted.connections}
          onConfirm={confirmSuggested}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "reset" && (
        <ConfirmModal
          eyebrow="RESET INVESTIGATION"
          title="Return CASE-047 to its sealed state?"
          body="All notes, connections, reports, and deductions saved for this case will be removed. Unrelated browser data is not affected."
          confirmLabel="RESET CASE"
          onConfirm={resetCase}
          onClose={() => setModal(null)}
          danger
        />
      )}
      {modal === "status" && (
        <StatusModal
          status={persisted.status}
          onChange={(status) => {
            if (persisted.status === "SOLVED" || status === "SOLVED") {
              if (!window.confirm("Change the sealed status of this case?"))
                return
            }
            setStatus(status)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDeduction && deductionChoice && (
        <ConfirmModal
          eyebrow="FINAL DEDUCTION"
          title={`Name ${deductionChoice.name} in the sealed case file?`}
          body="This action closes the investigation and compares your hypothesis with the seeded case outcome."
          confirmLabel="SEAL MY DEDUCTION"
          onConfirm={finalizeDeduction}
          onClose={() => setConfirmDeduction(false)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function TopBar({
  status,
  screen,
  agentState,
  onNavigate,
  onArchive,
  onReset,
  onStatus,
}: {
  status: CaseStatus
  screen: Screen
  agentState: AgentState
  onNavigate: (screen: Screen) => void
  onArchive: () => void
  onReset: () => void
  onStatus: () => void
}) {
  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={() => onNavigate("board")}
        aria-label="Return to case board"
      >
        <span className="brand-seal">221B</span>
        <span>
          <strong>THE CASE ROOM</strong>
          <small>EVERY CLUE LEAVES A TRAIL</small>
        </span>
      </button>
      <div className="case-heading">
        <span>CASE 047</span>
        <strong>THE MISSING SAPPHIRE</strong>
      </div>
      <nav className="nav-tabs" aria-label="Case navigation">
        <button
          className={screen === "board" ? "active" : ""}
          onClick={() => onNavigate("board")}
        >
          CASE BOARD
        </button>
        <button
          className={screen === "profile" ? "active" : ""}
          onClick={() => onNavigate("profile")}
        >
          SUSPECTS
        </button>
        <button onClick={onArchive}>EVIDENCE</button>
        <button
          className={screen === "deduction" ? "active" : ""}
          onClick={() => onNavigate("deduction")}
        >
          DEDUCTION
        </button>
      </nav>
      <div className="top-actions">
        <div className="agent-pill">
          <i className={agentState === "Investigating" ? "pulse" : ""} /> HOLMES
          · {agentState.toUpperCase()}
        </div>
        <button
          className={`status status-${status.replace(" ", "-").toLowerCase()}`}
          onClick={onStatus}
        >
          {status}
        </button>
        <button
          className="icon-button"
          onClick={onReset}
          aria-label="Reset demonstration"
        >
          <Icon name="reset" />
        </button>
      </div>
    </header>
  )
}

function BoardScreen({
  status,
  connections,
  selectedEvidenceId,
  onInspect,
  onSuspect,
  onConnect,
  onSuspectConnect,
  onAnalyse,
  onReport,
  onDeduction,
}: {
  status: CaseStatus
  connections: Connection[]
  selectedEvidenceId: string | null
  onInspect: (id: string) => void
  onSuspect: (id: string) => void
  onConnect: (id: string) => void
  onSuspectConnect: (id: string) => void
  onAnalyse: () => void
  onReport: () => void
  onDeduction: () => void
}) {
  const coordinates: Record<string, [number, number]> = {
    "E-01": [18, 22],
    "E-02": [44, 19],
    "E-03": [72, 22],
    "E-04": [24, 56],
    "E-05": [51, 53],
    "E-06": [77, 57],
    "S-01": [10, 88],
    "S-02": [30, 88],
    "S-03": [50, 88],
    "S-04": [70, 88],
    "S-05": [90, 88],
  }
  return (
    <div className="board-screen">
      <section className="room-hero">
        <div className="rain-window">
          <div className="rain" />
          <div className="city-lights" />
        </div>
        <div className="wall-lamp">
          <span />
        </div>
        <div className="room-copy">
          <div className="eyebrow">
            BAKER STREET · LONDON · 17 NOVEMBER 1898
          </div>
          <div className="display-title">
            Every clue tells a story.
            <br />
            <em>Every alibi leaves a trail.</em>
          </div>
          <p>
            A sapphire vanished at 9:13 PM. Five accounts survive. One does not.
          </p>
        </div>
        <div className="board-frame">
          <div className="board-plaque">INVESTIGATION WALL · CASE 047</div>
          <div className="cork-board">
            <svg
              className="connection-layer"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label={`${connections.length} active evidence connections`}
            >
              {connections.map((connection) => {
                const from = coordinates[connection.evidenceId]
                const to = coordinates[connection.suspectId]
                if (!from || !to) return null
                return (
                  <line
                    key={connection.id}
                    x1={from[0]}
                    y1={from[1]}
                    x2={to[0]}
                    y2={to[1]}
                    className={`line-${connection.classification.toLowerCase()} ${
                      connection.source === "AI SUGGESTED" ? "line-ai" : ""
                    }`}
                  />
                )
              })}
            </svg>
            <div className="evidence-grid">
              {evidence.map((item, index) => (
                <article
                  key={item.id}
                  className={`evidence-card evidence-${index + 1} ${
                    selectedEvidenceId === item.id ? "selected" : ""
                  }`}
                >
                  <div className="brass-pin" />
                  <button
                    className="evidence-main"
                    onClick={() => onInspect(item.id)}
                    aria-label={`Inspect ${item.id}: ${item.title}`}
                  >
                    <div className="paper-heading">
                      <span>{item.id}</span>
                      <StateTag state={item.state} />
                    </div>
                    <div className="evidence-visual">
                      <b>{item.glyph}</b>
                      <small>{item.category}</small>
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    {item.time && <time>{item.time}</time>}
                  </button>
                  <button
                    className="pin-action"
                    onClick={() => onConnect(item.id)}
                  >
                    <Icon name="link" /> CONNECT CLUE
                  </button>
                </article>
              ))}
            </div>
            <div className="suspect-strip">
              {suspects.map((suspect) => (
                <article key={suspect.id} className="suspect-pin">
                  <button
                    onClick={() =>
                      selectedEvidenceId
                        ? onSuspectConnect(suspect.id)
                        : onSuspect(suspect.id)
                    }
                    aria-label={`View ${suspect.name}`}
                  >
                    <Portrait suspect={suspect} />
                    <span className="suspect-label">
                      <strong>{suspect.name}</strong>
                      <small>{suspect.role}</small>
                    </span>
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
        <div className="desk-edge">
          <div className="desk-paper">
            <span>9:13</span>
            <small>THE CRITICAL MINUTE</small>
          </div>
          <div className="magnifier" />
          <div className="inkwell" />
        </div>
      </section>

      <section className="case-console">
        <div className="console-intro">
          <div className="eyebrow">ACTIVE INVESTIGATION</div>
          <div className="section-title">Follow the thread.</div>
          <p>
            Select an evidence card, then choose a suspect portrait to make a
            connection. Dashed threads are Holmes suggestions awaiting your
            judgment.
          </p>
        </div>
        <div className="case-metrics">
          <div>
            <strong>{evidence.length}</strong>
            <span>EVIDENCE ITEMS</span>
          </div>
          <div>
            <strong>{suspects.length}</strong>
            <span>PERSONS OF INTEREST</span>
          </div>
          <div>
            <strong>{connections.length}</strong>
            <span>ACTIVE CONNECTIONS</span>
          </div>
          <div>
            <strong>
              {
                connections.filter((item) => item.source === "USER CONFIRMED")
                  .length
              }
            </strong>
            <span>CONFIRMED BY YOU</span>
          </div>
        </div>
        <div className="console-actions">
          <Button onClick={onAnalyse}>
            <Icon name="brain" /> ANALYSE EVIDENCE
          </Button>
          <Button variant="paper" onClick={onReport}>
            <Icon name="file" /> VIEW INVESTIGATION REPORT
          </Button>
          <Button variant="ghost" onClick={onDeduction}>
            MAKE YOUR DEDUCTION <Icon name="arrow" />
          </Button>
        </div>
        {status === "OPEN" && (
          <div className="start-note">
            The first inspection will change this case from OPEN to IN PROGRESS.
          </div>
        )}
      </section>
    </div>
  )
}

function ProfileScreen({
  suspect,
  connections,
  report,
  notes,
  onNote,
  onInspect,
  onConnect,
  onAgent,
  onBack,
  onChangeSuspect,
  onRemove,
  onUpdate,
}: {
  suspect: Suspect
  connections: Connection[]
  report: Report | null
  notes: string
  onNote: (value: string) => void
  onInspect: (id: string) => void
  onConnect: () => void
  onAgent: () => void
  onBack: () => void
  onChangeSuspect: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string) => void
}) {
  const relatedIds = Array.from(
    new Set([
      ...suspect.supporting,
      ...suspect.contradictory,
      ...evidence
        .filter((item) => item.related.includes(suspect.id))
        .map((item) => item.id),
      ...connections.map((item) => item.evidenceId),
    ]),
  )
  return (
    <div className="profile-screen">
      <div className="profile-rail">
        <div className="eyebrow">PERSONS OF INTEREST</div>
        {suspects.map((item) => (
          <button
            key={item.id}
            className={item.id === suspect.id ? "active" : ""}
            onClick={() => onChangeSuspect(item.id)}
          >
            <Portrait suspect={item} />
            <span>
              <strong>{item.name}</strong>
              <small>{item.role}</small>
            </span>
          </button>
        ))}
        <Button variant="ghost" onClick={onBack}>
          ← RETURN TO BOARD
        </Button>
      </div>
      <section className="dossier">
        <div className="dossier-portrait">
          <div className="brass-pin" />
          <Portrait suspect={suspect} large />
          <div className="typewritten">
            SUBJECT {suspect.id}
            <br />
            STATUS: PERSON OF INTEREST
          </div>
        </div>
        <div className="dossier-content">
          <div className="eyebrow">CONFIDENTIAL DOSSIER · {suspect.id}</div>
          <div className="display-title profile-name">{suspect.name}</div>
          <div className="profile-role">{suspect.role}</div>
          <p className="lead">{suspect.summary}</p>
          <div className="fact-grid">
            <div className="fact-block wide">
              <span className="fact-label verified">
                VERIFIED FACT / STATED ALIBI
              </span>
              <p>{suspect.alibi}</p>
            </div>
            <div className="fact-block">
              <span className="fact-label">LAST KNOWN LOCATION</span>
              <p>{suspect.location}</p>
            </div>
            <div className="fact-block">
              <span className="fact-label contradiction">UNCONFIRMED LEAD</span>
              <p>{suspect.clue}</p>
            </div>
          </div>
          <div className="dossier-columns">
            <div>
              <div className="section-kicker">RELATED CASE MATERIAL</div>
              <div className="related-list">
                {relatedIds.length ? (
                  relatedIds.map((id) => {
                    const item = evidence.find((entry) => entry.id === id)!
                    return (
                      <button key={id} onClick={() => onInspect(id)}>
                        <span>{id}</span>
                        <strong>{item.title}</strong>
                        <Icon name="arrow" />
                      </button>
                    )
                  })
                ) : (
                  <p className="empty">
                    No case-board evidence has been linked yet.
                  </p>
                )}
              </div>
            </div>
            <div>
              <div className="section-kicker">AI-GENERATED ASSESSMENT</div>
              <div className="ai-assessment">
                <span>
                  HOLMES INTELLIGENCE ·{" "}
                  {report ? "REPORT AVAILABLE" : "AWAITING ANALYSIS"}
                </span>
                <p>
                  {report
                    ? assessmentFor(suspect.id)
                    : "Run a grounded comparison of alibis, timestamps, and existing connections. No assessment has been generated yet."}
                </p>
              </div>
            </div>
          </div>
          <div className="connection-ledger">
            <div className="section-kicker">CURRENT CONNECTION MAP</div>
            {connections.length ? (
              connections.map((connection) => (
                <div className="connection-row" key={connection.id}>
                  <span
                    className={`connection-dot dot-${connection.classification.toLowerCase()}`}
                  />
                  <strong>{connection.evidenceId}</strong>
                  <p>{connection.rationale}</p>
                  <small>
                    {connection.classification} · {connection.source}
                  </small>
                  <button onClick={() => onUpdate(connection.id)}>
                    CYCLE CLASS
                  </button>
                  <button onClick={() => onRemove(connection.id)}>
                    REMOVE
                  </button>
                </div>
              ))
            ) : (
              <p className="empty">
                No active connections. Link a clue to begin.
              </p>
            )}
          </div>
          <label className="notes-field">
            <span className="section-kicker">
              INVESTIGATOR NOTES · SAVED LOCALLY
            </span>
            <textarea
              value={notes}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Record observations without treating inference as fact…"
            />
          </label>
          <div className="dossier-actions">
            <Button
              variant="paper"
              onClick={() => relatedIds[0] && onInspect(relatedIds[0])}
              disabled={!relatedIds.length}
            >
              <Icon name="search" /> INSPECT RELATED CLUES
            </Button>
            <Button onClick={onConnect}>
              <Icon name="link" /> CONNECT EVIDENCE
            </Button>
            <Button variant="ghost" onClick={onAgent}>
              <Icon name="brain" /> ASK HOLMES TO INVESTIGATE
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function assessmentFor(id: string) {
  const text: Record<string, string> = {
    "S-01":
      "E-02 establishes access at 8:55 PM, while E-03 contradicts Grey's stated kitchen alibi during E-01's 9:13 PM opening. These combined facts make him the strongest current lead, not a proven culprit.",
    "S-02":
      "The instrument is a relevant lead, but no seeded evidence record establishes Sen's presence at the display at 9:13 PM. Expertise alone is not evidence of theft.",
    "S-03":
      "E-06 weakens the initial footprint association because the tread does not match Finch's shoes. Her precise location remains incompletely verified.",
    "S-04":
      "E-04 supports Reed's stage alibi at 9:12 PM. His wire raises a method question but does not overcome the time-stamped photograph.",
    "S-05":
      "Vale had access, but E-05 supports her ballroom presence at 9:14 PM. Access alone does not establish that she opened the case.",
  }
  return text[id]
}

function DeductionScreen({
  selectedId,
  onSelect,
  choice,
  connections,
  explanation,
  onExplanation,
  error,
  onSubmit,
  deduction,
  onReset,
  onBack,
}: {
  selectedId: string
  onSelect: (id: string) => void
  choice?: Suspect
  connections: Connection[]
  explanation: string
  onExplanation: (value: string) => void
  error: string
  onSubmit: () => void
  deduction: PersistedState["deduction"]
  onReset: () => void
  onBack: () => void
}) {
  if (deduction) {
    const result = suspects.find((item) => item.id === deduction.suspectId)!
    const correct = result.id === "S-01"
    return (
      <div className="resolution-screen">
        <div className="resolution-glow" />
        <div className="resolution-card">
          <div className="eyebrow">CASE 047 · FILE SEALED</div>
          <div className="resolution-mark">
            {correct ? "CASE SOLVED" : "HYPOTHESIS REVIEWED"}
          </div>
          <Portrait suspect={result} large />
          <div className="display-title">{result.name}</div>
          <div className="profile-role">{result.role}</div>
          <p className="resolution-verdict">
            {correct
              ? "Your deduction matches the seeded case outcome."
              : "Your deduction does not match the seeded case outcome: Thomas Grey is the strongest supported explanation."}
          </p>
          <div className="resolution-reason">
            <div className="section-kicker">THE DETAIL THAT DID NOT FIT</div>
            <p>
              E-02 places the spare key in Grey's custody at 8:55 PM. E-03
              records his absence from the kitchen between 9:10 and 9:20 PM,
              directly conflicting with his alibi and overlapping E-01's 9:13 PM
              opening. E-04 and E-05 support alternative alibis; E-06 weakens
              the case against Finch.
            </p>
          </div>
          <div className="your-statement">
            <span>YOUR SEALED STATEMENT</span>
            <p>“{deduction.explanation}”</p>
          </div>
          <div className="confidence-note">
            EVIDENTIARY BASIS: 2 directly convergent records + 1 scene record.
            This is an explainable case assessment, not a scientific probability
            of guilt.
          </div>
          <div className="resolution-actions">
            <Button onClick={onReset}>
              <Icon name="reset" /> NEW INVESTIGATION / RESET CASE
            </Button>
            <Button variant="ghost" onClick={onBack}>
              REVIEW CASE BOARD
            </Button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="deduction-screen">
      <div className="deduction-header">
        <div className="eyebrow">CASE 047 · YOUR JUDGMENT</div>
        <div className="display-title">The Final Deduction</div>
        <p>“One detail does not fit. Find it.”</p>
      </div>
      <div className="deduction-suspects">
        {suspects.map((suspect) => (
          <button
            key={suspect.id}
            className={selectedId === suspect.id ? "selected" : ""}
            onClick={() => onSelect(suspect.id)}
          >
            <Portrait suspect={suspect} />
            <span>
              <strong>{suspect.name}</strong>
              <small>{suspect.role}</small>
            </span>
            <i>{selectedId === suspect.id ? "SELECTED" : "REVIEW DOSSIER"}</i>
          </button>
        ))}
      </div>
      <div className="deduction-workspace">
        <div className="theory-panel">
          <div className="section-kicker">EVIDENCE TEST</div>
          {choice ? (
            <>
              <div className="theory-name">
                {choice.name}
                <span>{choice.role}</span>
              </div>
              <div className="theory-block">
                <b>STRONGEST BASIS FOR SUSPICION</b>
                <p>{choice.clue}</p>
              </div>
              <div className="theory-block">
                <b>EVIDENCE THAT CHALLENGES THE THEORY</b>
                <p>
                  {choice.supporting.length
                    ? choice.supporting
                        .map(
                          (id) =>
                            `${id}: ${evidence.find((item) => item.id === id)?.title}`,
                        )
                        .join(" · ")
                    : "No seeded record directly clears this suspect; absence of exculpatory evidence is not proof."}
                </p>
              </div>
              <div className="theory-block">
                <b>RELEVANT TIMESTAMPS</b>
                <p>
                  {connections
                    .filter((item) => item.suspectId === choice.id)
                    .map((item) => item.evidenceId)
                    .join(", ") || "No board connections yet."}
                </p>
              </div>
              <div className="connection-chips">
                {connections
                  .filter((item) => item.suspectId === choice.id)
                  .map((item) => (
                    <span
                      key={item.id}
                      className={
                        item.source === "AI SUGGESTED" ? "suggested" : ""
                      }
                    >
                      {item.evidenceId} · {item.classification} · {item.source}
                    </span>
                  ))}
              </div>
            </>
          ) : (
            <p className="empty large">
              Select a portrait to test your theory against the case record. The
              intended outcome remains concealed until submission.
            </p>
          )}
        </div>
        <div className="statement-panel">
          <div className="section-kicker">YOUR SEALED STATEMENT</div>
          <label>
            <span>Explain which evidence led to your conclusion.</span>
            <textarea
              value={explanation}
              onChange={(event) => onExplanation(event.target.value)}
              placeholder="I believe the evidence points to… because E-…"
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <Button onClick={onSubmit} className="submit-deduction">
            SUBMIT FINAL DEDUCTION <Icon name="arrow" />
          </Button>
          <button className="text-link" onClick={onBack}>
            Return to the evidence board
          </button>
        </div>
      </div>
    </div>
  )
}

function EvidenceModal({
  item,
  connections,
  onClose,
  onConnect,
  onViewSuspect,
  onRemove,
  onUpdate,
}: {
  item: Evidence
  connections: Connection[]
  onClose: () => void
  onConnect: () => void
  onViewSuspect: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string) => void
}) {
  return (
    <ModalShell onClose={onClose} className="evidence-modal">
      <div className="inspection-visual">
        <div className="inspection-glyph">{item.glyph}</div>
        <span>{item.category}</span>
        <strong>{item.id}</strong>
      </div>
      <div className="inspection-content">
        <div className="eyebrow">EVIDENCE INSPECTION · {item.id}</div>
        <div className="modal-title">{item.title}</div>
        <StateTag state={item.state} />
        <p className="lead">{item.description}</p>
        <div className="inspection-grid">
          <div>
            <span>TIMELINE RELEVANCE</span>
            <p>{item.time || "No fixed timestamp established"}</p>
          </div>
          <div>
            <span>VERIFICATION STATE</span>
            <p>{item.state}</p>
          </div>
          <div className="wide">
            <span>INVESTIGATOR NOTE</span>
            <p>{item.notes}</p>
          </div>
        </div>
        <div className="section-kicker">CONNECTED SUSPECTS</div>
        <div className="connected-people">
          {connections.length ? (
            connections.map((connection) => {
              const suspect = suspects.find(
                (entry) => entry.id === connection.suspectId,
              )!
              return (
                <div key={connection.id}>
                  <Portrait suspect={suspect} />
                  <button onClick={() => onViewSuspect(suspect.id)}>
                    <strong>{suspect.name}</strong>
                    <small>
                      {connection.classification} · {connection.source}
                    </small>
                  </button>
                  <p>{connection.rationale}</p>
                  <button
                    className="mini-action"
                    onClick={() => onUpdate(connection.id)}
                  >
                    UPDATE
                  </button>
                  <button
                    className="mini-action"
                    onClick={() => onRemove(connection.id)}
                  >
                    REMOVE
                  </button>
                </div>
              )
            })
          ) : (
            <p className="empty">No connections pinned yet.</p>
          )}
        </div>
        <div className="modal-actions">
          <Button onClick={onConnect}>
            <Icon name="link" /> CONNECT EVIDENCE
          </Button>
          <Button variant="ghost" onClick={onClose}>
            CLOSE INSPECTION
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function ArchiveModal({
  onClose,
  onInspect,
}: {
  onClose: () => void
  onInspect: (id: string) => void
}) {
  return (
    <ModalShell onClose={onClose} className="archive-modal">
      <div className="modal-title">Evidence Archive</div>
      <div className="eyebrow">CASE 047 · SIX CATALOGUED ITEMS</div>
      <div className="archive-list">
        {evidence.map((item) => (
          <button key={item.id} onClick={() => onInspect(item.id)}>
            <span>{item.id}</span>
            <div>
              <strong>{item.title}</strong>
              <small>
                {item.category} · {item.time || "TIME UNRESOLVED"}
              </small>
            </div>
            <StateTag state={item.state} />
            <Icon name="arrow" />
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

function ConnectModal({
  evidenceId,
  suspectId,
  classification,
  rationale,
  onEvidence,
  onSuspect,
  onClassification,
  onRationale,
  onAdd,
  onClose,
}: {
  evidenceId: string | null
  suspectId: string
  classification: Classification
  rationale: string
  onEvidence: (id: string) => void
  onSuspect: (id: string) => void
  onClassification: (value: Classification) => void
  onRationale: (value: string) => void
  onAdd: () => void
  onClose: () => void
}) {
  return (
    <ModalShell onClose={onClose} className="connect-modal">
      <div className="eyebrow">PIN A NEW THREAD</div>
      <div className="modal-title">Connect evidence to suspect</div>
      <label>
        <span>EVIDENCE</span>
        <select
          value={evidenceId || ""}
          onChange={(event) => onEvidence(event.target.value)}
        >
          <option value="" disabled>
            Select a case record…
          </option>
          {evidence.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} · {item.title}
            </option>
          ))}
        </select>
      </label>
      {evidenceId && (
        <>
          <div className="connection-origin">
            <span>{evidenceId}</span>
            <strong>
              {evidence.find((item) => item.id === evidenceId)?.title}
            </strong>
          </div>
          <label>
            <span>SUSPECT</span>
            <select
              value={suspectId}
              onChange={(event) => onSuspect(event.target.value)}
            >
              {suspects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>CLASSIFICATION</span>
            <select
              value={classification}
              onChange={(event) =>
                onClassification(event.target.value as Classification)
              }
            >
              <option>Supporting</option>
              <option>Contradictory</option>
              <option>Unresolved</option>
            </select>
          </label>
          <label>
            <span>RATIONALE</span>
            <textarea
              value={rationale}
              onChange={(event) => onRationale(event.target.value)}
              placeholder="Explain what this association supports, contradicts, or leaves unresolved…"
            />
          </label>
          <div className="modal-actions">
            <Button onClick={onAdd} disabled={!rationale.trim()}>
              PIN CONNECTION
            </Button>
            <Button variant="ghost" onClick={onClose}>
              CANCEL
            </Button>
          </div>
        </>
      )}
    </ModalShell>
  )
}

function AgentModal({
  state,
  logs,
  report,
  onRun,
  onReport,
  onClose,
}: {
  state: AgentState
  logs: string[]
  report: Report | null
  onRun: () => void
  onReport: () => void
  onClose: () => void
}) {
  return (
    <ModalShell onClose={onClose} className="agent-modal">
      <div className="agent-header">
        <div className="agent-emblem">H</div>
        <div>
          <div className="eyebrow">DETERMINISTIC INVESTIGATION ENGINE</div>
          <div className="modal-title">Holmes Intelligence</div>
        </div>
        <span className={`agent-state state-${state.toLowerCase()}`}>
          {state}
        </span>
      </div>
      <div className="mode-notice">
        <strong>DEMO MODE</strong>
        <p>
          No live model credentials are configured. This agent runs real,
          deterministic tools against the structured CASE-047 records; it does
          not represent simulated live model activity.
        </p>
      </div>
      <div className="question-block">
        <span>CURRENT INVESTIGATIVE QUESTION</span>
        <p>
          Whose account conflicts most directly with the verified theft
          timeline?
        </p>
      </div>
      <div className="activity-log">
        <div className="section-kicker">TOOL ACTIVITY</div>
        {logs.length ? (
          logs.map((log, index) => (
            <div key={`${log}-${index}`} className="log-row">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
              <code>{log}</code>
            </div>
          ))
        ) : (
          <p className="empty">No tools have run in this session.</p>
        )}
        {state === "Investigating" && (
          <div className="agent-working">Comparing grounded records…</div>
        )}
      </div>
      <div className="modal-actions">
        {state !== "Investigating" && (
          <Button onClick={onRun}>
            <Icon name="brain" />{" "}
            {report ? "RUN ANALYSIS AGAIN" : "BEGIN INVESTIGATION"}
          </Button>
        )}
        {report && (
          <Button variant="paper" onClick={onReport}>
            <Icon name="file" /> VIEW FULL REPORT
          </Button>
        )}
      </div>
    </ModalShell>
  )
}

function ReportModal({
  report,
  connections,
  onConfirm,
  onClose,
}: {
  report: Report
  connections: Connection[]
  onConfirm: (id: string) => void
  onClose: () => void
}) {
  return (
    <ModalShell onClose={onClose} className="report-modal">
      <div className="report-heading">
        <div>
          <div className="eyebrow">HOLMES INTELLIGENCE · {report.mode}</div>
          <div className="modal-title">Investigation Report</div>
        </div>
        <span>CASE 047 / REPORT 01</span>
      </div>
      <div className="report-question">
        <span>INVESTIGATION QUESTION</span>
        <p>{report.question}</p>
      </div>
      <div className="report-grid">
        <ReportSection title="FACTS DIRECTLY SUPPORTED" items={report.facts} />
        <ReportSection title="TIMELINE FINDINGS" items={report.timeline} />
        <ReportSection title="SUSPECT COMPARISONS" items={report.comparisons} />
        <ReportSection title="UNRESOLVED QUESTIONS" items={report.unresolved} />
      </div>
      <div className="report-ids">
        <span>SUPPORTING EVIDENCE</span>
        {report.supporting.map((id) => (
          <b key={id}>{id}</b>
        ))}
        <span>CONTRADICTORY / EXCULPATORY</span>
        {report.contradictory.map((id) => (
          <b key={id}>{id}</b>
        ))}
      </div>
      <div className="report-conclusion">
        <span>REASONED CONCLUSION</span>
        <p>{report.conclusion}</p>
        <small>NEXT ACTION · {report.nextAction}</small>
      </div>
      <div className="suggestions">
        <div className="section-kicker">AI-PROPOSED CONNECTIONS</div>
        {connections
          .filter((item) => item.source === "AI SUGGESTED")
          .map((item) => (
            <div key={item.id}>
              <strong>
                {item.evidenceId} → {item.suspectId}
              </strong>
              <p>{item.rationale}</p>
              <span>{item.classification}</span>
              <Button variant="paper" onClick={() => onConfirm(item.id)}>
                CONFIRM AS INVESTIGATOR
              </Button>
            </div>
          ))}
        {!connections.some((item) => item.source === "AI SUGGESTED") && (
          <p className="empty">All suggestions have been reviewed.</p>
        )}
      </div>
    </ModalShell>
  )
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="report-section">
      <span>{title}</span>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  )
}

function StatusModal({
  status,
  onChange,
  onClose,
}: {
  status: CaseStatus
  onChange: (status: CaseStatus) => void
  onClose: () => void
}) {
  return (
    <ModalShell onClose={onClose} className="status-modal">
      <div className="eyebrow">CASE MANAGEMENT</div>
      <div className="modal-title">Update case status</div>
      <p className="lead">
        Closing or reopening a solved case requires explicit confirmation. A
        final deduction always sets the case to SOLVED.
      </p>
      <div className="status-options">
        {(["OPEN", "IN PROGRESS", "SOLVED"] as CaseStatus[]).map((item) => (
          <button
            key={item}
            className={status === item ? "active" : ""}
            onClick={() => onChange(item)}
          >
            <i />
            <strong>{item}</strong>
            <small>
              {item === "OPEN"
                ? "Sealed evidence, no active inquiry"
                : item === "IN PROGRESS"
                  ? "Evidence is being examined"
                  : "Final deduction recorded"}
            </small>
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

function ConfirmModal({
  eyebrow,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  danger = false,
}: {
  eyebrow: string
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}) {
  return (
    <ModalShell onClose={onClose} className="confirm-modal">
      <div className="eyebrow">{eyebrow}</div>
      <div className="modal-title">{title}</div>
      <p className="lead">{body}</p>
      <div className="modal-actions">
        <Button variant={danger ? "danger" : "brass"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          CANCEL
        </Button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  children,
  onClose,
  className = "",
}: {
  children: React.ReactNode
  onClose: () => void
  className?: string
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`modal-shell ${className}`}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="x" />
        </button>
        {children}
      </section>
    </div>
  )
}

export default App
