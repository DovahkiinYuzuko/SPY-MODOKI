# SPY-MODOKI

[日本語](#日本語) | [English](#english)

---

# 日本語

## 概要
SPY-MODOKIは、極めて利便性が低く、かつ堅牢な防御を備えた「嫌がらせ暗号システム」です。
古典暗号と現代暗号を組み合わせた多段防御に加え、時間制限による自己破壊機能を搭載しており、スパイ映画のような緊張感のあるファイル保護を提供します。

## 特徴
- **多段暗号化**: 古典的なヴィジュネル暗号（バイトレベルXOR）と、現代のAES-256-GCMを組み合わせた堅牢な処理。
- **全角合鍵**: 16文字の全角文字によるアクセスキー生成。利便性をあえて低下させることで、入力時の緊張感を演出。
- **自己破壊機能**: 指定された有効期限を1秒でも過ぎた場合、または鍵の入力を3回間違えた場合、ファイルはランダムデータで3回上書きされ、物理的に破壊されます。
- **証拠隠滅**: 復元に成功した際、元の暗号化ファイル（.spy）は自動的に物理破壊され、痕跡を残しません。
- **マルチリンガル**: 日本語と英語のUIに対応。

## 技術仕様
- **鍵派生**: Argon2id (Salt: 16-byte random)
- **暗号化**: AES-256-GCM (Nonce: 12-byte random)
- **前処理**: Vigenere XOR (バイトレベル)
- **バックエンド**: Rust (Tauri)
- **フロントエンド**: React + TypeScript

## インストールとビルド
本アプリケーションはTauriフレームワークを使用しており、各OS向けのバイナリをビルドすることが可能です。

### 必要な環境
- Rust (Cargo)
- Node.js (npm)

### ビルド手順

#### Windows
```bash
cd app
npm install
npm run tauri build
```
`app/src-tauri/target/release/bundle` 配下に `.exe` および `.msi` が生成されます。

#### macOS / Linux
ソースコード自体はマルチプラットフォームに対応していますが、各OS向けのバイナリを作成するにはそれぞれの環境でビルドが必要です。
```bash
cd app
npm install
npm run tauri build
```
macOSでは `.dmg` または `.app`、Linuxでは `.deb` または `.AppImage` が生成されます。

## 免責事項
本ソフトウェアの「物理破壊機能」によって失われたデータの復元は不可能です。利用の際は、オリジナルデータのバックアップを適切に管理してください。開発者は本ソフトウェアの使用によって生じたいかなる損害についても責任を負いません。

---

# English

## Overview
SPY-MODOKI is a "Unforgiving Encryption System" designed with extremely low usability and robust defense. 
Featuring multi-layered protection combining classical and modern cryptography, along with a time-limited self-destruction mechanism, it provides file protection with the tension of a spy movie.

## Features
- **Multi-layered Encryption**: Robust processing combining classical Vigenère cipher (byte-level XOR) with modern AES-256-GCM.
- **Full-width Access Key**: Generates a 16-character full-width access key. Deliberately lowers usability to create tension during entry.
- **Self-Destruction Mechanism**: If the specified expiration time passes by even one second, or if the key is entered incorrectly three times, the file is overwritten with random data three times and physically destroyed.
- **Evidence Elimination**: Upon successful restoration, the original encrypted file (.spy) is automatically physically destroyed, leaving no trace.
- **Multilingual**: Supports both Japanese and English UI.

## Technical Specifications
- **Key Derivation**: Argon2id (Salt: 16-byte random)
- **Encryption**: AES-256-GCM (Nonce: 12-byte random)
- **Pre-processing**: Vigenère XOR (Byte-level)
- **Backend**: Rust (Tauri)
- **Frontend**: React + TypeScript

## Installation and Build
This application uses the Tauri framework, allowing you to build binaries for various operating systems.

### Prerequisites
- Rust (Cargo)
- Node.js (npm)

### Build Instructions

#### Windows
```bash
cd app
npm install
npm run tauri build
```
The `.exe` and `.msi` installers will be generated in `app/src-tauri/target/release/bundle`.

#### macOS / Linux
The source code is cross-platform compatible, but you must build on the target OS to create platform-specific binaries.
```bash
cd app
npm install
npm run tauri build
```
macOS will generate `.dmg` or `.app`, and Linux will generate `.deb` or `.AppImage`.

## Disclaimer
Data lost due to this software's "Physical Destruction Feature" is unrecoverable. Please manage backups of your original data appropriately. The developer assumes no responsibility for any damage resulting from the use of this software.
