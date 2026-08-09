// Copyright (c) 2026, GMF AeroAsia and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Capability Submission", {
// 	refresh(frm) {

// 	},
// });

frappe.listview_settings["Capability Submission"] = {
	get_indicator: function (doc) {
		var status_colors = {
			"Draft": "gray",
			"Submitted": "blue",
			"Under Review": "orange",
			"Approved": "green",
			"Revision": "red",
			"Signed": "purple"
		};
		var color = status_colors[doc.status] || "gray";
		return [__(doc.status), color, "status,=," + doc.status];
	}
};
