import base64
import io
import os

import frappe
import frappe.integrations.utils


DOCUSEAL_BASE_URL = "http://172.18.0.1:3000"

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff")
DOCUMENT_EXTENSIONS = (".pdf", ".docx", ".doc")


def _get_file_doc(submission):
	attachment = submission.get("attachment")
	if not attachment:
		return None
	file_doc = frappe.get_all(
		"File",
		filters={"file_url": attachment},
		fields=["name", "file_name", "file_url", "is_private"],
		limit=1,
	)
	if not file_doc:
		return None
	return frappe.get_doc("File", file_doc[0]["name"])


def _read_file_bytes(file_doc):
	file_path = file_doc.get_full_path()
	with open(file_path, "rb") as f:
		return f.read()


def _convert_image_to_pdf(image_bytes):
	from PIL import Image
	image = Image.open(io.BytesIO(image_bytes))
	if image.mode != "RGB":
		image = image.convert("RGB")
	pdf_buffer = io.BytesIO()
	image.save(pdf_buffer, format="PDF")
	return pdf_buffer.getvalue()


def _embed_signature_to_pdf(pdf_bytes, signature_bytes, page=0, sig_x=None, sig_y=None, pdf_canvas_width=None, pdf_canvas_height=None):
	from reportlab.pdfgen import canvas as rl_canvas
	from reportlab.lib.utils import ImageReader
	from pypdf import PdfReader, PdfWriter

	sig_image = ImageReader(io.BytesIO(signature_bytes))
	sig_width = 200
	sig_height = 80

	reader = PdfReader(io.BytesIO(pdf_bytes))
	total_pages = len(reader.pages)
	page_index = int(page) if page is not None else total_pages - 1
	if page_index >= total_pages:
		page_index = total_pages - 1

	target_page = reader.pages[page_index]
	page_width = float(target_page.mediabox.width)
	page_height = float(target_page.mediabox.height)

	if sig_x is not None and sig_y is not None and pdf_canvas_width and pdf_canvas_height:
		canvas_w = float(pdf_canvas_width)
		canvas_h = float(pdf_canvas_height)
		click_x = float(sig_x)
		click_y = float(sig_y)
		scale_x = page_width / canvas_w
		scale_y = page_height / canvas_h
		pdf_x = click_x * scale_x
		pdf_y_from_top = click_y * scale_y
		x = pdf_x - sig_width / 2
		y = page_height - pdf_y_from_top - sig_height / 2
		x = max(0, min(x, page_width - sig_width))
		y = max(0, min(y, page_height - sig_height))
	else:
		x = page_width - sig_width - 50
		y = 50

	overlay_buffer = io.BytesIO()
	c = rl_canvas.Canvas(overlay_buffer, pagesize=(page_width, page_height))
	c.drawImage(sig_image, x, y, width=sig_width, height=sig_height, mask="auto")
	c.save()

	overlay_buffer.seek(0)
	overlay_reader = PdfReader(overlay_buffer)

	writer = PdfWriter()
	for i, pg in enumerate(reader.pages):
		if i == page_index:
			pg.merge_page(overlay_reader.pages[0])
		writer.add_page(pg)

	output_buffer = io.BytesIO()
	writer.write(output_buffer)
	return output_buffer.getvalue()


@frappe.whitelist()
def save_signature(doc_name, signature_base64, page=0, sig_x=None, sig_y=None, pdf_canvas_width=None, pdf_canvas_height=None):
	try:
		submission = frappe.get_doc("Capability Submission", doc_name)
	except frappe.DoesNotExistError:
		return {"success": False, "message": "Capability Submission tidak ditemukan."}

	try:
		signature_bytes = base64.b64decode(signature_base64)
	except Exception as e:
		return {"success": False, "message": "Format tanda tangan tidak valid: " + str(e)}

	file_doc = _get_file_doc(submission)
	if not file_doc:
		return {"success": False, "message": "Tidak ada dokumen attachment pada submission ini."}

	try:
		raw_bytes = _read_file_bytes(file_doc)
		file_name = file_doc.file_name or "document"
		extension = os.path.splitext(file_name)[1].lower()

		if extension in IMAGE_EXTENSIONS:
			pdf_bytes = _convert_image_to_pdf(raw_bytes)
		elif extension == ".pdf":
			pdf_bytes = raw_bytes
		else:
			return {"success": False, "message": "Format file tidak didukung: " + extension}

		signed_pdf_bytes = _embed_signature_to_pdf(
			pdf_bytes, signature_bytes,
			page=page,
			sig_x=sig_x,
			sig_y=sig_y,
			pdf_canvas_width=pdf_canvas_width,
			pdf_canvas_height=pdf_canvas_height
		)
	except Exception as e:
		return {"success": False, "message": "Gagal memproses dokumen: " + str(e)}

	signer_name = frappe.utils.get_fullname(frappe.session.user)
	signed_file_name = "signed_" + os.path.splitext(file_name)[0] + ".pdf"

	try:
		signed_file_doc = frappe.get_doc({
			"doctype": "File",
			"file_name": signed_file_name,
			"attached_to_doctype": "Capability Submission",
			"attached_to_name": doc_name,
			"content": signed_pdf_bytes,
			"is_private": 1,
		})
		signed_file_doc.insert(ignore_permissions=True)
		frappe.db.set_value("Capability Submission", doc_name, "status", "Signed")
		frappe.db.commit()
	except Exception as e:
		return {"success": False, "message": "Gagal menyimpan dokumen: " + str(e)}

	return {
		"success": True,
		"message": "Dokumen berhasil ditandatangani oleh " + signer_name + ".",
		"file_url": signed_file_doc.file_url,
		"file_name": signed_file_name,
	}
