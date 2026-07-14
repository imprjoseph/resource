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
  ExternalLink,
  FileText,
  FolderKanban,
  IdCard,
  LogOut,
  RefreshCw,
  Save,
  Search,
  Settings,
  UsersRound,
  WalletCards,
} from "lucide-react";
import "./styles.css";

type SheetKey = "projects" | "inventory" | "loans" | "vendors" | "cases" | "budget" | "accounts" | "personnel";

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
  department: string;
  manager: string;
  phone: string;
  email: string;
  status: string;
  startDate: string;
  endDate: string;
  hourlyRate: number;
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

const sheetKeys: { key: SheetKey; label: string; hint: string }[] = [
  { key: "projects", label: "專案", hint: "id, code, name, client, status, owner, startDate, endDate, budget, description" },
  { key: "inventory", label: "物資", hint: "id, name, category, manager, quantity, borrowed, location, note" },
  { key: "loans", label: "借用", hint: "id, purpose, borrower, status, plannedAt, borrowedAt, returnedAt, items" },
  { key: "vendors", label: "廠商", hint: "id, name, type, contact, phone, email, note" },
  { key: "cases", label: "案例", hint: "id, title, type, year, fileUrl, description" },
  { key: "budget", label: "預算", hint: "id, projectId, projectName, type, planned, actual, paid, item" },
  { key: "accounts", label: "帳號", hint: "id, name, email, role, department, status, note" },
  { key: "personnel", label: "派遣/工讀", hint: "id, name, kind, department, manager, phone, email, status, startDate, endDate, hourlyRate, note" },
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
  writeEndpoint: "",
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
    { id: "pt-001", name: "張育瑄", kind: "工讀生", department: "行政部", manager: "黃郁婷", phone: "0912-345-678", email: "pt01@impr.com.tw", status: "排班中", startDate: "2026-07-01", endDate: "2026-09-30", hourlyRate: 190, note: "文具盤點、資料建檔" },
    { id: "pt-002", name: "劉冠廷", kind: "工讀生", department: "活動部", manager: "陳柏宇", phone: "0922-555-816", email: "pt02@impr.com.tw", status: "待排班", startDate: "2026-07-15", endDate: "2026-08-31", hourlyRate: 200, note: "活動支援與報到協助" },
    { id: "dispatch-001", name: "宏展人力派遣", kind: "派遣人員", department: "活動部", manager: "林怡君", phone: "02-2222-8899", email: "dispatch@example.com", status: "合約中", startDate: "2026-07-01", endDate: "2026-12-31", hourlyRate: 320, note: "大型活動現場支援" },
  ],
};

