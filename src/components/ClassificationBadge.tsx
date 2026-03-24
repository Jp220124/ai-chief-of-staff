import { Badge } from "@/components/ui/badge";
import { Classification } from "@/lib/types";
import { ShieldAlert, Forward, EyeOff } from "lucide-react";

const config: Record<Classification, { variant: "destructive" | "default" | "secondary" | "outline"; icon: typeof ShieldAlert; label: string }> = {
  decide: { variant: "destructive", icon: ShieldAlert, label: "Decide" },
  delegate: { variant: "default", icon: Forward, label: "Delegate" },
  ignore: { variant: "secondary", icon: EyeOff, label: "Ignore" },
};

export default function ClassificationBadge({ classification }: { classification: Classification }) {
  const { variant, icon: Icon, label } = config[classification] || config.ignore;
  return (
    <Badge variant={variant} className="gap-1 font-semibold">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
