const logChanges = async ({
  table,
  updates, // { column1: newValue1, column2: newValue2 }
  targetId,
  userId,
}) => {
  const logTable = `${table}History`;

  // 1. Fetch current values for the specified columns
  const columns = Object.keys(updates);
  const { data: currentRow, error: fetchError } = await supabase
    .from(table)
    .select(columns.join(','))
    .eq('id', targetId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const now = new Date().toISOString();
  const changeLogs = [];

  for (const column of columns) {
    const oldValue = currentRow[column];
    const newValue = updates[column];

    // Only log if there's a real change
    if (oldValue !== newValue) {
      // End previous log (if exists)
      await supabase
        .from(logTable)
        .update({ to_date: now })
        .match({ column_name: column, target_id: targetId, to_date: null });

      // Prepare new log entry
      changeLogs.push({
        table_name: table,
        target_id: targetId,
        column_name: column,
        old_value: oldValue,
        new_value: newValue,
        from_date: now,
        to_date: null,
        changed_by: userId,
        changed_at: now,
      });
    }
  }

  // 2. Update main table
  const { error: updateError } = await supabase.from(table).update(updates).eq('id', targetId);

  if (updateError) throw new Error(updateError.message);

  // 3. Insert logs
  if (changeLogs.length > 0) {
    const { error: insertError } = await supabase.from(logTable).insert(changeLogs);

    if (insertError) throw new Error(insertError.message);
  }
};