function App() {
  const [active, setActive] = useState("dashboard");
  const [adminName, setAdminName] = useState(() => localStorage.getItem("resource-admin-session") || "");
  const [settings, setSettings] = usePersistentSettings();
  const [data, setData] = useState<ResourceData>(sampleData);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("使用範例資料");

  async function refresh() {
    setLoading(true);
    try {
      const loaded = await loadSheetData(settings);
      setData(loaded);
      setMessage(hasAnySheet(settings) ? "已載入 Google Sheet 資料" : "使用範例資料");
    } catch (error) {
      setData(sampleData);
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

  const tabs = [
    { id: "dashboard", label: "總覽", icon: BarChart3 },
    { id: "accounts", label: "帳號", icon: IdCard },
    { id: "personnel", label: "派遣/工讀", icon: BriefcaseBusiness },
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
        {active === "accounts" && <Accounts accounts={filtered.accounts} />}
        {active === "personnel" && <PersonnelPage personnel={filtered.personnel} />}
        {active === "projects" && <Projects data={filtered} />}
        {active === "inventory" && <Inventory items={filtered.inventory} />}
        {active === "loans" && <Loans loans={filtered.loans} />}
        {active === "vendors" && <Vendors vendors={filtered.vendors} />}
        {active === "cases" && <Cases cases={filtered.cases} />}
        {active === "budget" && <Budget items={filtered.budget} />}
        {active === "settings" && <SettingsPanel settings={settings} setSettings={setSettings} onRefresh={refresh} />}
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

function Accounts({ accounts }: { accounts: Account[] }) {
  const managers = accounts.filter((account) => account.role === "manager");
  const staff = accounts.filter((account) => account.role === "staff");

  return (
    <section className="view-stack">
      <div className="metric-grid compact-metrics">
        <Metric icon={IdCard} label="全部帳號" value={accounts.length} />
        <Metric icon={CheckCircle2} label="管理者" value={managers.length} />
        <Metric icon={UsersRound} label="同仁" value={staff.length} />
      </div>

      <Panel title="帳號管理" action={<ExportButton rows={accounts} filename="accounts.csv" />}>
        <DataTable
          columns={["姓名", "Email", "角色", "部門", "狀態", "備註"]}
          rows={accounts.map((account) => [
            account.name,
            account.email,
            account.role === "manager" ? "管理者" : "同仁",
            account.department,
            account.status,
            account.note,
          ])}
        />
      </Panel>
    </section>
  );
}

function PersonnelPage({ personnel }: { personnel: Personnel[] }) {
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

      <Panel title="派遣人員 / 工讀生" action={<ExportButton rows={personnel} filename="personnel.csv" />}>
        <DataTable
          columns={["姓名/單位", "項目", "部門", "管理者", "電話", "Email", "狀態", "期間", "時薪/單價", "備註"]}
          rows={personnel.map((person) => [
            person.name,
            person.kind,
            person.department,
            person.manager,
            person.phone,
            person.email,
            person.status,
            `${person.startDate || "未定"} → ${person.endDate || "未定"}`,
            person.hourlyRate ? money(person.hourlyRate) : "",
            person.note,
          ])}
        />
      </Panel>
    </section>
  );
}

function Projects({ data }: { data: ResourceData }) {
  return (
    <section className="view-stack">
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
                <StatusBadge status={project.status} />
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

function Inventory({ items }: { items: InventoryItem[] }) {
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

      <Panel title="物資清單" action={<ExportButton rows={items} filename="inventory.csv" />}>
        <DataTable
          columns={["名稱", "類別", "管理者", "總量", "借出", "可借", "位置", "備註"]}
          rows={items.map((item) => [
            item.name,
            item.category,
            item.manager,
            item.quantity,
            item.borrowed,
            Math.max(0, item.quantity - item.borrowed),
            item.location,
            item.note,
          ])}
        />
      </Panel>
    </section>
  );
}

function Loans({ loans }: { loans: Loan[] }) {
  return (
    <Panel title="借用紀錄" action={<ExportButton rows={loans} filename="loans.csv" />}>
      <DataTable
        columns={["用途", "借用人", "狀態", "預計", "借出", "歸還", "項目"]}
        rows={loans.map((loan) => [
          loan.purpose,
          loan.borrower,
          loanLabels[loan.status] ?? loan.status,
          loan.plannedAt,
          loan.borrowedAt,
          loan.returnedAt,
          loan.items,
        ])}
      />
    </Panel>
  );
}

function Vendors({ vendors }: { vendors: Vendor[] }) {
  return (
    <section className="card-grid">
      {vendors.map((vendor) => (
        <article className="info-card" key={vendor.id}>
          <div className="card-heading">
            <div>
              <span className="code">{vendor.type || "未分類"}</span>
              <h2>{vendor.name}</h2>
            </div>
            <UsersRound size={18} />
          </div>
          <p>{vendor.note || "尚無備註"}</p>
          <div className="meta-grid">
            <span>聯絡人：{vendor.contact || "未填"}</span>
            <span>電話：{vendor.phone || "未填"}</span>
            <span>Email：{vendor.email || "未填"}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function Cases({ cases }: { cases: CaseStudy[] }) {
  const grouped = groupBy(cases, (item) => String(item.year || "未指定"));
  return (
    <section className="view-stack">
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
                    <FileText size={18} />
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

function Budget({ items }: { items: BudgetItem[] }) {
  const rows = Object.values(groupBy(items, (item) => item.projectId || item.projectName)).map((projectItems) => {
    const first = projectItems[0];
    const income = projectItems.filter((item) => item.type === "income").reduce((sum, item) => sum + item.actual, 0);
    const expense = projectItems.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.actual, 0);
    const planned = projectItems.reduce((sum, item) => sum + item.planned, 0);
    return {
      project: first.projectName || first.projectId,
      planned,
      income,
      expense,
      profit: income - expense,
      paid: projectItems.filter((item) => item.paid).length,
      total: projectItems.length,
    };
  });

  return (
    <Panel title="預算結算" action={<ExportButton rows={items} filename="budget.csv" />}>
      <DataTable
        columns={["專案", "規劃金額", "實際收入", "實際支出", "實際利潤", "已付款/收款"]}
        rows={rows.map((row) => [
          row.project,
          money(row.planned),
          money(row.income),
          money(row.expense),
          money(row.profit),
          `${row.paid}/${row.total}`,
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

function DataTable({ columns, rows }: { columns: string[]; rows: (string | number | boolean)[][] }) {
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
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell || "")}</td>)}</tr>
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
      return raw ? { ...emptySettings, ...JSON.parse(raw) } : emptySettings;
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

  const [projects, inventory, loans, vendors, cases, budget, accounts, personnel] = await Promise.all([
    loadCsv(settings.projects, sampleData.projects, mapProject),
    loadCsv(settings.inventory, sampleData.inventory, mapInventory),
    loadCsv(settings.loans, sampleData.loans, mapLoan),
    loadCsv(settings.vendors, sampleData.vendors, mapVendor),
    loadCsv(settings.cases, sampleData.cases, mapCase),
    loadCsv(settings.budget, sampleData.budget, mapBudget),
    loadCsv(settings.accounts, sampleData.accounts, mapAccount),
    loadCsv(settings.personnel, sampleData.personnel, mapPersonnel),
  ]);

  return { projects, inventory, loans, vendors, cases, budget, accounts, personnel };
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
    department: pick(row, ["department", "部門", "單位"]),
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
  };
}

function groupBy<T>(rows: T[], keyer: (row: T) => string) {
  return rows.reduce<Record<string, T[]>>((groups, row) => {
    const key = keyer(row);
    groups[key] ||= [];
    groups[key].push(row);
    return groups;
  }, {});
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
