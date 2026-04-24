DO $$
DECLARE
  max_suffix BIGINT;
  current_last_value BIGINT;
  sequence_was_called BOOLEAN;
  target_value BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(RIGHT("referenceId", 6) AS BIGINT)), 0)
  INTO max_suffix
  FROM "Handover";

  SELECT last_value, is_called
  INTO current_last_value, sequence_was_called
  FROM handover_reference_seq;

  target_value := GREATEST(
    max_suffix,
    CASE WHEN sequence_was_called THEN current_last_value ELSE 0 END
  );

  IF target_value > 0 THEN
    PERFORM setval('handover_reference_seq', target_value, true);
  END IF;
END $$;
