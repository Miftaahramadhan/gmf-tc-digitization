# GMF TC Digitization — Capability Submission Monitoring System

Sistem digitalisasi proses Capability Submission di divisi TC (Technical Center) PT. GMF AeroAsia, dibangun di atas platform **ERPNext v16 / Frappe Framework** yang di-deploy via Docker.

---

## 📋 Fitur Utama

### 1. Capability Submission Monitoring
- DocType **Capability Submission** untuk pengajuan kapabilitas engineer
- Workflow approval multi-role: **TC Engineer** dan **TC Quality**
- Status tracking: `Draft` → `Submitted` → `Under Review` → `Approved` / `Revision` → `Signed`
- Status bar berwarna di form (biru, oranye, merah, hijau, ungu)

### 2. Sistem Diskusi (WhatsApp-style Chat)
- Komentar real-time antar Engineer dan Quality langsung di dalam form
- Tampilan chat bubble dengan identitas role pengirim
- Kirim pesan dengan tombol atau tekan Enter

### 3. Workflow Tombol Aksi
- **TC Quality**: Set Under Review, Approve, Request Revision
- **TC Engineer**: Edit & Resubmit (saat status Revision)

### 4. E-Sign Digital (Custom Canvas)
- Tombol **E-Sign Dokumen** muncul saat status Approved (khusus TC Quality)
- Preview dokumen PDF attachment langsung di dalam ERPNext menggunakan **PDF.js**
- User klik posisi di atas preview PDF untuk menentukan letak tanda tangan
- Canvas tanda tangan digital (coret menggunakan mouse/touchpad)
- Tanda tangan di-embed langsung ke dokumen PDF asli menggunakan **reportlab** + **pypdf**
- Dokumen yang sudah ditandatangani otomatis ter-download
- Status submission otomatis berubah menjadi **Signed** setelah tanda tangan disimpan

### 5. Workspace GMF TC
- Workspace khusus di ERPNext sidebar untuk semua role TC

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| Platform | ERPNext v16.16.0 / Frappe Framework |
| Deployment | Docker Compose (Ubuntu 22.04) |
| Database | MariaDB 11.8 |
| Cache | Redis |
| Custom App | Python (Frappe App: `gmf_tc`) |
| PDF Processing | pypdf, reportlab, Pillow |
| PDF Preview | PDF.js (Mozilla) |
| Frontend | Frappe Client Script (JavaScript) |

---

## 📁 Struktur App
gmf_tc/

├── gmf_tc/

│   ├── api.py              # Whitelisted API: save_signature (E-Sign)

│   └── www/

│       ├── docusign_callback.py    # OAuth callback handler (legacy)

│       └── docusign_callback.html  # OAuth callback page (legacy)

├── pyproject.toml          # Dependencies: Pillow, reportlab

└── README.md

---

## ⚙️ Instalasi

### Prerequisites
- Docker & Docker Compose
- ERPNext v16 via Frappe Docker

### Install Custom App

```bash
# Dari dalam container backend
bench new-app gmf_tc

# Install ke site
bench --site [site-name] install-app gmf_tc

# Install Python dependencies
/path/to/bench/env/bin/pip install -e apps/gmf_tc
```

### Konfigurasi

Tambahkan konfigurasi berikut ke `site_config.json`:

```json
{
  "developer_mode": 1
}
```

---

## 👥 Role & Akses

| Role | Akses |
|---|---|
| TC Engineer | Buat & submit Capability Submission, Edit & Resubmit saat Revision |
| TC Quality | Review, Approve, Request Revision, E-Sign dokumen |

---

## 🏢 Tentang Project

Project ini dikerjakan sebagai bagian dari program **Internship/Magang** di **PT. GMF AeroAsia** divisi TC (Technical Center) — Engineering Component Maintenance, dalam rangka digitalisasi proses pengajuan kapabilitas engineer yang sebelumnya dilakukan secara manual.

**Universitas**: Universitas Trisakti  
**Divisi**: TC (Technical Center) — Engineering Component Maintenance  
**Platform**: ERPNext v16 / Frappe Framework
