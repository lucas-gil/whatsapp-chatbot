-- CreateTable "Admin"
CREATE TABLE "Admin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable "Contact"
CREATE TABLE "Contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "phone" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "email" TEXT,
  "device" TEXT,
  "status" TEXT NOT NULL DEFAULT 'prospect',
  "installationProof" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateTable "Conversation"
CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contactId" TEXT NOT NULL,
  "step" TEXT NOT NULL DEFAULT 'welcome',
  "stepData" JSONB,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "timeoutAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Conversation_contactId_idx" ON "Conversation"("contactId");
CREATE INDEX "Conversation_step_idx" ON "Conversation"("step");

-- CreateTable "Message"
CREATE TABLE "Message" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "mediaPath" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_sender_idx" ON "Message"("sender");

-- CreateTable "Plan"
CREATE TABLE "Plan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "billingCycle" INTEGER NOT NULL,
  "features" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Plan_active_idx" ON "Plan"("active");

-- CreateTable "Subscription"
CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contactId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'trial',
  "trialEndsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "mercadopagoId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Subscription_contactId_idx" ON "Subscription"("contactId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_expiresAt_idx" ON "Subscription"("expiresAt");

-- CreateTable "Payment"
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subscriptionId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "mercadopagoId" TEXT UNIQUE,
  "paymentMethod" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_mercadopagoId_idx" ON "Payment"("mercadopagoId");

-- CreateTable "Ticket"
CREATE TABLE "Ticket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contactId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "status" TEXT NOT NULL DEFAULT 'open',
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "attachments" TEXT[],
  "notes" TEXT,
  "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ticket_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX "Ticket_category_idx" ON "Ticket"("category");

-- CreateTable "KnowledgeBase"
CREATE TABLE "KnowledgeBase" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "keywords" TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "KnowledgeBase_category_idx" ON "KnowledgeBase"("category");
CREATE INDEX "KnowledgeBase_active_idx" ON "KnowledgeBase"("active");

-- CreateTable "DeviceRecommendation"
CREATE TABLE "DeviceRecommendation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "device" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "instructions" TEXT NOT NULL,
  "apps" JSONB NOT NULL,
  "images" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "DeviceRecommendation_device_idx" ON "DeviceRecommendation"("device");

-- CreateTable "StandardMessage"
CREATE TABLE "StandardMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'text',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "StandardMessage_key_idx" ON "StandardMessage"("key");

-- CreateTable "WebhookEvent"
CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");
