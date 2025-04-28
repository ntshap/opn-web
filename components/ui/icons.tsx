"use client";

import { LucideProps } from 'lucide-react';
import { SafeLucideIcon } from '@/lib/lucide-config';
import * as LucideIcons from 'lucide-react';

// Create safe versions of all Lucide icons
type IconName = keyof typeof LucideIcons;

// Create a type-safe icon component
export function Icon({ 
  name, 
  ...props 
}: LucideProps & { name: IconName }) {
  const LucideIcon = LucideIcons[name];
  
  if (!LucideIcon) {
    console.error(`Icon "${name}" not found in Lucide icons`);
    return null;
  }
  
  return <SafeLucideIcon icon={LucideIcon} {...props} />;
}

// Export individual safe icon components for convenience
export function User(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.User} {...props} />;
}

export function LockKeyhole(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.LockKeyhole} {...props} />;
}

export function Calendar(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Calendar} {...props} />;
}

export function Users(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Users} {...props} />;
}

export function FileText(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.FileText} {...props} />;
}

export function Settings(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Settings} {...props} />;
}

export function Menu(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Menu} {...props} />;
}

export function X(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.X} {...props} />;
}

export function ChevronLeft(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.ChevronLeft} {...props} />;
}

export function ChevronRight(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.ChevronRight} {...props} />;
}

export function Bell(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Bell} {...props} />;
}

export function Search(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Search} {...props} />;
}

export function CreditCard(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.CreditCard} {...props} />;
}

export function BarChart(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.BarChart} {...props} />;
}

export function Newspaper(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Newspaper} {...props} />;
}

export function Home(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Home} {...props} />;
}

export function LogOut(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.LogOut} {...props} />;
}

export function HelpCircle(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.HelpCircle} {...props} />;
}

export function LayoutDashboard(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.LayoutDashboard} {...props} />;
}

export function PlusCircle(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.PlusCircle} {...props} />;
}

export function Edit(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Edit} {...props} />;
}

export function Trash2(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Trash2} {...props} />;
}

export function ArrowUp(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.ArrowUp} {...props} />;
}

export function ArrowDown(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.ArrowDown} {...props} />;
}

export function Plus(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Plus} {...props} />;
}

export function Check(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Check} {...props} />;
}

export function ArrowLeft(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.ArrowLeft} {...props} />;
}

export function Trash(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Trash} {...props} />;
}

export function Upload(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Upload} {...props} />;
}

export function BarChart2(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.BarChart2} {...props} />;
}

export function Loader2(props: LucideProps) {
  return <SafeLucideIcon icon={LucideIcons.Loader2} {...props} />;
}
