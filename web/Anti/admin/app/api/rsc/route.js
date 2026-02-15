import { NextResponse } from 'next/server';

// CVE-2025-55182 vulnerable endpoint
// This endpoint intentionally deserializes untrusted data
export async function POST(request) {
    try {
        const body = await request.text();

        console.log('[VULNERABLE ENDPOINT] Received payload:', body.substring(0, 100));

        // INTENTIONALLY VULNERABLE: Unsafe deserialization
        // This simulates the CVE-2025-55182 vulnerability in RSC
        // where React Flight protocol unsafely deserializes data

        try {
            // Attempt to parse as JSON first
            const data = JSON.parse(body);

            // VULNERABLE: If data contains code, execute it
            if (data && data.eval) {
                console.log('[EXPLOIT DETECTED] Executing payload:', data.eval);
                const result = eval(data.eval);
                console.log('[EXPLOIT RESULT]:', result);

                return NextResponse.json({
                    success: true,
                    result: String(result),
                    message: 'Command executed'
                });
            }

            // Check for alternative payload formats
            if (data && typeof data === 'object') {
                // Look for dangerous properties
                for (const key in data) {
                    if (key.includes('eval') || key.includes('exec')) {
                        console.log('[EXPLOIT DETECTED] Dangerous key:', key);
                        const result = eval(data[key]);
                        return NextResponse.json({
                            success: true,
                            result: String(result)
                        });
                    }
                }
            }

        } catch (parseError) {
            // If not JSON, try other formats
            console.log('[VULNERABLE] Parse error, trying alternative deserialize');
        }

        // VULNERABLE: React Flight protocol format parsing
        // This mimics the actual CVE-2025-55182 vulnerability
        if (body.includes('eval') || body.includes('require')) {
            console.log('[CRITICAL] Detected potential RCE payload');

            // Extract and execute - THIS IS THE VULNERABILITY
            const match = body.match(/"([^"]*require[^"]*)"/);
            if (match) {
                const code = match[1];
                console.log('[EXECUTING]:', code);
                try {
                    const result = eval(code);
                    console.log('[RESULT]:', result);

                    return NextResponse.json({
                        success: true,
                        output: String(result),
                        exploited: true
                    });
                } catch (execError) {
                    console.error('[EXEC ERROR]:', execError);
                    return NextResponse.json({
                        error: execError.message,
                        hint: 'Payload format might be incorrect'
                    }, { status: 500 });
                }
            }
        }

        return NextResponse.json({
            message: 'No vulnerable payload detected',
            hint: 'Try sending JSON with "eval" property or Flight protocol format'
        });

    } catch (error) {
        console.error('[ERROR]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Also handle GET for testing
export async function GET() {
    return NextResponse.json({
        message: 'CVE-2025-55182 Vulnerable Endpoint',
        vulnerable: true,
        hint: 'Send POST request with malicious payload'
    });
}
