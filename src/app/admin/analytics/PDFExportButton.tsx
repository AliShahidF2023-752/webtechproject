'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { createClient } from '@/lib/supabase/client'
import styles from './styles.module.css' // We'll just use inline styles or existing admin styles

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number }
}

export default function PDFExportButton({ type }: { type: 'users' | 'bookings' | 'revenue' }) {
    const handleExport = async () => {
        const doc = new jsPDF() as jsPDFWithAutoTable
        const supabase = createClient()

        if (type === 'users') {
            const { data } = await supabase.from('users').select('email, role, created_at').limit(100)
            if (data) {
                doc.text('User Report', 14, 20)
                autoTable(doc, {
                    startY: 30,
                    head: [['Email', 'Role', 'Joined Date']],
                    body: data.map(u => [u.email, u.role, new Date(u.created_at).toLocaleDateString()])
                })
                doc.save('users_report.pdf')
            }
        } else if (type === 'bookings') {
            const { data } = await supabase.from('bookings').select('id, booking_date, total_amount, payment_status').limit(100)
            if (data) {
                doc.text('Booking Report', 14, 20)
                autoTable(doc, {
                    startY: 30,
                    head: [['Date', 'Amount', 'Status']],
                    body: data.map(b => [b.booking_date, `PKR ${b.total_amount}`, b.payment_status])
                })
                doc.save('bookings_report.pdf')
            }
        }
    }

    return (
        <button
            onClick={handleExport}
            style={{
                marginLeft: '10px',
                padding: '0.5rem 1rem',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500
            }}
        >
            📄 Export {type.charAt(0).toUpperCase() + type.slice(1)} (PDF)
        </button>
    )
}
