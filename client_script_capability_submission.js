
frappe.after_ajax(function() {
    if (frappe.user.has_role('TC Engineer') || frappe.user.has_role('TC Quality')) {
        if (window.location.pathname === '/app' || window.location.pathname === '/app/') {
            frappe.set_route('gmf-tc');
        }
    }
});

frappe.ui.form.on('Capability Submission', {
    refresh: function(frm) {
        $(frm.wrapper).find('.status-bar-custom').remove();
        $(frm.wrapper).find('.whatsapp-chat').remove();
        frm.set_df_property('status', 'hidden', 1);
        
        setTimeout(function() {
            $(frm.wrapper).find('.comment-box').hide();
            $(frm.wrapper).find('.form-comments').hide();
            $(frm.wrapper).find('.timeline-items').hide();
        }, 500);
        
        if (!frm.is_new()) {
            let status = frm.doc.status || 'Draft';
            let color = '#6c757d';
            if (status === 'Submitted') color = '#007bff';
            if (status === 'Under Review') color = '#fd7e14';
            if (status === 'Revision') color = '#dc3545';
            if (status === 'Approved') color = '#28a745';
            if (status === 'Signed') color = '#6f42c1';
            
            $(frm.footer.wrapper).prepend(
                '<div class="status-bar-custom" style="margin:10px 0; padding:10px; background:' + color + '; color:white; border-radius:5px; text-align:center; font-weight:bold;">Status: ' + status + '</div>'
            );
            let current_user = frappe.session.user;
            let is_engineer = frappe.user.has_role('TC Engineer');
            let docname = frm.doc.name;
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Comment',
                    filters: {
                        reference_doctype: 'Capability Submission',
                        reference_name: frm.doc.name,
                        comment_type: 'Comment'
                    },
                    fields: ['content', 'owner', 'creation', 'comment_by'],
                    order_by: 'creation asc',
                    limit: 100
                },
                callback: function(r) {
                    let messages = r.message || [];
                    let chat_html = '<div class="whatsapp-chat" style="background:#e5ddd5; padding:15px; border-radius:10px; margin-top:20px;"><h6 style="margin-bottom:15px; color:#333;">Diskusi</h6><div id="chat-messages-' + docname + '" style="max-height:300px; overflow-y:auto; margin-bottom:15px;">';
                    if (messages.length === 0) {
                        chat_html += '<p style="text-align:center; color:#999;">Belum ada pesan</p>';
                    }
                    messages.forEach(function(msg) {
                        let is_me = msg.owner === current_user;
                        let align = is_me ? 'right' : 'left';
                        let bg = is_me ? '#dcf8c6' : 'white';
                        let margin = is_me ? 'margin-left:30%' : 'margin-right:30%';
                        let role_label = is_me ? (is_engineer ? 'Engineer' : 'Quality') : (is_engineer ? 'Quality' : 'Engineer');
                        chat_html += '<div style="margin-bottom:10px;' + margin + '; text-align:' + align + '"><div style="background:' + bg + '; padding:8px 12px; border-radius:8px; display:inline-block; max-width:100%; text-align:left; box-shadow:0 1px 2px rgba(0,0,0,0.2)"><strong style="font-size:11px; color:#075e54">' + (msg.comment_by || msg.owner) + ' (' + role_label + ')</strong><br><span>' + msg.content + '</span><br><small style="color:#999; font-size:10px">' + frappe.datetime.str_to_user(msg.creation) + '</small></div></div>';
                    });
                    chat_html += '</div><div style="display:flex; gap:10px"><input type="text" id="chat-input-' + docname + '" placeholder="Ketik pesan..." style="flex:1; padding:8px 12px; border-radius:20px; border:1px solid #ccc; outline:none"><button id="send-btn-' + docname + '" style="background:#075e54; color:white; border:none; padding:8px 20px; border-radius:20px; cursor:pointer; font-weight:bold">Kirim</button></div></div>';
                    $(frm.footer.wrapper).prepend(chat_html);
                    let chatBox = document.getElementById('chat-messages-' + docname);
                    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
                    $('#send-btn-' + docname).on('click', function() {
                        let message = $('#chat-input-' + docname).val().trim();
                        if (!message) return;
                        frappe.call({
                            method: 'frappe.desk.form.utils.add_comment',
                            args: {
                                reference_doctype: 'Capability Submission',
                                reference_name: docname,
                                content: message,
                                comment_email: frappe.session.user,
                                comment_by: frappe.session.user_fullname
                            },
                            callback: function() {
                                $('#chat-input-' + docname).val('');
                                frm.reload_doc();
                            }
                        });
                    });
                    $('#chat-input-' + docname).on('keypress', function(e) {
                        if (e.which === 13) $('#send-btn-' + docname).click();
                    });
                }
            });
        }
        
        if (!frm.is_new() && frm.doc.docstatus === 1 && frappe.user.has_role('TC Quality')) {
            if (frm.doc.status === 'Submitted') {
                frm.add_custom_button('Set Under Review', function() {
                    frappe.db.set_value('Capability Submission', frm.doc.name, 'status', 'Under Review').then(function() { frm.reload_doc(); });
                }).addClass('btn-warning');
            }
            if (frm.doc.status === 'Under Review') {
                frm.add_custom_button('Approve', function() {
                    frappe.db.set_value('Capability Submission', frm.doc.name, 'status', 'Approved').then(function() { frm.reload_doc(); });
                }).addClass('btn-success');
                frm.add_custom_button('Request Revision', function() {
                    frappe.db.set_value('Capability Submission', frm.doc.name, 'status', 'Revision').then(function() { frm.reload_doc(); });
                }).addClass('btn-danger');
            }
            if (frm.doc.status === 'Revision') {
                frm.add_custom_button('Approve', function() {
                    frappe.db.set_value('Capability Submission', frm.doc.name, 'status', 'Approved').then(function() { frm.reload_doc(); });
                }).addClass('btn-success');
                frm.add_custom_button('Set Under Review', function() {
                    frappe.db.set_value('Capability Submission', frm.doc.name, 'status', 'Under Review').then(function() { frm.reload_doc(); });
                }).addClass('btn-warning');
            }
            if (frm.doc.status === 'Approved') {
                frm.add_custom_button('E-Sign Dokumen', function() {
                    if (!frm.doc.attachment) {
                        frappe.msgprint({title: 'Error', message: 'Tidak ada dokumen attachment.', indicator: 'red'});
                        return;
                    }
                    let sigX = null, sigY = null, sigPage = 0;
                    let pdfDoc = null, currentPage = 1, totalPages = 1;
                    let dialog = new frappe.ui.Dialog({
                        title: 'E-Sign Dokumen',
                        size: 'extra-large',
                        fields: [{
                            fieldtype: 'HTML',
                            fieldname: 'esign_content',
                            options: '<div style="font-family:sans-serif"><p style="color:#555;margin-bottom:8px;font-size:13px;"><strong>Langkah 1:</strong> Klik di dokumen untuk menentukan posisi tanda tangan</p><div id="pdf-page-nav" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><button id="pdf-prev" style="padding:4px 12px;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Prev</button><span id="pdf-page-info" style="font-size:13px;">Halaman 1 / 1</span><button id="pdf-next" style="padding:4px 12px;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Next</button></div><div id="pdf-container" style="position:relative;border:2px solid #ccc;border-radius:6px;overflow:auto;max-height:350px;background:#f0f0f0;cursor:crosshair;"><canvas id="pdf-canvas" style="display:block;"></canvas><div id="sig-marker" style="display:none;position:absolute;width:180px;height:60px;border:2px dashed #dc3545;background:rgba(220,53,69,0.1);pointer-events:none;"><span style="font-size:11px;color:#dc3545;padding:2px 4px;">Posisi Tanda Tangan</span></div></div><p id="position-hint" style="color:#888;font-size:12px;margin-top:6px;">Belum ada posisi dipilih. Klik di dokumen untuk memilih.</p><div style="margin-top:15px;border-top:1px solid #eee;padding-top:15px;"><p style="color:#555;margin-bottom:8px;font-size:13px;"><strong>Langkah 2:</strong> Tanda tangan di kotak di bawah ini</p><canvas id="signature-canvas" width="600" height="150" style="border:2px solid #ccc;border-radius:6px;cursor:crosshair;background:white;display:block;width:100%;"></canvas><div style="margin-top:8px;"><button id="clear-signature" style="background:#dc3545;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;">Hapus Tanda Tangan</button></div><p id="signature-error" style="color:red;font-size:12px;margin-top:6px;display:none;">Silakan tanda tangan terlebih dahulu!</p><p id="position-error" style="color:red;font-size:12px;margin-top:6px;display:none;">Silakan pilih posisi tanda tangan di dokumen!</p></div></div>'
                        }],
                        primary_action_label: 'Simpan Tanda Tangan',
                        primary_action: function() {
                            let sigError = document.getElementById('signature-error');
                            let posError = document.getElementById('position-error');
                            sigError.style.display = 'none';
                            posError.style.display = 'none';
                            let canvas = document.getElementById('signature-canvas');
                            let ctx = canvas.getContext('2d');
                            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            let isEmpty = !imageData.data.some(ch => ch !== 0);
                            if (isEmpty) { sigError.style.display = 'block'; return; }
                            if (sigX === null) { posError.style.display = 'block'; return; }
                            let signatureData = canvas.toDataURL('image/png');
                            let base64Data = signatureData.split(',')[1];
                            frappe.show_alert({message: 'Menyimpan tanda tangan...', indicator: 'blue'});
                            frappe.call({
                                method: 'gmf_tc.api.save_signature',
                                args: {
                                    doc_name: frm.doc.name,
                                    signature_base64: base64Data,
                                    page: sigPage,
                                    sig_x: sigX,
                                    sig_y: sigY,
                                    pdf_canvas_width: document.getElementById('pdf-canvas').width,
                                    pdf_canvas_height: document.getElementById('pdf-canvas').height
                                },
                                callback: function(r) {
                                    if (r.message && r.message.success) {
                                        dialog.hide();
                                        frappe.show_alert({message: 'Dokumen berhasil ditandatangani!', indicator: 'green'});
                                        if (r.message.file_url) {
                                            let a = document.createElement('a');
                                            a.href = 'http://localhost:8080' + r.message.file_url;
                                            a.download = r.message.file_name || 'signed_document.pdf';
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                        }
                                        frm.reload_doc();
                                    } else {
                                        frappe.msgprint({title: 'Gagal', message: (r.message && r.message.message) ? r.message.message : 'Terjadi kesalahan.', indicator: 'red'});
                                    }
                                }
                            });
                        }
                    });
                    dialog.show();
                    setTimeout(function() {
                        let pdfUrl = 'http://localhost:8080' + frm.doc.attachment;
                        function loadPdfJs(callback) {
                            if (window.pdfjsLib) { callback(); return; }
                            let script = document.createElement('script');
                            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                            script.onload = function() {
                                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                                callback();
                            };
                            document.head.appendChild(script);
                        }
                        function renderPage(pageNum) {
                            pdfDoc.getPage(pageNum).then(function(page) {
                                let viewport = page.getViewport({scale: 1.0});
                                let pdfCanvas = document.getElementById('pdf-canvas');
                                if (!pdfCanvas) return;
                                pdfCanvas.width = viewport.width;
                                pdfCanvas.height = viewport.height;
                                let ctx = pdfCanvas.getContext('2d');
                                page.render({canvasContext: ctx, viewport: viewport}).promise.then(function() {
                                    document.getElementById('pdf-page-info').innerText = 'Halaman ' + pageNum + ' / ' + totalPages;
                                    sigX = null; sigY = null;
                                    document.getElementById('sig-marker').style.display = 'none';
                                    document.getElementById('position-hint').innerText = 'Belum ada posisi dipilih. Klik di dokumen untuk memilih.';
                                });
                            });
                        }
                        loadPdfJs(function() {
                            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
                                pdfDoc = pdf;
                                totalPages = pdf.numPages;
                                renderPage(currentPage);
                            }).catch(function() {
                                document.getElementById('pdf-container').innerHTML = '<p style="padding:20px;color:#888;text-align:center;">Preview tidak tersedia untuk tipe file ini.</p>';
                            });
                        });
                        document.getElementById('pdf-canvas').addEventListener('click', function(e) {
                            let rect = this.getBoundingClientRect();
                            let containerRect = document.getElementById('pdf-container').getBoundingClientRect();
                            let container = document.getElementById('pdf-container');
                            sigX = e.clientX - rect.left;
                            sigY = e.clientY - rect.top;
                            sigPage = currentPage - 1;
                            let marker = document.getElementById('sig-marker');
                            marker.style.display = 'block';
                            marker.style.left = (e.clientX - containerRect.left + container.scrollLeft) + 'px';
                            marker.style.top = (e.clientY - containerRect.top + container.scrollTop) + 'px';
                            document.getElementById('position-hint').innerText = 'Posisi dipilih di halaman ' + currentPage;
                        });
                        document.getElementById('pdf-prev').addEventListener('click', function() {
                            if (currentPage > 1) { currentPage--; renderPage(currentPage); }
                        });
                        document.getElementById('pdf-next').addEventListener('click', function() {
                            if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
                        });
                        let sigCanvas = document.getElementById('signature-canvas');
                        let sigCtx = sigCanvas.getContext('2d');
                        let isDrawing = false, lastX = 0, lastY = 0;
                        sigCtx.strokeStyle = '#000000';
                        sigCtx.lineWidth = 2;
                        sigCtx.lineCap = 'round';
                        sigCtx.lineJoin = 'round';
                        function getPos(e) {
                            let rect = sigCanvas.getBoundingClientRect();
                            let scaleX = sigCanvas.width / rect.width;
                            let scaleY = sigCanvas.height / rect.height;
                            if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
                            return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
                        }
                        sigCanvas.addEventListener('mousedown', function(e) { isDrawing = true; let p = getPos(e); lastX = p.x; lastY = p.y; });
                        sigCanvas.addEventListener('mousemove', function(e) {
                            if (!isDrawing) return;
                            let p = getPos(e);
                            sigCtx.beginPath(); sigCtx.moveTo(lastX, lastY); sigCtx.lineTo(p.x, p.y); sigCtx.stroke();
                            lastX = p.x; lastY = p.y;
                        });
                        sigCanvas.addEventListener('mouseup', function() { isDrawing = false; });
                        sigCanvas.addEventListener('mouseleave', function() { isDrawing = false; });
                        document.getElementById('clear-signature').addEventListener('click', function() {
                            sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
                            document.getElementById('signature-error').style.display = 'none';
                        });
                    }, 400);
                }).addClass('btn-success');
            }
        }
        if (!frm.is_new() && frm.doc.docstatus === 1 && frm.doc.status === 'Revision' && frappe.user.has_role('TC Engineer')) {
            frm.add_custom_button('Edit & Resubmit', function() {
                frm.set_df_property('title', 'read_only', 0);
                frm.set_df_property('description', 'read_only', 0);
                frm.set_df_property('assigned_to', 'read_only', 0);
                frm.set_df_property('attachment', 'read_only', 0);
                frappe.show_alert({message: 'Silakan edit dokumen lalu klik Save!', indicator: 'blue'});
            }).addClass('btn-primary');
        }
    },
    on_submit: function(frm) {
        frappe.db.set_value('Capability Submission', frm.doc.name, 'status', 'Submitted').then(function() { frm.reload_doc(); });
    }
});
