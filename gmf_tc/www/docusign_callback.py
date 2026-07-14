import frappe
import frappe.integrations.utils

B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

def b64(s):
    bs = bytes(s, "utf-8") if isinstance(s, str) else s
    r = ""
    for i in range(0, len(bs), 3):
        c = bs[i:i+3]
        n = 0
        for b in c:
            n = (n << 8) | b
        p = 3 - len(c)
        n <<= p * 8
        for j in range(4 - p):
            r += B64[(n >> (18 - j*6)) & 0x3F]
        r += "=" * p
    return r

def get_context(context):
    context.no_cache = 1
    code = frappe.form_dict.get("code")
    state = frappe.form_dict.get("state")
    error = frappe.form_dict.get("error")

    context.doc_name = state
    context.success = False
    context.message = ""

    if error:
        context.message = "DocuSign mengembalikan error: " + str(error)
        return context

    if not code:
        context.message = "Parameter code tidak ditemukan dari DocuSign."
        return context

    if not state:
        context.message = "Parameter state (doc_name) tidak ditemukan."
        return context

    try:
        submission = frappe.get_doc("Capability Submission", state)
    except Exception:
        context.message = "Capability Submission tidak ditemukan: " + str(state)
        return context

    integration_key = frappe.db.get_single_value("DocuSign Settings", "integration_key")
    secret_key = frappe.db.get_single_value("DocuSign Settings", "secret_key")
    account_id = frappe.db.get_single_value("DocuSign Settings", "account_id")
    base_uri = frappe.db.get_single_value("DocuSign Settings", "base_uri")

    cred = integration_key + ":" + secret_key
    encoded_cred = b64(cred)

    redirect_uri = frappe.utils.get_url() + "/docusign_callback"

    try:
        token_resp = frappe.integrations.utils.make_post_request(
            "https://account-d.docusign.com/oauth/token",
            headers={"Authorization": "Basic " + encoded_cred, "Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri}
        )
    except Exception as e:
        context.message = "Gagal menukar code ke token: " + str(e)
        return context

    token = token_resp.get("access_token")
    if not token:
        context.message = "Tidak ada access_token. Detail: " + str(token_resp)
        return context

    signer_email = frappe.session.user
    signer_name = frappe.utils.get_fullname(frappe.session.user)
    doc_title = submission.get("title") or submission.name

    doc_content = "Capability Submission: " + str(doc_title) + " | ID: " + str(submission.name) + " | Status: " + str(submission.status)
    doc_encoded = b64(doc_content)

    envelope = {
        "emailSubject": "Tanda Tangan: " + str(doc_title),
        "documents": [{
            "documentBase64": doc_encoded,
            "name": str(doc_title) + ".txt",
            "fileExtension": "txt",
            "documentId": "1"
        }],
        "recipients": {
            "signers": [{
                "email": signer_email,
                "name": signer_name,
                "recipientId": "1",
                "tabs": {"signHereTabs": [{"documentId": "1", "pageNumber": "1", "xPosition": "100", "yPosition": "100"}]}
            }]
        },
        "status": "sent"
    }

    try:
        env_resp = frappe.integrations.utils.make_post_request(
            base_uri + "/restapi/v2.1/accounts/" + account_id + "/envelopes",
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
            data=envelope
        )
    except Exception as e:
        context.message = "Gagal mengirim envelope: " + str(e)
        return context

    context.success = True
    context.message = "Dokumen berhasil dikirim untuk ditandatangani! Envelope ID: " + str(env_resp.get("envelopeId"))

    return context
