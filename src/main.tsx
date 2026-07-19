import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FolderKanban,
  IdCard,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  UsersRound,
  WalletCards,
} from "lucide-react";
import "./styles.css";

type SheetKey = "projects" | "inventory" | "loans" | "vendors" | "cases" | "budget" | "accounts" | "personnel" | "credentials";

type SheetSettings = Record<SheetKey, string> & {
  writeEndpoint: string;
};

type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
  status: string;
  owner: string;
  startDate: string;
  endDate: string;
  budget: number;
  description: string;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  manager: string;
  quantity: number;
  borrowed: number;
  location: string;
  note: string;
};

type Loan = {
  id: string;
  purpose: string;
  borrower: string;
  status: string;
  plannedAt: string;
  borrowedAt: string;
  returnedAt: string;
  items: string;
};

type Vendor = {
  id: string;
  name: string;
  type: string;
  contact: string;
  phone: string;
  email: string;
  note: string;
};

type CaseStudy = {
  id: string;
  title: string;
  type: string;
  year: number;
  fileUrl: string;
  description: string;
};

type BudgetItem = {
  id: string;
  projectId: string;
  projectName: string;
  type: "income" | "expense";
  planned: number;
  actual: number;
  paid: boolean;
  item: string;
};

type Account = {
  id: string;
  name: string;
  email: string;
  role: "manager" | "staff";
  department: string;
  status: string;
  note: string;
};

type Personnel = {
  id: string;
  name: string;
  kind: "派遣人員" | "工讀生";
  area: string;
  manager: string;
  phone: string;
  email: string;
  status: string;
  startDate: string;
  endDate: string;
  hourlyRate: number;
  note: string;
};

type CompanyCredential = {
  id: string;
  name: string;
  url: string;
  account: string;
  password: string;
  period: string;
  manager: string;
  note: string;
};

type ResourceData = {
  projects: Project[];
  inventory: InventoryItem[];
  loans: Loan[];
  vendors: Vendor[];
  cases: CaseStudy[];
  budget: BudgetItem[];
  accounts: Account[];
  personnel: Personnel[];
  credentials: CompanyCredential[];
};

type ResourceKey = keyof ResourceData;
type ResourceRow = ResourceData[ResourceKey][number];
type EditorState = {
  key: ResourceKey;
  row: ResourceRow;
};

type FormField = {
  key: string;
  label: string;
  type?: "text" | "number" | "checkbox" | "select";
  options?: { label: string; value: string }[];
};

type SheetMutation = {
  action: "create" | "update" | "delete";
  sheet: ResourceKey;
  row: ResourceRow;
};

const statusLabels: Record<string, string> = {
  planning: "規劃中",
  in_progress: "進行中",
  on_hold: "暫停",
  completed: "已完成",
  cancelled: "已取消",
};

const loanLabels: Record<string, string> = {
  pending: "待借出",
  borrowed: "借用中",
  returned: "已歸還",
};

const demoAdmin = {
  email: "admin@impr.com.tw",
  password: "impr2026",
  name: "管理者",
};

const defaultWriteEndpoint = "https://script.google.com/macros/s/AKfycbznOGudX0_IMjU088vgWwl-lLRmQtYYd7IqMwZJz4yO36RLSjz3c6xZAjpzN0L1MhmVMA/exec";

const sheetKeys: { key: SheetKey; label: string; hint: string }[] = [
  { key: "projects", label: "專案", hint: "id, code, name, client, status, owner, startDate, endDate, budget, description" },
  { key: "inventory", label: "物資", hint: "id, name, category, manager, quantity, borrowed, location, note" },
  { key: "loans", label: "借用", hint: "id, purpose, borrower, status, plannedAt, borrowedAt, returnedAt, items" },
  { key: "vendors", label: "廠商", hint: "id, name, type, contact, phone, email, note" },
  { key: "cases", label: "案例", hint: "id, title, type, year, fileUrl, description" },
  { key: "budget", label: "預算", hint: "id, projectId, projectName, type, planned, actual, paid, item" },
  { key: "accounts", label: "帳號", hint: "id, name, email, role, department, status, note" },
  { key: "personnel", label: "派遣/工讀", hint: "id, name, kind, area, manager, phone, email, status, startDate, endDate, hourlyRate, note" },
  { key: "credentials", label: "帳密大全", hint: "id, name, url, account, password, period, manager, note" },
];

const emptySettings: SheetSettings = {
  projects: "",
  inventory: "",
  loans: "",
  vendors: "",
  cases: "",
  budget: "",
  accounts: "",
  personnel: "",
  credentials: "",
  writeEndpoint: defaultWriteEndpoint,
};

