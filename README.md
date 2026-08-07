# GMF TC Digitization — Capability Submission Monitoring System

Sistem digitalisasi proses Capability Submission di divisi TC (Technical Center) PT. GMF AeroAsia, dibangun di atas platform **ERPNext v16 / Frappe Framework** yang di-deploy via Docker.

**Repository**: https://github.com/Miftaahramadhan/gmf-tc-digitization

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
- **TC Engineer**: Submit pengajuan baru, Edit & Resubmit (saat status Revision)
- **TC Quality**: Set Under Review, Approve, Request Revision

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
| Deployment | Docker Compose (Ubuntu 22.04 / macOS lokal) |
| Database | MariaDB 11.8 |
| Cache | Redis |
| Custom App | Python (Frappe App: `gmf_tc`) |
| PDF Processing | pypdf, reportlab, Pillow |
| PDF Preview | PDF.js (Mozilla) |
| Frontend | Frappe Client Script (JavaScript) |

---

## 📁 Struktur App

```
gmf_tc/
├── gmf_tc/
│   ├── api.py                          # Whitelisted API: save_signature (E-Sign)
│   ├── hooks.py                        # Frappe app hooks & config
│   ├── gmf_tc/
│   │   └── doctype/
│   │       └── capability_submission/  # DocType inti sistem
│   │           ├── capability_submission.json   # Definisi field & schema
│   │           ├── capability_submission.py     # Server-side controller
│   │           ├── capability_submission.js     # Client-side (form) script
│   │           └── test_capability_submission.py
│   └── www/
│       ├── docusign_callback.py        # OAuth callback handler (legacy, sudah tidak dipakai)
│       └── docusign_callback.html      # OAuth callback page (legacy, sudah tidak dipakai)
├── client_script_capability_submission.js  # Client Script tambahan (chat, workflow, e-sign)
├── pyproject.toml                      # Dependencies: Pillow, reportlab
└── README.md
```

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
| TC Quality | Set Under Review, Approve, Request Revision, E-Sign dokumen |

---

## ✅ Status Project

Sistem telah diuji menggunakan metode Black Box Testing dengan seluruh skenario pengujian (login, workflow submit-review-approve, diskusi, e-signature, dan deployment Docker) berjalan sesuai harapan. Sistem saat ini berjalan pada lingkungan pengembangan lokal (Docker) sebagai bagian dari persiapan sidang magang.

---

## 🏢 Tentang Project

Project ini dikerjakan sebagai bagian dari program **Internship/Magang** di **PT. GMF AeroAsia** divisi TC (Technical Center) — Engineering Component Maintenance, dalam rangka digitalisasi proses pengajuan kapabilitas engineer yang sebelumnya dilakukan secara manual.

**Universitas**: Universitas Trisakti
**Program Studi**: Teknik Informatika
**Divisi**: TC (Technical Center) — Engineering Component Maintenance
**Platform**: ERPNext v16 / Frappe Framework

## 👤 Author

**Miftah Ramadhan**
NIM: 064002300028
GitHub: [@Miftaahramadhan](https://github.com/Miftaahramadhan)
