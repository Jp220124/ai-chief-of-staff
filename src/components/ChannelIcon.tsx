import { Mail, Hash, MessageCircle } from "lucide-react";
import { Channel } from "@/lib/types";

const config: Record<Channel, { icon: typeof Mail; bg: string; label: string }> = {
  email: { icon: Mail, bg: "bg-blue-500/20 text-blue-400", label: "Email" },
  slack: { icon: Hash, bg: "bg-purple-500/20 text-purple-400", label: "Slack" },
  whatsapp: { icon: MessageCircle, bg: "bg-green-500/20 text-green-400", label: "WhatsApp" },
};

export default function ChannelIcon({ channel }: { channel: Channel }) {
  const { icon: Icon, bg, label } = config[channel] || config.email;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}
