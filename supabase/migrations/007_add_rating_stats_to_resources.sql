-- 1. Add cached stats columns to resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS average_rating numeric(3, 1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- 2. Create a function to calculate and update stats
CREATE OR REPLACE FUNCTION update_resource_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the resource that was just rated (using NEW.resource_id or OLD.resource_id)
  -- We handle both to cover INSERT, UPDATE, and DELETE
  UPDATE resources
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(overall) * 2) / 2, 0) -- Round to nearest 0.5
      FROM ratings
      WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
    )
  WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
  
  RETURN NULL; -- Return value is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_rating_change ON ratings;

CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_resource_rating_stats();

-- 4. Backfill existing data
-- This runs once to populate the new columns for existing resources
UPDATE resources r
SET 
  average_rating = (
    SELECT COALESCE(ROUND(AVG(overall) * 2) / 2, 0)
    FROM ratings
    WHERE resource_id = r.id
  ),
  rating_count = (
    SELECT COUNT(*)
    FROM ratings
    WHERE resource_id = r.id
  );
