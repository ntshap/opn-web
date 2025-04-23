"use client"

import { SettingsTabs } from "./components/settings-tabs"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <SettingsTabs />
    </div>
  )
}

