import type { Metadata } from 'next'
import { Cascadia_Code } from 'next/font/google'
import './globals.css'

const code = Cascadia_Code({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Bus Scheduler - Driver Management System',
    description: 'A comprehensive bus driver scheduling application with role-based access control',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={code.className}>
                {children}
            </body>
        </html>
    )
} 