import { db } from "../client";

export async function setupClinicalTable() {
  try {
    console.log('Creating clinical_entries_new table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clinical_entries_new (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        template_id TEXT,
        answers TEXT, -- JSON string
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating index for patient lookups...');
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_clinical_patient ON clinical_entries_new(patient_id);
    `);

    console.log('Clinical tables created successfully!');
  } catch (error) {
    console.error('Error creating clinical tables:', error);
  }
}

setupClinicalTable();
