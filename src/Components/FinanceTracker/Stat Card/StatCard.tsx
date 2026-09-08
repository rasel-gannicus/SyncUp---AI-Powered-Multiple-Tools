import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { NotepadLoading } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  userLoading: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  userLoading,
}) =>
  userLoading ? (
    <NotepadLoading />
  ) : (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${value.toLocaleString()}</div>
        <p
          className={`text-xs ${
            trend >= 0 ? "text-green-500" : "text-red-500"
          } flex items-center`}
        >
          {trend >= 0 ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          {Math.abs(trend)}%
        </p>
      </CardContent>
    </Card>
  );
