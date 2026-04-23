import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ja: {
    translation: {
      logo: "SPY-MODOKI",
      nav: {
        encode: "ファイルを保護",
        decode: "ファイルを復元",
      },
      panel: {
        targetFile: "対象ファイル",
        spyFile: "保護済みファイル (.spy)",
        dropBox: "選択またはドラッグ＆ドロップ",
        pathPlaceholder: "ファイルパス",
        btnBrowse: "参照",
        timerLabel: "有効期限設定",
        timerReset: "0秒にリセット (即時破壊仕様)",
        keyLabel: "全角合鍵 (16文字)",
        keyPlaceholder: "合鍵を入力してください",
        generatedKeyLabel: "生成された合鍵 (コピーで破棄されます)",
        btnCopyClose: "合鍵をコピーして終了",
      },
      status: {
        encodeInfo: "※ 新しい暗号化ファイルを作成します。元のファイルは変更・削除されず維持されます",
        decodeWarning: "警告：期限切れや入力ミスでファイルは物理破壊されます",
        processingEncrypt: "暗号化処理を実行中...",
        processingDecrypt: "復元処理を試行中...",
        successDecrypt: "復元成功: {{path}}",
        copied: "合鍵をコピーしました。",
      },
      btn: {
        startEncode: "保護を開始",
        startDecode: "復元を実行",
      },
      settings: {
        title: "隠密設定",
        language: "言語 / Language",
        saveMode: "保存先モード",
        saveModeDialog: "毎回ダイアログで指定",
        saveModeFolder: "固定フォルダに保存",
        folderLabel: "保存先フォルダ",
        btnSelectFolder: "フォルダを選択",
        btnClose: "設定を閉じる",
      },
      fileSuffix: "_復元",
    },
  },
  en: {
    translation: {
      logo: "SPY-MODOKI",
      nav: {
        encode: "Protect File",
        decode: "Restore File",
      },
      panel: {
        targetFile: "Target File",
        spyFile: "Protected File (.spy)",
        dropBox: "Click or Drag & Drop",
        pathPlaceholder: "File path",
        btnBrowse: "Browse",
        timerLabel: "Expiration Timer",
        timerReset: "Reset to 0s (Instant Destruction)",
        keyLabel: "Full-width Key (16 chars)",
        keyPlaceholder: "Enter access key",
        generatedKeyLabel: "Generated Key (Destroyed after copy)",
        btnCopyClose: "Copy Key and Exit",
      },
      status: {
        encodeInfo: "* Creates a new encrypted file. Original file remains untouched.",
        decodeWarning: "WARNING: File will be physically destroyed on expiration or wrong key.",
        processingEncrypt: "Encrypting...",
        processingDecrypt: "Restoring...",
        successDecrypt: "Restored: {{path}}",
        copied: "Key copied to clipboard.",
      },
      btn: {
        startEncode: "Start Protection",
        startDecode: "Execute Restoration",
      },
      settings: {
        title: "Spy Settings",
        language: "Language",
        saveMode: "Save Destination",
        saveModeDialog: "Always ask (Dialog)",
        saveModeFolder: "Fixed folder",
        folderLabel: "Storage Folder",
        btnSelectFolder: "Select Folder",
        btnClose: "Close Settings",
      },
      fileSuffix: "_restored",
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("spy_modoki_lang") || "ja",
    fallbackLng: "ja",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
