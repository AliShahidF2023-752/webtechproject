'use client'

import Navbar from '@/components/layout/Navbar'
import VenueForm from '@/components/venues/VenueForm'
import styles from '../../admin.module.css'

export default function NewVenuePage() {
    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Add New Venue</h1>
                        <p>Create a new venue listing (Pending Approval)</p>
                    </div>

                    <div className={styles.formCard} style={{ background: 'white', padding: '2rem', borderRadius: '1rem' }}>
                        <VenueForm redirectPath="/admin/venues" />
                    </div>
                </div>
            </div>
        </>
    )
}
