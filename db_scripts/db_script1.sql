-- ====================================================================
--  Consolidated CRM Database Setup Script (Schema: MARM)
-- ====================================================================

-- --------------------------------------------------------------------
--  Phase 1: Cleanup
--  Drop schema and types to ensure a clean slate.
-- --------------------------------------------------------------------
DROP SCHEMA IF EXISTS "MARM" CASCADE;
DROP TYPE IF EXISTS app_role;

-- --------------------------------------------------------------------
--  Phase 2: Schema & Type Creation
-- --------------------------------------------------------------------
CREATE SCHEMA "MARM";

-- Create type in public schema as in original script
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'user');

-- --------------------------------------------------------------------
--  Phase 3: Table Creation
--  Tables are created in order of dependency, inside MARM.
-- --------------------------------------------------------------------

-- Core Tables (No Foreign Keys)
CREATE TABLE "MARM"."customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "company" TEXT,
  "industry" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Prospect',
  "value" NUMERIC(10,2) DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "last_contact" TIMESTAMP WITH TIME ZONE,
  "address" JSONB,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MARM"."customer_segments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "criteria" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MARM"."user_roles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "role" app_role NOT NULL DEFAULT 'user', -- Uses public app_role type
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "MARM"."admin_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "setting_key" TEXT NOT NULL UNIQUE,
  "setting_value" JSONB NOT NULL,
  "description" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE "MARM".deal_stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  deal_order INTEGER NOT NULL UNIQUE,
  probability INTEGER NOT NULL DEFAULT 0
);

-- Dependent Tables (With Foreign Keys)
CREATE TABLE "MARM"."interactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "notes" TEXT,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "duration" INTEGER,
  "outcome" TEXT,
  "next_action" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "interactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "interactions_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES "MARM".customers(id) ON DELETE CASCADE,
  CONSTRAINT "interactions_type_check" CHECK (type IN ('Email', 'Phone', 'Meeting', 'Chat'))
);

CREATE TABLE "MARM"."support_tickets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_number" SERIAL UNIQUE,
  "customer_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'Medium',
  "status" TEXT NOT NULL DEFAULT 'Open',
  "category" TEXT NOT NULL,
  "assigned_to" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_tickets_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES "MARM".customers(id) ON DELETE CASCADE
);

CREATE TABLE "MARM"."ticket_responses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "author" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "ticket_responses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ticket_responses_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES "MARM".support_tickets(id) ON DELETE CASCADE
);

CREATE TABLE "MARM"."segment_memberships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "segment_id" UUID NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "segment_memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "segment_memberships_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES "MARM".customers(id) ON DELETE CASCADE,
  CONSTRAINT "segment_memberships_segment_id_fkey" FOREIGN KEY (segment_id) REFERENCES "MARM".customer_segments(id) ON DELETE CASCADE,
  CONSTRAINT "unique_customer_segment" UNIQUE (customer_id, segment_id)
);

CREATE TABLE "MARM".deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  value NUMERIC(12, 2) NOT NULL,
  stage_id INTEGER NOT NULL REFERENCES "MARM".deal_stages(id),
  customer_id UUID NOT NULL REFERENCES "MARM".customers(id) ON DELETE CASCADE,
  expected_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE "MARM".recent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- e.g., 'created', 'ticket_status_change'
  user_name TEXT, -- e.g., 'Trigger', 'Sales Team'
  target TEXT, -- e.g., 'Deal: API Integration', 'Customer: John Smith'
  details JSONB, -- To store relevant info like customer_name, ticket_id
  customer_id UUID REFERENCES "MARM".customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
--  Phase 4: Indexes
--  Create indexes for performance-critical columns.
-- --------------------------------------------------------------------
CREATE INDEX "idx_customers_email" ON "MARM"."customers"("email");
CREATE INDEX "idx_customers_company" ON "MARM"."customers"("company");
CREATE INDEX "idx_customers_industry" ON "MARM"."customers"("industry");
CREATE INDEX "idx_customers_status" ON "MARM"."customers"("status");
CREATE INDEX "idx_customers_tags" ON "MARM"."customers" USING GIN("tags");
CREATE INDEX "idx_interactions_customer_id" ON "MARM"."interactions"("customer_id");
CREATE INDEX "idx_interactions_date" ON "MARM"."interactions"("date");
CREATE INDEX "idx_support_tickets_customer_id" ON "MARM"."support_tickets"("customer_id");
CREATE INDEX "idx_support_tickets_status" ON "MARM"."support_tickets"("status");
CREATE INDEX "idx_support_tickets_priority" ON "MARM"."support_tickets"("priority");
CREATE INDEX "idx_ticket_responses_ticket_id" ON "MARM"."ticket_responses"("ticket_id");
CREATE INDEX "idx_recent_activities_created_at" ON "MARM".recent_activities(created_at DESC);

