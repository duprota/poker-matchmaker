

# Expense Split Modes — Updated Plan

## Summary

Replace the `Switch` (equal/custom) with a **4-mode ToggleGroup**: Equal, Percentage, Parts, Direct Value. The "Parts" mode includes a **total parts input** at the top (e.g., 10 sandwiches), then each player selects how many parts they consumed.

## UI Layout

```text
Split mode:  [Equal] [%] [Parts] [R$]

Mode = Parts:
  Total parts: [ 10 ]           ← new field
  Player A  [ 3 ] parts  → R$ 45.00
  Player B  [ 2 ] parts  → R$ 30.00
  Player C  [ 5 ] parts  → R$ 75.00
  Assigned: 10/10 parts ✓

Mode = %:
  Player A  [ 40 ] %  → R$ 60.00
  Player B  [ 30 ] %  → R$ 45.00
  Player C  [ 30 ] %  → R$ 45.00
  Total: 100% ✓

Mode = R$:
  (current custom behavior)
```

## Changes — `CreateExpenseDialog.tsx` only

1. **State**: Replace `equalSplit: boolean` with `splitMode: 'equal' | 'percentage' | 'parts' | 'direct'`. Add `totalParts: string` state for the parts mode.

2. **ToggleGroup**: Import from `@/components/ui/toggle-group`. Render 4 compact items replacing the Switch.

3. **Splits computation** (`useMemo`):
   - `equal`: `amount / count`
   - `percentage`: `amount * value / 100`
   - `parts`: `amount * playerParts / totalPartsNumber`
   - `direct`: `parseFloat(value)` (current)

4. **Validation**:
   - `percentage`: sum ≈ 100 (tolerance 0.1)
   - `parts`: sum of assigned parts ≤ total parts, all integers ≥ 0, sum > 0
   - `direct`: sum ≈ totalAmount (tolerance 0.02)

5. **Inline preview