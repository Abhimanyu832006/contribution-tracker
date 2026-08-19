import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export default function TeamMemberCard({ member }) {
  const { github_username, avatar_url, role, total_hours } = member;

  return (
    <Card hover className="flex items-center gap-4">
      <Avatar src={avatar_url} name={github_username} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {github_username}
          </p>
          <Badge variant={role === "leader" ? "indigo" : "default"}>
            {role === "leader" ? "Leader" : "Member"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          @{github_username}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-bold text-indigo-600">
          {Number(total_hours || 0).toFixed(1)}
        </p>
        <p className="text-xs text-gray-500">hours</p>
      </div>
    </Card>
  );
}
