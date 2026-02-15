// Server Component - Header
export default function Header() {
    return (
        <header style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h1 style={{
                fontSize: '3rem',
                color: '#b30000',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                Money Heist Portal
            </h1>
            <p style={{
                fontSize: '1.2rem',
                color: '#e0e0e0',
                fontStyle: 'italic'
            }}>
                La Casa de Papel - Character & Quote Generator
            </p>
        </header>
    );
}
