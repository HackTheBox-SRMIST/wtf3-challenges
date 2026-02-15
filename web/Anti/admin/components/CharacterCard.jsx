"use client";

import { useState } from 'react';

export default function CharacterCard({ character, isSelected, onSelect }) {
    const handleSelect = () => {
        onSelect(character);
    };

    return (
        <div className={`character-card ${isSelected ? 'selected' : ''}`}>
            <img src={character.image} alt={character.name} />
            <h3>{character.name}</h3>
            <p>{character.description}</p>
            <button className="select-button" onClick={handleSelect}>
                {isSelected ? 'Selected' : 'Select'}
            </button>
        </div>
    );
}
