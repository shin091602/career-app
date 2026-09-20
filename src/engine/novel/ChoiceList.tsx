import type { Choice } from '../../types';
import { Button } from '../../components';

interface ChoiceListProps {
  choices: Choice[];
  onPick: (choice: Choice) => void;
}

export function ChoiceList({ choices, onPick }: ChoiceListProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-muted">どうする？</p>
      {choices.map((choice) => (
        <Button
          key={choice.label}
          variant="secondary"
          block
          className="text-left"
          onClick={() => onPick(choice)}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  );
}
