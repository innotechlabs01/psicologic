import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface ClinicalEntry {
  id: string;
  patient_id: string;
  template_id: string;
  answers: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClinicalTemplate {
  id: string;
  name: string;
  template: string;
}

function safeString(val: any): string {
  return val === null || val === undefined ? '' : String(val);
}

function safeJsonParse(val: any): Record<string, any> {
  if (!val) return {};
  try {
    return typeof val === 'object' ? val : JSON.parse(String(val));
  } catch {
    return {};
  }
}

export async function getClinicalEntries(patientId: string): Promise<ClinicalEntry[]> {
  const result = await db.execute({
    sql: 'SELECT id, patient_id, template_id, answers, created_at, updated_at FROM clinical_entries_new WHERE patient_id = ? ORDER BY created_at DESC',
    args: [patientId]
  });
  
  return result.rows.map((row: any) => ({
    id: safeString(row[0]),
    patient_id: safeString(row[1]),
    template_id: safeString(row[2]),
    answers: safeJsonParse(row[3]),
    created_at: safeString(row[4]),
    updated_at: safeString(row[5])
  }));
}

export async function getClinicalEntry(id: string): Promise<ClinicalEntry | null> {
  const result = await db.execute({
    sql: 'SELECT id, patient_id, template_id, answers, created_at, updated_at FROM clinical_entries_new WHERE id = ?',
    args: [id]
  });
  
  if (!result.rows.length) return null;
  
  const row = result.rows[0];
  return {
    id: safeString(row[0]),
    patient_id: safeString(row[1]),
    template_id: safeString(row[2]),
    answers: safeJsonParse(row[3]),
    created_at: safeString(row[4]),
    updated_at: safeString(row[5])
  };
}

export async function createClinicalEntry(patientId: string, templateId: string, answers: Record<string, any>): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  await db.execute({
    sql: 'INSERT INTO clinical_entries_new (id, patient_id, template_id, answers, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, patientId, templateId, JSON.stringify(answers), now, now]
  });
  
  return id;
}

export async function updateClinicalEntry(id: string, answers: Record<string, any>): Promise<boolean> {
  const now = new Date().toISOString();
  
  const result = await db.execute({
    sql: 'UPDATE clinical_entries_new SET answers = ?, updated_at = ? WHERE id = ?',
    args: [JSON.stringify(answers), now, id]
  });
  
  return result.rowsAffected > 0;
}

export async function deleteClinicalEntry(id: string): Promise<boolean> {
  const result = await db.execute({
    sql: 'DELETE FROM clinical_entries_new WHERE id = ?',
    args: [id]
  });
  
  return result.rowsAffected > 0;
}

export async function getDefaultTemplate(userId: string): Promise<ClinicalTemplate | null> {
  const result = await db.execute({
    sql: 'SELECT id, name, template FROM template_history WHERE userId = ? AND status = 1 LIMIT 1',
    args: [userId]
  });
  
  if (!result.rows.length) return null;
  
  const row = result.rows[0];
  return {
    id: safeString(row[0]),
    name: safeString(row[1]),
    template: safeString(row[2])
  };
}

export async function getTemplate(templateId: string): Promise<ClinicalTemplate | null> {
  const result = await db.execute({
    sql: 'SELECT id, name, template FROM template_history WHERE id = ?',
    args: [templateId]
  });
  
  if (!result.rows.length) return null;
  
  const row = result.rows[0];
  return {
    id: safeString(row[0]),
    name: safeString(row[1]),
    template: safeString(row[2])
  };
}

export async function getPatientById(patientId: string): Promise<{id: string, name: string, document: string, email: string} | null> {
  const result = await db.execute({
    sql: 'SELECT id, name, document, email FROM patientsClient WHERE id = ?',
    args: [patientId]
  });
  
  if (!result.rows.length) return null;
  
  const row = result.rows[0];
  return {
    id: safeString(row[0]),
    name: safeString(row[1]),
    document: safeString(row[2]),
    email: safeString(row[3])
  };
}