-- --------------------------------------------------------------------
--  Phase 5: Functions
--  Define reusable functions for triggers within MARM schema.
-- --------------------------------------------------------------------

-- Function to update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION "MARM".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log new customers
CREATE OR REPLACE FUNCTION "MARM".log_new_customer_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at)
    VALUES (
        'created',
        'Trigger',
        'Customer: ' || NEW.first_name || ' ' || NEW.last_name,
        jsonb_build_object(
            'customer_id', NEW.id,
            'email', NEW.email,
            'company', NEW.company
        ),
        NEW.id,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log new interactions
CREATE OR REPLACE FUNCTION "MARM".log_new_interaction_activity()
RETURNS TRIGGER AS $$
DECLARE
    customer_name_var TEXT;
BEGIN
    SELECT first_name || ' ' || last_name INTO customer_name_var FROM "MARM".customers WHERE id = NEW.customer_id;
    INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at)
    VALUES (
        'created',
        'Trigger',
        'Interaction: ' || NEW.subject,
        jsonb_build_object(
            'interaction_id', NEW.id,
            'subject', NEW.subject,
            'customer_name', customer_name_var
        ),
        NEW.customer_id,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plVpgsql;

-- Function to log ticket status changes
CREATE OR REPLACE FUNCTION "MARM".log_ticket_status_change_activity()
RETURNS TRIGGER AS $$
DECLARE
    customer_name_var TEXT;
BEGIN
    -- Only log if the status has actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT first_name || ' ' || last_name INTO customer_name_var FROM "MARM".customers WHERE id = NEW.customer_id;
        INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at)
        VALUES (
            'status_changed',
            'Trigger',
            'Ticket: ' || NEW.title,
            jsonb_build_object(
                'ticket_id', NEW.id,
                'ticket_number', NEW.ticket_number,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'customer_name', customer_name_var
            ),
            NEW.customer_id,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log new deals
CREATE OR REPLACE FUNCTION "MARM".log_deal_activity()
RETURNS TRIGGER AS $$
DECLARE
    customer_name_var TEXT;
BEGIN
    SELECT CONCAT_WS(' ', first_name, last_name)
    INTO customer_name_var
    FROM "MARM".customers
    WHERE id = NEW.customer_id;

    INSERT INTO "MARM".recent_activities (action, user_name, target, details, customer_id, created_at)
    VALUES (
        'created',
        'Trigger',
        'Deal: ' || NEW.title,
        jsonb_build_object(
            'deal_id', NEW.id,
            'deal_value', NEW.value,
            'customer_name', customer_name_var
        ),
        NEW.customer_id,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
--  Phase 6: Triggers
--  Connect functions to table events.
-- --------------------------------------------------------------------

-- Triggers for 'updated_at'
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON "MARM".customers
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON "MARM".interactions
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON "MARM".support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON "MARM".customer_segments
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON "MARM".deals
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".update_updated_at_column();

-- Triggers for 'recent_activities' logging
CREATE TRIGGER on_new_customer_activity
  AFTER INSERT ON "MARM".customers
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".log_new_customer_activity();

CREATE TRIGGER on_new_interaction_activity
  AFTER INSERT ON "MARM".interactions
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".log_new_interaction_activity();

CREATE TRIGGER on_ticket_status_change_activity
  AFTER UPDATE ON "MARM".support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".log_ticket_status_change_activity();
  
CREATE TRIGGER on_new_deal_trigger
  AFTER INSERT ON "MARM".deals
  FOR EACH ROW
  EXECUTE FUNCTION "MARM".log_deal_activity();

-- ====================================================================
--  End of Script
-- ====================================================================