const sampleData: ResourceData = {
  projects: [
    {
      id: "p-001",
      code: "P2026-001",
      name: "企業資源網站建置",
      client: "總管理處",
      status: "in_progress",
      owner: "林怡君",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      budget: 680000,
      description: "整合專案、物資、廠商與預算追蹤。",
    },
    {
      id: "p-002",
      code: "P2026-002",
      name: "年度品牌活動",
      client: "行銷部",
      status: "planning",
      owner: "陳柏宇",
      startDate: "2026-08-05",
      endDate: "2026-11-20",
      budget: 1200000,
      description: "活動企劃、器材借用與合作廠商管理。",
    },
    {
      id: "p-003",
      code: "P2026-003",
      name: "教育訓練影片拍攝",
      client: "人資部",
      status: "completed",
      owner: "王佳玲",
      startDate: "2026-05-12",
      endDate: "2026-06-30",
      budget: 280000,
      description: "內訓課程拍攝與後製。",
    },
  ],
  inventory: [
    { id: "i-001", name: "MacBook Pro 14", category: "3C", manager: "林怡君", quantity: 4, borrowed: 1, location: "資訊櫃 A", note: "含充電器" },
    { id: "i-002", name: "Sony FX3", category: "3C", manager: "王佳玲", quantity: 2, borrowed: 1, location: "器材櫃 A", note: "含電池組" },
    { id: "i-003", name: "無線麥克風組", category: "音響", manager: "王佳玲", quantity: 6, borrowed: 2, location: "器材櫃 B", note: "Rode Wireless Pro" },
    { id: "i-004", name: "簡報投影機", category: "3C", manager: "陳柏宇", quantity: 3, borrowed: 0, location: "會議室倉庫", note: "含 HDMI 線" },
    { id: "i-005", name: "A4 影印紙", category: "文具", manager: "黃郁婷", quantity: 20, borrowed: 0, location: "行政櫃", note: "每箱 5 包" },
    { id: "i-006", name: "LED 補光燈", category: "音響", manager: "王佳玲", quantity: 8, borrowed: 3, location: "攝影棚", note: "含燈架" },
  ],
  loans: [
    { id: "l-001", purpose: "教育訓練拍攝", borrower: "王佳玲", status: "borrowed", plannedAt: "2026-07-10", borrowedAt: "2026-07-10", returnedAt: "", items: "Sony FX3 x1, 無線麥克風組 x2" },
    { id: "l-002", purpose: "新品簡報", borrower: "陳柏宇", status: "pending", plannedAt: "2026-07-18", borrowedAt: "", returnedAt: "", items: "簡報投影機 x1" },
    { id: "l-003", purpose: "品牌形象照", borrower: "林怡君", status: "returned", plannedAt: "2026-06-20", borrowedAt: "2026-06-20", returnedAt: "2026-06-22", items: "LED 補光燈 x2" },
  ],
  vendors: [
    { id: "v-001", name: "晨光影像", type: "攝影", contact: "張先生", phone: "02-2345-6789", email: "hello@example.com", note: "影片拍攝與直播支援" },
    { id: "v-002", name: "展場製作所", type: "活動工程", contact: "李小姐", phone: "02-8765-4321", email: "service@example.com", note: "舞台、背板、燈光" },
    { id: "v-003", name: "雲端資訊顧問", type: "系統", contact: "黃顧問", phone: "03-222-7788", email: "it@example.com", note: "Google Workspace 與網站部署" },
  ],
  cases: [
    { id: "c-001", title: "2025 年度品牌活動結案", type: "活動企劃", year: 2025, fileUrl: "", description: "可參考議程、預算與供應商組合。" },
    { id: "c-002", title: "教育訓練影片範本", type: "影像製作", year: 2026, fileUrl: "", description: "含拍攝清單、腳本與交付格式。" },
  ],
  budget: [
    { id: "b-001", projectId: "p-001", projectName: "企業資源網站建置", type: "expense", planned: 220000, actual: 180000, paid: true, item: "前端與資料串接" },
    { id: "b-002", projectId: "p-001", projectName: "企業資源網站建置", type: "expense", planned: 80000, actual: 45000, paid: false, item: "導入訓練" },
    { id: "b-003", projectId: "p-002", projectName: "年度品牌活動", type: "income", planned: 1500000, actual: 0, paid: false, item: "活動預算撥款" },
    { id: "b-004", projectId: "p-002", projectName: "年度品牌活動", type: "expense", planned: 520000, actual: 120000, paid: true, item: "場地與工程訂金" },
  ],
  accounts: [
    { id: "u-001", name: "林怡君", email: "manager01@impr.com.tw", role: "manager", department: "總管理處", status: "啟用", note: "系統管理者" },
    { id: "u-002", name: "王佳玲", email: "staff01@impr.com.tw", role: "staff", department: "影像部", status: "啟用", note: "物資借用與案例上傳" },
    { id: "u-003", name: "陳柏宇", email: "staff02@impr.com.tw", role: "staff", department: "行銷部", status: "啟用", note: "專案與廠商維護" },
    { id: "u-004", name: "黃郁婷", email: "admin@impr.com.tw", role: "manager", department: "行政部", status: "啟用", note: "文具與行政物資管理者" },
  ],
  personnel: [
    { id: "pt-001", name: "張育瑄", kind: "工讀生", area: "台北", manager: "黃郁婷", phone: "0912-345-678", email: "pt01@impr.com.tw", status: "排班中", startDate: "2026-07-01", endDate: "2026-09-30", hourlyRate: 190, note: "文具盤點、資料建檔" },
    { id: "pt-002", name: "劉冠廷", kind: "工讀生", area: "新北", manager: "陳柏宇", phone: "0922-555-816", email: "pt02@impr.com.tw", status: "待排班", startDate: "2026-07-15", endDate: "2026-08-31", hourlyRate: 200, note: "活動支援與報到協助" },
    { id: "dispatch-001", name: "宏展人力派遣", kind: "派遣人員", area: "桃園", manager: "林怡君", phone: "02-2222-8899", email: "dispatch@example.com", status: "合約中", startDate: "2026-07-01", endDate: "2026-12-31", hourlyRate: 320, note: "大型活動現場支援" },
  ],
  credentials: [
    { id: "cred-001", name: "GitHub", url: "https://github.com/imprjoseph/resource", account: "imprjoseph", password: "請改填正式密碼", period: "長期", manager: "林怡君", note: "資源管理網站 repo" },
    { id: "cred-002", name: "Google Sheet", url: "https://drive.google.com/", account: "admin@impr.com.tw", password: "請改填正式密碼", period: "2026", manager: "黃郁婷", note: "資料表與雲端資料夾" },
  ],
};

const editorLabels: Record<ResourceKey, string> = {
  projects: "專案",
  inventory: "物資",
  loans: "借用",
  vendors: "廠商",
  cases: "案例",
  budget: "預算",
  accounts: "帳號",
  personnel: "派遣/工讀",
  credentials: "帳密大全",
};

const editorFields: Record<ResourceKey, FormField[]> = {
  projects: [
    { key: "code", label: "專案代號" },
    { key: "name", label: "專案名稱" },
    { key: "client", label: "客戶/單位" },
    { key: "status", label: "狀態", type: "select", options: statusOptions() },
    { key: "owner", label: "負責人" },
    { key: "startDate", label: "開始日期" },
    { key: "endDate", label: "結束日期" },
    { key: "budget", label: "預算", type: "number" },
    { key: "description", label: "說明" },
  ],
  inventory: [
    { key: "name", label: "名稱" },
    { key: "category", label: "類別" },
    { key: "manager", label: "管理者" },
    { key: "quantity", label: "總量", type: "number" },
    { key: "borrowed", label: "借出", type: "number" },
    { key: "location", label: "位置" },
    { key: "note", label: "備註" },
  ],
  loans: [
    { key: "purpose", label: "用途" },
    { key: "borrower", label: "借用人" },
    { key: "status", label: "狀態", type: "select", options: loanOptions() },
    { key: "plannedAt", label: "預計日期" },
    { key: "borrowedAt", label: "借出日期" },
    { key: "returnedAt", label: "歸還日期" },
    { key: "items", label: "項目" },
  ],
  vendors: [
    { key: "name", label: "廠商名稱" },
    { key: "type", label: "類別" },
    { key: "contact", label: "聯絡人" },
    { key: "phone", label: "電話" },
    { key: "email", label: "Email" },
    { key: "note", label: "備註" },
  ],
  cases: [
    { key: "title", label: "標題" },
    { key: "type", label: "類型" },
    { key: "year", label: "年度", type: "number" },
    { key: "fileUrl", label: "檔案網址" },
    { key: "description", label: "說明" },
  ],
  budget: [
    { key: "projectId", label: "專案 ID" },
    { key: "projectName", label: "專案" },
    { key: "type", label: "類型", type: "select", options: [{ label: "收入", value: "income" }, { label: "支出", value: "expense" }] },
    { key: "planned", label: "規劃金額", type: "number" },
    { key: "actual", label: "實際金額", type: "number" },
    { key: "paid", label: "已付款/收款", type: "checkbox" },
    { key: "item", label: "項目" },
  ],
  accounts: [
    { key: "name", label: "姓名" },
    { key: "email", label: "Email" },
    { key: "role", label: "角色", type: "select", options: [{ label: "管理者", value: "manager" }, { label: "同仁", value: "staff" }] },
    { key: "department", label: "部門" },
    { key: "status", label: "狀態" },
    { key: "note", label: "備註" },
  ],
  personnel: [
    { key: "name", label: "姓名/單位" },
    { key: "kind", label: "項目", type: "select", options: [{ label: "派遣人員", value: "派遣人員" }, { label: "工讀生", value: "工讀生" }] },
    { key: "area", label: "區域" },
    { key: "manager", label: "管理者" },
    { key: "phone", label: "電話" },
    { key: "email", label: "Email" },
    { key: "status", label: "狀態" },
    { key: "startDate", label: "開始日期" },
    { key: "endDate", label: "結束日期" },
    { key: "hourlyRate", label: "時薪/單價", type: "number" },
    { key: "note", label: "備註" },
  ],
  credentials: [
    { key: "name", label: "系統名稱" },
    { key: "url", label: "網址" },
    { key: "account", label: "帳號" },
    { key: "password", label: "密碼" },
    { key: "period", label: "期間" },
    { key: "manager", label: "管理者" },
    { key: "note", label: "備註" },
  ],
};

