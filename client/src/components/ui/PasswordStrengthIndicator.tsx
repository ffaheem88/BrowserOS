import { evaluatePasswordStrength, getStrengthColor, getStrengthTextColor } from '../../utils/passwordStrength';
import { cn } from '../../utils/cn';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const result = evaluatePasswordStrength(password);

  if (!password) {
    return null;
  }

  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              result.score >= level * 25
                ? getStrengthColor(result.strength)
                : 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>

      {/* Strength label and score */}
      <div className="flex items-center justify-between text-xs">
        <span className={cn('font-medium', getStrengthTextColor(result.strength))}>
          {strengthLabels[result.strength]}
        </span>
        <span className="text-muted-foreground">
          {result.score}% strong
        </span>
      </div>

      {/* Feedback */}
      {result.feedback.length > 0 && result.strength !== 'strong' && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {result.feedback.slice(0, 3).map((item, index) => (
            <li key={index} className="flex items-start gap-1.5">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
