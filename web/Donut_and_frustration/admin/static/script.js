document.addEventListener('DOMContentLoaded', () => {
    fetchDonuts();
});

async function fetchDonuts() {
    const container = document.getElementById('donut-container');
    
    try {
        const response = await fetch('/api/donuts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const donuts = await response.json();
        
        container.innerHTML = ''; // Clear loader
        
        donuts.forEach(donut => {
            const card = document.createElement('div');
            card.className = 'donut-card';
            
            // Check if price is infinity from our custom serialization
            const isInfinity = donut.price === "inf";
            
            let html = `
                <div class="donut-icon">🍩</div>
                <div style="font-family: monospace; text-align: left; background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; width: 100%; box-sizing: border-box; overflow-x: auto;">
                    <span style="color: #cbd5e1;">{</span><br>
                    &nbsp;&nbsp;<span style="color: #93c5fd;">"name"</span>: <span style="color: #fca5a5;">"${donut.name}"</span>,<br>
                    &nbsp;&nbsp;<span style="color: #93c5fd;">"price"</span>: <span style="color: ${isInfinity ? '#ef4444' : '#86efac'};">${isInfinity ? 'float("inf")' : donut.price}</span>`;
            
            if (donut.flag) {
                const isRealFlag = donut.flag.startsWith('HTB{');
                let flagColor = isRealFlag ? '#f59e0b' : '#fca5a5';
                html += `,<br>&nbsp;&nbsp;<span style="color: #93c5fd;">"flag"</span>: <span style="color: ${flagColor}; font-weight: ${isRealFlag ? 'bold' : 'normal'};">"${donut.flag}"</span>`;
            }
            
            html += `<br><span style="color: #cbd5e1;">}</span>
                </div>
            `;
            
            card.innerHTML = html;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error fetching donuts:', error);
        container.innerHTML = '<div class="loader" style="color: #ef4444;">Failed to load donuts! Ensure the backend is running.</div>';
    }
}
