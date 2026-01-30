// Tipos compartilhados entre API e Admin

export interface Contact {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  device?: string;
  status: 'prospect' | 'lead' | 'negociacao' | 'cliente' | 'encerrado';
  installationProof?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  contactId: string;
  step: string;
  stepData?: any;
  messages: Message[];
  lastActivityAt: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'bot';
  type: 'text' | 'image' | 'video' | 'interactive_button' | 'interactive_list';
  content: string;
  mediaUrl?: string;
  metadata?: any;
  createdAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: number;
  features: string[];
  active: boolean;
  order: number;
}

export interface Subscription {
  id: string;
  contactId: string;
  planId: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trialEndsAt?: Date;
  expiresAt?: Date;
  mercadopagoId?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  mercadopagoId?: string;
  paymentMethod?: string;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  contactId: string;
  category: 'instalacao' | 'erro_tecnico' | 'pagamento' | 'outro';
  priority: 'low' | 'normal' | 'high' | 'urgent';
export interface Ticket {
  id: string;
  contactId: string;
  category: 'instalacao' | 'erro_tecnico' | 'pagamento' | 'outro';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  subject: string;
  description: string;
  attachments: string[];
  notes?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Tipos IPTV =====

export interface IPTVPlan extends Plan {
  streams?: number; // Número de streams simultâneos
  resolution?: '720p' | '1080p' | '4K';
  features?: string[];
}

export interface IPTVSubscription extends Subscription {
  streamCount?: number;
  lastStreamedAt?: Date;
  deviceLimit?: number;
}

export interface IPTVContact extends Contact {
  preferredDevice?: 'tv_smart' | 'fire_stick' | 'roku' | 'Android' | 'iOS' | 'Web';
  installationDate?: Date;
  totalRefunds?: number;
}

export interface IPTVConversationStep {
  step: 'welcome' | 'main_menu' | 'contratacao_menu' | 'plano_selecionado' | 'renovacao_verificacao' | 'renovacao_pagamento' | 'suporte_menu' | 'suporte_detalhes' | 'faq_menu' | 'finalizado';
}

export interface BulkMessageRequest {
  phones: string[];
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface BulkMessageResponse {
  success: boolean;
  results: Array<{
    phone: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}

export interface ChatbotStats {
  totalContacts: number;
  totalConversations: number;
  totalMessages: number;
  activeSubscriptions: number;
  conversionRate?: number;
}
