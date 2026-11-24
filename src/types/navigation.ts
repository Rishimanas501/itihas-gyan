import React from 'react';
import {
  Home,
  PlayCircle,
  Sparkles,
  MessageSquareText,
  BookOpen,
  Users,
  BarChart3,
  Database,
  Settings,
  Info,
  MapPin,
  Compass,
  Map as MapIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  labelOdia: string;
  labelEng: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    labelOdia: 'ମୁଖ୍ୟ ପୃଷ୍ଠା',
    labelEng: 'Home',
    icon: Home
  },
  {
    id: 'ai_chat',
    labelOdia: 'AI ସହ ଆଲୋଚନା (ଚାଟ୍)',
    labelEng: 'Chat with AI (Vision & Docs)',
    icon: MessageSquareText,
    badge: 'AI'
  },
  {
    id: 'historical_maps',
    labelOdia: 'ଐତିହାସିକ ମାନଚିତ୍ର',
    labelEng: 'Historical Maps',
    icon: Compass,
    badge: 'NEW'
  },
  {
    id: 'live_quiz',
    labelOdia: 'ଲାଇଭ୍ କୁଇଜ୍',
    labelEng: 'Start Live Quiz',
    icon: PlayCircle,
    badge: 'LIVE'
  },
  {
    id: 'ai_generator',
    labelOdia: 'AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି',
    labelEng: 'Create Questions with AI',
    icon: Sparkles
  },
  {
    id: 'question_bank',
    labelOdia: 'ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍',
    labelEng: 'Question Bank',
    icon: BookOpen
  },
  {
    id: 'student_database',
    labelOdia: 'ଛାତ୍ର ଡାଟାବେସ୍',
    labelEng: 'Student Database',
    icon: Users
  },
  {
    id: 'reports',
    labelOdia: 'ରିପୋର୍ଟ୍ସ ଓ ଫଳାଫଳ',
    labelEng: 'Reports & Results',
    icon: BarChart3
  },
  {
    id: 'backup_restore',
    labelOdia: 'ବ୍ୟାକ୍ଅପ୍ ଓ ରିଷ୍ଟୋର୍',
    labelEng: 'Backup & Restore',
    icon: Database
  },
  {
    id: 'settings',
    labelOdia: 'ସେଟିଙ୍ଗ୍ସ',
    labelEng: 'Settings',
    icon: Settings
  },
  {
    id: 'about_downloads',
    labelOdia: 'ସମ୍ପର୍କରେ / ଡାଉନଲୋଡ୍',
    labelEng: 'About / Downloads',
    icon: Info
  }
];
