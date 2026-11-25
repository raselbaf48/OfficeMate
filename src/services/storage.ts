import Dexie, { Table } from 'dexie';
import {
  DEFAULT_SETTINGS,
  INITIAL_PERSONNEL,
  INITIAL_SIGNERS,
  INITIAL_TEMPLATES,
} from '../data/seedData';
import {
  AppSettings,
  GeneratedDocument,
  Person,
  Signer,
  Template,
} from '../types/models';

export interface OfficeMateBackupPayload {
  version: number;
  exportedAt: string;
  templates: Template[];
  personnel: Person[];
  signers: Signer[];
  documents: GeneratedDocument[];
  settings: AppSettings;
}

export interface StorageService {
  seedInitialData(): Promise<void>;
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;

  getPeople(): Promise<Person[]>;
  savePerson(person: Person): Promise<void>;
  bulkSavePeople(people: Person[]): Promise<void>;
  deletePerson(id: string): Promise<void>;

  getSigners(): Promise<Signer[]>;
  saveSigner(signer: Signer): Promise<void>;
  deleteSigner(id: string): Promise<void>;

  getDocuments(): Promise<GeneratedDocument[]>;
  saveDocument(doc: GeneratedDocument): Promise<void>;
  deleteDocument(id: string): Promise<void>;

  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;

  exportBackup(): Promise<OfficeMateBackupPayload>;
  importBackup(payload: OfficeMateBackupPayload): Promise<void>;
}

class OfficeMateDB extends Dexie {
  templates!: Table<Template, string>;
  personnel!: Table<Person, string>;
  signers!: Table<Signer, string>;
  documents!: Table<GeneratedDocument, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('officemate_db');
    this.version(1).stores({
      templates: 'id, name, category, updatedAt',
      personnel: 'id, bd_no, rank, name, unit, trade',
      signers: 'id, role, name, isDefault',
      documents: 'id, templateId, personId, createdAt',
      settings: 'id',
    });
  }
}

const db = new OfficeMateDB();

class DexieStorageService implements StorageService {
  private seeded = false;

  async seedInitialData(): Promise<void> {
    if (this.seeded) return;
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.put(DEFAULT_SETTINGS);
    } else {
      const existingSettings = await db.settings.get('default');
      if (existingSettings && existingSettings.defaultFont === 'Times New Roman') {
        await db.settings.put({
          ...existingSettings,
          defaultFont: 'Arial',
          defaultFontSize: 12,
        });
      }
    }

    const templatesCount = await db.templates.count();
    if (templatesCount === 0) {
      await db.templates.bulkPut(INITIAL_TEMPLATES);
    } else {
      const existingJsi = await db.templates.get('tpl-jsi-8-80');
      const latestJsi = INITIAL_TEMPLATES.find((t) => t.id === 'tpl-jsi-8-80');
      if (existingJsi && latestJsi && existingJsi.updatedAt !== latestJsi.updatedAt) {
        await db.templates.put(latestJsi);
      }
      const existingStmt = await db.templates.get('tpl-statement-bn');
      const latestStmt = INITIAL_TEMPLATES.find((t) => t.id === 'tpl-statement-bn');
      if (latestStmt && (!existingStmt || existingStmt.updatedAt !== latestStmt.updatedAt)) {
        await db.templates.put(latestStmt);
      }
      for (const tplId of ['tpl-leave-application', 'tpl-service-certificate']) {
        const existingTpl = await db.templates.get(tplId);
        if (existingTpl && existingTpl.pageSettings.fontFamily === 'Times New Roman') {
          await db.templates.put({
            ...existingTpl,
            pageSettings: { ...existingTpl.pageSettings, fontFamily: 'Arial', fontSize: 12 },
          });
        }
      }
    }

    const signersCount = await db.signers.count();
    if (signersCount === 0) {
      await db.signers.bulkPut(INITIAL_SIGNERS);
    } else {
      const existingClerk = await db.signers.get('signer-clerk-1');
      if (existingClerk && existingClerk.bd_no === '445210') {
        const updatedClerk = INITIAL_SIGNERS.find((s) => s.id === 'signer-clerk-1');
        if (updatedClerk) await db.signers.put(updatedClerk);
      }
    }

    const peopleCount = await db.personnel.count();
    if (peopleCount === 0) {
      await db.personnel.bulkPut(INITIAL_PERSONNEL);
    }

    this.seeded = true;
  }

  async getTemplates(): Promise<Template[]> {
    await this.seedInitialData();
    return db.templates.orderBy('updatedAt').reverse().toArray();
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    await this.seedInitialData();
    return db.templates.get(id);
  }

  async saveTemplate(template: Template): Promise<void> {
    await db.templates.put({
      ...template,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.templates.delete(id);
  }

  async getPeople(): Promise<Person[]> {
    await this.seedInitialData();
    return db.personnel.orderBy('name').toArray();
  }

  async savePerson(person: Person): Promise<void> {
    await db.personnel.put({
      ...person,
      updatedAt: new Date().toISOString(),
    });
  }

  async bulkSavePeople(people: Person[]): Promise<void> {
    await db.personnel.bulkPut(people);
  }

  async deletePerson(id: string): Promise<void> {
    await db.personnel.delete(id);
  }

  async getSigners(): Promise<Signer[]> {
    await this.seedInitialData();
    return db.signers.toArray();
  }

  async saveSigner(signer: Signer): Promise<void> {
    await db.signers.put(signer);
  }

  async deleteSigner(id: string): Promise<void> {
    await db.signers.delete(id);
  }

  async getDocuments(): Promise<GeneratedDocument[]> {
    await this.seedInitialData();
    return db.documents.orderBy('createdAt').reverse().toArray();
  }

  async saveDocument(doc: GeneratedDocument): Promise<void> {
    await db.documents.put({
      ...doc,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteDocument(id: string): Promise<void> {
    await db.documents.delete(id);
  }

  async getSettings(): Promise<AppSettings> {
    await this.seedInitialData();
    const s = await db.settings.get('default');
    return s ?? DEFAULT_SETTINGS;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({ ...settings, id: 'default' });
  }

  async exportBackup(): Promise<OfficeMateBackupPayload> {
    const [templates, personnel, signers, documents, settings] = await Promise.all([
      this.getTemplates(),
      this.getPeople(),
      this.getSigners(),
      this.getDocuments(),
      this.getSettings(),
    ]);

    const now = new Date().toISOString();
    await this.saveSettings({ ...settings, lastBackupAt: now });

    return {
      version: 1,
      exportedAt: now,
      templates,
      personnel,
      signers,
      documents,
      settings: { ...settings, lastBackupAt: now },
    };
  }

  async importBackup(payload: OfficeMateBackupPayload): Promise<void> {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.templates)) {
      throw new Error('Invalid OfficeMate backup JSON file.');
    }

    await db.transaction(
      'rw',
      [db.templates, db.personnel, db.signers, db.documents, db.settings],
      async () => {
        await db.templates.clear();
        await db.personnel.clear();
        await db.signers.clear();
        await db.documents.clear();
        await db.settings.clear();

        if (payload.templates?.length) await db.templates.bulkPut(payload.templates);
        if (payload.personnel?.length) await db.personnel.bulkPut(payload.personnel);
        if (payload.signers?.length) await db.signers.bulkPut(payload.signers);
        if (payload.documents?.length) await db.documents.bulkPut(payload.documents);
        await db.settings.put({
          ...(payload.settings || DEFAULT_SETTINGS),
          id: 'default',
        });
      },
    );
  }
}

export const storage: StorageService = new DexieStorageService();
