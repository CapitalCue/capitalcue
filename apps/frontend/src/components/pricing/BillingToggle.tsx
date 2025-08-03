import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BillingToggleProps {
  isAnnual: boolean;
  onToggle: (annual: boolean) => void;
}

const BillingToggle = ({ isAnnual, onToggle }: BillingToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <Label htmlFor="billing-toggle" className={`text-sm ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
        Monthly
      </Label>
      <Switch
        id="billing-toggle"
        checked={isAnnual}
        onCheckedChange={onToggle}
      />
      <div className="flex items-center gap-2">
        <Label htmlFor="billing-toggle" className={`text-sm ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Annual
        </Label>
        <div className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
          Save 20%
        </div>
      </div>
    </div>
  );
};

export default BillingToggle;