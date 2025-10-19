/**
 * IndexedDB Storage for Fonts and Projects
 * Client-side persistent storage using IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SourceImage, CharacterMapping, FontMetadata, FontAdjustments } from '@/context/FontContext';

// Database schema
interface FontMakerDB extends DBSchema {
  fonts: {
    key: string;
    value: {
      id: string;
      name: string;
      data: ArrayBuffer;
      format: string;
      createdAt: number;
      updatedAt: number;
      metadata: FontMetadata;
      thumbnailUrl?: string;
    };
    indexes: { 'by-created': number; 'by-name': string };
  };
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      sourceImages: SourceImage[];
      characterMappings: CharacterMapping[];
      metadata: FontMetadata;
      adjustments: FontAdjustments;
      createdAt: number;
      updatedAt: number;
    };
    indexes: { 'by-updated': number; 'by-name': string };
  };
}

class FontStorageManager {
  private db: IDBPDatabase<FontMakerDB> | null = null;
  private dbName = 'fontmaker';
  private dbVersion = 1;

  /**
   * Initialize database connection
   */
  async init(): Promise<void> {
    if (this.db) return; // Already initialized

    this.db = await openDB<FontMakerDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create fonts store
        if (!db.objectStoreNames.contains('fonts')) {
          const fontsStore = db.createObjectStore('fonts', { keyPath: 'id' });
          fontsStore.createIndex('by-created', 'createdAt');
          fontsStore.createIndex('by-name', 'name');
        }

        // Create projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('by-updated', 'updatedAt');
          projectsStore.createIndex('by-name', 'name');
        }
      },
    });
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureInit(): Promise<IDBPDatabase<FontMakerDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ==================== FONTS ====================

  /**
   * Save generated font to storage
   */
  async saveFont(
    fontData: ArrayBuffer,
    metadata: FontMetadata,
    format: string = 'ttf',
    id?: string
  ): Promise<string> {
    const db = await this.ensureInit();
    const fontId = id || `font_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.put('fonts', {
      id: fontId,
      name: metadata.name,
      data: fontData,
      format,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata,
    });

    return fontId;
  }

  /**
   * Get font by ID
   */
  async getFont(id: string) {
    const db = await this.ensureInit();
    return await db.get('fonts', id);
  }

  /**
   * List all fonts
   */
  async listFonts(limit?: number) {
    const db = await this.ensureInit();
    const fonts = await db.getAllFromIndex('fonts', 'by-created');

    // Sort by created date (newest first)
    fonts.sort((a, b) => b.createdAt - a.createdAt);

    return limit ? fonts.slice(0, limit) : fonts;
  }

  /**
   * Delete font
   */
  async deleteFont(id: string): Promise<void> {
    const db = await this.ensureInit();
    await db.delete('fonts', id);
  }

  /**
   * Update font metadata
   */
  async updateFontMetadata(id: string, metadata: Partial<FontMetadata>): Promise<void> {
    const db = await this.ensureInit();
    const font = await db.get('fonts', id);

    if (font) {
      font.metadata = { ...font.metadata, ...metadata };
      font.updatedAt = Date.now();
      await db.put('fonts', font);
    }
  }

  /**
   * Search fonts by name
   */
  async searchFonts(query: string) {
    const fonts = await this.listFonts();
    const lowerQuery = query.toLowerCase();

    return fonts.filter(font =>
      font.name.toLowerCase().includes(lowerQuery) ||
      font.metadata.description?.toLowerCase().includes(lowerQuery) ||
      font.metadata.author?.toLowerCase().includes(lowerQuery)
    );
  }

  // ==================== PROJECTS ====================

  /**
   * Save project (work in progress)
   */
  async saveProject(
    project: {
      sourceImages: SourceImage[];
      characterMappings: CharacterMapping[];
      metadata: FontMetadata;
      adjustments: FontAdjustments;
    },
    id?: string
  ): Promise<string> {
    const db = await this.ensureInit();
    const projectId = id || `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const existingProject = id ? await db.get('projects', id) : null;

    await db.put('projects', {
      id: projectId,
      name: project.metadata.name || 'Untitled Project',
      sourceImages: project.sourceImages,
      characterMappings: project.characterMappings,
      metadata: project.metadata,
      adjustments: project.adjustments,
      createdAt: existingProject?.createdAt || Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  }

  /**
   * Get project by ID
   */
  async getProject(id: string) {
    const db = await this.ensureInit();
    return await db.get('projects', id);
  }

  /**
   * List all projects
   */
  async listProjects(limit?: number) {
    const db = await this.ensureInit();
    const projects = await db.getAllFromIndex('projects', 'by-updated');

    // Sort by updated date (newest first)
    projects.sort((a, b) => b.updatedAt - a.updatedAt);

    return limit ? projects.slice(0, limit) : projects;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<void> {
    const db = await this.ensureInit();
    await db.delete('projects', id);
  }

  /**
   * Get current/latest project
   */
  async getCurrentProject() {
    const projects = await this.listProjects(1);
    return projects[0] || null;
  }

  // ==================== UTILITY ====================

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    const fonts = await this.listFonts();
    const projects = await this.listProjects();

    const fontsSizeBytes = fonts.reduce((total, font) => total + font.data.byteLength, 0);

    // Estimate projects size (rough calculation)
    const projectsSizeBytes = projects.length * 1024 * 100; // Rough estimate

    return {
      fonts: {
        count: fonts.length,
        sizeBytes: fontsSizeBytes,
        sizeMB: (fontsSizeBytes / (1024 * 1024)).toFixed(2),
      },
      projects: {
        count: projects.length,
        sizeBytes: projectsSizeBytes,
        sizeMB: (projectsSizeBytes / (1024 * 1024)).toFixed(2),
      },
      total: {
        sizeBytes: fontsSizeBytes + projectsSizeBytes,
        sizeMB: ((fontsSizeBytes + projectsSizeBytes) / (1024 * 1024)).toFixed(2),
      },
    };
  }

  /**
   * Clear all data (careful!)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureInit();
    await db.clear('fonts');
    await db.clear('projects');
  }

  /**
   * Export all data as JSON (for backup)
   */
  async exportData(): Promise<string> {
    const fonts = await this.listFonts();
    const projects = await this.listProjects();

    // Convert ArrayBuffers to base64 for JSON serialization
    const fontsExport = fonts.map(font => ({
      ...font,
      data: this.arrayBufferToBase64(font.data),
    }));

    return JSON.stringify({
      fonts: fontsExport,
      projects,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import data from JSON backup
   */
  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Import fonts
    if (data.fonts) {
      for (const font of data.fonts) {
        await this.saveFont(
          this.base64ToArrayBuffer(font.data),
          font.metadata,
          font.format,
          font.id
        );
      }
    }

    // Import projects
    if (data.projects) {
      for (const project of data.projects) {
        await this.saveProject(project, project.id);
      }
    }
  }

  // Helper methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const fontStorage = new FontStorageManager();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  fontStorage.init().catch(console.error);
}

export default fontStorage;
