"use client";

import { submitFeedback } from '@/app/actions';
import { useState } from 'react';

export default function FeedbackForm() {
    const [result, setResult] = useState(null);

    async function handleSubmit(formData) {
        const response = await submitFeedback(formData);
        setResult(response.message);
    }

    return (
        <div style={{
            maxWidth: '600px',
            margin: '40px auto',
            padding: '30px',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333'
        }}>
            <h2 style={{ color: '#b30000', marginBottom: '20px' }}>Submit Feedback</h2>
            <form action={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Character:</label>
                    <input
                        type="text"
                        name="character"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#0d0d0d',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: '#e0e0e0'
                        }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Feedback:</label>
                    <textarea
                        name="feedback"
                        rows="4"
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#0d0d0d',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: '#e0e0e0'
                        }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        padding: '12px 30px',
                        backgroundColor: '#b30000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Submit Feedback
                </button>
            </form>
            {result && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#0d0d0d',
                    borderRadius: '6px',
                    color: '#4ade80'
                }}>
                    {result}
                </div>
            )}
        </div>
    );
}
