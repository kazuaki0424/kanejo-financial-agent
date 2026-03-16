CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text,
	"amount" bigint NOT NULL,
	"currency" text DEFAULT 'JPY',
	"institution" text,
	"interest_rate" numeric,
	"maturity_date" date,
	"is_liquid" boolean DEFAULT true,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text,
	"monthly_amount" integer NOT NULL,
	"is_fixed" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text,
	"monthly_amount" integer NOT NULL,
	"is_gross" boolean DEFAULT true,
	"is_recurring" boolean DEFAULT true,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text,
	"principal_amount" bigint NOT NULL,
	"remaining_amount" bigint NOT NULL,
	"interest_rate" numeric,
	"monthly_payment" integer,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"birth_date" date NOT NULL,
	"gender" text,
	"prefecture" text NOT NULL,
	"city" text,
	"marital_status" text NOT NULL,
	"dependents" integer DEFAULT 0,
	"children_ages" jsonb,
	"occupation" text NOT NULL,
	"tier" text NOT NULL,
	"annual_income" integer NOT NULL,
	"financial_goals" jsonb,
	"risk_tolerance" text,
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
