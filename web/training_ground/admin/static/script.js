document.addEventListener('DOMContentLoaded', () => {
    const robot = document.getElementById('robot');
    const eyes = document.querySelectorAll('.eye');
    
    // Interactive click effect on the robot
    robot.addEventListener('click', () => {
        // Temporarily change eye color on click
        eyes.forEach(eye => {
            const originalFill = eye.getAttribute('fill');
            eye.setAttribute('fill', '#ff0055'); // Turn eyes red
            
            setTimeout(() => {
                eye.setAttribute('fill', originalFill);
            }, 300);
        });
        
        // Give a little CTF clue in the console
        console.clear();
        console.log("%c[System Boot] Beep boop!", "color: #00f0ff; font-size: 14px; font-weight: bold;");
        console.log("%cHave you checked how automated web crawlers see this site?", "color: #e0e6ed; font-size: 12px; font-family: monospace; text-shadow: 0 0 5px rgba(0,240,255,0.5);");
        console.log("%cLooking for rules...", "color: #8fa0b5; font-size: 11px; font-style: italic;");
    });
});
