import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VenuesClient from './VenuesClient'
import styles from './venues.module.css'

export default async function VenuesPage() {
    const supabase = await createClient()

    const { data: venues } = await supabase
        .from('venues')
        .select(`
      *,
      courts(
        id,
        name,
        hourly_rate,
        sport:sports(name, icon)
      )
    `)
        .eq('is_active', true)
        .order('city')

    return (
        <>
            <Navbar />
            <main className={styles.page}>
                <VenuesClient venues={venues as any[]} />
            </main>
            <Footer />
        </>
    )
}
