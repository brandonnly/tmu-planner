CREATE TYPE "public"."term" AS enum(
    'Fall',
    'Winter',
    'Spring/Summer'
);

CREATE TABLE "public"."course"(
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "code" text NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "url" text NOT NULL,
    "academic_year" text NOT NULL,
    "custom_requisite" text,
    "prerequisite" text,
    "corequisite" text,
    "antirequisite" text,
    "weekly_contact" text,
    "gpa_weight" numeric(3, 2),
    "course_count" numeric(3, 2),
    "billing_units" smallint
);

ALTER TABLE "public"."course" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_plan"(
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "user_id" uuid NOT NULL,
    "notes" text,
    "starting_semester_term" term NOT NULL,
    "ending_semester_term" term NOT NULL,
    "name" text NOT NULL,
    "starting_semester_year" smallint NOT NULL,
    "ending_semester_year" smallint NOT NULL
);

ALTER TABLE "public"."user_plan" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."plan_course"(
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" uuid NOT NULL,
    "course_id" uuid NOT NULL,
    "semester_term" text NOT NULL,
    "semester_year" smallint NOT NULL,
    "note" text NOT NULL
);

ALTER TABLE "public"."plan_course" ENABLE ROW LEVEL SECURITY;

-- Create trigger function for managing timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION public.handle_created_at()
    RETURNS TRIGGER
    AS $$
BEGIN
    NEW.created_at = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

-- Create triggers
CREATE TRIGGER set_created_at
    BEFORE INSERT ON public.user_plan
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_created_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_plan
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for all tables
ALTER publication supabase_realtime
    ADD TABLE course;

ALTER publication supabase_realtime
    ADD TABLE plan_course;

ALTER publication supabase_realtime
    ADD TABLE user_plan;

CREATE UNIQUE INDEX course_pkey ON public.course USING btree(id);

CREATE UNIQUE INDEX course_url_key ON public.course USING btree(url);

CREATE UNIQUE INDEX plan_course_pkey ON public.plan_course USING btree(id);

CREATE UNIQUE INDEX user_plan_pkey ON public.user_plan USING btree(id);

ALTER TABLE "public"."course"
    ADD CONSTRAINT "course_pkey" PRIMARY KEY USING INDEX "course_pkey";

ALTER TABLE "public"."plan_course"
    ADD CONSTRAINT "plan_course_pkey" PRIMARY KEY USING INDEX "plan_course_pkey";

ALTER TABLE "public"."user_plan"
    ADD CONSTRAINT "user_plan_pkey" PRIMARY KEY USING INDEX "user_plan_pkey";

ALTER TABLE "public"."course"
    ADD CONSTRAINT "course_url_key" UNIQUE USING INDEX "course_url_key";

ALTER TABLE "public"."plan_course"
    ADD CONSTRAINT "plan_course_course_id_fkey" FOREIGN KEY (course_id) REFERENCES course(id) ON UPDATE CASCADE ON DELETE SET NULL NOT valid;

ALTER TABLE "public"."plan_course" validate CONSTRAINT "plan_course_course_id_fkey";

ALTER TABLE "public"."plan_course"
    ADD CONSTRAINT "plan_course_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES user_plan(id) ON UPDATE CASCADE ON DELETE SET NULL NOT valid;

ALTER TABLE "public"."plan_course" validate CONSTRAINT "plan_course_plan_id_fkey";

ALTER TABLE "public"."user_plan"
    ADD CONSTRAINT "user_plan_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) NOT valid;

ALTER TABLE "public"."user_plan" validate CONSTRAINT "user_plan_user_id_fkey";

GRANT DELETE ON TABLE "public"."course" TO "anon";

GRANT INSERT ON TABLE "public"."course" TO "anon";

GRANT REFERENCES ON TABLE "public"."course" TO "anon";

GRANT SELECT ON TABLE "public"."course" TO "anon";

GRANT TRIGGER ON TABLE "public"."course" TO "anon";

GRANT TRUNCATE ON TABLE "public"."course" TO "anon";

GRANT UPDATE ON TABLE "public"."course" TO "anon";

GRANT DELETE ON TABLE "public"."course" TO "authenticated";

GRANT INSERT ON TABLE "public"."course" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."course" TO "authenticated";

GRANT SELECT ON TABLE "public"."course" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."course" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."course" TO "authenticated";

GRANT UPDATE ON TABLE "public"."course" TO "authenticated";

GRANT DELETE ON TABLE "public"."course" TO "service_role";

GRANT INSERT ON TABLE "public"."course" TO "service_role";

GRANT REFERENCES ON TABLE "public"."course" TO "service_role";

GRANT SELECT ON TABLE "public"."course" TO "service_role";

GRANT TRIGGER ON TABLE "public"."course" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."course" TO "service_role";

GRANT UPDATE ON TABLE "public"."course" TO "service_role";

GRANT DELETE ON TABLE "public"."plan_course" TO "anon";

GRANT INSERT ON TABLE "public"."plan_course" TO "anon";

