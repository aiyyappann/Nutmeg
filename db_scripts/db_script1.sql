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
  "email" TEXT NOT NULL UNIQUE,
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
$$ LANGUAGE plpgsql;

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
INSERT INTO "MARM".deal_stages ("name", "deal_order", "probability") VALUES
('New Lead', 1, 10),
('Contact Made', 2, 20),
('Demo Scheduled', 3, 40),
('Proposal Sent', 4, 60),
('Negotiation', 5, 80);


INSERT INTO "MARM".deals ("id", "title", "value", "stage_id", "customer_id", "expected_close_date", "created_at", "updated_at") VALUES
('3b96c645-17c1-41ec-b4b5-3c3b42f5edde', 'Deal for BuildWell Constructions', 30000.00, 1, '72323b0a-d43b-4e54-a0fd-f4ed9b358998', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30'),
('3c3cc89d-405e-41db-8c65-186081c739d7', 'Deal for QuickShift Logistics', 11000.00, 1, '3f03d289-2841-4abc-af0c-8555df13e182', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30'),
('de62b6d2-c426-4a9f-bcf5-00f895097ac8', 'Deal for Salazar Enterprises', 16000.00, 2, 'd1e7e07b-390e-423d-b8c1-00ad3897c033', '2025-10-26', '2025-09-26 21:03:45.447158+05:30', '2025-10-01 16:08:19.477744+05:30'),
('7f587041-48e0-4f9a-930b-e1e156a9c14e', 'Deal for Shivkumar Enterprises', 19500.00, 3, '42cee314-924b-4aa8-bfd8-4ea74d15dac6', '2025-10-29', '2025-09-29 18:58:44.701048+05:30', '2025-10-01 16:08:23.334459+05:30'),
('ea06aebb-703f-4c21-a95e-532cc6fbdf27', 'Deal for MediServe Hospitals', 25000.00, 3, 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:08:25.586622+05:30'),
('b35ad741-0710-457e-9898-dfebcff6d646', 'Deal for Data Strategies', 7500.00, 3, 'c0b3108a-c465-4c4b-93fe-827640b9e781', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 20:08:35.844147+05:30'),
('bcb57504-6327-4de6-895b-6654403699e4', 'Deal for AKSV', 15000.00, 2, '72323b0a-d43b-4e54-a0fd-f4ed9b358998', '2025-11-09', '2025-10-01 16:16:30.324866+05:30', '2025-10-01 16:16:30.324866+05:30'),
('e31a7884-f5c8-48bf-9c83-385ec69f716f', 'New Deal', 10000.00, 2, '9a088739-cf97-49d8-9782-c8bf3db11618', '2025-11-08', '2025-10-01 16:17:10.920408+05:30', '2025-10-01 16:17:10.920408+05:30'),
('4a68d999-edbd-4fde-8fc7-8675cea5c02c', 'Food', 100000.00, 5, '2f0321f0-1794-48e7-ba28-f18ea9b487c9', '2025-10-10', '2025-10-01 16:28:26.624827+05:30', '2025-10-01 16:28:26.624827+05:30'),
('ea3afa67-f9a4-486e-a8c8-5af83afe6c79', 'Deal for Foodies United', 4500.00, 3, '04987988-c750-452a-b9d5-0b0ae4415924', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:28:47.293243+05:30'),
('0f8ca9d2-d9d6-464a-82cf-f896de39ce0d', 'Deal for PharmaCo', 22000.00, 4, '7dc35920-f69a-47f0-96f7-3c2210c5fbc0', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:28:52.29105+05:30'),
('4deecc00-dbe9-4c7a-b118-64ba334cf64c', 'Deal for CloudWave Solutions', 8000.00, 5, '3b8c3450-2fd2-484e-a437-530f3bed4583', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 20:08:38.67385+05:30'),
('1fdaedcf-6884-4fd7-b5f7-51377653d4e6', 'Deal for Data Dynamics', 5000.00, 3, 'e60f5aa7-0980-4275-bdc0-eb2785493c94', '2025-10-25', '2025-09-25 21:45:11.172061+05:30', '2025-10-08 10:53:54.291534+05:30'),
('47c8c66a-8e8d-4349-91d2-7c74bef94724', 'Deal for Krishnan & Associates', 13500.00, 4, 'a6f63ca5-d511-4103-abba-0f31b6f38d1f', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:22.550772+05:30'),
('84503f1d-8d00-4c5c-89cb-8bd81969ca73', 'Deal for Pixel Perfect Games', 8500.00, 5, '9a088739-cf97-49d8-9782-c8bf3db11618', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:25.044575+05:30'),
('e7fef178-d603-4981-bf0d-6a84f2169117', 'Deal for Jain Textiles', 9000.00, 5, '9134395a-feca-445e-a678-0b9a9470359f', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:26.170845+05:30'),
('9bb7f160-373e-4ffb-9e60-d5a2950a3bdc', 'Deal for Retail Dynamics', 15000.00, 4, '532394d9-36f9-42ee-ba2a-de69fe9c6534', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-08 10:56:31.824684+05:30'),
('74f165f4-f7c8-402f-965d-de7228c10373', 'Deal for EduTech Innovations', 6000.00, 4, 'c318a6ab-8cb5-4f59-886e-4ba4cd234050', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:31.633108+05:30'),
('f42f9923-9e5e-4454-b41d-5fe3538b4838', 'Deal for GreenEnergy Solutions', 18000.00, 4, 'cc573320-6d01-4413-8f53-5e2bade0d84b', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:33.810126+05:30'),
('15b63889-2e6e-4ca3-9bd5-9c7bc2516753', 'Latest', 20000.00, 5, '3b8c3450-2fd2-484e-a437-530f3bed4583', '2025-10-26', '2025-10-01 20:08:14.749474+05:30', '2025-10-01 20:08:14.749474+05:30'),
('03a6a634-6f0e-4e08-9d23-b112a0bd1dd4', 'Deal for Aravind Gaming', 5500.00, 2, '05627e02-207c-41b1-b950-392bc8789b3f', '2025-10-26', '2025-09-26 21:00:26.484223+05:30', '2025-10-01 20:08:27.908673+05:30'),
('02c23d28-dcd8-446d-9190-16314d94d397', 'Deal for GlobalFin Corp', 12000.00, 1, '2f0321f0-1794-48e7-ba28-f18ea9b487c9', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-08 19:13:51.813418+05:30'),
('f393dfb5-07cf-4673-9a9f-3ac2ac0f6198', 'Deal for NextGen AI', 9500.00, 2, '7e9911d1-6ba3-4781-b695-6ad6a3a40602', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-08 21:07:56.101145+05:30');

INSERT INTO "MARM".customer_segments ("id", "name", "description", "criteria", "created_at", "updated_at") VALUES
('4368a4d5-2c96-41f8-a36a-bdec990fa23e', 'VIP Customers', 'High-value customers with significant business potential', '{"rules": [{"field": "value", "value": "50000", "operator": "gt"}, {"field": "status", "value": "Active", "operator": "eq"}]}', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('662b2992-c2a1-46cf-b4b3-3cf092ebb6e1', 'Technology Prospects', 'Prospective customers in the technology industry', '{"rules": [{"field": "industry", "value": "Technology", "operator": "eq"}, {"field": "status", "value": "Prospect", "operator": "eq"}]}', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('9c1f916f-8116-4a33-a355-034605002152', 'Healthcare Segment', 'Active customers in healthcare industry', '{"rules": [{"field": "industry", "value": "Healthcare", "operator": "eq"}, {"field": "status", "value": "Active", "operator": "eq"}]}', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('6870fa14-bd12-4cfe-b479-7428a44be19a', 'High Value Active', 'Active customers with high customer value', '{"rules": [{"field": "value", "value": "40000", "operator": "gt"}, {"field": "status", "value": "Active", "operator": "eq"}]}', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('3d21b44f-f416-4117-a814-790af4d93cb1', 'VIP segment2', 'Segment with 1 rule', '{"rules": [{"field": "industry", "value": "100", "operator": "gt"}]}', '2025-09-25 21:12:23.199285+05:30', '2025-09-25 21:12:23.199285+05:30'),
('403f54be-3951-4fd9-8a6d-b434f192c936', 'neww', 'Segment with 1 rule', '{"rules": [{"field": "value", "value": "10", "operator": "lt"}]}', '2025-09-25 21:54:51.304732+05:30', '2025-09-25 21:54:51.304732+05:30'),
('fbcf1077-9cf5-4816-a8fd-b3744df9d240', 'NEW ', 'Segment with 1 rule', '{"rules": [{"field": "value", "value": "100000", "operator": "gt"}]}', '2025-09-29 18:59:33.121787+05:30', '2025-09-29 18:59:33.121787+05:30');



INSERT INTO "MARM".support_tickets ("id", "customer_id", "title", "description", "priority", "status", "category", "assigned_to", "created_at", "updated_at") VALUES
('f644cdb7-92e6-4c00-945e-7d719ed50d79', '5454e524-c7b5-441f-bcb1-6343bf355686', 'Performance Issues', 'Need help integrating with existing CRM system', 'Low', 'Open', 'Billing', 'John Doe', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('1d2d7bf6-9b51-4654-ac2d-baa97b9cf88a', '3e2c4fa0-4e8f-4900-9861-89ee1776d4d3', 'Billing Discrepancy', 'General inquiry about service capabilities', 'Low', 'Resolved', 'Billing', 'Mike Johnson', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('775583b1-84d2-4e7a-9f54-37203ba4872f', '42cee314-924b-4aa8-bfd8-4ea74d15dac6', 'Req new feature ', '...', 'High', 'In Progress', 'Feature Request', 'Tech Team', '2025-09-29 19:01:22.253869+05:30', '2025-10-01 12:01:42.235533+05:30'),
('44e7f733-d100-487b-91df-a0b79bead587', 'e60f5aa7-0980-4275-bdc0-eb2785493c94', 'Tech support', 'desc', 'Medium', 'In Progress', 'General', 'Support Team', '2025-09-26 20:58:30.943202+05:30', '2025-10-01 12:03:44.997218+05:30'),
('39b53865-90b1-4494-bbf3-d7dcd2ea68e8', 'dd4aa6d8-cb33-40bf-b9f0-abc954d473dc', 'Login Issues', 'General inquiry about service capabilities', 'Medium', 'Closed', 'General', 'Mike Johnson', '2025-09-25 11:40:41.36093+05:30', '2025-10-01 12:19:09.29201+05:30');




INSERT INTO "MARM".support_tickets ("id", "customer_id", "title", "description", "priority", "status", "category", "assigned_to", "created_at", "updated_at") VALUES
('f644cdb7-92e6-4c00-945e-7d719ed50d79', '5454e524-c7b5-441f-bcb1-6343bf355686', 'Performance Issues', 'Need help integrating with existing CRM system', 'Low', 'Open', 'Billing', 'John Doe', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('1d2d7bf6-9b51-4654-ac2d-baa97b9cf88a', '3e2c4fa0-4e8f-4900-9861-89ee1776d4d3', 'Billing Discrepancy', 'General inquiry about service capabilities', 'Low', 'Resolved', 'Billing', 'Mike Johnson', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('775583b1-84d2-4e7a-9f54-37203ba4872f', '42cee314-924b-4aa8-bfd8-4ea74d15dac6', 'Req new feature ', '...', 'High', 'In Progress', 'Feature Request', 'Tech Team', '2025-09-29 19:01:22.253869+05:30', '2025-10-01 12:01:42.235533+05:30'),
('44e7f733-d100-487b-91df-a0b79bead587', 'e60f5aa7-0980-4275-bdc0-eb2785493c94', 'Tech support', 'desc', 'Medium', 'In Progress', 'General', 'Support Team', '2025-09-26 20:58:30.943202+05:30', '2025-10-01 12:03:44.997218+05:30'),
('39b53865-90b1-4494-bbf3-d7dcd2ea68e8', 'dd4aa6d8-cb33-40bf-b9f0-abc954d473dc', 'Login Issues', 'General inquiry about service capabilities', 'Medium', 'Closed', 'General', 'Mike Johnson', '2025-09-25 11:40:41.36093+05:30', '2025-10-01 12:19:09.29201+05:30');


INSERT INTO "MARM".ticket_responses ("id", "ticket_id", "author", "message", "created_at") VALUES
('bc1bfcd8-89df-454c-9e05-0f47a1b0cb61', '39b53865-90b1-4494-bbf3-d7dcd2ea68e8', 'Customer', 'Initial ticket description and problem details', '2025-09-25 11:40:41.36093+05:30'),
('b0174a46-924e-41cd-a2a9-eaba36d519db', 'f644cdb7-92e6-4c00-945e-7d719ed50d79', 'Customer', 'Initial ticket description and problem details', '2025-09-25 11:40:41.36093+05:30'),
('cb9ddecc-af14-46b0-a943-6f2bbcaffaf1', '1d2d7bf6-9b51-4654-ac2d-baa97b9cf88a', 'Customer', 'Initial ticket description and problem details', '2025-09-25 11:40:41.36093+05:30'),
('4d3ea780-4195-41dc-b136-53f786999f68', 'f644cdb7-92e6-4c00-945e-7d719ed50d79', 'Support Agent', 'We have implemented the fix for your issue. Please let us know if you need any further assistance.', '2025-09-25 11:40:41.36093+05:30'),
('9b304e99-13dd-4765-8b0d-3802c5a25bdb', '1d2d7bf6-9b51-4654-ac2d-baa97b9cf88a', 'Support Agent', 'We have implemented the fix for your issue. Please let us know if you need any further assistance.', '2025-09-25 11:40:41.36093+05:30'),
('6990f93f-400d-44f7-bb82-2a7602f00eb0', '1d2d7bf6-9b51-4654-ac2d-baa97b9cf88a', 'Support Agent', 'xfg', '2025-09-26 22:33:01.296844+05:30'),
('551e5799-2e6c-4471-85bf-3380df1288d6', '44e7f733-d100-487b-91df-a0b79bead587', 'Support Agent', 'hey', '2025-09-26 22:33:28.126511+05:30'),
('ddd3da0c-a1f5-478b-92b1-a20d0c496105', 'f644cdb7-92e6-4c00-945e-7d719ed50d79', 'Support Agent', 'okay', '2025-09-26 22:36:42.299533+05:30'),
('cdd0ae1b-29a2-463f-b1eb-190fe452619d', 'f644cdb7-92e6-4c00-945e-7d719ed50d79', 'Support Agent', 'okay', '2025-09-26 22:37:38.694309+05:30'),
('01cb5d88-8f8a-40b9-915e-06b34b25d641', 'f644cdb7-92e6-4c00-945e-7d719ed50d79', 'Support Agent', 'okay', '2025-09-26 22:37:59.257852+05:30'),
('2877d042-9a14-4166-9c2f-9dd874375bbd', 'f644cdb7-92e6-4c00-945e-7d719ed50d79', 'Support Agent', 'okay', '2025-09-26 22:38:14.165769+05:30'),
('bde57352-df90-4116-bf9b-0f44bad38646', '39b53865-90b1-4494-bbf3-d7dcd2ea68e8', 'Support Agent', 'vanakkam', '2025-10-01 16:27:28.389179+05:30');


INSERT INTO "MARM".segment_memberships ("id", "customer_id", "segment_id", "created_at") VALUES
('7bf61277-60a2-4ffa-b87e-d97607bcdb6b', '274c7d8d-2c68-4853-a4d6-cfd342627c6b', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('561046dc-3419-41d6-911f-a6f0e0e66c64', '136ef922-bb41-4ecd-83a7-0935529b2577', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('ebc3945f-799e-4509-a8e5-a318010c5af8', '5b010216-6fc9-412e-8e01-3eb1cfcfcd6b', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('34cdb43a-51c0-4fde-bfff-1425dc7358ca', 'c0b3108a-c465-4c4b-93fe-827640b9e781', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('33b460fb-5914-468b-b195-2c91cba401e5', '2f0321f0-1794-48e7-ba28-f18ea9b487c9', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('301021e3-e5d3-4bcf-9d9e-939898cda20c', 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('78cc0422-023d-46b0-be41-6adc90d07121', 'a6f63ca5-d511-4103-abba-0f31b6f38d1f', '4368a4d5-2c96-41f8-a36a-bdec990fa23e', '2025-09-25 22:14:12.21183+05:30'),
('99104223-0456-418e-8be6-f5710531d15d', '7e9911d1-6ba3-4781-b695-6ad6a3a40602', '662b2992-c2a1-46cf-b4b3-3cf092ebb6e1', '2025-09-25 22:14:12.21183+05:30'),
('98ffc1ed-6721-4670-926e-00fb48d266ee', '3b8c3450-2fd2-484e-a437-530f3bed4583', '662b2992-c2a1-46cf-b4b3-3cf092ebb6e1', '2025-09-25 22:14:12.21183+05:30'),
('139f3441-b73f-441d-ba0c-1d76d73ac137', '136ef922-bb41-4ecd-83a7-0935529b2577', '9c1f916f-8116-4a33-a355-034605002152', '2025-09-25 22:14:12.21183+05:30'),
('7bbcf191-aeb8-4f37-b778-89115d3fd8b2', 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f', '9c1f916f-8116-4a33-a355-034605002152', '2025-09-25 22:14:12.21183+05:30'),
('fe440892-adb9-40e0-86f1-686c40a1ca1c', '274c7d8d-2c68-4853-a4d6-cfd342627c6b', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('88a4e470-420c-49eb-97c1-25eeac61f0ff', 'dd4aa6d8-cb33-40bf-b9f0-abc954d473dc', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('364297ed-bdf6-472a-b213-07a89254f6be', '136ef922-bb41-4ecd-83a7-0935529b2577', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('9516e5e6-2cfc-4cea-b9ab-2e3690cbdd68', '5b010216-6fc9-412e-8e01-3eb1cfcfcd6b', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('117faa26-8783-4492-880b-5a84a2ac3574', 'c0b3108a-c465-4c4b-93fe-827640b9e781', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('5bf78823-54c8-4718-a8fb-314e56ab9b6a', '2f0321f0-1794-48e7-ba28-f18ea9b487c9', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('71761eb3-87ed-4881-b8bc-5e52d53402f8', 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('73d5845b-d29b-4f80-bfeb-d00e210f172a', 'a6f63ca5-d511-4103-abba-0f31b6f38d1f', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30'),
('aa8f068b-bf97-409a-80ba-0fa6e36bcec1', '9a088739-cf97-49d8-9782-c8bf3db11618', '6870fa14-bd12-4cfe-b479-7428a44be19a', '2025-09-25 22:14:12.21183+05:30');



INSERT INTO "MARM".recent_activities ("id", "action", "details", "created_at", "user_name", "target", "customer_id") VALUES
('ac494445-c90c-406d-b78d-614c7ca45fa4', 'NEW_CUSTOMER', '{"id": "e60f5aa7-0980-4275-bdc0-eb2785493c94", "name": "Nolana Rodriguez", "company": "Data Dynamics"}', '2025-09-25 21:45:11.172061+05:30', NULL, NULL, 'e60f5aa7-0980-4275-bdc0-eb2785493c94'),
('654b3814-ae26-446e-9281-edd31f4f423c', 'NEW_INTERACTION', '{"id": "cbecdf51-bd70-41f3-bcd3-8528b5dbabac", "subject": "abcd", "customerId": "e60f5aa7-0980-4275-bdc0-eb2785493c94", "customerName": "Nolana Rodriguez"}', '2025-09-25 21:46:09.729249+05:30', NULL, NULL, 'e60f5aa7-0980-4275-bdc0-eb2785493c94'),
('e9b295ad-ace4-46ec-90c6-f90abd94fddb', 'NEW_INTERACTION', '{"id": "77cc0bca-cc1c-4313-a3fc-3f67e3c3f932", "subject": "Interview", "customerId": "e60f5aa7-0980-4275-bdc0-eb2785493c94", "customerName": "Nolana Rodriguezo"}', '2025-09-25 21:54:18.846938+05:30', NULL, NULL, 'e60f5aa7-0980-4275-bdc0-eb2785493c94'),
('bbd243b2-c92e-4c25-8d20-320f977501d9', 'NEW_CUSTOMER', '{"id": "c0b3108a-c465-4c4b-93fe-827640b9e781", "name": "Priya Rao", "company": "Data Strategies"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, 'c0b3108a-c465-4c4b-93fe-827640b9e781'),
('d4612a4a-bc81-41f9-a800-9057cef1cf1a', 'NEW_CUSTOMER', '{"id": "2f0321f0-1794-48e7-ba28-f18ea9b487c9", "name": "Amit Singh", "company": "GlobalFin Corp"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '2f0321f0-1794-48e7-ba28-f18ea9b487c9'),
('2416479f-3437-451c-8983-8accff02a7f3', 'NEW_CUSTOMER', '{"id": "7e9911d1-6ba3-4781-b695-6ad6a3a40602", "name": "Kiran Desai", "company": "NextGen AI"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '7e9911d1-6ba3-4781-b695-6ad6a3a40602'),
('1917bc41-5cde-4357-b64f-1fa86e29fa71', 'NEW_CUSTOMER', '{"id": "3b8c3450-2fd2-484e-a437-530f3bed4583", "name": "Sunita Patel", "company": "CloudWave Solutions"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '3b8c3450-2fd2-484e-a437-530f3bed4583'),
('be7bb2e3-72d8-487a-85b6-22d4f4c8763f', 'NEW_CUSTOMER', '{"id": "aa2d2ef8-cc99-4b9c-93a9-da5ee757172f", "name": "Dr. Rohan Gupta", "company": "MediServe Hospitals"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f'),
('559bcabe-b5ad-4fcd-b674-348941bbe56e', 'NEW_CUSTOMER', '{"id": "c318a6ab-8cb5-4f59-886e-4ba4cd234050", "name": "Anjali Sharma", "company": "EduTech Innovations"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, 'c318a6ab-8cb5-4f59-886e-4ba4cd234050'),
('7906747e-ff5c-4b32-aa15-2114e2f67400', 'NEW_CUSTOMER', '{"id": "532394d9-36f9-42ee-ba2a-de69fe9c6534", "name": "Vikram Kumar", "company": "Retail Dynamics"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '532394d9-36f9-42ee-ba2a-de69fe9c6534'),
('6854071d-8470-4c08-9aad-2070e202a5d1', 'NEW_CUSTOMER', '{"id": "72323b0a-d43b-4e54-a0fd-f4ed9b358998", "name": "Neha Verma", "company": "BuildWell Constructions"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '72323b0a-d43b-4e54-a0fd-f4ed9b358998'),
('33f52bb5-de51-4a14-a447-63f8c9354dd7', 'NEW_CUSTOMER', '{"id": "3f03d289-2841-4abc-af0c-8555df13e182", "name": "Sanjay Mehta", "company": "QuickShift Logistics"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '3f03d289-2841-4abc-af0c-8555df13e182'),
('edef3143-7b22-4171-b651-b452fb59b9d9', 'NEW_CUSTOMER', '{"id": "04987988-c750-452a-b9d5-0b0ae4415924", "name": "Pooja Iyer", "company": "Foodies United"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '04987988-c750-452a-b9d5-0b0ae4415924'),
('b035b713-e5c8-4569-a3d3-b3483f08b912', 'NEW_CUSTOMER', '{"id": "cc573320-6d01-4413-8f53-5e2bade0d84b", "name": "Arjun Nair", "company": "GreenEnergy Solutions"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, 'cc573320-6d01-4413-8f53-5e2bade0d84b'),
('0bbfaa69-6934-448a-a775-02b4ae155581', 'NEW_CUSTOMER', '{"id": "7dc35920-f69a-47f0-96f7-3c2210c5fbc0", "name": "Divya Reddy", "company": "PharmaCo"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '7dc35920-f69a-47f0-96f7-3c2210c5fbc0'),
('3c462bc2-4b25-497c-920c-ebb63cfc1ded', 'NEW_CUSTOMER', '{"id": "9134395a-feca-445e-a678-0b9a9470359f", "name": "Rajesh Jain", "company": "Jain Textiles"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '9134395a-feca-445e-a678-0b9a9470359f'),
('412f938d-126f-4cf3-a1d5-809091220d74', 'NEW_CUSTOMER', '{"id": "a6f63ca5-d511-4103-abba-0f31b6f38d1f", "name": "Meera Krishnan", "company": "Krishnan & Associates"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, 'a6f63ca5-d511-4103-abba-0f31b6f38d1f'),
('bec1f3df-69a9-412f-9248-7019ab87f015', 'NEW_CUSTOMER', '{"id": "9a088739-cf97-49d8-9782-c8bf3db11618", "name": "Siddharth Chopra", "company": "Pixel Perfect Games"}', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '9a088739-cf97-49d8-9782-c8bf3db11618'),
('3bb705ac-a2f9-4a74-905e-37ba1a213319', 'NEW_CUSTOMER', '{"id": "05627e02-207c-41b1-b950-392bc8789b3f", "name": "Aravind  Krishna", "company": "Aravind Gaming"}', '2025-09-26 21:00:26.484223+05:30', NULL, NULL, '05627e02-207c-41b1-b950-392bc8789b3f'),
('c5b4c29a-c600-4da2-9385-4c923cd1016c', 'NEW_CUSTOMER', '{"id": "d1e7e07b-390e-423d-b8c1-00ad3897c033", "name": "Midhru Jayan", "company": "Salazar Enterprises"}', '2025-09-26 21:03:45.447158+05:30', NULL, NULL, 'd1e7e07b-390e-423d-b8c1-00ad3897c033'),
('ff719b25-ea93-4df3-9128-7ac146ec5b88', 'TICKET_STATUS_CHANGED', '{"id": "39b53865-90b1-4494-bbf3-d7dcd2ea68e8", "title": "Login Issues", "newStatus": "Resolved", "customerId": "dd4aa6d8-cb33-40bf-b9f0-abc954d473dc", "customerName": "Sarah Johnson"}', '2025-09-29 18:51:59.034581+05:30', NULL, NULL, 'dd4aa6d8-cb33-40bf-b9f0-abc954d473dc'),
('0537e788-e40b-4e7d-b14b-f008e9e8b900', 'NEW_INTERACTION', '{"id": "7797c234-c410-421e-a4c5-90fe5eaaa816", "subject": "Product Description", "customerId": "05627e02-207c-41b1-b950-392bc8789b3f", "customerName": "Aravind  Krishna"}', '2025-09-29 18:55:18.427654+05:30', NULL, NULL, '05627e02-207c-41b1-b950-392bc8789b3f'),
('f00eff3b-b274-4063-be2d-e3144125a238', 'NEW_CUSTOMER', '{"id": "42cee314-924b-4aa8-bfd8-4ea74d15dac6", "name": "Arjun  Shivkumar", "company": "Shivkumar Enterprises"}', '2025-09-29 18:58:44.701048+05:30', NULL, NULL, '42cee314-924b-4aa8-bfd8-4ea74d15dac6'),
('095e42c0-eb49-40c3-8edb-d76f22238802', 'NEW_INTERACTION', '{"id": "cd080b42-6b9a-401e-ab31-f061dd53dbeb", "subject": "GEN ENQUIRY", "customerId": "42cee314-924b-4aa8-bfd8-4ea74d15dac6", "customerName": "Arjun  Shivakumar"}', '2025-09-29 19:00:46.677255+05:30', NULL, NULL, '42cee314-924b-4aa8-bfd8-4ea74d15dac6'),
('6c7b0c77-deb8-422b-8ed8-7033840b2641', 'TICKET_STATUS_CHANGED', '{"id": "775583b1-84d2-4e7a-9f54-37203ba4872f", "title": "Req new feature ", "newStatus": "In Progress", "customerId": "42cee314-924b-4aa8-bfd8-4ea74d15dac6", "customerName": "Arjun  Shivakumar"}', '2025-09-29 19:01:29.961925+05:30', NULL, NULL, '42cee314-924b-4aa8-bfd8-4ea74d15dac6'),
('7c886e88-5d2a-4497-b20d-06bfde3cd9f1', 'TICKET_STATUS_CHANGED', '{"id": "775583b1-84d2-4e7a-9f54-37203ba4872f", "title": "Req new feature ", "newStatus": "Closed", "customerId": "42cee314-924b-4aa8-bfd8-4ea74d15dac6", "customerName": "Arjun  Shivakumar"}', '2025-09-29 19:01:59.563642+05:30', NULL, NULL, '42cee314-924b-4aa8-bfd8-4ea74d15dac6'),
('d8ae208a-a553-4c17-8465-7829bda3c88e', 'TICKET_STATUS_CHANGED', '{"id": "775583b1-84d2-4e7a-9f54-37203ba4872f", "title": "Req new feature ", "newStatus": "In Progress", "customerId": "42cee314-924b-4aa8-bfd8-4ea74d15dac6", "customerName": "Arjun  Shivakumar"}', '2025-10-01 12:01:42.235533+05:30', NULL, NULL, '42cee314-924b-4aa8-bfd8-4ea74d15dac6'),
('77c0ea37-740d-4e22-aece-70caa61c4aa0', 'ticket_status_change', '{"ticket_id": "775583b1-84d2-4e7a-9f54-37203ba4872f", "new_status": "In Progress", "old_status": "Closed"}', '2025-10-01 12:01:42.235533+05:30', NULL, NULL, NULL),
('520e398b-0333-4d3c-852b-e42a10033ed4', 'TICKET_STATUS_CHANGED', '{"id": "44e7f733-d100-487b-91df-a0b79bead587", "title": "Tech support", "newStatus": "In Progress", "customerId": "e60f5aa7-0980-4275-bdc0-eb2785493c94", "customerName": "Nolana Rodriguezo"}', '2025-10-01 12:03:44.997218+05:30', NULL, NULL, 'e60f5aa7-0980-4275-bdc0-eb2785493c94'),
('56ceffb7-a521-499a-9a7a-be8566c6d9aa', 'ticket_status_change', '{"ticket_id": "44e7f733-d100-487b-91df-a0b79bead587", "new_status": "In Progress", "old_status": "Open"}', '2025-10-01 12:03:44.997218+05:30', NULL, NULL, NULL),
('aea64716-da56-450e-8b89-afff435d2cc3', 'TICKET_STATUS_CHANGED', '{"id": "39b53865-90b1-4494-bbf3-d7dcd2ea68e8", "title": "Login Issues", "newStatus": "Closed", "customerId": "dd4aa6d8-cb33-40bf-b9f0-abc954d473dc", "customerName": "Sarah Johnson"}', '2025-10-01 12:19:09.29201+05:30', NULL, NULL, 'dd4aa6d8-cb33-40bf-b9f0-abc954d473dc'),
('db20b19c-2868-4cb1-86e5-8b083e034603', 'DEAL_CREATED', '{"dealId": "1fdaedcf-6884-4fd7-b5f7-51377653d4e6", "dealTitle": "Deal for Data Dynamics", "customerId": "e60f5aa7-0980-4275-bdc0-eb2785493c94", "customerName": "Nolana Rodriguezo"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'e60f5aa7-0980-4275-bdc0-eb2785493c94'),
('d450fec4-6bbf-4cda-b282-0ca81591e6fa', 'DEAL_CREATED', '{"dealId": "b35ad741-0710-457e-9898-dfebcff6d646", "dealTitle": "Deal for Data Strategies", "customerId": "c0b3108a-c465-4c4b-93fe-827640b9e781", "customerName": "Priya Rao"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'c0b3108a-c465-4c4b-93fe-827640b9e781'),
('61637948-2def-4519-92d7-141039cf9edd', 'DEAL_CREATED', '{"dealId": "02c23d28-dcd8-446d-9190-16314d94d397", "dealTitle": "Deal for GlobalFin Corp", "customerId": "2f0321f0-1794-48e7-ba28-f18ea9b487c9", "customerName": "Amit Singh"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '2f0321f0-1794-48e7-ba28-f18ea9b487c9'),
('473a3592-4ab4-4fd1-be24-d42eef64cd27', 'DEAL_CREATED', '{"dealId": "f393dfb5-07cf-4673-9a9f-3ac2ac0f6198", "dealTitle": "Deal for NextGen AI", "customerId": "7e9911d1-6ba3-4781-b695-6ad6a3a40602", "customerName": "Kiran Desai"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '7e9911d1-6ba3-4781-b695-6ad6a3a40602'),
('940e0ff2-2979-4096-8d6a-cc210c5420ef', 'DEAL_CREATED', '{"dealId": "4deecc00-dbe9-4c7a-b118-64ba334cf64c", "dealTitle": "Deal for CloudWave Solutions", "customerId": "3b8c3450-2fd2-484e-a437-530f3bed4583", "customerName": "Sunita Patel"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '3b8c3450-2fd2-484e-a437-530f3bed4583'),
('43b4fd1c-9f8a-41b3-9bdf-ee2971376906', 'DEAL_CREATED', '{"dealId": "ea06aebb-703f-4c21-a95e-532cc6fbdf27", "dealTitle": "Deal for MediServe Hospitals", "customerId": "aa2d2ef8-cc99-4b9c-93a9-da5ee757172f", "customerName": "Dr. Rohan Gupta"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f'),
('75b2cacc-c847-4394-acb7-e9028b83eed2', 'DEAL_CREATED', '{"dealId": "74f165f4-f7c8-402f-965d-de7228c10373", "dealTitle": "Deal for EduTech Innovations", "customerId": "c318a6ab-8cb5-4f59-886e-4ba4cd234050", "customerName": "Anjali Sharma"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'c318a6ab-8cb5-4f59-886e-4ba4cd234050'),
('dee90bd0-4699-4918-846f-3a16bc9b0520', 'DEAL_CREATED', '{"dealId": "9bb7f160-373e-4ffb-9e60-d5a2950a3bdc", "dealTitle": "Deal for Retail Dynamics", "customerId": "532394d9-36f9-42ee-ba2a-de69fe9c6534", "customerName": "Vikram Kumar"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '532394d9-36f9-42ee-ba2a-de69fe9c6534'),
('7feecc7b-b97a-4a23-955d-0605fced5502', 'DEAL_CREATED', '{"dealId": "3b96c645-17c1-41ec-b4b5-3c3b42f5edde", "dealTitle": "Deal for BuildWell Constructions", "customerId": "72323b0a-d43b-4e54-a0fd-f4ed9b358998", "customerName": "Neha Verma"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '72323b0a-d43b-4e54-a0fd-f4ed9b358998'),
('ce46c966-9fd1-4d01-b3b1-db40843bc0c3', 'DEAL_CREATED', '{"dealId": "3c3cc89d-405e-41db-8c65-186081c739d7", "dealTitle": "Deal for QuickShift Logistics", "customerId": "3f03d289-2841-4abc-af0c-8555df13e182", "customerName": "Sanjay Mehtaa"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '3f03d289-2841-4abc-af0c-8555df13e182'),
('18b4e5a4-68b3-4404-b921-f818e7d24bd3', 'DEAL_CREATED', '{"dealId": "ea3afa67-f9a4-486e-a8c8-5af83afe6c79", "dealTitle": "Deal for Foodies United", "customerId": "04987988-c750-452a-b9d5-0b0ae4415924", "customerName": "Pooja Iyer"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '04987988-c750-452a-b9d5-0b0ae4415924'),
('4343c6c5-343b-47de-b131-de48fd4ec890', 'DEAL_CREATED', '{"dealId": "f42f9923-9e5e-4454-b41d-5fe3538b4838", "dealTitle": "Deal for GreenEnergy Solutions", "customerId": "cc573320-6d01-4413-8f53-5e2bade0d84b", "customerName": "Arjun Nair"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'cc573320-6d01-4413-8f53-5e2bade0d84b'),
('858403a9-868e-4c17-be0c-23c9d0d58c42', 'DEAL_CREATED', '{"dealId": "0f8ca9d2-d9d6-464a-82cf-f896de39ce0d", "dealTitle": "Deal for PharmaCo", "customerId": "7dc35920-f69a-47f0-96f7-3c2210c5fbc0", "customerName": "Divya Reddy"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '7dc35920-f69a-47f0-96f7-3c2210c5fbc0'),
('f93a161a-da8d-4876-933c-f8ce51a3c08a', 'DEAL_CREATED', '{"dealId": "e7fef178-d603-4981-bf0d-6a84f2169117", "dealTitle": "Deal for Jain Textiles", "customerId": "9134395a-feca-445e-a678-0b9a9470359f", "customerName": "Rajesh Jain"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '9134395a-feca-445e-a678-0b9a9470359f'),
('16a1d329-e2af-446d-b9ea-79d60fee66f4', 'DEAL_CREATED', '{"dealId": "47c8c66a-8e8d-4349-91d2-7c74bef94724", "dealTitle": "Deal for Krishnan & Associates", "customerId": "a6f63ca5-d511-4103-abba-0f31b6f38d1f", "customerName": "Meera Krishnan"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'a6f63ca5-d511-4103-abba-0f31b6f38d1f'),
('636615eb-e334-49ec-aa86-75c497ad3b7b', 'DEAL_CREATED', '{"dealId": "84503f1d-8d00-4c5c-89cb-8bd81969ca73", "dealTitle": "Deal for Pixel Perfect Games", "customerId": "9a088739-cf97-49d8-9782-c8bf3db11618", "customerName": "Siddharth Chopra"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '9a088739-cf97-49d8-9782-c8bf3db11618'),
('0235ccd9-e7f2-4ae7-9a16-ac4fdfdb8e2e', 'DEAL_CREATED', '{"dealId": "03a6a634-6f0e-4e08-9d23-b112a0bd1dd4", "dealTitle": "Deal for Aravind Gaming", "customerId": "05627e02-207c-41b1-b950-392bc8789b3f", "customerName": "Aravind  Krishna"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '05627e02-207c-41b1-b950-392bc8789b3f'),
('f974873b-362b-4ff0-ab56-97b63926023a', 'DEAL_CREATED', '{"dealId": "de62b6d2-c426-4a9f-bcf5-00f895097ac8", "dealTitle": "Deal for Salazar Enterprises", "customerId": "d1e7e07b-390e-423d-b8c1-00ad3897c033", "customerName": "Midhru  Jayan"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, 'd1e7e07b-390e-423d-b8c1-00ad3897c033'),
('967446c0-951b-4289-8877-a4b8989db248', 'DEAL_CREATED', '{"dealId": "7f587041-48e0-4f9a-930b-e1e156a9c14e", "dealTitle": "Deal for Shivkumar Enterprises", "customerId": "42cee314-924b-4aa8-bfd8-4ea74d15dac6", "customerName": "Arjun  Shivakumar"}', '2025-10-01 14:12:12.981703+05:30', NULL, NULL, '42cee314-924b-4aa8-bfd8-4ea74d15dac6'),
('87a67daf-de87-4706-8119-55c28aded2ee', 'DEAL_CREATED', '{"dealId": "bcb57504-6327-4de6-895b-6654403699e4", "dealTitle": "Deal for AKSV", "customerId": "72323b0a-d43b-4e54-a0fd-f4ed9b358998", "customerName": "Neha Verma"}', '2025-10-01 16:16:30.324866+05:30', NULL, NULL, '72323b0a-d43b-4e54-a0fd-f4ed9b358998'),
('8074cfa8-d69a-489a-ba0b-b5809980840e', 'DEAL_CREATED', '{"dealId": "e31a7884-f5c8-48bf-9c83-385ec69f716f", "dealTitle": "New Deal", "customerId": "9a088739-cf97-49d8-9782-c8bf3db11618", "customerName": "Siddharth Chopra"}', '2025-10-01 16:17:10.920408+05:30', NULL, NULL, '9a088739-cf97-49d8-9782-c8bf3db11618'),
('1f5908b5-8801-4bcc-a994-d3173a851d3e', 'DEAL_CREATED', '{"dealId": "4a68d999-edbd-4fde-8fc7-8675cea5c02c", "dealTitle": "Food", "customerId": "2f0321f0-1794-48e7-ba28-f18ea9b487c9", "customerName": "Amit Singh"}', '2025-10-01 16:28:26.624827+05:30', NULL, NULL, '2f0321f0-1794-48e7-ba28-f18ea9b487c9'),
('4c31e68f-4ce3-4326-88c0-e8febb7d58e5', 'DEAL_CREATED', '{"dealId": "15b63889-2e6e-4ca3-9bd5-9c7bc2516753", "dealTitle": "Latest", "customerId": "3b8c3450-2fd2-484e-a437-530f3bed4583", "customerName": "Sunita Patel"}', '2025-10-01 20:08:14.749474+05:30', NULL, NULL, '3b8c3450-2fd2-484e-a437-530f3bed4583'),
('cecd7aee-bbad-4f56-9c7f-77c9d9fd04ef', 'DEAL_STAGE_CHANGED', '{"dealId": "1fdaedcf-6884-4fd7-b5f7-51377653d4e6", "newStage": "Demo Scheduled", "oldStage": "Contact Made", "dealTitle": "Deal for Data Dynamics", "customerId": "e60f5aa7-0980-4275-bdc0-eb2785493c94", "customerName": "Nolana Rodriguezo"}', '2025-10-08 10:53:54.333072+05:30', NULL, NULL, 'e60f5aa7-0980-4275-bdc0-eb2785493c94'),
('e664ec00-1327-4629-b95e-f92155fe7f0a', 'DEAL_STAGE_CHANGED', '{"dealId": "9bb7f160-373e-4ffb-9e60-d5a2950a3bdc", "newStage": "Proposal Sent", "oldStage": "Negotiation", "dealTitle": "Deal for Retail Dynamics", "customerId": "532394d9-36f9-42ee-ba2a-de69fe9c6534", "customerName": "Vikram Kumar"}', '2025-10-08 10:56:31.834769+05:30', NULL, NULL, '532394d9-36f9-42ee-ba2a-de69fe9c6534'),
('7bb756f8-5c66-4144-9cdd-8fb7f9974682', 'DEAL_STAGE_CHANGED', '{"dealId": "02c23d28-dcd8-446d-9190-16314d94d397", "newStage": "New Lead", "oldStage": "Contact Made", "dealTitle": "Deal for GlobalFin Corp", "customerId": "2f0321f0-1794-48e7-ba28-f18ea9b487c9", "customerName": "Amit Singh"}', '2025-10-08 19:13:51.839273+05:30', NULL, NULL, '2f0321f0-1794-48e7-ba28-f18ea9b487c9'),
('881184fd-bb18-47dc-87fc-d58798089761', 'DEAL_STAGE_CHANGED', '{"dealId": "f393dfb5-07cf-4673-9a9f-3ac2ac0f6198", "newStage": "Contact Made", "oldStage": "New Lead", "dealTitle": "Deal for NextGen AI", "customerId": "7e9911d1-6ba3-4781-b695-6ad6a3a40602", "customerName": "Kiran Desai"}', '2025-10-08 21:07:56.131815+05:30', NULL, NULL, '7e9911d1-6ba3-4781-b695-6ad6a3a40602');



INSERT INTO "MARM".interactions ("id", "customer_id", "type", "channel", "subject", "notes", "date", "duration", "outcome", "next_action", "created_at", "updated_at") VALUES
('49544b98-ba05-4c70-a248-801a3b105810', '274c7d8d-2c68-4853-a4d6-cfd342627c6b', 'Meeting', 'In-Person', 'General Inquiry', 'Provided technical specifications and implementation timeline', '2025-09-25 11:40:41.36093+05:30', 83, 'Positive', 'Prepare contract for review', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('04660f99-6b43-46fd-b9ad-5baa082e99df', 'dd4aa6d8-cb33-40bf-b9f0-abc954d473dc', 'Phone', 'Video Call', 'Support Issue', 'Resolved billing inquiry and updated account information', '2025-09-25 11:40:41.36093+05:30', 92, 'Positive', 'Schedule follow-up call next week', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('f8ddde5a-bdba-4890-a694-3e0c43604275', '5454e524-c7b5-441f-bcb1-6343bf355686', 'Meeting', 'Phone', 'General Inquiry', 'Provided technical specifications and implementation timeline', '2025-09-25 11:40:41.36093+05:30', 83, 'Negative', 'Prepare contract for review', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('7080a7c7-3986-47d7-b8e6-b4b7b73f342d', '2cd2586d-cd17-4dcb-98b4-6d28e34c891c', 'Phone', 'In-Person', 'Price Discussion', 'Provided technical specifications and implementation timeline', '2025-09-25 11:40:41.36093+05:30', 57, 'Positive', 'Share additional product documentation', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('4d1bf636-c03c-4373-96aa-f873c2f62ca4', '3e2c4fa0-4e8f-4900-9861-89ee1776d4d3', 'Meeting', 'Video Call', 'Price Discussion', 'Resolved billing inquiry and updated account information', '2025-09-25 11:40:41.36093+05:30', 59, 'Neutral', 'Prepare contract for review', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('ebadd76a-5a0b-432e-8bd1-5860d264bc78', '5b010216-6fc9-412e-8e01-3eb1cfcfcd6b', 'Chat', 'Video Call', 'Price Discussion', 'Resolved billing inquiry and updated account information', '2025-09-25 11:40:41.36093+05:30', 125, 'Negative', 'Wait for customer decision', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('fb28dff4-4322-40a0-90d5-a283f2bca466', '274c7d8d-2c68-4853-a4d6-cfd342627c6b', 'Email', 'Video Call', 'General Inquiry', 'Customer expressed strong interest in our enterprise solution', '2025-09-25 11:40:41.36093+05:30', 34, 'Positive', 'Prepare contract for review', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('3837f6b3-0e60-4e8a-9bca-2d8b3f1ffe01', '5454e524-c7b5-441f-bcb1-6343bf355686', 'Phone', 'Video Call', 'Support Issue', 'Provided technical specifications and implementation timeline', '2025-09-25 11:40:41.36093+05:30', 56, 'Negative', 'Share additional product documentation', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('61af8a90-b209-4f1e-9573-0070217f90dc', '136ef922-bb41-4ecd-83a7-0935529b2577', 'Chat', 'In-Person', 'Product Demo', 'Resolved billing inquiry and updated account information', '2025-09-25 11:40:41.36093+05:30', 88, 'Neutral', 'Schedule follow-up call next week', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('88b0b713-cc44-4ebe-9bd7-c05276b1e29a', '2cd2586d-cd17-4dcb-98b4-6d28e34c891c', 'Phone', 'Email', 'Support Issue', 'Customer expressed strong interest in our enterprise solution', '2025-09-25 11:40:41.36093+05:30', 36, 'Positive', 'Prepare contract for review', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('90878b90-cadd-4a20-a813-ac1834cd7a23', '3e2c4fa0-4e8f-4900-9861-89ee1776d4d3', 'Phone', 'Phone', 'Contract Negotiation', 'Provided technical specifications and implementation timeline', '2025-09-25 11:40:41.36093+05:30', 115, 'Neutral', 'Prepare contract for review', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('9a0c5240-9ff3-4a29-b688-00ccbd9d7c8f', '5b010216-6fc9-412e-8e01-3eb1cfcfcd6b', 'Phone', 'Video Call', 'Support Issue', 'Resolved billing inquiry and updated account information', '2025-09-25 11:40:41.36093+05:30', 101, 'Negative', 'Schedule follow-up call next week', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('c6d1421d-ce39-4576-a53e-869a903ab306', 'd2282176-26ac-4e43-a333-0a026e8c158d', 'Email', 'Email', 'Support Issue', 'Provided technical specifications and implementation timeline', '2025-09-25 11:40:41.36093+05:30', 34, 'Neutral', 'Schedule follow-up call next week', '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30'),
('cbecdf51-bd70-41f3-bcd3-8528b5dbabac', 'e60f5aa7-0980-4275-bdc0-eb2785493c94', 'Phone', 'In-Person', 'abcd', 'super customer service', '2025-09-25 21:46:09.729249+05:30', 10, 'Neutral', 'Call in a week', '2025-09-25 21:46:09.729249+05:30', '2025-09-25 21:46:09.729249+05:30'),
('77cc0bca-cc1c-4313-a3fc-3f67e3c3f932', 'e60f5aa7-0980-4275-bdc0-eb2785493c94', 'Email', 'Email', 'Interview', 'SUper', '2025-09-25 21:54:18.846938+05:30', 10, 'Positive', 'Call in a week', '2025-09-25 21:54:18.846938+05:30', '2025-09-25 21:54:31.100919+05:30'),
('7797c234-c410-421e-a4c5-90fe5eaaa816', '05627e02-207c-41b1-b950-392bc8789b3f', 'Meeting', 'Video Call', 'Product Description', 'Extensive info about their product', '2025-09-29 18:55:18.427654+05:30', 50, 'Positive', 'NONE', '2025-09-29 18:55:18.427654+05:30', '2025-09-29 18:55:18.427654+05:30'),
('f4815ccd-672c-472e-8b99-f5d6e6de8077', '136ef922-bb41-4ecd-83a7-0935529b2577', 'Chat', 'Email', 'Support Issue', 'Resolved billing inquiry and updated account information', '2025-09-25 11:40:41.36093+05:30', 95, 'Positive', 'Send proposal by end of week', '2025-09-25 11:40:41.36093+05:30', '2025-09-29 21:50:29.656839+05:30'),
('cd080b42-6b9a-401e-ab31-f061dd53dbeb', '42cee314-924b-4aa8-bfd8-4ea74d15dac6', 'Meeting', 'In-Person', 'GEN ENQUIRY', 'very curious', '2025-09-29 19:00:46.677255+05:30', 30, 'Positive', 'Call in a week', '2025-09-29 19:00:46.677255+05:30', '2025-09-29 21:58:59.119752+05:30'),
('e8c4f27c-62ed-402d-9707-73764b0cced8', 'd2282176-26ac-4e43-a333-0a026e8c158d', 'Meeting', 'Video Call', 'Contract Negotiation', 'Initial consultation about service offerings', '2025-09-25 11:40:41.36093+05:30', 114, 'Negative', 'Share additional product documentation', '2025-09-25 11:40:41.36093+05:30', '2025-10-01 16:26:26.566999+05:30');

INSERT INTO "MARM".customers ("id", "first_name", "last_name", "email", "phone", "company", "industry", "status", "value", "created_at", "updated_at", "last_contact", "address", "tags") VALUES
('274c7d8d-2c68-4853-a4d6-cfd342627c6b', 'John', 'Smith', 'john.smith@techcorp.com', '+1-555-0101', 'TechCorp Inc', 'Technology', 'Active', 75000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"vip","enterprise"}'),
('dd4aa6d8-cb33-40bf-b9f0-abc954d473dc', 'Sarah', 'Johnson', 'sarah.j@innovate.co', '+1-555-0102', 'Innovate Solutions', 'Technology', 'Active', 45000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"startup"}'),
('5454e524-c7b5-441f-bcb1-6343bf355686', 'Michael', 'Brown', 'mbrown@manufacturing.com', '+1-555-0103', 'Brown Manufacturing', 'Manufacturing', 'Prospect', 25000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"industrial"}'),
('136ef922-bb41-4ecd-83a7-0935529b2577', 'Emily', 'Davis', 'emily@healthcare.org', '+1-555-0104', 'Healthcare Plus', 'Healthcare', 'Active', 60000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"healthcare","priority"}'),
('2cd2586d-cd17-4dcb-98b4-6d28e34c891c', 'Robert', 'Wilson', 'rwilson@finance.biz', '+1-555-0105', 'Wilson Finance', 'Finance', 'Inactive', 15000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"small-business"}'),
('3e2c4fa0-4e8f-4900-9861-89ee1776d4d3', 'Lisa', 'Anderson', 'lisa@retail.store', '+1-555-0106', 'Anderson Retail', 'Retail', 'Prospect', 35000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"retail","growing"}'),
('5b010216-6fc9-412e-8e01-3eb1cfcfcd6b', 'David', 'Taylor', 'david@consulting.pro', '+1-555-0107', 'Taylor Consulting', 'Consulting', 'Active', 85000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"vip","consulting"}'),
('d2282176-26ac-4e43-a333-0a026e8c158d', 'Jennifer', 'Martinez', 'jen@education.edu', '+1-555-0108', 'Martinez Education', 'Education', 'Active', 40000.00, '2025-09-25 11:40:41.36093+05:30', '2025-09-25 11:40:41.36093+05:30', NULL, NULL, '{"education","non-profit"}'),
('e60f5aa7-0980-4275-bdc0-eb2785493c94', 'Nolana', 'Rodriguezo', 'abc@gmail.com', '9385950601', 'Data Dynamics', 'Finance', 'Prospect', 10000.00, '2025-09-25 21:45:11.172061+05:30', '2025-09-25 21:53:51.085404+05:30', NULL, '{"zip": "30003", "city": "Data Valley", "state": "arizona", "street": "789 Analytics Ave"}', '{"Data","Potential"}'),
('c0b3108a-c465-4c4b-93fe-827640b9e781', 'Priya', 'Rao', 'priya.rao@datastrategies.com', '+91-9876543210', 'Data Strategies', 'Technology', 'Active', 95000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"enterprise","decision-maker"}'),
('2f0321f0-1794-48e7-ba28-f18ea9b487c9', 'Amit', 'Singh', 'amit.singh@globalfin.com', '+91-9123456789', 'GlobalFin Corp', 'Finance', 'Active', 120000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"vip","fintech"}'),
('7e9911d1-6ba3-4781-b695-6ad6a3a40602', 'Kiran', 'Desai', 'kiran.desai@nextgenai.io', '+91-8765432109', 'NextGen AI', 'Technology', 'Prospect', 0.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"ai","startup"}'),
('3b8c3450-2fd2-484e-a437-530f3bed4583', 'Sunita', 'Patel', 'sunita.p@cloudwave.com', '+91-7890123456', 'CloudWave Solutions', 'Technology', 'Prospect', 0.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"saas"}'),
('aa2d2ef8-cc99-4b9c-93a9-da5ee757172f', 'Dr. Rohan', 'Gupta', 'rohan.gupta@mediserve.com', '+91-8888888888', 'MediServe Hospitals', 'Healthcare', 'Active', 65000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"hospital-chain"}'),
('c318a6ab-8cb5-4f59-886e-4ba4cd234050', 'Anjali', 'Sharma', 'anjali.s@edutech.co', '+91-7777777777', 'EduTech Innovations', 'Education', 'Active', 30000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"edtech"}'),
('532394d9-36f9-42ee-ba2a-de69fe9c6534', 'Vikram', 'Kumar', 'vikram.k@retaildynamics.com', '+91-6666666666', 'Retail Dynamics', 'Retail', 'Inactive', 15000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"ecommerce"}'),
('72323b0a-d43b-4e54-a0fd-f4ed9b358998', 'Neha', 'Verma', 'neha.v@buildwell.com', '+91-5555555555', 'BuildWell Constructions', 'Manufacturing', 'Qualified', 250000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"b2b"}'),
('04987988-c750-452a-b9d5-0b0ae4415924', 'Pooja', 'Iyer', 'pooja.iyer@foodies.com', '+91-3333333333', 'Foodies United', 'Retail', 'Active', 22000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"food-beverage"}'),
('cc573320-6d01-4413-8f53-5e2bade0d84b', 'Arjun', 'Nair', 'arjun.nair@greenenergy.io', '+91-2222222222', 'GreenEnergy Solutions', 'Energy', 'Qualified', 180000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"renewable"}'),
('7dc35920-f69a-47f0-96f7-3c2210c5fbc0', 'Divya', 'Reddy', 'divya.r@pharmaco.com', '+91-1111111111', 'PharmaCo', 'Healthcare', 'Prospect', 0.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"pharma"}'),
('9134395a-feca-445e-a678-0b9a9470359f', 'Rajesh', 'Jain', 'rajesh.jain@textiles.com', '+91-9990009990', 'Jain Textiles', 'Manufacturing', 'Inactive', 5000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"textiles"}'),
('3f03d289-2841-4abc-af0c-8555df13e182', 'Sanjay', 'Mehtaa', 'sanjay.mehta@logistics.com', '+91-4444444444', 'QuickShift Logistics', 'Transport', 'Prospect', 0.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-26 20:29:19.694062+05:30', NULL, '{"zip": "", "city": "", "state": "", "street": ""}', '{"logistics"}'),
('a6f63ca5-d511-4103-abba-0f31b6f38d1f', 'Meera', 'Krishnan', 'meera.k@consult.biz', '+91-8889998889', 'Krishnan & Associates', 'Consulting', 'Active', 72000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"consulting","vip"}'),
('9a088739-cf97-49d8-9782-c8bf3db11618', 'Siddharth', 'Chopra', 'sid.chopra@gamestudio.com', '+91-7778887778', 'Pixel Perfect Games', 'Technology', 'Active', 48000.00, '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30', NULL, NULL, '{"gaming","startup"}'),
('05627e02-207c-41b1-b950-392bc8789b3f', 'Aravind ', 'Krishna', 'AKSV@gmail.com', '9385950601', 'Aravind Gaming', 'Education', 'Active', 175000.00, '2025-09-26 21:00:26.484223+05:30', '2025-09-26 21:00:26.484223+05:30', '2025-09-26 21:00:26.484223+05:30', '{"zip": "611011", "city": "Chennai", "state": "TAMIL NADU", "street": "Keelpauk"}', '{"Impressive"}'),
('d1e7e07b-390e-423d-b8c1-00ad3897c033', 'Midhru ', 'Jayan', 'midhruchand2004@gmail.com', '8832799237', 'Salazar Enterprises', 'Retail', 'Active', 50000.00, '2025-09-26 21:03:45.447158+05:30', '2025-09-26 21:03:45.447158+05:30', '2025-09-26 21:03:45.447158+05:30', '{"zip": "641112", "city": "Coimbatore", "state": "Tamil Nadu", "street": "Amritanagar P.O"}', '{"EnterpriseLeads"}'),
('42cee314-924b-4aa8-bfd8-4ea74d15dac6', 'Arjun ', 'Shivakumar', 'arjun@shivkumar.in', '9873218333', 'Shivkumar Enterprises', 'Manufacturing', 'Prospect', 190000.00, '2025-09-29 18:58:44.701048+05:30', '2025-09-29 18:59:01.961268+05:30', '2025-09-29 18:58:44.701+05:30', '{"zip": "641112", "city": "Coimbatore", "state": "Tamil Nadu", "street": "Amritanagar P.O"}', '{"Enterprise"}');





INSERT INTO "MARM".deals ("id", "title", "value", "stage_id", "customer_id", "expected_close_date", "created_at", "updated_at") VALUES
('3b96c645-17c1-41ec-b4b5-3c3b42f5edde', 'Deal for BuildWell Constructions', 30000.00, 1, '72323b0a-d43b-4e54-a0fd-f4ed9b358998', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30'),
('3c3cc89d-405e-41db-8c65-186081c739d7', 'Deal for QuickShift Logistics', 11000.00, 1, '3f03d289-2841-4abc-af0c-8555df13e182', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-09-25 22:14:12.21183+05:30'),
('7f587041-48e0-4f9a-930b-e1e156a9c14e', 'Deal for Shivkumar Enterprises', 19500.00, 3, '42cee314-924b-4aa8-bfd8-4ea74d15dac6', '2025-10-29', '2025-09-29 18:58:44.701048+05:30', '2025-10-01 16:08:23.334459+05:30'),
('ea06aebb-703f-4c21-a95e-532cc6fbdf27', 'Deal for MediServe Hospitals', 25000.00, 3, 'aa2d2ef8-cc99-4b9c-93a9-da5ee757172f', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:08:25.586622+05:30'),
('b35ad741-0710-457e-9898-dfebcff6d646', 'Deal for Data Strategies', 7500.00, 3, 'c0b3108a-c465-4c4b-93fe-827640b9e781', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 20:08:35.844147+05:30'),
('bcb57504-6327-4de6-895b-6654403699e4', 'Deal for AKSV', 15000.00, 2, '72323b0a-d43b-4e54-a0fd-f4ed9b358998', '2025-11-09', '2025-10-01 16:16:30.324866+05:30', '2025-10-01 16:16:30.324866+05:30'),
('e31a7884-f5c8-48bf-9c83-385ec69f716f', 'New Deal', 10000.00, 2, '9a088739-cf97-49d8-9782-c8bf3db11618', '2025-11-08', '2025-10-01 16:17:10.920408+05:30', '2025-10-01 16:17:10.920408+05:30'),
('4a68d999-edbd-4fde-8fc7-8675cea5c02c', 'Food', 100000.00, 5, '2f0321f0-1794-48e7-ba28-f18ea9b487c9', '2025-10-10', '2025-10-01 16:28:26.624827+05:30', '2025-10-01 16:28:26.624827+05:30'),
('ea3afa67-f9a4-486e-a8c8-5af83afe6c79', 'Deal for Foodies United', 4500.00, 3, '04987988-c750-452a-b9d5-0b0ae4415924', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:28:47.293243+05:30'),
('0f8ca9d2-d9d6-464a-82cf-f896de39ce0d', 'Deal for PharmaCo', 22000.00, 4, '7dc35920-f69a-47f0-96f7-3c2210c5fbc0', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:28:52.29105+05:30'),
('4deecc00-dbe9-4c7a-b118-64ba334cf64c', 'Deal for CloudWave Solutions', 8000.00, 5, '3b8c3450-2fd2-484e-a437-530f3bed4583', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 20:08:38.67385+05:30'),
('1fdaedcf-6884-4fd7-b5f7-51377653d4e6', 'Deal for Data Dynamics', 5000.00, 3, 'e60f5aa7-0980-4275-bdc0-eb2785493c94', '2025-10-25', '2025-09-25 21:45:11.172061+05:30', '2025-10-08 10:53:54.291534+05:30'),
('47c8c66a-8e8d-4349-91d2-7c74bef94724', 'Deal for Krishnan & Associates', 13500.00, 4, 'a6f63ca5-d511-4103-abba-0f31b6f38d1f', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:22.550772+05:30'),
('84503f1d-8d00-4c5c-89cb-8bd81969ca73', 'Deal for Pixel Perfect Games', 8500.00, 5, '9a088739-cf97-49d8-9782-c8bf3db11618', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:25.044575+05:30'),
('e7fef178-d603-4981-bf0d-6a84f2169117', 'Deal for Jain Textiles', 9000.00, 5, '9134395a-feca-445e-a678-0b9a9470359f', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:26.170845+05:30'),
('9bb7f160-373e-4ffb-9e60-d5a2950a3bdc', 'Deal for Retail Dynamics', 15000.00, 4, '532394d9-36f9-42ee-ba2a-de69fe9c6534', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-08 10:56:31.824684+05:30'),
('74f165f4-f7c8-402f-965d-de7228c10373', 'Deal for EduTech Innovations', 6000.00, 4, 'c318a6ab-8cb5-4f59-886e-4ba4cd234050', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:31.633108+05:30'),
('f42f9923-9e5e-4454-b41d-5fe3538b4838', 'Deal for GreenEnergy Solutions', 18000.00, 4, 'cc573320-6d01-4413-8f53-5e2bade0d84b', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-01 16:29:33.810126+05:30'),
('15b63889-2e6e-4ca3-9bd5-9c7bc2516753', 'Latest', 20000.00, 5, '3b8c3450-2fd2-484e-a437-530f3bed4583', '2025-10-26', '2025-10-01 20:08:14.749474+05:30', '2025-10-01 20:08:14.749474+05:30'),
('03a6a634-6f0e-4e08-9d23-b112a0bd1dd4', 'Deal for Aravind Gaming', 5500.00, 2, '05627e02-207c-41b1-b950-392bc8789b3f', '2025-10-26', '2025-09-26 21:00:26.484223+05:30', '2025-10-01 20:08:27.908673+05:30'),
('02c23d28-dcd8-446d-9190-16314d94d397', 'Deal for GlobalFin Corp', 12000.00, 1, '2f0321f0-1794-48e7-ba28-f18ea9b487c9', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-08 19:13:51.813418+05:30'),
('f393dfb5-07cf-4673-9a9f-3ac2ac0f6198', 'Deal for NextGen AI', 9500.00, 2, '7e9911d1-6ba3-4781-b695-6ad6a3a40602', '2025-10-25', '2025-09-25 22:14:12.21183+05:30', '2025-10-08 21:07:56.101145+05:30');
