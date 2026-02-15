// Server Component - Character Grid
import CharacterCard from './CharacterCard';

export default function CharacterGrid({ characters, selectedId, onSelect }) {
    return (
        <div className="grid">
            {characters.map((character) => (
                <CharacterCard
                    key={character.id}
                    character={character}
                    isSelected={selectedId === character.id}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}
