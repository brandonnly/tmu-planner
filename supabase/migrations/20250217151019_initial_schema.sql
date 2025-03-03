-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- Create GIN indexes for fuzzy search
CREATE INDEX course_code_trgm_idx ON public.course USING GIN(code gin_trgm_ops);

CREATE INDEX course_name_trgm_idx ON public.course USING GIN(name gin_trgm_ops);

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

-- Create function for fuzzy course search
CREATE OR REPLACE FUNCTION public.search_courses(search_query text)
    RETURNS SETOF course
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
BEGIN
    -- If the search is exactly 3 characters, make it uppercase
    IF length(trim(search_query)) = 3 THEN
        search_query := upper(search_query);
    END IF;
    -- Add space between course code and number if needed
    search_query := regexp_replace(search_query, '([a-zA-Z]{3})(\d+)', '\1 \2', 'g');
    RETURN QUERY WITH ranked_courses AS(
        SELECT
            c.*,
            CASE
            -- Exact match on code (after normalizing spaces) gets highest score (10.0)
            WHEN upper(regexp_replace(c.code, '\s+', '', 'g')) = upper(regexp_replace(search_query, '\s+', '', 'g')) THEN
                10.0
                -- Exact match on code with spaces gets second highest score (9.0)
            WHEN upper(c.code) = upper(search_query) THEN
                9.0
                -- Starts with the search query gets high score (8.0)
            WHEN upper(regexp_replace(c.code, '\s+', '', 'g')) LIKE upper(regexp_replace(search_query, '\s+', '', 'g')) || '%' THEN
                8.0
                -- Close code match gets medium score (2.0 * similarity)
            WHEN similarity(upper(regexp_replace(c.code, '\s+', '', 'g')), upper(regexp_replace(search_query, '\s+', '', 'g'))) > 0.4 THEN
                similarity(upper(regexp_replace(c.code, '\s+', '', 'g')), upper(regexp_replace(search_query, '\s+', '', 'g'))) * 2.0
                -- Name match gets normal score
            ELSE
                similarity(upper(c.name), upper(search_query))
            END AS search_rank
        FROM
            course c
        WHERE
            -- Lower threshold for course codes, normalized comparison
            similarity(upper(regexp_replace(c.code, '\s+', '', 'g')), upper(regexp_replace(search_query, '\s+', '', 'g'))) > 0.4
            -- Lower threshold for course names
            OR similarity(upper(c.name), upper(search_query)) > 0.2
            -- Direct match on code (after normalizing)
            OR upper(regexp_replace(c.code, '\s+', '', 'g')) = upper(regexp_replace(search_query, '\s+', '', 'g'))
            -- Starts with search query
            OR upper(regexp_replace(c.code, '\s+', '', 'g')) LIKE upper(regexp_replace(search_query, '\s+', '', 'g')) || '%'
)
    SELECT
        rc.id,
        rc.code,
        rc.name,
        rc.description,
        rc.url,
        rc.academic_year,
        rc.custom_requisite,
        rc.prerequisite,
        rc.corequisite,
        rc.antirequisite,
        rc.weekly_contact,
        rc.gpa_weight,
        rc.course_count,
        rc.billing_units
    FROM( SELECT DISTINCT ON(code)
            *
        FROM
            ranked_courses
        WHERE
            search_rank > 0
        ORDER BY
            code,
            search_rank DESC,
            academic_year DESC) rc
ORDER BY
    rc.search_rank DESC,
    rc.code
LIMIT 20;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.search_courses TO authenticated;

GRANT EXECUTE ON FUNCTION public.search_courses TO anon;

