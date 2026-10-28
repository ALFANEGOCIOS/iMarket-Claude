-- Owner-provided structure for CONTEXT ONLY. Do not execute this file.
-- USER-DEFINED placeholders omit the actual enum definitions.
CREATE TABLE public.profiles (
 id uuid NOT NULL,username text UNIQUE,display_name text NOT NULL,avatar_url text,city text DEFAULT 'La Habana',municipality text,
 account_type text NOT NULL DEFAULT 'individual' CHECK(account_type IN ('individual','business')),
 verification_status USER-DEFINED NOT NULL DEFAULT 'pending'::verification_status,is_suspended boolean NOT NULL DEFAULT false,is_banned boolean NOT NULL DEFAULT false,
 total_sales integer NOT NULL DEFAULT 0 CHECK(total_sales>=0),total_reviews integer NOT NULL DEFAULT 0 CHECK(total_reviews>=0),rating numeric NOT NULL DEFAULT 0 CHECK(rating>=0 AND rating<=5),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT profiles_pkey PRIMARY KEY(id),CONSTRAINT profiles_id_fkey FOREIGN KEY(id) REFERENCES auth.users(id)
);
CREATE TABLE public.verification_requests (
 id uuid NOT NULL DEFAULT gen_random_uuid(),user_id uuid NOT NULL,selfie_path text,document_path text,status USER-DEFINED NOT NULL DEFAULT 'pending'::verification_status,
 rejection_reason text,reviewed_by uuid,reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT verification_requests_pkey PRIMARY KEY(id),CONSTRAINT verification_requests_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.profiles(id),CONSTRAINT verification_requests_reviewed_by_fkey FOREIGN KEY(reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.listings (
 id uuid NOT NULL DEFAULT gen_random_uuid(),seller_id uuid NOT NULL,model text NOT NULL,storage_gb integer NOT NULL CHECK(storage_gb IN(32,64,128,256,512,1024)),color text NOT NULL,
 price_usd numeric NOT NULL CHECK(price_usd>=0),negotiable boolean NOT NULL DEFAULT false,accepts_trade boolean NOT NULL DEFAULT false,
 aesthetic_condition USER-DEFINED NOT NULL,battery_health integer CHECK(battery_health IS NULL OR battery_health BETWEEN 1 AND 100),battery_type USER-DEFINED NOT NULL DEFAULT 'unknown'::battery_type,
 factory_unlocked boolean NOT NULL DEFAULT false,face_id_working boolean NOT NULL DEFAULT true,true_tone_working boolean NOT NULL DEFAULT true,
 includes_cable boolean NOT NULL DEFAULT false,includes_charger boolean NOT NULL DEFAULT false,has_details boolean NOT NULL DEFAULT false,details text,has_warranty boolean NOT NULL DEFAULT false,warranty_days integer CHECK(warranty_days IS NULL OR warranty_days>=0),
 municipality text NOT NULL,neighborhood text,title text,description text,status USER-DEFINED NOT NULL DEFAULT 'draft'::listing_status,views_count integer NOT NULL DEFAULT 0,favorites_count integer NOT NULL DEFAULT 0,
 published_at timestamptz,reserved_at timestamptz,sold_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT listings_pkey PRIMARY KEY(id),CONSTRAINT listings_seller_id_fkey FOREIGN KEY(seller_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.listing_images (
 id uuid NOT NULL DEFAULT gen_random_uuid(),listing_id uuid NOT NULL,storage_path text NOT NULL,position integer NOT NULL CHECK(position BETWEEN 1 AND 5),created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT listing_images_pkey PRIMARY KEY(id),CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES public.listings(id)
);
CREATE TABLE public.favorites (
 user_id uuid NOT NULL,listing_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),CONSTRAINT favorites_pkey PRIMARY KEY(user_id,listing_id),
 CONSTRAINT favorites_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.profiles(id),CONSTRAINT favorites_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES public.listings(id)
);
CREATE TABLE public.sales (
 id uuid NOT NULL DEFAULT gen_random_uuid(),listing_id uuid,seller_id uuid NOT NULL,buyer_id uuid,status text NOT NULL DEFAULT 'reported' CHECK(status IN ('reported','confirmed','cancelled')),
 buyer_confirmed boolean NOT NULL DEFAULT false,seller_confirmed boolean NOT NULL DEFAULT false,sold_price_usd numeric,created_at timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz,sale_source USER-DEFINED NOT NULL DEFAULT 'external'::sale_source_type,
 CONSTRAINT sales_pkey PRIMARY KEY(id),CONSTRAINT sales_buyer_id_fkey FOREIGN KEY(buyer_id) REFERENCES public.profiles(id),CONSTRAINT sales_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES public.listings(id),CONSTRAINT sales_seller_id_fkey FOREIGN KEY(seller_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reports (
 id uuid NOT NULL DEFAULT gen_random_uuid(),reporter_id uuid NOT NULL,listing_id uuid,reported_user_id uuid,reason text NOT NULL,description text,status USER-DEFINED NOT NULL DEFAULT 'pending'::report_status,
 admin_notes text,reviewed_by uuid,reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT reports_pkey PRIMARY KEY(id),CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY(reported_user_id) REFERENCES public.profiles(id),CONSTRAINT reports_reviewed_by_fkey FOREIGN KEY(reviewed_by) REFERENCES public.profiles(id),CONSTRAINT reports_reporter_id_fkey FOREIGN KEY(reporter_id) REFERENCES public.profiles(id),CONSTRAINT reports_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES public.listings(id)
);
CREATE TABLE public.user_blocks (
 blocker_id uuid NOT NULL,blocked_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),CONSTRAINT user_blocks_pkey PRIMARY KEY(blocker_id,blocked_id),
 CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY(blocker_id) REFERENCES public.profiles(id),CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY(blocked_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_roles (
 user_id uuid NOT NULL,role USER-DEFINED NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),CONSTRAINT user_roles_pkey PRIMARY KEY(user_id,role),CONSTRAINT user_roles_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profile_private (
 user_id uuid NOT NULL,phone text,exact_address text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CONSTRAINT profile_private_pkey PRIMARY KEY(user_id),CONSTRAINT profile_private_user_id_fkey FOREIGN KEY(user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.platform_reviews (
 id uuid NOT NULL DEFAULT gen_random_uuid(),user_id uuid NOT NULL,sale_id uuid,rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),comment text,created_at timestamptz NOT NULL DEFAULT now(),reviewer_id uuid NOT NULL,
 CONSTRAINT platform_reviews_pkey PRIMARY KEY(id),CONSTRAINT platform_reviews_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.profiles(id),CONSTRAINT platform_reviews_reviewer_id_fkey FOREIGN KEY(reviewer_id) REFERENCES public.profiles(id),CONSTRAINT platform_reviews_sale_id_fkey FOREIGN KEY(sale_id) REFERENCES public.sales(id)
);
CREATE TABLE public.listing_moderation_history (
 id uuid NOT NULL DEFAULT gen_random_uuid(),listing_id uuid NOT NULL,reviewer_id uuid NOT NULL,decision text NOT NULL CHECK(decision IN('approved','rejected')),rejection_reason text,previous_status USER-DEFINED NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT listing_moderation_history_pkey PRIMARY KEY(id),CONSTRAINT listing_moderation_history_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES public.listings(id),CONSTRAINT listing_moderation_history_reviewer_id_fkey FOREIGN KEY(reviewer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversations (
 id uuid NOT NULL DEFAULT gen_random_uuid(),listing_id uuid,buyer_id uuid NOT NULL,seller_id uuid NOT NULL,last_message_at timestamptz DEFAULT now(),created_at timestamptz DEFAULT now(),
 CONSTRAINT conversations_pkey PRIMARY KEY(id),CONSTRAINT conversations_listing_id_fkey FOREIGN KEY(listing_id) REFERENCES public.listings(id),CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY(buyer_id) REFERENCES public.profiles(id),CONSTRAINT conversations_seller_id_fkey FOREIGN KEY(seller_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
 id uuid NOT NULL DEFAULT gen_random_uuid(),conversation_id uuid NOT NULL,sender_id uuid NOT NULL,content text NOT NULL CHECK(length(content) BETWEEN 1 AND 2000),read_at timestamptz,created_at timestamptz DEFAULT now(),
 CONSTRAINT messages_pkey PRIMARY KEY(id),CONSTRAINT messages_conversation_id_fkey FOREIGN KEY(conversation_id) REFERENCES public.conversations(id),CONSTRAINT messages_sender_id_fkey FOREIGN KEY(sender_id) REFERENCES public.profiles(id)
);
