frappe.listview_settings['Capability Submission'] = {
    add_fields: ['status'],

    get_indicator: function(doc) {
        const map = {
            'Submitted':    ['Submitted',    'blue',   'status,=,Submitted'],
            'Under Review': ['Under Review', 'orange', 'status,=,Under Review'],
            'Revision':     ['Revision',     'red',    'status,=,Revision'],
            'Approved':     ['Approved',     'green',  'status,=,Approved'],
        };
        return map[doc.status] || [doc.status || 'Draft', 'grey', ''];
    },

    formatters: {
        status: function(value) {
            const colors = {
                'Submitted':    '#007bff',
                'Under Review': '#fd7e14',
                'Revision':     '#dc3545',
                'Approved':     '#28a745',
            };
            const color = colors[value] || '#6c757d';
            return `<span style="color:white; background:${color}; 
                padding:2px 10px; border-radius:10px; font-size:12px; font-weight:bold;">
                ${value || 'Draft'}</span>`;
        }
    }
};