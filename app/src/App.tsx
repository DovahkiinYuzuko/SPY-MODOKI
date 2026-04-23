import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";
import { basename, join, extname } from "@tauri-apps/api/path";
import "./App.css";

const MIN_SECONDS = 0;
const MAX_SECONDS = 31536000;

interface TimeStep {
  label: string;
  s: number;
}

const TIME_STEPS: TimeStep[] = [
  { label: "1年", s: 31536000 },
  { label: "30日", s: 2592000 },
  { label: "1日", s: 86400 },
  { label: "1時間", s: 3600 },
  { label: "10分", s: 600 },
  { label: "1分", s: 60 },
  { label: "30秒", s: 30 },
];

interface AppSettings {
  lang: "ja" | "en";
  saveMode: "dialog" | "folder";
  fixedFolderPath: string;
}

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"encode" | "decode">("encode");
  const [filePath, setFilePath] = useState<string>("");
  const [totalSeconds, setTotalSeconds] = useState(3600);
  const [selectedUnit, setSelectedUnit] = useState(30);
  const [accessKey, setAccessKey] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("spy_modoki_settings");
    return saved ? JSON.parse(saved) : {
      lang: "ja",
      saveMode: "dialog",
      fixedFolderPath: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("spy_modoki_settings", JSON.stringify(settings));
    localStorage.setItem("spy_modoki_lang", settings.lang);
    i18n.changeLanguage(settings.lang);
  }, [settings, i18n]);

  const selectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: activeTab === "encode" 
          ? [{ name: "すべてのファイル", extensions: ["*"] }]
          : [{ name: "SPYファイル", extensions: ["spy"] }]
      });
      if (selected && typeof selected === "string") setFilePath(selected);
    } catch (e) {
      console.error(e);
    }
  };

  const selectFixedFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setSettings(prev => ({ ...prev, fixedFolderPath: selected }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let unlisten: any;
    const setup = async () => {
      unlisten = await listen("tauri://drag-drop", (event: any) => {
        const paths = (event.payload as any).paths;
        if (paths && paths.length > 0) {
          setFilePath(paths[0]);
        }
      });
    };
    setup();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const adjustTime = (dir: number) => {
    setTotalSeconds((prev) => {
      const next = prev + selectedUnit * dir;
      return Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, next));
    });
  };

  const formatTime = (s: number) => {
    let temp = s;
    const days = Math.floor(temp / 86400);
    temp %= 86400;
    const hours = Math.floor(temp / 3600);
    temp %= 3600;
    const mins = Math.floor(temp / 60);
    const secs = temp % 60;
    return `${String(days).padStart(2, "0")}D ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleEncrypt = async () => {
    if (!filePath) return;
    setIsProcessing(true);
    setStatusMessage(t("status.processingEncrypt"));
    try {
      let targetPath: string | null = null;
      const fileName = await basename(filePath);

      if (settings.saveMode === "dialog") {
        targetPath = await save({
          defaultPath: `${fileName}.spy`,
          filters: [{ name: "SPYファイル", extensions: ["spy"] }]
        });
      } else if (settings.fixedFolderPath) {
        targetPath = await join(settings.fixedFolderPath, `${fileName}.spy`);
      } else {
        targetPath = await save({
          defaultPath: `${fileName}.spy`,
          filters: [{ name: "SPYファイル", extensions: ["spy"] }]
        });
      }

      if (!targetPath) {
        setStatusMessage("");
        setIsProcessing(false);
        return;
      }

      const key: string = await invoke("generate_full_width_key");
      await invoke("encrypt_file_command", { 
        sourcePath: filePath, 
        outputPath: targetPath,
        key: key, 
        secondsValid: totalSeconds 
      });
      setGeneratedKey(key);
      setStatusMessage("");
      setFilePath("");
    } catch (e) {
      setStatusMessage(`Error: ${e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!filePath || !accessKey) return;
    setIsProcessing(true);
    setStatusMessage(t("status.processingDecrypt"));
    try {
      let targetPath: string | null = null;
      const fileName = await basename(filePath);
      
      let baseName = fileName.endsWith(".spy") ? fileName.slice(0, -4) : fileName;
      const ext = await extname(baseName);
      const nameWithoutExt = baseName.slice(0, baseName.length - (ext ? ext.length + 1 : 0));
      const restoredName = ext ? `${nameWithoutExt}${t("fileSuffix")}.${ext}` : `${baseName}${t("fileSuffix")}`;

      if (settings.saveMode === "dialog") {
        targetPath = await save({
          defaultPath: restoredName,
        });
      } else if (settings.fixedFolderPath) {
        targetPath = await join(settings.fixedFolderPath, restoredName);
      } else {
        targetPath = await save({
          defaultPath: restoredName,
        });
      }

      if (!targetPath) {
        setStatusMessage("");
        setIsProcessing(false);
        return;
      }

      const result: string = await invoke("decrypt_file_command", { 
        sourcePath: filePath,
        outputPath: targetPath,
        key: accessKey 
      });
      setStatusMessage(t("status.successDecrypt", { path: result }));
      setFilePath("");
      setAccessKey("");
    } catch (e) {
      setStatusMessage(`${e}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setGeneratedKey(null);
    setStatusMessage(t("status.copied"));
  };

  const switchTab = (tab: "encode" | "decode") => {
    setActiveTab(tab);
    setGeneratedKey(null);
    setStatusMessage("");
    setFilePath("");
    setAccessKey("");
  };

  return (
    <div className="app-container fade-in">
      <header className="topbar">
        <div className="app-logo">{t("logo")}</div>
        <div className="topbar-tools">
          <button 
            className="icon-btn" 
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Settings"
            title={t("settings.title")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </header>

      <div className="layout-body">
        <aside className="sidebar">
          <div 
            className={`nav-item ${activeTab === "encode" ? "active" : ""}`} 
            onClick={() => switchTab("encode")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && switchTab("encode")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>{t("nav.encode")}</span>
          </div>
          <div 
            className={`nav-item ${activeTab === "decode" ? "active" : ""}`} 
            onClick={() => switchTab("decode")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && switchTab("decode")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.01 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78z"/><path d="M12 2l2 2m-2 0l-2 2m11 4l-2 2m2 0l-2-2m-11 1l-2 2m2 0l-2-2"/></svg>
            <span>{t("nav.decode")}</span>
          </div>
        </aside>

        <main className="main-content">
          {generatedKey ? (
            <div className="key-panel fade-in">
              <label className="section-label" htmlFor="generated-key-display">{t("panel.generatedKeyLabel")}</label>
              <div className="key-display" id="generated-key-display">{generatedKey}</div>
              <button 
                className="btn-execute" 
                onClick={copyKey}
                aria-label={t("panel.btnCopyClose")}
              >
                {t("panel.btnCopyClose")}
              </button>
            </div>
          ) : (
            <>
              <div className="panel fade-in">
                <label className="section-label" htmlFor="file-path-input">
                  {activeTab === "encode" ? t("panel.targetFile") : t("panel.spyFile")}
                </label>
                <div 
                  className="drop-box" 
                  onClick={selectFile}
                  role="button"
                  aria-label={t("panel.dropBox")}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && selectFile()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>{t("panel.dropBox")}</span>
                </div>
                <div className="path-row">
                  <input 
                    type="text" 
                    id="file-path-input"
                    className="path-input" 
                    value={filePath} 
                    readOnly 
                    placeholder={t("panel.pathPlaceholder")} 
                  />
                  <button className="btn-tool" onClick={selectFile} aria-label={t("panel.btnBrowse")}>{t("panel.btnBrowse")}</button>
                </div>
              </div>

              {activeTab === "encode" ? (
                <div className="panel fade-in">
                  <label className="section-label">{t("panel.timerLabel")}</label>
                  <div className="timer-panel">
                    <div className="timer-display" aria-live="polite">{formatTime(totalSeconds)}</div>
                    <div className="unit-chips">
                      {TIME_STEPS.map(step => (
                        <label key={step.label}>
                          <input 
                            type="radio"
                            className="hidden-input"
                            name="time-unit"
                            checked={selectedUnit === step.s}
                            onChange={() => setSelectedUnit(step.s)}
                          />
                          <div 
                            className="unit-chip"
                            role="presentation"
                          >
                            {step.label}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="adjuster-row">
                      <button className="adj-btn" onClick={() => adjustTime(-1)} aria-label="Decrease timer">－</button>
                      <button className="adj-btn" onClick={() => adjustTime(1)} aria-label="Increase timer">＋</button>
                    </div>
                    <div 
                      className="reset-tool" 
                      onClick={() => setTotalSeconds(0)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setTotalSeconds(0)}
                    >
                      {t("panel.timerReset")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel fade-in">
                  <label className="section-label" htmlFor="access-key-input">{t("panel.keyLabel")}</label>
                  <input 
                    type="text" 
                    id="access-key-input"
                    className="text-input" 
                    value={accessKey} 
                    onChange={(e) => setAccessKey(e.target.value)} 
                    placeholder={t("panel.keyPlaceholder")} 
                    maxLength={16} 
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="status-area">
        <div className="status-info">
          {activeTab === "encode" ? (
            <p className="info-text">{t("status.encodeInfo")}</p>
          ) : (
            <p className="info-text danger-text">{t("status.decodeWarning")}</p>
          )}
          <p className="info-text" aria-live="polite">{statusMessage}</p>
        </div>
        {!generatedKey && (
          <button 
            className={`btn-execute ${activeTab === "decode" ? "danger" : ""}`}
            onClick={activeTab === "encode" ? handleEncrypt : handleDecrypt}
            disabled={isProcessing || !filePath || (activeTab === "decode" && !accessKey)}
          >
            {activeTab === "encode" ? t("btn.startEncode") : t("btn.startDecode")}
          </button>
        )}
      </footer>

      {isSettingsOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <h2 className="modal-title" id="settings-title">{t("settings.title")}</h2>
            
            <div className="setting-item">
              <label>{t("settings.language")}</label>
              <div className="setting-row">
                <label className="flex-1">
                  <input 
                    type="radio" 
                    className="hidden-input" 
                    name="settings-lang"
                    checked={settings.lang === "ja"}
                    onChange={() => setSettings(prev => ({ ...prev, lang: "ja" }))}
                  />
                  <div className="btn-toggle">日本語</div>
                </label>
                <label className="flex-1">
                  <input 
                    type="radio" 
                    className="hidden-input" 
                    name="settings-lang"
                    checked={settings.lang === "en"}
                    onChange={() => setSettings(prev => ({ ...prev, lang: "en" }))}
                  />
                  <div className="btn-toggle">English</div>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label>{t("settings.saveMode")}</label>
              <div className="setting-column">
                <label>
                  <input 
                    type="radio" 
                    className="hidden-input" 
                    name="settings-save-mode"
                    checked={settings.saveMode === "dialog"}
                    onChange={() => setSettings(prev => ({ ...prev, saveMode: "dialog" }))}
                  />
                  <div className="btn-choice">{t("settings.saveModeDialog")}</div>
                </label>
                <label>
                  <input 
                    type="radio" 
                    className="hidden-input" 
                    name="settings-save-mode"
                    checked={settings.saveMode === "folder"}
                    onChange={() => setSettings(prev => ({ ...prev, saveMode: "folder" }))}
                  />
                  <div className="btn-choice">{t("settings.saveModeFolder")}</div>
                </label>
              </div>
            </div>

            {settings.saveMode === "folder" && (
              <div className="setting-item fade-in">
                <label htmlFor="fixed-folder-input">{t("settings.folderLabel")}</label>
                <div className="path-row">
                  <input type="text" id="fixed-folder-input" className="path-input" value={settings.fixedFolderPath} readOnly />
                  <button className="btn-tool" onClick={selectFixedFolder}>{t("settings.btnSelectFolder")}</button>
                </div>
              </div>
            )}

            <button className="btn-main" onClick={() => setIsSettingsOpen(false)}>
              {t("settings.btnClose")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
