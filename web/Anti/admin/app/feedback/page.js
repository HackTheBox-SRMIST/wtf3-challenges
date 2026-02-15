import FeedbackForm from '@/components/FeedbackForm';
import Link from 'next/link';

export default function FeedbackPage() {
    return (
        <div className="container">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Link href="/" style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#333',
                    color: '#e0e0e0',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    marginBottom: '20px',
                }}>
                    ← Back to Characters
                </Link>
            </div>

            <FeedbackForm />
        </div>
    );
}
