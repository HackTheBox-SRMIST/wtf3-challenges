"use client";

import { useState } from 'react';
import CharacterGrid from './CharacterGrid';
import QuoteBox from './QuoteBox';

export default function ClientWrapper({ characters }) {
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    const handleSelect = (character) => {
        setSelectedCharacter(character);
    };

    const handleClose = () => {
        setSelectedCharacter(null);
    };

    return (
        <>
            <CharacterGrid
                characters={characters}
                selectedId={selectedCharacter?.id}
                onSelect={handleSelect}
            />
            <QuoteBox character={selectedCharacter} onClose={handleClose} />
        </>
    );
}
