## ADDED Requirements

### Requirement: File structure migration

This change is a PURE STRUCTURAL MIGRATION. No new capabilities are introduced, and no existing requirements are modified. All files from `features/` are relocated to standard directories (`api/`, `hooks/`, `components/`, `types/`, `context/`, `utils/`, `stores/tests/`) without any behavioral changes.

#### Scenario: All files migrated
- **WHEN** the migration is complete
- **THEN** no files remain under `src/features/`
- **THEN** the `features/` directory is deleted
- **THEN** the application compiles without errors
- **THEN** all existing functionality works identically

#### Scenario: All imports updated
- **WHEN** the migration is complete
- **THEN** there are zero imports referencing `features/` anywhere in `src/`

#### Scenario: Tests pass
- **WHEN** the migration is complete
- **THEN** all existing frontend tests pass without modification
