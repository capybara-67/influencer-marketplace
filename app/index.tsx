import { Redirect } from "expo-router";
import { LoadingState } from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";

export default function Index() {
  const { loading, session } = useAuth();

  if (loading) {
    return <LoadingState message="Checking your session..." />;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/offers" />;
}
