'use client'

import Navbar from '@/components/layout/Navbar'
import VenueForm from '@/components/venues/VenueForm'
import styles from '../../vendor.module.css'

export default function NewVendorVenuePage() {
    return (
        <>
            <Navbar />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>Add New Venue</h1>
                        <p>Listing will be pending until Admin approval</p>
                    </div>

                    <div className={styles.formCard} style={{ background: 'white', padding: '2rem', borderRadius: '1rem' }}>
                        <VenueForm redirectPath="/vendor" isVendor={true} />
                    </div>
                </div>
            </div>
        </>
    )
}
