import React, { Suspense } from "react";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "./LoadingSpinner";
import Login from "../pages/Login";
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const AdminDashboard = React.lazy(() => import("../pages/AdminDashboard"));

const RoleBasedDashboardRoute: React.FC = () => {
  const { user, loading } = useAuth() || {};

  if (loading) return <LoadingSpinner />;
  if (!user) {
    return <Login />;
  }

  if (user.role === "admin") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AdminDashboard />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
};

export default RoleBasedDashboardRoute;