function App() {
  const [active, setActive] = useState("dashboard");
  const [adminName, setAdminName] = useState(() => localStorage.getItem("resource-admin-session") || "");
  const [settings, setSettings] = usePersistentSettings();
  const [data, setData] = useState<ResourceData>(sampleData);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("使用範例資料");

  async function refresh() {
    setLoading(true);
    try {
      const loaded = await loadSheetData(settings);
      const merged = mergeLocalEdits(loaded);
      setData(merged);
      setMessage(hasAnySheet(settings) ? "已載入 Google Sheet 資料，含本機編輯" : "使用範例資料，含本機編輯");
    } catch (error) {
      setData(mergeLocalEdits(sampleData));
      setMessage(error instanceof Error ? `讀取失敗，改用範例資料：${error.message}` : "讀取失敗，改用範例資料");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const summary = useMemo(() => buildSummary(data), [data]);
  const filtered = useMemo(() => filterData(data, query), [data, query]);

  function handleLogin(email: string, password: string) {
    if (email.trim().toLowerCase() === demoAdmin.email && password === demoAdmin.password) {
      setAdminName(demoAdmin.name);
      localStorage.setItem("resource-admin-session", demoAdmin.name);
      return true;
    }
    return false;
  }

  function logout() {
    setAdminName("");
    localStorage.removeItem("resource-admin-session");
  }

  function openEditor(key: ResourceKey, row: ResourceRow) {
    setEditor({ key, row });
  }

  function addRow(key: ResourceKey) {
    setEditor({ key, row: createBlankRow(key) });
  }

  async function saveEditor(nextRow: ResourceRow) {
    const key = editor!.key;
    const action = isExistingRow(data, key, nextRow) ? "update" : "create";
    setData((current) => {
      const rowId = (nextRow as { id: string }).id;
      const rows = current[key];
      const exists = rows.some((row) => (row as { id: string }).id === rowId);
      const next = {
        ...current,
        [key]: exists ? rows.map((row) => ((row as { id: string }).id === rowId ? nextRow : row)) : [...rows, nextRow],
      } as ResourceData;
      persistLocalEdits(next);
      return next;
    });
    setEditor(null);
    if (settings.writeEndpoint.trim()) {
      try {
        await postSheetMutation(settings.writeEndpoint, { action, sheet: key, row: nextRow });
        setMessage("已同步送出到 Google Sheet");
      } catch (error) {
        setMessage(error instanceof Error ? `已先儲存在本機，同步失敗：${error.message}` : "已先儲存在本機，同步失敗");
      }
    } else {
      setMessage("已儲存本機資料，尚未設定 Google Sheet 寫入端點");
    }
  }

  async function deleteRow(key: ResourceKey, row: ResourceRow) {
    const rowId = (row as { id: string }).id;
    const confirmed = window.confirm(`確定刪除這筆${editorLabels[key]}資料？`);
    if (!confirmed) return;
    setData((current) => {
      const next = {
        ...current,
        [key]: current[key].filter((item) => (item as { id: string }).id !== rowId),
      } as ResourceData;
      persistLocalEdits(next);
      return next;
    });
    if (settings.writeEndpoint.trim()) {
      try {
        await postSheetMutation(settings.writeEndpoint, { action: "delete", sheet: key, row });
        setMessage("已同步刪除 Google Sheet 資料");
      } catch (error) {
        setMessage(error instanceof Error ? `已先刪除本機資料，同步失敗：${error.message}` : "已先刪除本機資料，同步失敗");
      }
    } else {
      setMessage("已刪除本機資料，尚未設定 Google Sheet 寫入端點");
    }
  }

  const tabs = [
    { id: "dashboard", label: "總覽", icon: BarChart3 },
    { id: "accounts", label: "帳號", icon: IdCard },
    { id: "personnel", label: "派遣/工讀", icon: BriefcaseBusiness },
    { id: "credentials", label: "帳密大全", icon: KeyRound },
    { id: "projects", label: "專案", icon: FolderKanban },
    { id: "inventory", label: "物資", icon: Boxes },
    { id: "loans", label: "借用", icon: ClipboardList },
    { id: "vendors", label: "廠商", icon: UsersRound },
    { id: "cases", label: "案例", icon: BookOpen },
    { id: "budget", label: "預算", icon: WalletCards },
    { id: "settings", label: "設定", icon: Settings },
  ];

  if (!adminName) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><img src="./impr-logo.png" alt="IMPR Logo" /></div>
          <div>
            <div className="brand-title">公司資源管理</div>
            <div className="brand-subtitle">GitHub + Google Sheet</div>
          </div>
        </div>
        <nav className="nav-list">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button className={active === tab.id ? "nav-item active" : "nav-item"} key={tab.id} onClick={() => setActive(tab.id)}>
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{tabs.find((tab) => tab.id === active)?.label ?? "總覽"}</h1>
            <p>{adminName}已登入 / {message}</p>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋帳號、專案、物資、廠商..." />
            </label>
            <button className="icon-button" onClick={refresh} aria-label="重新整理" title="重新整理">
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
            <button className="secondary-button" onClick={logout}>
              <LogOut size={16} /> 登出
            </button>
          </div>
        </header>

        {active === "dashboard" && <Dashboard data={filtered} summary={summary} />}
        {active === "accounts" && <Accounts accounts={filtered.accounts} onAdd={() => addRow("accounts")} onEdit={(row) => openEditor("accounts", row)} onDelete={(row) => deleteRow("accounts", row)} />}
        {active === "personnel" && <PersonnelPage personnel={filtered.personnel} onAdd={() => addRow("personnel")} onEdit={(row) => openEditor("personnel", row)} onDelete={(row) => deleteRow("personnel", row)} />}
        {active === "credentials" && <Credentials credentials={filtered.credentials} onAdd={() => addRow("credentials")} onEdit={(row) => openEditor("credentials", row)} onDelete={(row) => deleteRow("credentials", row)} />}
        {active === "projects" && <Projects data={filtered} onAdd={() => addRow("projects")} onEdit={(row) => openEditor("projects", row)} onDelete={(row) => deleteRow("projects", row)} />}
        {active === "inventory" && <Inventory items={filtered.inventory} onAdd={() => addRow("inventory")} onEdit={(row) => openEditor("inventory", row)} onDelete={(row) => deleteRow("inventory", row)} />}
        {active === "loans" && <Loans loans={filtered.loans} onAdd={() => addRow("loans")} onEdit={(row) => openEditor("loans", row)} onDelete={(row) => deleteRow("loans", row)} />}
        {active === "vendors" && <Vendors vendors={filtered.vendors} onAdd={() => addRow("vendors")} onEdit={(row) => openEditor("vendors", row)} onDelete={(row) => deleteRow("vendors", row)} />}
        {active === "cases" && <Cases cases={filtered.cases} onAdd={() => addRow("cases")} onEdit={(row) => openEditor("cases", row)} onDelete={(row) => deleteRow("cases", row)} />}
        {active === "budget" && <Budget items={filtered.budget} onAdd={() => addRow("budget")} onEdit={(row) => openEditor("budget", row)} onDelete={(row) => deleteRow("budget", row)} />}
        {active === "settings" && <SettingsPanel settings={settings} setSettings={setSettings} onRefresh={refresh} />}
        {editor && <EditorModal editor={editor} onClose={() => setEditor(null)} onSave={saveEditor} />}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => boolean }) {
  const [email, setEmail] = useState(demoAdmin.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (onLogin(email, password)) return;
    setError("帳號或密碼不正確");
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <img src="./impr-logo.png" alt="IMPR Logo" />
        </div>
        <div>
          <h1>公司資源管理</h1>
          <p>請使用管理者帳號登入</p>
        </div>
        <label className="login-field">
          <span>管理者帳號</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
        </label>
        <label className="login-field">
          <span>密碼</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button className="primary-button" type="submit">登入</button>
        <small>測試帳號：admin@impr.com.tw / impr2026</small>
      </form>
    </main>
  );
}

function Dashboard({ data, summary }: { data: ResourceData; summary: ReturnType<typeof buildSummary> }) {
  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Metric icon={IdCard} label="管理者/同仁" value={`${summary.managers}/${data.accounts.length}`} />
        <Metric icon={FolderKanban} label="進行中專案" value={`${summary.activeProjects}/${data.projects.length}`} />
        <Metric icon={CalendarDays} label="30 天內到期" value={summary.upcomingDeadlines} />
        <Metric icon={Boxes} label="可借物資" value={summary.availableItems} />
        <Metric icon={Archive} label="物資類別" value={summary.inventoryCategories} />
        <Metric icon={CircleDollarSign} label="實際收入" value={money(summary.income)} />
        <Metric icon={WalletCards} label="實際支出" value={money(summary.expense)} />
      </div>

      <div className="two-column">
        <Panel title="近期專案" action={<StatusLegend />}>
          <div className="compact-list">
            {data.projects.slice(0, 5).map((project) => (
              <div className="list-row" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.code || "未編號"} / {project.client || "未指定客戶"}</span>
                </div>
                <StatusBadge status={project.status} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="借用追蹤" action={<span className="muted">{data.loans.length} 筆</span>}>
          <div className="compact-list">
            {data.loans.slice(0, 5).map((loan) => (
              <div className="list-row" key={loan.id}>
                <div>
                  <strong>{loan.purpose}</strong>
                  <span>{loan.borrower} / {loan.items}</span>
                </div>
                <LoanBadge status={loan.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function Accounts({ accounts, onAdd, onEdit, onDelete }: { accounts: Account[]; onAdd: () => void; onEdit: (row: Account) => void; onDelete: (row: Account) => void }) {
  const managers = accounts.filter((account) => account.role === "manager");
  const staff = accounts.filter((account) => account.role === "staff");

  return (
    <section className="view-stack">
      <div className="metric-grid compact-metrics">
        <Metric icon={IdCard} label="全部帳號" value={accounts.length} />
        <Metric icon={CheckCircle2} label="管理者" value={managers.length} />
        <Metric icon={UsersRound} label="同仁" value={staff.length} />
      </div>

      <Panel title="帳號管理" action={<PanelActions onAdd={onAdd} rows={accounts} filename="accounts.csv" />}>
        <DataTable
          columns={["姓名", "Email", "角色", "部門", "狀態", "備註", "操作"]}
          rows={accounts.map((account) => [
            account.name,
            account.email,
            account.role === "manager" ? "管理者" : "同仁",
            account.department,
            account.status,
            account.note,
            <RowActions onEdit={() => onEdit(account)} onDelete={() => onDelete(account)} />,
          ])}
        />
      </Panel>
    </section>
  );
}

function PersonnelPage({ personnel, onAdd, onEdit, onDelete }: { personnel: Personnel[]; onAdd: () => void; onEdit: (row: Personnel) => void; onDelete: (row: Personnel) => void }) {
  const byKind = Object.entries(groupBy(personnel, (person) => person.kind || "未分類"));
  const activeCount = personnel.filter((person) => !person.status.includes("停用") && !person.status.includes("結束")).length;
  const monthlyEstimate = personnel.reduce((sum, person) => sum + person.hourlyRate * 80, 0);

  return (
    <section className="view-stack">
      <div className="metric-grid compact-metrics">
        <Metric icon={BriefcaseBusiness} label="全部人員" value={personnel.length} />
        <Metric icon={CheckCircle2} label="有效/可排班" value={activeCount} />
        <Metric icon={CircleDollarSign} label="月估成本" value={money(monthlyEstimate)} />
      </div>

      <div className="category-strip">
        {byKind.map(([kind, rows]) => {
          const managers = Array.from(new Set(rows.map((person) => person.manager).filter(Boolean)));
          return (
            <article className="category-card" key={kind}>
              <div>
                <span>{kind}</span>
                <strong>{rows.length}</strong>
              </div>
              <small>管理者：{managers.join("、") || "未指定"}</small>
            </article>
          );
        })}
      </div>

      <Panel title="派遣人員 / 工讀生" action={<PanelActions onAdd={onAdd} rows={personnel} filename="personnel.csv" />}>
        <DataTable
          columns={["姓名/單位", "項目", "區域", "管理者", "電話", "Email", "狀態", "期間", "時薪/單價", "備註", "操作"]}
          rows={personnel.map((person) => [
            person.name,
            person.kind,
            person.area,
            person.manager,
            person.phone,
            person.email,
            person.status,
            `${person.startDate || "未定"} → ${person.endDate || "未定"}`,
            person.hourlyRate ? money(person.hourlyRate) : "",
            person.note,
            <RowActions onEdit={() => onEdit(person)} onDelete={() => onDelete(person)} />,
          ])}
        />
      </Panel>
    </section>
  );
}

function Credentials({ credentials, onAdd, onEdit, onDelete }: { credentials: CompanyCredential[]; onAdd: () => void; onEdit: (row: CompanyCredential) => void; onDelete: (row: CompanyCredential) => void }) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  function togglePassword(id: string) {
    setVisiblePasswords((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <Panel title="公司帳密大全" action={<PanelActions onAdd={onAdd} rows={credentials} filename="credentials.csv" />}>
      <DataTable
        columns={["系統名稱", "網址", "帳號", "密碼", "期間", "管理者", "備註", "操作"]}
        rows={credentials.map((credential) => [
          credential.name,
          credential.url ? <a className="text-link" href={credential.url} target="_blank" rel="noreferrer">開啟</a> : "",
          credential.account,
          <PasswordCell
            password={credential.password}
            visible={Boolean(visiblePasswords[credential.id])}
            onToggle={() => togglePassword(credential.id)}
          />,
          credential.period,
          credential.manager,
          credential.note,
          <RowActions onEdit={() => onEdit(credential)} onDelete={() => onDelete(credential)} />,
        ])}
      />
    </Panel>
  );
}

function Projects({ data, onAdd, onEdit, onDelete }: { data: ResourceData; onAdd: () => void; onEdit: (row: Project) => void; onDelete: (row: Project) => void }) {
  return (
    <section className="view-stack">
      <div className="page-actions">
        <AddButton onClick={onAdd} />
      </div>
      <div className="project-grid">
        {data.projects.map((project) => {
          const spent = data.budget
            .filter((item) => item.projectId === project.id && item.type === "expense")
            .reduce((sum, item) => sum + item.actual, 0);
          const progress = project.budget > 0 ? Math.min(100, Math.round((spent / project.budget) * 100)) : 0;
          return (
            <article className="project-card" key={project.id}>
              <div className="card-heading">
                <div>
                  <span className="code">{project.code || "未編號"}</span>
                  <h2>{project.name}</h2>
                </div>
                <div className="card-actions">
                  <StatusBadge status={project.status} />
                  <RowActions onEdit={() => onEdit(project)} onDelete={() => onDelete(project)} />
                </div>
              </div>
              <p>{project.description || "尚無說明"}</p>
              <div className="meta-grid">
                <span>客戶：{project.client || "未指定"}</span>
                <span>負責：{project.owner || "未指定"}</span>
                <span>{project.startDate || "未定"} → {project.endDate || "未定"}</span>
                <span>{money(project.budget)}</span>
              </div>
              <div className="progress">
                <div style={{ width: `${progress}%` }} />
              </div>
              <small>實際支出 {money(spent)} / 預算 {money(project.budget)}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Inventory({ items, onAdd, onEdit, onDelete }: { items: InventoryItem[]; onAdd: () => void; onEdit: (row: InventoryItem) => void; onDelete: (row: InventoryItem) => void }) {
  const grouped = Object.entries(groupBy(items, (item) => item.category || "未分類")).sort(([a], [b]) => a.localeCompare(b, "zh-Hant"));

  return (
    <section className="view-stack">
      <div className="category-strip">
        {grouped.map(([category, rows]) => {
          const total = rows.reduce((sum, item) => sum + item.quantity, 0);
          const borrowed = rows.reduce((sum, item) => sum + item.borrowed, 0);
          const managers = Array.from(new Set(rows.map((item) => item.manager).filter(Boolean)));
          return (
            <article className="category-card" key={category}>
              <div>
                <span>{category}</span>
                <strong>{Math.max(0, total - borrowed)} / {total}</strong>
              </div>
              <small>管理者：{managers.join("、") || "未指定"}</small>
            </article>
          );
        })}
      </div>

      <Panel title="物資清單" action={<PanelActions onAdd={onAdd} rows={items} filename="inventory.csv" />}>
        <DataTable
          columns={["名稱", "類別", "管理者", "總量", "借出", "可借", "位置", "備註", "操作"]}
          rows={items.map((item) => [
            item.name,
            item.category,
            item.manager,
            item.quantity,
            item.borrowed,
            Math.max(0, item.quantity - item.borrowed),
            item.location,
            item.note,
            <RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />,
          ])}
        />
      </Panel>
    </section>
  );
}

function Loans({ loans, onAdd, onEdit, onDelete }: { loans: Loan[]; onAdd: () => void; onEdit: (row: Loan) => void; onDelete: (row: Loan) => void }) {
  return (
    <Panel title="借用紀錄" action={<PanelActions onAdd={onAdd} rows={loans} filename="loans.csv" />}>
      <DataTable
        columns={["用途", "借用人", "狀態", "預計", "借出", "歸還", "項目", "操作"]}
        rows={loans.map((loan) => [
          loan.purpose,
          loan.borrower,
          loanLabels[loan.status] ?? loan.status,
          loan.plannedAt,
          loan.borrowedAt,
          loan.returnedAt,
          loan.items,
          <RowActions onEdit={() => onEdit(loan)} onDelete={() => onDelete(loan)} />,
        ])}
      />
    </Panel>
  );
}

function Vendors({ vendors, onAdd, onEdit, onDelete }: { vendors: Vendor[]; onAdd: () => void; onEdit: (row: Vendor) => void; onDelete: (row: Vendor) => void }) {
  return (
    <section className="view-stack">
      <div className="page-actions">
        <AddButton onClick={onAdd} />
      </div>
      <div className="card-grid">
        {vendors.map((vendor) => (
          <article className="info-card" key={vendor.id}>
            <div className="card-heading">
              <div>
                <span className="code">{vendor.type || "未分類"}</span>
                <h2>{vendor.name}</h2>
              </div>
              <div className="card-actions">
                <UsersRound size={18} />
                <RowActions onEdit={() => onEdit(vendor)} onDelete={() => onDelete(vendor)} />
              </div>
            </div>
            <p>{vendor.note || "尚無備註"}</p>
            <div className="meta-grid">
              <span>聯絡人：{vendor.contact || "未填"}</span>
              <span>電話：{vendor.phone || "未填"}</span>
              <span>Email：{vendor.email || "未填"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Cases({ cases, onAdd, onEdit, onDelete }: { cases: CaseStudy[]; onAdd: () => void; onEdit: (row: CaseStudy) => void; onDelete: (row: CaseStudy) => void }) {
  const grouped = groupBy(cases, (item) => String(item.year || "未指定"));
  return (
    <section className="view-stack">
      <div className="page-actions">
        <AddButton onClick={onAdd} />
      </div>
      {Object.entries(grouped)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, rows]) => (
          <Panel title={`${year} 年`} key={year} action={<span className="muted">{rows.length} 份</span>}>
            <div className="card-grid compact">
              {rows.map((item) => (
                <article className="info-card" key={item.id}>
                  <div className="card-heading">
                    <div>
                      <span className="code">{item.type || "案例"}</span>
                      <h2>{item.title}</h2>
                    </div>
                    <div className="card-actions">
                      <FileText size={18} />
                      <RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
                    </div>
                  </div>
                  <p>{item.description || "尚無說明"}</p>
                  {item.fileUrl && (
                    <a className="text-link" href={item.fileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} /> 開啟檔案
                    </a>
                  )}
                </article>
              ))}
            </div>
          </Panel>
        ))}
    </section>
  );
}

function Budget({ items, onAdd, onEdit, onDelete }: { items: BudgetItem[]; onAdd: () => void; onEdit: (row: BudgetItem) => void; onDelete: (row: BudgetItem) => void }) {
  return (
    <Panel title="預算結算" action={<PanelActions onAdd={onAdd} rows={items} filename="budget.csv" />}>
      <DataTable
        columns={["專案", "類型", "項目", "規劃金額", "實際金額", "已付款/收款", "操作"]}
        rows={items.map((item) => [
          item.projectName || item.projectId,
          item.type === "income" ? "收入" : "支出",
          item.item,
          money(item.planned),
          money(item.actual),
          item.paid ? "是" : "否",
          <RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />,
        ])}
      />
    </Panel>
  );
}

function SettingsPanel({
  settings,
  setSettings,
  onRefresh,
}: {
  settings: SheetSettings;
  setSettings: (settings: SheetSettings) => void;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState(settings);

  function update(key: keyof SheetSettings, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="settings-layout">
      <Panel title="Google Sheet 連線" action={<button className="primary-button" onClick={() => { setSettings(draft); onRefresh(); }}><Save size={16} /> 儲存</button>}>
        <div className="settings-copy">
          <p>每個分頁可用「檔案 → 共用 → 發佈到網路 → CSV」取得網址。欄位名稱可用中文或英文，系統會自動對應常見欄位。</p>
          <p>若要新增、編輯、刪除資料，建議建立 Google Apps Script Web App，並把 POST endpoint 填在下方；目前網站已預留寫入位置，讀取可直接用 CSV。</p>
        </div>
        <div className="settings-grid">
          {sheetKeys.map((sheet) => (
            <label className="field" key={sheet.key}>
              <span>{sheet.label} CSV</span>
              <input value={draft[sheet.key]} onChange={(event) => update(sheet.key, event.target.value)} placeholder="https://docs.google.com/spreadsheets/..." />
              <small>{sheet.hint}</small>
            </label>
          ))}
          <label className="field wide">
            <span>Apps Script 寫入端點</span>
            <input value={draft.writeEndpoint} onChange={(event) => update("writeEndpoint", event.target.value)} placeholder="https://script.google.com/macros/s/.../exec" />
            <small>可後續接新增表單與權限驗證。</small>
          </label>
        </div>
      </Panel>

      <Panel title="Google Sheet 建議分頁">
        <DataTable
          columns={["分頁", "用途", "必要欄位"]}
          rows={sheetKeys.map((sheet) => [sheet.label, sheet.key, sheet.hint])}
        />
      </Panel>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="metric-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-button small" onClick={onClick} aria-label="編輯" title="編輯">
      <Pencil size={15} />
    </button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-button small danger" onClick={onClick} aria-label="刪除" title="刪除">
      <Trash2 size={15} />
    </button>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="primary-button" onClick={onClick}>
      <Plus size={16} /> 新增
    </button>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="row-actions">
      <EditButton onClick={onEdit} />
      <DeleteButton onClick={onDelete} />
    </div>
  );
}

function PasswordCell({ password, visible, onToggle }: { password: string; visible: boolean; onToggle: () => void }) {
  return (
    <div className="password-cell">
      <span className={visible ? "password-value" : "password-mask"}>{visible ? password || "未填" : "••••••••"}</span>
      <button className="secondary-button compact" onClick={onToggle}>
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        {visible ? "隱藏" : "查看"}
      </button>
    </div>
  );
}

function PanelActions({ onAdd, rows, filename }: { onAdd: () => void; rows: unknown[]; filename: string }) {
  return (
    <div className="panel-actions">
      <AddButton onClick={onAdd} />
      <ExportButton rows={rows} filename={filename} />
    </div>
  );
}

function EditorModal({ editor, onClose, onSave }: { editor: EditorState; onClose: () => void; onSave: (row: ResourceRow) => void }) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...(editor.row as Record<string, unknown>) });
  const fields = editorFields[editor.key];

  function update(field: FormField, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [field.key]: field.type === "number" ? toNumber(String(value)) : value,
    }));
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card" onSubmit={(event) => { event.preventDefault(); onSave(draft as ResourceRow); }}>
        <div className="modal-header">
          <div>
            <h2>編輯{editorLabels[editor.key]}</h2>
            <p>{String((editor.row as Record<string, unknown>).id || "")}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="關閉">×</button>
        </div>
        <div className="edit-grid">
          {fields.map((field) => (
            <label className={field.type === "checkbox" ? "edit-check" : "field"} key={field.key}>
              <span>{field.label}</span>
              {field.type === "select" ? (
                <select value={String(draft[field.key] ?? "")} onChange={(event) => update(field, event.target.value)}>
                  {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : field.type === "checkbox" ? (
                <input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => update(field, event.target.checked)} />
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={String(draft[field.key] ?? "")}
                  onChange={(event) => update(field, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>取消</button>
          <button className="primary-button" type="submit"><Save size={16} /> 儲存</button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status}`}>{statusLabels[status] ?? status}</span>;
}

function LoanBadge({ status }: { status: string }) {
  return <span className={`badge loan-${status}`}>{loanLabels[status] ?? status}</span>;
}

function StatusLegend() {
  return (
    <span className="legend">
      <span /> 專案狀態
    </span>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="empty-cell">沒有符合條件的資料</td></tr>
          ) : rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{typeof cell === "boolean" ? String(cell) : cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExportButton({ rows, filename }: { rows: unknown[]; filename: string }) {
  return (
    <button className="secondary-button" onClick={() => downloadCsv(rows, filename)}>
      <Download size={16} /> 匯出
    </button>
  );
}

function usePersistentSettings(): [SheetSettings, (settings: SheetSettings) => void] {
  const [settings, setSettingsState] = useState<SheetSettings>(() => {
    try {
      const raw = localStorage.getItem("resource-sheet-settings");
      const parsed = raw ? { ...emptySettings, ...JSON.parse(raw) } : emptySettings;
      return parsed.writeEndpoint ? parsed : { ...parsed, writeEndpoint: defaultWriteEndpoint };
    } catch {
      return emptySettings;
    }
  });

  function setSettings(next: SheetSettings) {
    setSettingsState(next);
    localStorage.setItem("resource-sheet-settings", JSON.stringify(next));
  }

  return [settings, setSettings];
}

async function loadSheetData(settings: SheetSettings): Promise<ResourceData> {
  if (!hasAnySheet(settings)) return sampleData;

  const [projects, inventory, loans, vendors, cases, budget, accounts, personnel, credentials] = await Promise.all([
    loadCsv(settings.projects, sampleData.projects, mapProject),
    loadCsv(settings.inventory, sampleData.inventory, mapInventory),
    loadCsv(settings.loans, sampleData.loans, mapLoan),
    loadCsv(settings.vendors, sampleData.vendors, mapVendor),
    loadCsv(settings.cases, sampleData.cases, mapCase),
    loadCsv(settings.budget, sampleData.budget, mapBudget),
    loadCsv(settings.accounts, sampleData.accounts, mapAccount),
    loadCsv(settings.personnel, sampleData.personnel, mapPersonnel),
    loadCsv(settings.credentials, sampleData.credentials, mapCredential),
  ]);

  return { projects, inventory, loans, vendors, cases, budget, accounts, personnel, credentials };
}

async function loadCsv<T>(url: string, fallback: T[], mapper: (row: Record<string, string>, index: number) => T): Promise<T[]> {
  if (!url.trim()) return fallback;
  const response = await fetch(url.trim());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const rows = parseCsv(text);
  return rows.map(mapper);
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current);
  rows.push(row);

  const headers = (rows.shift() ?? []).map((header) => normalizeKey(header));
  return rows
    .filter((values) => values.some((value) => value.trim()))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])));
}

function mapProject(row: Record<string, string>, index: number): Project {
  return {
    id: pick(row, ["id", "編號", "流水號"]) || `project-${index + 1}`,
    code: pick(row, ["code", "專案代號"]),
    name: pick(row, ["name", "專案名稱", "名稱"]),
    client: pick(row, ["client", "客戶", "單位"]),
    status: normalizeStatus(pick(row, ["status", "狀態"])),
    owner: pick(row, ["owner", "負責人", "pm"]),
    startDate: pick(row, ["startdate", "start_date", "開始日期"]),
    endDate: pick(row, ["enddate", "end_date", "結束日期", "截止日期"]),
    budget: toNumber(pick(row, ["budget", "budget_total", "預算", "總預算"])),
    description: pick(row, ["description", "說明", "備註"]),
  };
}

function mapInventory(row: Record<string, string>, index: number): InventoryItem {
  return {
    id: pick(row, ["id", "編號"]) || `inventory-${index + 1}`,
    name: pick(row, ["name", "名稱", "物資名稱"]),
    category: pick(row, ["category", "類別", "分類"]) || "未分類",
    manager: pick(row, ["manager", "管理者", "保管人", "負責人"]),
    quantity: toNumber(pick(row, ["quantity", "總量", "庫存"])),
    borrowed: toNumber(pick(row, ["borrowed", "借出", "借用中"])),
    location: pick(row, ["location", "位置"]),
    note: pick(row, ["note", "notes", "備註"]),
  };
}

function mapLoan(row: Record<string, string>, index: number): Loan {
  return {
    id: pick(row, ["id", "編號"]) || `loan-${index + 1}`,
    purpose: pick(row, ["purpose", "用途", "活動"]),
    borrower: pick(row, ["borrower", "借用人"]),
    status: normalizeLoan(pick(row, ["status", "狀態"])),
    plannedAt: pick(row, ["plannedat", "planned_at", "預計"]),
    borrowedAt: pick(row, ["borrowedat", "borrowed_at", "借出"]),
    returnedAt: pick(row, ["returnedat", "returned_at", "歸還"]),
    items: pick(row, ["items", "項目", "物資"]),
  };
}

function mapVendor(row: Record<string, string>, index: number): Vendor {
  return {
    id: pick(row, ["id", "編號"]) || `vendor-${index + 1}`,
    name: pick(row, ["name", "名稱", "廠商名稱"]),
    type: pick(row, ["type", "類別"]),
    contact: pick(row, ["contact", "contact_person", "聯絡人"]),
    phone: pick(row, ["phone", "電話"]),
    email: pick(row, ["email", "信箱"]),
    note: pick(row, ["note", "notes", "備註"]),
  };
}

function mapCase(row: Record<string, string>, index: number): CaseStudy {
  return {
    id: pick(row, ["id", "編號"]) || `case-${index + 1}`,
    title: pick(row, ["title", "標題", "名稱"]),
    type: pick(row, ["type", "project_type", "類型"]),
    year: toNumber(pick(row, ["year", "年度"])),
    fileUrl: pick(row, ["fileurl", "file_url", "檔案", "連結"]),
    description: pick(row, ["description", "說明", "備註"]),
  };
}

function mapBudget(row: Record<string, string>, index: number): BudgetItem {
  const type = pick(row, ["type", "entry_type", "類型"]) === "income" || pick(row, ["type", "entry_type", "類型"]).includes("收入") ? "income" : "expense";
  return {
    id: pick(row, ["id", "編號"]) || `budget-${index + 1}`,
    projectId: pick(row, ["projectid", "project_id", "專案id"]),
    projectName: pick(row, ["projectname", "project_name", "專案"]),
    type,
    planned: toNumber(pick(row, ["planned", "planned_amount", "規劃", "預估"])),
    actual: toNumber(pick(row, ["actual", "actual_amount", "實際"])),
    paid: ["true", "1", "yes", "y", "已付款", "已收款", "是"].includes(pick(row, ["paid", "付款", "收款"]).toLowerCase()),
    item: pick(row, ["item", "項目", "說明"]),
  };
}

function mapAccount(row: Record<string, string>, index: number): Account {
  const roleText = pick(row, ["role", "角色", "權限"]);
  return {
    id: pick(row, ["id", "編號", "帳號id"]) || `account-${index + 1}`,
    name: pick(row, ["name", "姓名", "名稱"]),
    email: pick(row, ["email", "帳號", "信箱"]),
    role: roleText.includes("管理") || roleText === "manager" || roleText === "admin" ? "manager" : "staff",
    department: pick(row, ["department", "部門", "單位"]),
    status: pick(row, ["status", "狀態"]) || "啟用",
    note: pick(row, ["note", "notes", "備註"]),
  };
}

function mapPersonnel(row: Record<string, string>, index: number): Personnel {
  const kindText = pick(row, ["kind", "項目", "類型", "身份"]);
  return {
    id: pick(row, ["id", "編號"]) || `personnel-${index + 1}`,
    name: pick(row, ["name", "姓名", "名稱", "單位"]),
    kind: kindText.includes("派遣") ? "派遣人員" : "工讀生",
    area: pick(row, ["area", "區域", "department", "部門", "單位"]),
    manager: pick(row, ["manager", "管理者", "負責人"]),
    phone: pick(row, ["phone", "電話"]),
    email: pick(row, ["email", "信箱"]),
    status: pick(row, ["status", "狀態"]) || "待排班",
    startDate: pick(row, ["startdate", "start_date", "開始日期"]),
    endDate: pick(row, ["enddate", "end_date", "結束日期"]),
    hourlyRate: toNumber(pick(row, ["hourlyrate", "hourly_rate", "時薪", "單價"])),
    note: pick(row, ["note", "notes", "備註"]),
  };
}

function mapCredential(row: Record<string, string>, index: number): CompanyCredential {
  return {
    id: pick(row, ["id", "編號"]) || `credential-${index + 1}`,
    name: pick(row, ["name", "系統名稱", "名稱"]),
    url: pick(row, ["url", "網址", "連結"]),
    account: pick(row, ["account", "帳號", "username"]),
    password: pick(row, ["password", "密碼"]),
    period: pick(row, ["period", "期間", "效期"]),
    manager: pick(row, ["manager", "管理者", "負責人"]),
    note: pick(row, ["note", "notes", "備註"]),
  };
}

function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[normalizeKey(key)];
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "").replace(/[-_]/g, "");
}

function normalizeStatus(status: string) {
  const text = status || "planning";
  if (text.includes("進行")) return "in_progress";
  if (text.includes("暫")) return "on_hold";
  if (text.includes("完成")) return "completed";
  if (text.includes("取消")) return "cancelled";
  return text;
}

function normalizeLoan(status: string) {
  const text = status || "pending";
  if (text.includes("借用中") || text.includes("借出")) return "borrowed";
  if (text.includes("歸還") || text.includes("完成")) return "returned";
  return text;
}

function toNumber(value: string) {
  return Number(String(value || "0").replace(/[$,，]/g, "")) || 0;
}

function hasAnySheet(settings: SheetSettings) {
  return sheetKeys.some((sheet) => settings[sheet.key].trim());
}

function buildSummary(data: ResourceData) {
  const now = new Date();
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);
  return {
    managers: data.accounts.filter((account) => account.role === "manager").length,
    activeProjects: data.projects.filter((project) => project.status === "in_progress").length,
    upcomingDeadlines: data.projects.filter((project) => {
      const date = project.endDate ? new Date(project.endDate) : null;
      return date && date >= now && date <= in30 && project.status !== "completed";
    }).length,
    availableItems: data.inventory.reduce((sum, item) => sum + Math.max(0, item.quantity - item.borrowed), 0),
    inventoryCategories: new Set(data.inventory.map((item) => item.category || "未分類")).size,
    credentials: data.credentials.length,
    income: data.budget.filter((item) => item.type === "income").reduce((sum, item) => sum + item.actual, 0),
    expense: data.budget.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.actual, 0),
  };
}

function filterData(data: ResourceData, query: string): ResourceData {
  const q = query.trim().toLowerCase();
  if (!q) return data;
  const includes = (values: unknown[]) => values.some((value) => String(value ?? "").toLowerCase().includes(q));
  return {
    projects: data.projects.filter((item) => includes(Object.values(item))),
    inventory: data.inventory.filter((item) => includes(Object.values(item))),
    loans: data.loans.filter((item) => includes(Object.values(item))),
    vendors: data.vendors.filter((item) => includes(Object.values(item))),
    cases: data.cases.filter((item) => includes(Object.values(item))),
    budget: data.budget.filter((item) => includes(Object.values(item))),
    accounts: data.accounts.filter((item) => includes(Object.values(item))),
    personnel: data.personnel.filter((item) => includes(Object.values(item))),
    credentials: data.credentials.filter((item) => includes(Object.values(item))),
  };
}

function mergeLocalEdits(data: ResourceData): ResourceData {
  try {
    const raw = localStorage.getItem("resource-local-edits");
    return raw ? { ...data, ...JSON.parse(raw) } : data;
  } catch {
    return data;
  }
}

function persistLocalEdits(data: ResourceData) {
  localStorage.setItem("resource-local-edits", JSON.stringify(data));
}

function isExistingRow(data: ResourceData, key: ResourceKey, row: ResourceRow) {
  const rowId = (row as { id: string }).id;
  return data[key].some((item) => (item as { id: string }).id === rowId);
}

async function postSheetMutation(endpoint: string, mutation: SheetMutation) {
  const response = await fetch(endpoint.trim(), {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(mutation),
  });
  return response;
}

function createBlankRow(key: ResourceKey): ResourceRow {
  const id = `${key}-${Date.now()}`;
  const rows: Record<ResourceKey, ResourceRow> = {
    projects: {
      id,
      code: "",
      name: "新增專案",
      client: "",
      status: "planning",
      owner: "",
      startDate: "",
      endDate: "",
      budget: 0,
      description: "",
    },
    inventory: {
      id,
      name: "新增物資",
      category: "未分類",
      manager: "",
      quantity: 0,
      borrowed: 0,
      location: "",
      note: "",
    },
    loans: {
      id,
      purpose: "新增借用",
      borrower: "",
      status: "pending",
      plannedAt: "",
      borrowedAt: "",
      returnedAt: "",
      items: "",
    },
    vendors: {
      id,
      name: "新增廠商",
      type: "",
      contact: "",
      phone: "",
      email: "",
      note: "",
    },
    cases: {
      id,
      title: "新增案例",
      type: "",
      year: new Date().getFullYear(),
      fileUrl: "",
      description: "",
    },
    budget: {
      id,
      projectId: "",
      projectName: "",
      type: "expense",
      planned: 0,
      actual: 0,
      paid: false,
      item: "新增項目",
    },
    accounts: {
      id,
      name: "新增帳號",
      email: "",
      role: "staff",
      department: "",
      status: "啟用",
      note: "",
    },
    personnel: {
      id,
      name: "新增人員",
      kind: "工讀生",
      area: "",
      manager: "",
      phone: "",
      email: "",
      status: "待排班",
      startDate: "",
      endDate: "",
      hourlyRate: 0,
      note: "",
    },
    credentials: {
      id,
      name: "新增系統",
      url: "",
      account: "",
      password: "",
      period: "",
      manager: "",
      note: "",
    },
  };
  return rows[key];
}

function groupBy<T>(rows: T[], keyer: (row: T) => string) {
  return rows.reduce<Record<string, T[]>>((groups, row) => {
    const key = keyer(row);
    groups[key] ||= [];
    groups[key].push(row);
    return groups;
  }, {});
}

function statusOptions() {
  return [
    { label: "規劃中", value: "planning" },
    { label: "進行中", value: "in_progress" },
    { label: "暫停", value: "on_hold" },
    { label: "已完成", value: "completed" },
    { label: "已取消", value: "cancelled" },
  ];
}

function loanOptions() {
  return [
    { label: "待借出", value: "pending" },
    { label: "借用中", value: "borrowed" },
    { label: "已歸還", value: "returned" },
  ];
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString("zh-TW")}`;
}

function downloadCsv(rows: unknown[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell((row as Record<string, unknown>)[header])).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