GRANT REFERENCES ON TABLE "public"."plan_course" TO "anon";

GRANT SELECT ON TABLE "public"."plan_course" TO "anon";

GRANT TRIGGER ON TABLE "public"."plan_course" TO "anon";

GRANT TRUNCATE ON TABLE "public"."plan_course" TO "anon";

GRANT UPDATE ON TABLE "public"."plan_course" TO "anon";

GRANT DELETE ON TABLE "public"."plan_course" TO "authenticated";

GRANT INSERT ON TABLE "public"."plan_course" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."plan_course" TO "authenticated";

GRANT SELECT ON TABLE "public"."plan_course" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."plan_course" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."plan_course" TO "authenticated";

GRANT UPDATE ON TABLE "public"."plan_course" TO "authenticated";

GRANT DELETE ON TABLE "public"."plan_course" TO "service_role";

GRANT INSERT ON TABLE "public"."plan_course" TO "service_role";

GRANT REFERENCES ON TABLE "public"."plan_course" TO "service_role";

GRANT SELECT ON TABLE "public"."plan_course" TO "service_role";

GRANT TRIGGER ON TABLE "public"."plan_course" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."plan_course" TO "service_role";

GRANT UPDATE ON TABLE "public"."plan_course" TO "service_role";

GRANT DELETE ON TABLE "public"."user_plan" TO "anon";

GRANT INSERT ON TABLE "public"."user_plan" TO "anon";

GRANT REFERENCES ON TABLE "public"."user_plan" TO "anon";

GRANT SELECT ON TABLE "public"."user_plan" TO "anon";

GRANT TRIGGER ON TABLE "public"."user_plan" TO "anon";

GRANT TRUNCATE ON TABLE "public"."user_plan" TO "anon";

GRANT UPDATE ON TABLE "public"."user_plan" TO "anon";

GRANT DELETE ON TABLE "public"."user_plan" TO "authenticated";

GRANT INSERT ON TABLE "public"."user_plan" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."user_plan" TO "authenticated";

GRANT SELECT ON TABLE "public"."user_plan" TO "authenticated";

GRANT TRIGGER ON TABLE "public"."user_plan" TO "authenticated";

GRANT TRUNCATE ON TABLE "public"."user_plan" TO "authenticated";

GRANT UPDATE ON TABLE "public"."user_plan" TO "authenticated";

GRANT DELETE ON TABLE "public"."user_plan" TO "service_role";

GRANT INSERT ON TABLE "public"."user_plan" TO "service_role";

GRANT REFERENCES ON TABLE "public"."user_plan" TO "service_role";

GRANT SELECT ON TABLE "public"."user_plan" TO "service_role";

GRANT TRIGGER ON TABLE "public"."user_plan" TO "service_role";

GRANT TRUNCATE ON TABLE "public"."user_plan" TO "service_role";

GRANT UPDATE ON TABLE "public"."user_plan" TO "service_role";

-- Add RLS policy for select on course table
CREATE POLICY "Allow select access for all users on course" ON "public"."course"
    FOR SELECT TO public
        USING (TRUE);

-- Add RLS policies for plan_course
CREATE POLICY "Users can view their own plan courses" ON "public"."plan_course"
    FOR SELECT TO public
        USING (EXISTS (
            SELECT
                1
            FROM
                user_plan
            WHERE
                user_plan.id = plan_course.plan_id AND user_plan.user_id = auth.uid()));

CREATE POLICY "Users can insert their own plan courses" ON "public"."plan_course"
    FOR INSERT TO public
        WITH CHECK (EXISTS (
            SELECT
                1
            FROM
                user_plan
            WHERE
                user_plan.id = plan_course.plan_id AND user_plan.user_id = auth.uid()));

CREATE POLICY "Users can update their own plan courses" ON "public"."plan_course"
    FOR UPDATE TO public
        USING (EXISTS (
            SELECT
                1
            FROM
                user_plan
            WHERE
                user_plan.id = plan_course.plan_id AND user_plan.user_id = auth.uid()))
            WITH CHECK (EXISTS (
                SELECT
                    1
                FROM
                    user_plan
                WHERE
                    user_plan.id = plan_course.plan_id AND user_plan.user_id = auth.uid()));

CREATE POLICY "Users can delete their own plan courses" ON "public"."plan_course"
    FOR DELETE TO public
        USING (EXISTS (
            SELECT
                1
            FROM
                user_plan
            WHERE
                user_plan.id = plan_course.plan_id AND user_plan.user_id = auth.uid()));

-- Add RLS policies for user_plan
CREATE POLICY "Users can view their own plans" ON "public"."user_plan"
    FOR SELECT TO public
        USING (user_id = auth.uid());

CREATE POLICY "Users can create their own plans" ON "public"."user_plan"
    FOR INSERT TO public
        WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own plans" ON "public"."user_plan"
    FOR UPDATE TO public
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own plans" ON "public"."user_plan"
    FOR DELETE TO public
        USING (user_id = auth.uid());

