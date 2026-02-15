"use client";

import { useState } from 'react';

export default function QuoteBox({ character, onClose }) {
    const [currentQuote, setCurrentQuote] = useState('');
    const [quoteKey, setQuoteKey] = useState(0);

    if (!character) {
        return null;
    }

    const generateQuote = () => {
        const quotes = character.quotes;
        let newQuote;

        // Prevent consecutive repetition
        do {
            newQuote = quotes[Math.floor(Math.random() * quotes.length)];
        } while (newQuote === currentQuote && quotes.length > 1);

        setCurrentQuote(newQuote);
        // Change key to re-trigger animation
        setQuoteKey(prev => prev + 1);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="quote-box">
                    <h2>{character.name}'s Wisdom</h2>
                    {currentQuote ? (
                        <p key={quoteKey} className="quote-text">
                            "{currentQuote}"
                        </p>
                    ) : (
                        <p className="quote-text" style={{ opacity: 0.5 }}>
                            Click the button below to generate a quote
                        </p>
                    )}
                    <button className="generate-button" onClick={generateQuote}>
                        Generate Quote
                    </button>
                </div>
            </div>
        </div>
    );
}
