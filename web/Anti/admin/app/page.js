// Server Component - Main Page
import Header from '@/components/Header';
import ClientWrapper from '@/components/ClientWrapper';
import Link from 'next/link';
import { characters } from '@/data/characters';

export default function Home() {
  return (
    <div className="container">
      <Header />
      <ClientWrapper characters={characters} />

      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <Link href="/feedback" style={{
          display: 'inline-block',
          padding: '15px 40px',
          backgroundColor: '#b30000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: '600',
          transition: 'transform 0.2s',
        }}>
          Submit Feedback
        </Link>
      </div>
    </div>
  );
}
