import React from 'react';

export interface CrmLead {
  id: string;
  name: string;
  status: 'Booked' | 'Follow Up' | 'Not Interested' | 'Qualified' | 'No Answer';
  notes: string;
  date: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface FunnelStage {
  name: string;
  value: number;
  fill: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

export interface ServiceItem {
  title: string;
  description: string;
  icon: React.ElementType;
}