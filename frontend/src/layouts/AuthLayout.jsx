import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — transparent wrapper; Login/Register handle their own full-screen layouts
 */
export default function AuthLayout() {
  return <Outlet />;
}
