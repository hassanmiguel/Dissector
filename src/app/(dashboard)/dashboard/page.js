import { getMachineId } from "@/shared/utils/machine";
import DashboardOverview from "@/shared/components/DashboardOverview";

export default async function DashboardPage() {
  const machineId = await getMachineId();
  return <DashboardOverview machineId={machineId} />;
}
